import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import en from "@/locales/en/common.json";
import type { CalibrationState } from "@/lib/types/adaptive-journey";
import type { DashboardCourse } from "@/lib/types/dashboard";

/**
 * "[Dashboard] Do not show the resume learning block when the assessment is not yet done
 * because it will ask to take the assessment if we click on it. Instead show take the
 * assessment."
 *
 * The card had no way to know. Its payload carried `resumeSubmoduleId` and nothing about the
 * calibration, and `resumeSubmoduleId` is deliberately null while the gate holds every topic
 * locked - so "Continue" fell back to `/adaptive-courses/{id}`, the page that asks for the
 * calibration. On production 5445 of 5591 enrolments on gated courses are in that state.
 *
 * Before the fix the first test below finds "Continue" and a course-page href.
 */

// framer-motion's whileInView (the Reveal wrapper) needs one; jsdom has none.
class NoopObserver { observe() {} unobserve() {} disconnect() {} takeRecords() { return []; } }
(globalThis as unknown as { IntersectionObserver: unknown }).IntersectionObserver = NoopObserver;

const push = vi.fn();
vi.mock("@/lib/hooks/useInstantNavigation", () => ({
  useInstantNavigation: () => ({ push, prefetch: vi.fn(), replace: vi.fn() }),
}));
vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) =>
      key.split(".").reduce<unknown>((acc, k) => (acc as Record<string, unknown>)?.[k], en) as string,
  }),
}));

import { ContinueCoursesRow } from "./ContinueCoursesRow";
import { UpNextPanel } from "./UpNextPanel";

const PENDING: CalibrationState = {
  required: true, done: false, pending: true,
  assessmentId: 476, assessmentSlug: "calibration-34-33",
};
const DONE: CalibrationState = {
  required: true, done: true, pending: false,
  assessmentId: 476, assessmentSlug: "calibration-34-33",
};

const band = { percent: null, band: "not-started" as const };
function course(over: Partial<DashboardCourse> = {}): DashboardCourse {
  return {
    id: 33,
    title: "Advanced Python",
    cardImageUrl: null,
    completionPct: 0,
    readiness: { coverage: band, precision: band, craft: band, clutch: band, overall: band },
    skillProfile: { abilityIndex: null, fieldTier: null, mastery: null, skillsTracked: 0, skills: [], aiTip: null },
    upNext: null,
    resumeSubmoduleId: null,
    calibration: PENDING,
    due: null,
    leaderboardRank: null,
    certificate: { enabled: false, pct: 0, threshold: 80 },
    ...over,
  };
}

describe("dashboard course card before the calibration is done", () => {
  it("offers the assessment and goes straight to it", () => {
    push.mockClear();
    render(<ContinueCoursesRow courses={[course()]} />);
    const btn = screen.getByRole("button", { name: /Take the assessment/ });
    fireEvent.click(btn);
    expect(push).toHaveBeenCalledWith("/assessments/calibration-34-33/calibration?courseId=33");
    // And it no longer claims there is something to continue.
    expect(screen.queryByRole("button", { name: /Resume learning/ })).toBeNull();
  });

  it("says start, not resume, once calibrated with nothing done", () => {
    push.mockClear();
    render(<ContinueCoursesRow courses={[course({ calibration: DONE, resumeSubmoduleId: 1443 })]} />);
    fireEvent.click(screen.getByRole("button", { name: /Start learning/ }));
    expect(push).toHaveBeenCalledWith("/adaptive-courses/33/submodule/1443");
  });

  it("resumes once there is progress", () => {
    push.mockClear();
    render(<ContinueCoursesRow courses={[course({ calibration: DONE, resumeSubmoduleId: 1443, completionPct: 6 })]} />);
    fireEvent.click(screen.getByRole("button", { name: /Resume learning/ }));
    expect(push).toHaveBeenCalledWith("/adaptive-courses/33/submodule/1443");
  });

  it("reviews a finished course", () => {
    render(<ContinueCoursesRow courses={[course({ calibration: DONE, resumeSubmoduleId: 1443, completionPct: 100 })]} />);
    expect(screen.getByRole("button", { name: /Review the course/ })).toBeTruthy();
  });
});

describe("Up Next routes to the same place the card does", () => {
  const item = {
    nodeId: 1357, title: "Introduction to Python", type: "topic", points: 30,
    weekNo: 1, ref: { submoduleId: 1443 }, dueAt: null, lockReason: null, why: "Next up",
    courseId: 33, courseTitle: "Advanced Python", resumeSubmoduleId: null,
    calibration: PENDING,
  };

  it("opens the calibration while it is pending", () => {
    push.mockClear();
    render(<UpNextPanel items={[item]} />);
    fireEvent.click(screen.getByText("Introduction to Python"));
    expect(push).toHaveBeenCalledWith("/assessments/calibration-34-33/calibration?courseId=33");
  });

  it("opens the topic once the calibration is done", () => {
    push.mockClear();
    render(<UpNextPanel items={[{ ...item, calibration: DONE, resumeSubmoduleId: 1443 }]} />);
    fireEvent.click(screen.getByText("Introduction to Python"));
    expect(push).toHaveBeenCalledWith("/adaptive-courses/33/submodule/1443");
  });
});
