/**
 * Reported: work experience dates appear in the resume preview but the editor's date fields are
 * empty, and the ATS score falls as a result.
 *
 * `<input type="month">` accepts exactly `YYYY-MM`. A stored `2025-12-01` is a valid date that
 * the preview renders as "Dec 2025" and the input renders as nothing at all. Production has
 * both shapes saved: 12 full dates against 9 month strings.
 */

import { describe, expect, it } from "vitest";
import { toMonthInputValue } from "./monthValue";

describe("dates the month input can display", () => {
  it("trims a full ISO date, which is the shape that was disappearing", () => {
    expect(toMonthInputValue("2025-12-01")).toBe("2025-12");
    expect(toMonthInputValue("2026-02-28")).toBe("2026-02");
  });

  it("leaves an already-correct month string alone", () => {
    expect(toMonthInputValue("2025-05")).toBe("2025-05");
  });

  it("keeps empty empty rather than inventing a date", () => {
    expect(toMonthInputValue("")).toBe("");
    expect(toMonthInputValue(null)).toBe("");
    expect(toMonthInputValue(undefined)).toBe("");
    expect(toMonthInputValue("   ")).toBe("");
  });

  it("recovers a human-written month", () => {
    // Not a format we write, but a format that has reached this data via imports.
    expect(toMonthInputValue("May 2025")).toBe("2025-05");
  });

  it("returns nothing for a string that is not a date at all", () => {
    // Better an empty field than a confidently wrong one in front of somebody.
    expect(toMonthInputValue("present")).toBe("");
    expect(toMonthInputValue("ongoing")).toBe("");
  });

  it("does not shift the month across a timezone boundary", () => {
    // The whole point is the first of the month; parsing it as UTC midnight and formatting in
    // a negative offset would render the month before.
    expect(toMonthInputValue("2025-01-01")).toBe("2025-01");
    expect(toMonthInputValue("2025-12-31")).toBe("2025-12");
  });
});
