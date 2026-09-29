// @vitest-environment jsdom
/**
 * A practice generation that SUCCEEDED must not be reported to the learner as a failure.
 *
 * The API client's default timeout is 45s. This one call takes 48-57s on production, because a
 * model writes the content and then every coding problem is run against its own test cases on
 * Judge0 before any of it is saved. So the browser gave up first: axios threw with no response,
 * the panel found no `detail` to show, and the learner was told "Couldn't generate practice right
 * now" over the top of problems that had just been saved for them.
 *
 * The backend ALB's idle timeout is 60 seconds, so the client waits 55 and no longer.
 */

import { describe, expect, it, vi } from "vitest";

const post = vi.fn();
vi.mock("@/lib/services/api", () => ({
  default: { post, get: vi.fn(), put: vi.fn(), patch: vi.fn(), delete: vi.fn() },
  apiClient: { post, get: vi.fn(), put: vi.fn(), patch: vi.fn(), delete: vi.fn() },
  setLoggingOut: vi.fn(),
}));

describe("the practice generate request", () => {
  it("waits longer than the client default, and less than the ALB's ceiling", async () => {
    post.mockResolvedValue({ data: { item: {}, usage: {}, items: [] } });
    const { adaptiveCourseService } = await import("@/lib/services/adaptive-course.service");

    await adaptiveCourseService.generatePractice(33, 1443, {
      kind: "coding", difficulty: "Easy", count: 5, focus: "",
    } as never);

    const config = post.mock.calls[0][2];
    expect(config?.timeout).toBeGreaterThan(45_000); // the client default it must beat
    expect(config?.timeout).toBeLessThan(60_000);    // the ALB idle timeout it must not exceed
  });
});
