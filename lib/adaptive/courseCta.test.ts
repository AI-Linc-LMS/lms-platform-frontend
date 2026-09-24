import { describe, expect, it } from "vitest";
import en from "@/locales/en/common.json";
import ar from "@/locales/ar/common.json";
import { calibrationHref, courseCta } from "./courseCta";
import type { CalibrationState } from "@/lib/types/adaptive-journey";

const PENDING: CalibrationState = {
  required: true, done: false, pending: true,
  assessmentId: 476, assessmentSlug: "calibration-34-33",
};
const DONE: CalibrationState = {
  required: true, done: true, pending: false,
  assessmentId: 476, assessmentSlug: "calibration-34-33",
};
const NONE: CalibrationState = {
  required: false, done: true, pending: false,
  assessmentId: null, assessmentSlug: null,
};

describe("courseCta - the four states a learner can be in", () => {
  it("offers the assessment, not a resume, before the calibration is done", () => {
    // The reported bug: the button promised to resume a course that had not started, and
    // the page it opened asked for the calibration.
    const cta = courseCta({ courseId: 33, calibration: PENDING, resumeSubmoduleId: null, completionPct: 0 });
    expect(cta.kind).toBe("takeAssessment");
    expect(cta.labelKey).toBe("courseCta.takeAssessment");
    expect(cta.href).toBe("/assessments/calibration-34-33/calibration?courseId=33");
    expect(cta.toCalibration).toBe(true);
  });

  it("still offers the assessment when a topic happens to be unlocked", () => {
    // A course whose entry topic is open is still a course the learner has not begun. The
    // old hero only routed to the calibration when there was NO unlocked topic at all.
    const cta = courseCta({ courseId: 33, calibration: PENDING, resumeSubmoduleId: 1443, completionPct: 0 });
    expect(cta.kind).toBe("takeAssessment");
  });

  it("says start, not resume, once calibrated with nothing done", () => {
    const cta = courseCta({ courseId: 33, calibration: DONE, resumeSubmoduleId: 1443, completionPct: 0 });
    expect(cta.kind).toBe("startLearning");
    expect(cta.href).toBe("/adaptive-courses/33/submodule/1443");
  });

  it("resumes once there is progress", () => {
    const cta = courseCta({ courseId: 33, calibration: DONE, resumeSubmoduleId: 1443, completionPct: 6 });
    expect(cta.kind).toBe("resumeLearning");
    expect(cta.href).toBe("/adaptive-courses/33/submodule/1443");
  });

  it("reviews a finished course", () => {
    const cta = courseCta({ courseId: 33, calibration: DONE, resumeSubmoduleId: 1443, completionPct: 100 });
    expect(cta.kind).toBe("reviewCourse");
  });

  it("falls back to the course page when there is no topic to open", () => {
    const cta = courseCta({ courseId: 33, calibration: DONE, resumeSubmoduleId: null, completionPct: 0 });
    expect(cta.href).toBe("/adaptive-courses/33");
  });

  it("does not offer a calibration nobody can sit", () => {
    // required but not pending: no questions authored yet, or still generating. The course
    // is not gated on it either, so the ordinary states apply.
    const unauthored: CalibrationState = { ...PENDING, pending: false };
    expect(courseCta({ courseId: 33, calibration: unauthored, resumeSubmoduleId: 1443, completionPct: 0 }).kind)
      .toBe("startLearning");
  });

  it("does not offer a calibration with no slug to route to", () => {
    const noSlug: CalibrationState = { ...PENDING, assessmentSlug: null };
    expect(courseCta({ courseId: 33, calibration: noSlug, resumeSubmoduleId: 1443, completionPct: 0 }).kind)
      .toBe("startLearning");
  });

  it("behaves as before on a payload that carries no calibration at all", () => {
    expect(courseCta({ courseId: 33, resumeSubmoduleId: 1443, completionPct: 6 }).kind).toBe("resumeLearning");
    expect(courseCta({ courseId: 33, calibration: null, resumeSubmoduleId: 1443, completionPct: 6 }).kind)
      .toBe("resumeLearning");
    expect(courseCta({ courseId: 33, calibration: NONE, resumeSubmoduleId: 1443, completionPct: 6 }).kind)
      .toBe("resumeLearning");
  });

  it("builds the calibration href the assessments route expects", () => {
    expect(calibrationHref(7, "calib-x")).toBe("/assessments/calib-x/calibration?courseId=7");
  });
});

describe("courseCta labels are translated in every locale", () => {
  const kinds = ["takeAssessment", "startLearning", "resumeLearning", "reviewCourse"] as const;

  it("has an English string for each state", () => {
    for (const k of kinds) expect((en.courseCta as Record<string, string>)[k]).toBeTruthy();
    expect(en.courseCta.takeAssessment).toBe("Take the assessment");
  });

  it("has an Arabic string for each state", () => {
    for (const k of kinds) expect((ar.courseCta as Record<string, string>)[k]).toBeTruthy();
  });

  it("keeps the two locales in step", () => {
    expect(Object.keys(ar.courseCta).sort()).toEqual(Object.keys(en.courseCta).sort());
  });
});
