import type { CalibrationState } from "@/lib/types/adaptive-journey";

/**
 * What the one button on a course promises, and where it goes.
 *
 * Three surfaces render that button — the course page's hero, the dashboard's "Continue
 * your courses" card and its "Up Next" row — and each used to decide for itself. The
 * dashboard could not decide well: its payload carried `resumeSubmoduleId` and nothing
 * about the calibration, so it said "Continue", found `resumeSubmoduleId` null (every
 * topic is locked until the calibration is done), fell back to the course page — and the
 * course page is the page that asks for the calibration. A button promising to resume
 * dropped the learner on a request to start.
 *
 * So the decision lives here, once, fed by the server's single `CalibrationState`.
 */

export type CourseCtaKind =
  | "takeAssessment"
  | "startLearning"
  | "resumeLearning"
  | "reviewCourse";

export interface CourseCta {
  kind: CourseCtaKind;
  /** i18n key under the `courseCta` namespace. */
  labelKey: `courseCta.${CourseCtaKind}`;
  href: string;
  /** True when this sends the learner to the calibration rather than into content. */
  toCalibration: boolean;
}

export interface CourseCtaInput {
  courseId: number;
  /** The server's answer. Null/undefined on a payload that predates it: behave as before. */
  calibration?: CalibrationState | null;
  /** The topic to resume, or null when there is none unlocked. */
  resumeSubmoduleId?: number | null;
  /** 0-100. Drives "start" vs "resume" vs "review". */
  completionPct?: number | null;
}

export function calibrationHref(courseId: number, slug: string): string {
  return `/assessments/${slug}/calibration?courseId=${courseId}`;
}

/**
 * Resolve the four states a learner can be in on a course:
 *
 * | state                                | label               | goes to                  |
 * |--------------------------------------|---------------------|--------------------------|
 * | calibration pending (never started)  | Take the assessment | the calibration          |
 * | calibrated, nothing done yet         | Start learning      | first unlocked topic     |
 * | content in progress                  | Resume learning     | the current topic        |
 * | course complete                      | Review the course   | the current topic        |
 *
 * A calibration that is `required` but NOT `pending` (no questions authored yet, or still
 * generating) is deliberately not offered: it is a dead end, and the course is not gated
 * on it either. Those learners fall through to the ordinary states.
 */
export function courseCta({
  courseId,
  calibration,
  resumeSubmoduleId,
  completionPct,
}: CourseCtaInput): CourseCta {
  const coursePage = `/adaptive-courses/${courseId}`;

  if (calibration?.pending && calibration.assessmentSlug) {
    return {
      kind: "takeAssessment",
      labelKey: "courseCta.takeAssessment",
      href: calibrationHref(courseId, calibration.assessmentSlug),
      toCalibration: true,
    };
  }

  const resume = resumeSubmoduleId
    ? `/adaptive-courses/${courseId}/submodule/${resumeSubmoduleId}`
    : coursePage;
  const pct = completionPct ?? 0;

  if (pct >= 100) {
    return { kind: "reviewCourse", labelKey: "courseCta.reviewCourse", href: resume, toCalibration: false };
  }
  if (pct > 0) {
    return { kind: "resumeLearning", labelKey: "courseCta.resumeLearning", href: resume, toCalibration: false };
  }
  return { kind: "startLearning", labelKey: "courseCta.startLearning", href: resume, toCalibration: false };
}
