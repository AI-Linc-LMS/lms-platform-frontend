import { describe, expect, it } from "vitest";
import { GENERIC_OUTAGE, readProviderOutage } from "./providerOutage";

/**
 * "it should not sound like its platform error - as it might lead to esclation or bad
 * experience". This is the switch that decides which of the two the learner is shown.
 */
describe("reading a failed AI request", () => {
  it("treats an explicit ai_unavailable as not-worth-retrying", () => {
    const out = readProviderOutage({
      response: { status: 503, data: { code: "ai_unavailable", retry_later: true, error: "at capacity" } },
    });
    expect(out.retryLater).toBe(true);
    expect(out.message).toBe("at capacity");
  });

  it("reads the tutor's `detail` as well as the interview's `error`", () => {
    // The two stacks answer with different keys, and a reader that knew only one would show
    // the generic line in half the cases.
    expect(readProviderOutage({ response: { data: { detail: "tutor is busy" } } }).message)
      .toBe("tutor is busy");
    expect(readProviderOutage({ response: { data: { error: "interview is busy" } } }).message)
      .toBe("interview is busy");
  });

  it("does NOT infer retry-later from a 503 alone", () => {
    // A 503 is equally a blip worth retrying in two seconds. Guessing from the status would
    // take the retry button away from people who should have it.
    const out = readProviderOutage({ response: { status: 503, data: { error: "restarting" } } });
    expect(out.retryLater).toBe(false);
  });

  it("treats an ordinary failure as retryable", () => {
    expect(readProviderOutage({ response: { status: 500, data: {} } }).retryLater).toBe(false);
    expect(readProviderOutage(new Error("network")).retryLater).toBe(false);
  });

  it("survives a shapeless error", () => {
    for (const junk of [undefined, null, "x", 42, {}, { response: {} }]) {
      const out = readProviderOutage(junk);
      expect(out.retryLater).toBe(false);
      expect(out.message).toBe("");
    }
  });

  it("offers a fallback sentence that still does not sound like a defect", () => {
    expect(GENERIC_OUTAGE.toLowerCase()).not.toContain("error");
    expect(GENERIC_OUTAGE.toLowerCase()).not.toContain("failed");
    expect(GENERIC_OUTAGE.toLowerCase()).toContain("try again");
  });
});
