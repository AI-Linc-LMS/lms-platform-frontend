/**
 * The Verify contract. Reported from real use: a brief that verified 7/7 showed the chip
 * "Verified 7/7" AND an error toast saying "only passes 7/7 of its own checks".
 *
 * Cause: the endpoint returns the stored `verification` object — {status, passed, total, log} —
 * and the client read a `verified` boolean that is not on the wire. It was always undefined, so
 * every successful verification took the failure branch.
 */
import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("@/lib/services/api", () => ({
  default: { post: vi.fn(), get: vi.fn(), patch: vi.fn(), delete: vi.fn() },
}));

import apiClient from "@/lib/services/api";
import {
  verificationToResult,
  verifyProject,
} from "@/lib/services/admin/admin-projects.service";

const post = apiClient.post as unknown as ReturnType<typeof vi.fn>;

/** Axios rejects with a real Error carrying `response`. Rejecting with a bare object would test
 *  a shape the client never actually sees.
 *
 *  Thrown from a mock IMPLEMENTATION rather than handed to mockRejectedValue: the latter builds
 *  the rejected promise at setup time, which vitest reports as an unhandled rejection before the
 *  test has a chance to consume it. */
function httpError(status: number, data?: unknown) {
  const err = new Error(`Request failed with status code ${status}`) as Error & {
    response?: { status: number; data?: unknown };
    isAxiosError?: boolean;
  };
  err.isAxiosError = true;
  err.response = { status, data };
  return err;
}

describe("verifyProject", () => {
  beforeEach(() => post.mockReset());

  it("treats a passing verification as passing", async () => {
    post.mockResolvedValue({ data: { status: "passed", passed: 7, total: 7, log: "ok" } });
    const r = await verifyProject(1);
    expect(r.verified).toBe(true);
    expect(r.passed).toBe(7);
    expect(r.total).toBe(7);
  });

});

/**
 * The mapping is where the defect lived, so it is asserted directly — no HTTP, no mocking.
 * The endpoint returns the stored `verification` object; the client used to read a `verified`
 * boolean that is not on the wire, so a 7/7 pass took the failure branch.
 */
describe("verificationToResult", () => {
  it("reads the verdict from `status`, which is the field the server actually sends", () => {
    expect(verificationToResult({ status: "passed", passed: 7, total: 7 }, true).verified)
      .toBe(true);
    expect(verificationToResult({ status: "failed", passed: 3, total: 7 }, false).verified)
      .toBe(false);
  });

  it("does not infer a pass from passed === total", () => {
    // The bug this guards: a brief with zero checks would otherwise read as fully verified.
    expect(verificationToResult({ passed: 0, total: 0 }, true).verified).toBe(false);
  });

  it("trusts `status` over the HTTP code when they disagree", () => {
    // The server is the authority on its own verdict; an intermediary rewriting the status code
    // must not silently flip a failed brief to verified.
    expect(verificationToResult({ status: "failed", passed: 3, total: 7 }, true).verified)
      .toBe(false);
  });

  it("falls back to the HTTP code when an older deployment omits `status`", () => {
    expect(verificationToResult({ passed: 5, total: 5 }, true).verified).toBe(true);
    expect(verificationToResult({ passed: 5, total: 5 }, false).verified).toBe(false);
  });

  it("survives a missing or malformed payload without claiming a pass", () => {
    expect(verificationToResult(undefined, true).verified).toBe(false);
    expect(verificationToResult({}, true).verified).toBe(false);
    expect(verificationToResult(undefined, true).passed).toBe(0);
  });

  it("carries the counts and log through for the toast", () => {
    const r = verificationToResult({ status: "passed", passed: 7, total: 7, log: "all good" }, true);
    expect(r).toMatchObject({ verified: true, passed: 7, total: 7, log: "all good" });
  });
});
