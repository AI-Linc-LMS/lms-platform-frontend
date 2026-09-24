import { describe, expect, it } from "vitest";
import type { Student } from "@/lib/services/admin/admin-student.service";
import type { CourseCompletionStats } from "@/lib/services/admin/admin-student.service";
import {
  atRiskSegmentHref,
  completionStatsFor,
  matchesSegment,
  segmentCounts,
  STUDENT_SIGNALS,
} from "./student-risk";

function student(over: Partial<Student> = {}): Student {
  return {
    id: 1,
    user_id: 1,
    name: "S",
    first_name: "S",
    last_name: "",
    email: "s@x.com",
    username: "s",
    is_active: true,
    date_joined: "2026-01-01",
    last_login: null,
    total_marks: 0,
    most_active_course: "",
    total_time_spent: { value: 0, unit: "hours" },
    last_activity_date: null,
    current_streak: 0,
    streak_data: [],
    enrollment_count: 1,
    assessment_submissions: 0,
    activity_summary: { total_activities: 0, by_type: {} },
    ...over,
  };
}

describe("the At risk segment reads the server's verdict", () => {
  it("includes a student the server flagged", () => {
    expect(matchesSegment("at_risk", student({ at_risk: true }))).toBe(true);
  });

  it("excludes a student the server did not flag, whatever the browser-side signals say", () => {
    // The old browser rule flagged this one (enrolled, no legacy activity, 0% legacy completion)
    // and so disagreed with the dashboard.
    const stats = {
      student_id: 1, name: "S", email: "s@x.com", completed_contents: 0, total_contents: 10,
      completion_percentage: 0, attended_activities: 0, total_attendance_activities: 0,
      attendance_percentage: 0,
    };
    expect(matchesSegment("at_risk", student({ at_risk: false }), stats)).toBe(false);
  });

  it("reads a missing verdict (older server) as not at risk", () => {
    expect(matchesSegment("at_risk", student())).toBe(false);
  });
});

describe("atRiskSegmentHref", () => {
  it("links to the segment", () => {
    expect(atRiskSegmentHref()).toBe("/admin/manage-students?segment=at_risk");
  });

  it("carries an adaptive course", () => {
    expect(atRiskSegmentHref(7)).toBe("/admin/manage-students?segment=at_risk&riskCourse=7");
  });
});

const DAY = 24 * 60 * 60 * 1000;
const ago = (days: number) => new Date(Date.now() - days * DAY).toISOString();
const stats = (pct: number): CourseCompletionStats => ({
  student_id: 1, name: "S", email: "s@x.com", completed_contents: 0, total_contents: 10,
  completion_percentage: pct, attended_activities: 0, total_attendance_activities: 0,
  attendance_percentage: 0,
});

describe("every documented signal is filterable", () => {
  it("has six signals, and matchesSegment answers for each of them", () => {
    // The bug: the popover documented six, the chip row offered four. The chips, the counts and
    // the popover are all rendered from this one table now, so they cannot drift apart again.
    expect(STUDENT_SIGNALS.map((s) => s.key)).toEqual([
      "at_risk",
      "inactive",
      "low_completion",
      "high_performers",
      "never_logged_in",
      "never_active",
    ]);
    for (const signal of STUDENT_SIGNALS) {
      expect(typeof signal.matches, signal.key).toBe("function");
      expect(signal.label.length, signal.key).toBeGreaterThan(0);
      expect(signal.rule.length, signal.key).toBeGreaterThan(0);
    }
  });

  it("lists the accounts that have never authenticated", () => {
    expect(matchesSegment("never_logged_in", student({ last_login: null }))).toBe(true);
    expect(matchesSegment("never_logged_in", student({ last_login: ago(1) }))).toBe(false);
  });

  it("lists the students no activity has ever been recorded for", () => {
    const ghost = student({
      last_activity_date: null,
      activity_summary: { total_activities: 0, by_type: {} },
    });
    expect(matchesSegment("never_active", ghost)).toBe(true);
    expect(
      matchesSegment("never_active", student({ last_activity_date: ago(400) })),
    ).toBe(false);
    // An activity summary without a date still counts as having been active.
    expect(
      matchesSegment(
        "never_active",
        student({ activity_summary: { total_activities: 4, by_type: {} } }),
      ),
    ).toBe(false);
  });

  it("never flags an unenrolled student as inactive, which is what the chip always did", () => {
    // The popover used to promise "no activity in the last 30 days" while the filter also
    // required an enrolment. One rule now, and the popover states it.
    expect(matchesSegment("inactive", student({ enrollment_count: 0 }))).toBe(false);
    expect(matchesSegment("inactive", student({ enrollment_count: 2 }))).toBe(true);
    expect(
      matchesSegment("inactive", student({ enrollment_count: 2, last_activity_date: ago(3) })),
    ).toBe(false);
    expect(
      STUDENT_SIGNALS.find((s) => s.key === "inactive")?.rule,
    ).toMatch(/Enrolled/);
  });
});

describe("a chip's count is the list it opens", () => {
  it("counts exactly the students the same segment filter returns", () => {
    const population = [
      student({ id: 1, user_id: 101, last_login: null, last_activity_date: null,
        activity_summary: { total_activities: 0, by_type: {} } }),
      student({ id: 2, user_id: 102, last_login: ago(1), last_activity_date: ago(1),
        activity_summary: { total_activities: 5, by_type: {} } }),
      student({ id: 3, user_id: 103, last_login: null, last_activity_date: ago(90),
        activity_summary: { total_activities: 1, by_type: {} } }),
    ];
    const statsFor = (s: { id: number }) => stats(s.id === 2 ? 90 : 5);
    const counts = segmentCounts(population, statsFor);

    for (const signal of STUDENT_SIGNALS) {
      const rows = population.filter((s) => matchesSegment(signal.key, s, statsFor(s)));
      expect(counts[signal.key], signal.key).toBe(rows.length);
    }
    expect(counts.never_logged_in).toBe(2);
    expect(counts.never_active).toBe(1);
    expect(counts.high_performers).toBe(1);
  });
});

describe("completionStatsFor", () => {
  it("reads the row the server keyed by profile id, not a stranger's", () => {
    // The completion endpoint keys rows by UserProfile id. Looking user_id up FIRST could land
    // on a different student whose profile id happens to equal this student's user id.
    const mine = stats(90);
    const someoneElse = stats(10);
    const map = { 7: mine, 1007: someoneElse };
    expect(completionStatsFor(map, { id: 7, user_id: 1007 })).toBe(mine);
  });

  it("still falls back to user_id for a payload keyed that way", () => {
    const row = stats(50);
    expect(completionStatsFor({ 1007: row }, { id: 7, user_id: 1007 })).toBe(row);
  });
});
