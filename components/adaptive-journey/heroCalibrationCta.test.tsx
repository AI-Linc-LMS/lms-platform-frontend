import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import en from "@/locales/en/common.json";

/**
 * The hero button on the course page - the one in the reported screenshot, reading
 * "Resume learning ->" beside a chip saying LEVEL - ADVANCED.
 *
 * It used to route to the calibration only when there was NO unlocked topic anywhere, so a
 * course whose entry topic happened to be open still promised a resume to a learner who had
 * not begun. It now uses lib/adaptive/courseCta.ts, the same resolver the dashboard card
 * uses, fed the server's single `calibration.pending`.
 */

const push = vi.fn();
vi.mock("@/lib/hooks/useInstantNavigation", () => ({
  useInstantNavigation: () => ({ push, replace: vi.fn(), prefetch: vi.fn(), isPending: false }),
}));
vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) =>
      key.split(".").reduce<unknown>((acc, k) => (acc as Record<string, unknown>)?.[k], en) as string,
  }),
}));
vi.mock("./JourneySidePanels", () => ({ JourneySidePanels: () => null }));
vi.mock("./JourneyTopCards", () => ({ JourneyTopCards: () => null }));

const getJourney = vi.fn();
vi.mock("@/lib/services/adaptive-journey.service", () => ({
  adaptiveJourneyService: { getJourney: () => getJourney() },
}));

import { JourneyBoard } from "./JourneyBoard";

const topic = (status: string, submoduleId: number) => ({
  id: 1, type: "topic", title: "Variables", order: 1, status,
  score: { earned: 0, total: 30 }, weight: 1, basePoints: 30, unlockRule: "sequential",
  lockReason: status === "locked" ? "Complete the calibration assessment first" : null,
  isCalibration: false, content: { articles: 1, quizzes: 1, coding: 0, videos: 0 },
  itemCount: 2, questionCount: 0, proctored: false, durationMinutes: null,
  ref: { submoduleId },
});

const CARD = {
  assessmentId: 476, assessmentSlug: "calibration-34-33", title: "Calibration",
  points: 200, durationMinutes: 45, questionCount: 30, proctored: true,
  configured: true, generating: false, status: "not_started",
};

function board({
  calibration,
  topicStatus,
  completionPct = 0,
  fieldTier = "advanced" as string | null,
}: {
  calibration: Record<string, unknown>;
  topicStatus: string;
  completionPct?: number;
  fieldTier?: string | null;
}) {
  return {
    contentLocked: true,
    unitNoun: "Week",
    course: {
      id: 33, title: "Advanced Python", description: "", fieldTier, abilityIndex: 88,
      enrolledCount: 12, certificateThreshold: 80, certificateEnabled: false,
      certificateTemplateUrl: null, certificateTitle: "", estHours: 6, sections: 1,
      items: 2, completionPct, startedAt: null,
    },
    progressCard: { pointsEarned: 0, pointsTotal: 60, onTimeRate: null, nodesDone: 0, nodesTotal: 1, completionPct },
    calibration,
    interview: { card: null },
    weeks: [{
      weekNo: 1, title: "Week 1", schedule: null, penaltyStrip: null,
      totals: { earned: 0, total: 30 }, stepsDone: 0, stepsTotal: 1,
      nodes: [topic(topicStatus, 1443)],
    }],
  };
}

describe("course hero button", () => {
  it("offers the assessment while the calibration is pending", async () => {
    push.mockClear();
    getJourney.mockResolvedValue(board({
      calibration: { required: true, done: false, pending: true, assessmentId: 476, assessmentSlug: "calibration-34-33", card: CARD },
      topicStatus: "locked",
    }));
    render(<JourneyBoard courseId={33} />);
    const btn = await screen.findByRole("button", { name: /Take the assessment/ });
    fireEvent.click(btn);
    expect(push).toHaveBeenCalledWith("/assessments/calibration-34-33/calibration?courseId=33");
  });

  it("still offers the assessment when a topic is unlocked - the old code said resume here", async () => {
    push.mockClear();
    getJourney.mockResolvedValue(board({
      calibration: { required: true, done: false, pending: true, assessmentId: 476, assessmentSlug: "calibration-34-33", card: CARD },
      topicStatus: "current",
    }));
    render(<JourneyBoard courseId={33} />);
    fireEvent.click(await screen.findByRole("button", { name: /Take the assessment/ }));
    expect(push).toHaveBeenCalledWith("/assessments/calibration-34-33/calibration?courseId=33");
  });

  it("resumes into the topic once the calibration is done and there is progress", async () => {
    push.mockClear();
    getJourney.mockResolvedValue(board({
      calibration: { required: true, done: true, pending: false, assessmentId: 476, assessmentSlug: "calibration-34-33", card: { ...CARD, status: "done" } },
      topicStatus: "current",
      completionPct: 6,
    }));
    render(<JourneyBoard courseId={33} />);
    fireEvent.click(await screen.findByRole("button", { name: /Resume learning/ }));
    expect(push).toHaveBeenCalledWith("/adaptive-courses/33/submodule/1443");
  });

  it("says start, not resume, on a calibrated course with nothing done", async () => {
    getJourney.mockResolvedValue(board({
      calibration: { required: true, done: true, pending: false, assessmentId: 476, assessmentSlug: "calibration-34-33", card: { ...CARD, status: "done" } },
      topicStatus: "current",
    }));
    render(<JourneyBoard courseId={33} />);
    expect(await screen.findByRole("button", { name: /Start learning/ })).toBeTruthy();
  });

  it("does not offer a calibration that has no questions yet", async () => {
    getJourney.mockResolvedValue(board({
      calibration: { required: true, done: false, pending: false, assessmentId: null, assessmentSlug: null, card: { ...CARD, configured: false, status: "not_configured" } },
      topicStatus: "current",
    }));
    render(<JourneyBoard courseId={33} />);
    expect(await screen.findByRole("button", { name: /Start learning/ })).toBeTruthy();
  });
});
