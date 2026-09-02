// @vitest-environment jsdom
/**
 * "While reading the Adaptive Articles, clicking the other reading options errors with
 *  'request failed with status code 502'."
 *
 * The server generated the tier inside the request - one blocking LLM call for a ~1500-word
 * article - and this client aborts at 45s, so a slow tier could never arrive however long the
 * backend waited. The server now answers 202 while a worker generates it, and this polls.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { adaptiveCourseService } from "./adaptive-course.service";
import apiClientDefault from "./api";

vi.mock("./api", () => {
  const post = vi.fn();
  return { default: { post, get: vi.fn(), put: vi.fn(), delete: vi.fn() }, apiClient: { post } };
});

const post = (apiClientDefault as unknown as { post: ReturnType<typeof vi.fn> }).post;

const CONTENT = { tier: "Advanced", content_html: "<p>done</p>", reading_time_minutes: 6 };

describe("waiting for a reading tier to be generated", () => {
  beforeEach(() => {
    post.mockReset();
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });
  afterEach(() => vi.useRealTimers());

  it("returns the content immediately when the tier is already cached", async () => {
    post.mockResolvedValueOnce({ status: 200, data: CONTENT });

    const res = await adaptiveCourseService.renderArticleTier(1, "Advanced" as never);

    expect(res).toEqual(CONTENT);
    expect(post).toHaveBeenCalledTimes(1);
  });

  it("polls while the server says it is still generating", async () => {
    post
      .mockResolvedValueOnce({ status: 202, data: { status: "generating" } })
      .mockResolvedValueOnce({ status: 202, data: { status: "generating" } })
      .mockResolvedValueOnce({ status: 200, data: CONTENT });

    const p = adaptiveCourseService.renderArticleTier(1, "Advanced" as never);
    await vi.advanceTimersByTimeAsync(10_000);

    await expect(p).resolves.toEqual(CONTENT);
    expect(post).toHaveBeenCalledTimes(3);
  });

  it("treats 202 as a normal answer, not an error", async () => {
    post.mockResolvedValueOnce({ status: 200, data: CONTENT });
    await adaptiveCourseService.renderArticleTier(1, "Advanced" as never);

    // A 202 must not be thrown by axios, or the poll never gets a chance to run.
    const cfg = post.mock.calls[0][2];
    expect(cfg.validateStatus(200)).toBe(true);
    expect(cfg.validateStatus(202)).toBe(true);
    expect(cfg.validateStatus(502)).toBe(false);
  });

  it("lets a real failure through so the caller can show the reason", async () => {
    const err = Object.assign(new Error("Request failed with status code 502"), {
      response: { status: 502, data: { detail: "Couldn't render this level right now: rate limit" } },
    });
    post.mockRejectedValueOnce(err);

    await expect(
      adaptiveCourseService.renderArticleTier(1, "Advanced" as never),
    ).rejects.toBe(err);
  });

  it("gives up eventually rather than polling forever", async () => {
    post.mockResolvedValue({ status: 202, data: { status: "generating" } });

    const p = adaptiveCourseService.renderArticleTier(1, "Advanced" as never);
    const assertion = expect(p).rejects.toThrow(/taking longer than usual/);
    await vi.advanceTimersByTimeAsync(200_000);
    await assertion;
  });
});
