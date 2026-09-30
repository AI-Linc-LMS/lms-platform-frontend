import { describe, expect, it } from "vitest";

import {
  weekAssessmentHref,
  weekAssessmentPreviewHref,
  weekAssessmentSummary,
  weekAssessmentTypeLabel,
} from "./weekAssessmentLinks";
import type { AdminAdaptiveCourseWeekAssessment } from "@/lib/services/admin/admin-adaptive-course.service";

const paper: AdminAdaptiveCourseWeekAssessment = {
  node_id: 7,
  assessment_id: 920,
  slug: "week-1-final-14",
  title: "Week 1 Final",
  type: "week_final",
  is_active: true,
  duration_minutes: 60,
  question_count: 30,
  proctoring_enabled: true,
  points: 240,
  submission_count: 3,
};

describe("weekAssessmentHref", () => {
  it("sends every action to a tab the edit page actually has", () => {
    // ASSESSMENT_EDIT_TAB_VALUES: overview | details | questions | submissions | analytics.
    // An unknown tab silently falls back to overview, so a typo would look like it worked.
    expect(weekAssessmentHref(paper, "view")).toBe("/admin/assessment/920/edit?tab=overview");
    expect(weekAssessmentHref(paper, "questions")).toBe("/admin/assessment/920/edit?tab=questions");
    expect(weekAssessmentHref(paper, "submissions")).toBe(
      "/admin/assessment/920/edit?tab=submissions",
    );
  });
});

describe("weekAssessmentPreviewHref", () => {
  it("builds the learner link from the slug", () => {
    expect(weekAssessmentPreviewHref(paper, 14)).toBe("/assessments/week-1-final-14?courseId=14");
  });

  it("is null without a slug, rather than a link to nowhere", () => {
    expect(weekAssessmentPreviewHref({ slug: "" }, 14)).toBeNull();
  });
});

describe("weekAssessmentSummary", () => {
  it("reads as one line", () => {
    expect(weekAssessmentSummary(paper)).toBe("30 questions · 60 min · 240 pts · proctored");
  });

  it("says a deactivated paper cannot be opened", () => {
    expect(weekAssessmentSummary({ ...paper, is_active: false })).toContain(
      "learners cannot open it",
    );
  });

  it("drops what is not set instead of printing zeros", () => {
    expect(
      weekAssessmentSummary({
        ...paper,
        question_count: 0,
        duration_minutes: null,
        points: 0,
        proctoring_enabled: false,
      }),
    ).toBe("");
  });

  it("says question, not questions, for one", () => {
    expect(weekAssessmentSummary({ ...paper, question_count: 1 })).toContain("1 question ·");
  });
});

describe("weekAssessmentTypeLabel", () => {
  it("uses the words an admin uses, not the stored type", () => {
    expect(weekAssessmentTypeLabel("week_final")).toBe("Final assessment");
    expect(weekAssessmentTypeLabel("checkpoint")).toBe("Checkpoint");
    expect(weekAssessmentTypeLabel("calibration")).toBe("Calibration");
  });
});
