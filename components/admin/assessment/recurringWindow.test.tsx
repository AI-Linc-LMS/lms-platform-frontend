// @vitest-environment jsdom
/**
 * "Create a recurring assessment with a timeline, starts at 10 am and ends at 10 pm."
 *
 * The admin-facing half. What is pinned here is mostly about the mistakes this form makes easy,
 * because the window itself is simple and its failure modes are not:
 *
 *   - A window SHORTER than the paper reads perfectly well ("10:00 to 11:00" beside a 90-minute
 *     duration) and means every learner hits the wall at 11:00, every day. The server refuses it;
 *     this warns while the admin is still looking at the field.
 *   - "Chosen days" with no day chosen is a paper nobody can ever sit.
 *   - A closing time EARLIER than the opening time is an overnight window, not an error, and the
 *     summary has to say so or an admin will "fix" it.
 */

import { describe, expect, it } from "vitest";
import {
  occurrenceMinutes,
  windowSummary,
  windowWarning,
} from "./AssessmentSettingsSection";

const base = {
  recurrence: "daily" as const,
  start: "10:00",
  end: "22:00",
  weekdays: [] as number[],
  durationMinutes: 60,
  closesAttempt: true,
};

describe("how long one occurrence lasts", () => {
  it("measures an ordinary daytime window", () => {
    expect(occurrenceMinutes("10:00", "22:00")).toBe(720);
  });

  it("treats a closing time before the opening time as overnight", () => {
    expect(occurrenceMinutes("22:00", "06:00")).toBe(480);
  });

  it("reports an empty window rather than a negative one", () => {
    expect(occurrenceMinutes("10:00", "10:00")).toBe(0);
  });

  it("refuses to guess at junk", () => {
    expect(occurrenceMinutes("", "22:00")).toBeNull();
    expect(occurrenceMinutes("25:00", "22:00")).toBeNull();
    expect(occurrenceMinutes("10.00", "22:00")).toBeNull();
  });
});

describe("the warning an admin needs before saving", () => {
  it("says nothing when the window comfortably fits the paper", () => {
    expect(windowWarning(base)).toBeNull();
  });

  it("catches a window shorter than the assessment", () => {
    const warning = windowWarning({ ...base, end: "11:00", durationMinutes: 90 });
    expect(warning).toContain("60 minutes");
    expect(warning).toContain("90");
  });

  it("allows a short window when the admin turned off closing the attempt", () => {
    // Then the window governs entry only, and a started attempt may finish afterwards.
    expect(
      windowWarning({ ...base, end: "11:00", durationMinutes: 90, closesAttempt: false }),
    ).toBeNull();
  });

  it("catches 'chosen days' with nothing chosen", () => {
    expect(windowWarning({ ...base, recurrence: "weekly", weekdays: [] })).toContain(
      "at least one day",
    );
  });

  it("accepts chosen days once one is picked", () => {
    expect(windowWarning({ ...base, recurrence: "weekly", weekdays: [0] })).toBeNull();
  });

  it("catches an empty window", () => {
    expect(windowWarning({ ...base, end: "10:00" })).toContain("same");
  });

  it("asks for both ends", () => {
    expect(windowWarning({ ...base, end: "" })).toContain("both");
  });

  it("says nothing at all when there is no recurrence", () => {
    expect(windowWarning({ ...base, recurrence: "none", end: "" })).toBeNull();
  });

  it("does not warn about an overnight window, which is legitimate", () => {
    expect(windowWarning({ ...base, start: "22:00", end: "06:00" })).toBeNull();
  });
});

describe("the plain-English read-back", () => {
  it("states the rule rather than the fields", () => {
    expect(windowSummary({ ...base, zone: "Asia/Kolkata" })).toBe(
      "Open every day from 10:00 to 22:00, Asia/Kolkata.",
    );
  });

  it("says when a window runs into the next morning", () => {
    expect(windowSummary({ ...base, start: "22:00", end: "06:00", zone: "Asia/Kolkata" })).toContain(
      "the next morning",
    );
  });

  it("names the chosen days", () => {
    expect(
      windowSummary({ ...base, recurrence: "weekly", weekdays: [0, 2, 4], zone: "" }),
    ).toContain("Mon, Wed, Fri");
  });

  it("falls back to the institution's time when no zone is set", () => {
    expect(windowSummary({ ...base, zone: "" })).toContain("your institution's time");
  });

  it("says nothing when there is no window to describe", () => {
    expect(windowSummary({ ...base, recurrence: "none", zone: "" })).toBe("");
  });
});
