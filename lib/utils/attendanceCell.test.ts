/**
 * Reported: the Manage Students attendance column "shows N/A if attendance is lower than 100%".
 *
 * It does not - a real 0% renders, in red, for 38 of Agileology's students. What it did do was
 * render a bare "N/A" for the 283 whose batch has never held a live class, which is a different
 * fact and should not look like missing data.
 */

import { describe, expect, it } from "vitest";
import { attendanceCell, attendanceExplanation } from "./attendanceCell";

describe("what the attendance column says", () => {
  it("shows a real percentage when classes have been held", () => {
    const cell = attendanceCell({ attended: 1, expected: 1, percent: 100 });
    expect(cell).toEqual({ kind: "percent", percent: 100, attended: 1, expected: 1 });
  });

  it("shows 0%, NOT N/A, when they missed every class they could have attended", () => {
    // The heart of the report. Zero is a number somebody earned and can improve on.
    const cell = attendanceCell({ attended: 0, expected: 2, percent: 0 });
    expect(cell.kind).toBe("percent");
    expect(cell).toMatchObject({ percent: 0, attended: 0, expected: 2 });
  });

  it("shows a partial percentage rather than rounding it away", () => {
    const cell = attendanceCell({ attended: 1, expected: 3, percent: 33.3 });
    expect(cell).toMatchObject({ kind: "percent", percent: 33.3 });
  });

  it("says there were no classes, rather than N/A, when the denominator is zero", () => {
    expect(attendanceCell({ attended: 0, expected: 0, percent: null })).toEqual({
      kind: "no-classes",
    });
  });

  it("still says nothing-known when the server reported nothing at all", () => {
    // An older server, or a failed fetch. Distinct from "no classes were held".
    expect(attendanceCell(undefined)).toEqual({ kind: "unknown" });
    expect(attendanceCell(null)).toEqual({ kind: "unknown" });
  });

  it("falls back to the roll-call system when live sessions report nothing", () => {
    const cell = attendanceCell(
      { attended: 0, expected: 0, percent: null },
      { attendance_percentage: 50, total_attendance_activities: 4 },
    );
    expect(cell).toMatchObject({ kind: "percent", percent: 50, attended: 2, expected: 4 });
  });

  it("does not use the roll-call fallback when IT has a zero denominator either", () => {
    const cell = attendanceCell(
      { attended: 0, expected: 0, percent: null },
      { attendance_percentage: 0, total_attendance_activities: 0 },
    );
    expect(cell).toEqual({ kind: "no-classes" });
  });

  it("explains itself differently for each case", () => {
    expect(attendanceExplanation({ kind: "percent", percent: 50, attended: 1, expected: 2 }))
      .toContain("1 of 2 classes");
    expect(attendanceExplanation({ kind: "percent", percent: 100, attended: 1, expected: 1 }))
      .toContain("1 of 1 class");
    expect(attendanceExplanation({ kind: "no-classes" })).toContain("nothing to attend yet");
    expect(attendanceExplanation({ kind: "unknown" })).toContain("No attendance has been reported");
  });
});
