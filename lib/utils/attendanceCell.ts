/**
 * What the attendance column should say for one student.
 *
 * Reported from Agileology as "if a student has attendance lower than 100% it shows N/A".
 * The numbers turned out to be right - 38 of that tenant's students show a real 0% in red -
 * but 283 of 394 show "N/A", and a column that is 72% "N/A" reads as broken whatever the
 * arithmetic underneath it is doing.
 *
 * The cause is not a calculation. `attendance_rates_for_students` returns `percent: None`
 * when the denominator is zero, deliberately:
 *
 *     "no classes yet" and "came to none of them" are different answers and a ring showing
 *     0% for the first is a lie.
 *
 * That is the right call, and the UI then threw the distinction away by rendering both as a
 * bare "N/A". On Agileology the denominator is zero for most students because only 4 live
 * sessions have ever ended, and the two biggest batches - "Data Analytics and AI Engineering"
 * with 206 members and 8022-M with 62 - have never held one. Those students have nothing to
 * have attended, and the column should say so instead of implying missing data.
 */

export interface LiveAttendance {
  attended: number;
  expected: number;
  percent: number | null;
}

export type AttendanceCell =
  | { kind: "percent"; percent: number; attended: number; expected: number }
  /** On the roster of no live session that has ended since they joined. */
  | { kind: "no-classes" }
  /** Nothing was reported for this student at all - an older server, or a failed fetch. */
  | { kind: "unknown" };

export function attendanceCell(
  live: LiveAttendance | null | undefined,
  fallback?: { attendance_percentage: number; total_attendance_activities: number } | null,
): AttendanceCell {
  if (live && live.percent !== null && live.percent !== undefined) {
    return {
      kind: "percent",
      percent: live.percent,
      attended: live.attended,
      expected: live.expected,
    };
  }
  // The roll-call activity system, kept as a fallback for tenants that still use it.
  if (fallback && fallback.total_attendance_activities > 0) {
    return {
      kind: "percent",
      percent: fallback.attendance_percentage,
      attended: Math.round(
        (fallback.attendance_percentage / 100) * fallback.total_attendance_activities,
      ),
      expected: fallback.total_attendance_activities,
    };
  }
  // The server answered, and its answer was "there was nothing to attend". That is a fact
  // about the batch's schedule, not a gap in the data, and saying so is the whole fix.
  if (live && live.expected === 0) return { kind: "no-classes" };
  return { kind: "unknown" };
}

/** Why the cell says what it says, for a tooltip. */
export function attendanceExplanation(cell: AttendanceCell): string {
  switch (cell.kind) {
    case "percent":
      return `Attended ${cell.attended} of ${cell.expected} ${
        cell.expected === 1 ? "class" : "classes"
      } held since they joined.`;
    case "no-classes":
      return "No live class on this student's batch has ended since they joined, so there is nothing to attend yet.";
    default:
      return "No attendance has been reported for this student.";
  }
}
