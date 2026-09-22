import { describe, expect, it } from "vitest";
import type { Student } from "@/lib/services/admin/admin-student.service";
import { atRiskSegmentHref, matchesSegment } from "./student-risk";

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
