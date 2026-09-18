import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/services/api", () => ({
  default: { post: vi.fn(), get: vi.fn(), patch: vi.fn(), delete: vi.fn() },
}));

import apiClient from "@/lib/services/api";
import { adaptiveCodingService } from "./adaptive-coding.service";

/**
 * The learner's input has to arrive under the key the server reads.
 *
 * This is the one way this feature fails silently. DRF drops an unknown key and answers 200, so
 * sending the input under the wrong name returns a perfectly valid run - of the program against
 * EMPTY input. The learner types "3 4", sees the output for no input at all, and has no way to
 * tell that their input was never delivered.
 *
 * It is a live risk rather than a hypothetical: the assessment surface already has a custom-input
 * endpoint and it takes the input under `input`, while the adaptive-coding one takes `stdin`.
 * Copying the wrong one is the obvious mistake.
 */

const post = vi.mocked(apiClient.post);

describe("the custom-input request", () => {
  beforeEach(() => {
    post.mockReset();
    post.mockResolvedValue({ data: { stdout: "", stderr: null, compile_output: null, status: null } });
  });

  it("sends the input under `stdin`", async () => {
    await adaptiveCodingService.runWithCustomInput("sess-1", {
      source: "print(input())",
      language_id: 71,
      stdin: "3 4\n",
    });
    expect(post.mock.calls[0][1]).toMatchObject({ stdin: "3 4\n" });
  });

  it("does not send it under `input`, which this endpoint ignores", () => {
    return adaptiveCodingService
      .runWithCustomInput("sess-1", { source: "x", language_id: 71, stdin: "3 4\n" })
      .then(() => {
        expect(post.mock.calls[0][1]).not.toHaveProperty("input");
      });
  });

  it("posts to the session's run-custom route, not run or submit", async () => {
    await adaptiveCodingService.runWithCustomInput("sess-1", {
      source: "x", language_id: 71, stdin: "",
    });
    expect(post.mock.calls[0][0]).toBe("/adaptive-coding/api/sessions/sess-1/run-custom/");
  });

  it("sends the input verbatim, including a trailing newline", async () => {
    // A program that reads a fixed number of lines hangs without the last newline. Trimming it
    // in transit would make the scratch pad behave differently from a real stdin.
    await adaptiveCodingService.runWithCustomInput("sess-1", {
      source: "x", language_id: 71, stdin: "  5  \n\n",
    });
    expect((post.mock.calls[0][1] as { stdin: string }).stdin).toBe("  5  \n\n");
  });

  it("passes the language through so the editor's choice survives a refresh", async () => {
    await adaptiveCodingService.runWithCustomInput("sess-1", {
      source: "x", language_id: 62, stdin: "", language: "java",
    });
    expect(post.mock.calls[0][1]).toMatchObject({ language: "java", language_id: 62 });
  });
});
