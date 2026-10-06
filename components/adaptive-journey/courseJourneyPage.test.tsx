import { describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";

/**
 * The whole course page, with every part of the journey switched on at once.
 *
 * Each piece has its own unit tests. This is the one that would have caught the integration
 * failures: a milestone that throws on a board with no interview card, a rail that renders
 * twice, a certificate that disappeared when it moved out of the side panel. It renders the
 * real `JourneyBoard` against a board shaped like the API's and asserts the learner can see
 * the course, its test, its destination and where it leads.
 */

vi.mock("@/lib/hooks/useInstantNavigation", () => ({
  useInstantNavigation: () => ({ push: vi.fn(), prefetch: vi.fn(), replace: vi.fn(), isPending: false }),
}));
vi.mock("./JourneySidePanels", () => ({ JourneySidePanels: () => null }));
// The certificate card drags in jspdf + html-to-image and does its own server round trip.
// Its own tests cover it; here we only need to know the spine mounted it.
vi.mock("./CertificateCard", () => ({
  CertificateCard: () => <div data-testid="certificate-card">certificate</div>,
}));
vi.mock("@/lib/contexts/ClientInfoContext", () => ({ useIsAiVoiceTutorEnabled: () => true }));
vi.mock("@/components/common/Toast", () => ({ useToast: () => ({ showToast: vi.fn() }) }));
vi.mock("@/lib/services/mock-interview.service", () => ({
  default: { startTemplateInterview: vi.fn() },
}));
vi.mock("@/lib/hooks/useInterviewerVoice", () => ({ prefetchInterviewerClip: vi.fn() }));

const node = (id: number, type: string, title: string, status: string, ref: object) => ({
  id, type, title, order: id, status,
  score: { earned: status === "done" ? 30 : 0, total: 30 },
  weight: 1, basePoints: 30, unlockRule: "sequential",
  lockReason: status === "locked" ? "Finish the topic before this one" : null,
  isCalibration: false,
  content: type === "topic" ? { articles: 2, quizzes: 1, coding: 0, videos: 1 } : null,
  itemCount: 4, questionCount: type === "checkpoint" ? 10 : 0,
  proctored: false, durationMinutes: type === "checkpoint" ? 20 : null,
  // The tutor leg, as the API now sends it. `done` carries real connected minutes.
  tutor: type === "topic"
    ? status === "done"
      ? { state: "done", sessions: 1, minutes: 22 }
      : { state: status === "locked" ? "locked" : "ready", sessions: 0, minutes: 0 }
    : null,
  ref,
});

const board = {
  contentLocked: false,
  unitNoun: "Module",
  course: {
    id: 7, title: "Python Basics", description: "Start from zero.",
    fieldTier: "beginner", abilityIndex: null, enrolledCount: 12,
    certificateThreshold: 70, certificateEnabled: true, certificateTemplateUrl: null,
    certificateTitle: "Python Professional", estHours: 6, sections: 2, items: 4,
    completionPct: 50, startedAt: "2026-09-01T00:00:00Z",
  },
  progressCard: { pointsEarned: 30, pointsTotal: 90, onTimeRate: null, nodesDone: 1, nodesTotal: 3, completionPct: 50 },
  calibration: { required: false, done: false, card: null },
  interview: {
    card: {
      templateId: 28, configured: true, status: "not_started",
      topic: "Python", difficulty: "Medium", durationMinutes: 15,
    },
  },
  career: {
    daysSinceStart: 21, unlocked: true, unlocksAfterDays: 14,
    related: [], openCount: 2, resumeNudge: true,
    open: [
      { id: 1, title: "Backend Engineer", company: "Acme Corp", companyLogo: null,
        location: "Pune", workMode: "remote", employmentType: "full_time", salary: "" },
      { id: 2, title: "Data Analyst", company: "Beta Ltd", companyLogo: null,
        location: "Remote", workMode: "", employmentType: "", salary: "" },
    ],
  },
  weeks: [
    {
      weekNo: 1, title: "Week 1", schedule: null, penaltyStrip: null,
      totals: { earned: 30, total: 90 }, stepsDone: 1, stepsTotal: 3,
      nodes: [
        node(1, "topic", "Variables and types", "done", { submoduleId: 101 }),
        node(2, "topic", "Control flow", "current", { submoduleId: 102 }),
        node(3, "checkpoint", "Module 1 checkpoint", "locked", { assessmentId: 9, assessmentSlug: "py-wk01-checkpoint" }),
      ],
    },
  ],
};

vi.mock("@/lib/services/adaptive-journey.service", () => ({
  adaptiveJourneyService: { getJourney: () => Promise.resolve(board) },
}));

import { JourneyBoard } from "./JourneyBoard";

describe("a course with the whole journey switched on", () => {
  it("shows the modules, the checkpoint, both destinations and where it leads", async () => {
    render(<JourneyBoard courseId={7} />);
    await waitFor(() => expect(screen.getByText("Variables and types")).toBeTruthy());

    // Two modules. The checkpoint is NOT a third row - it is the third leg of the module it
    // closes, which is the whole point of the triad.
    expect(screen.getAllByTestId("journey-node")).toHaveLength(2);
    expect(screen.queryByText("Module 1 checkpoint")).toBeNull();

    // Every module states its three legs.
    expect(screen.getAllByTestId("module-triad")).toHaveLength(2);
    expect(screen.getAllByText(/1 · LESSONS/).length).toBe(2);
    expect(screen.getAllByText(/2 · AI TUTOR/).length).toBe(2);
    expect(screen.getAllByText(/3 · ASSESSMENT/).length).toBe(2);
    // This course's paper is still locked, so its tile states the condition rather than a
    // question count. `triad.test.ts` covers the open and scored wordings.
    expect(screen.getByText("After all lessons")).toBeTruthy();

    // The tutor is offered on the module they are on.
    expect(screen.getAllByRole("button", { name: /with the AI Tutor/ }).length).toBeGreaterThanOrEqual(1);
    // The finished module reports the time this learner really spent with the tutor.
    expect(screen.getByText("22 min session")).toBeTruthy();

    // Both terminal milestones, on the spine.
    expect(screen.getByText("MOCK INTERVIEW")).toBeTruthy();
    expect(screen.getByText("Interview: Python")).toBeTruthy();
    expect(screen.getByText("CERTIFICATE")).toBeTruthy();
    expect(screen.getByText("Python Professional")).toBeTruthy();
    // The certificate card moved here out of the side rail; it must still be on the page.
    expect(screen.getByTestId("certificate-card")).toBeTruthy();

    // And where the course leads.
    expect(screen.getByText("Where this takes you")).toBeTruthy();
    expect(screen.getByText("Backend Engineer")).toBeTruthy();
    expect(screen.getByText(/Add what Python Basics taught you/)).toBeTruthy();
  });

  it("renders each milestone exactly once", async () => {
    // The interview exists as a top card AND as a milestone; the certificate used to be in the
    // side rail. Either could easily have ended up on the page twice.
    render(<JourneyBoard courseId={7} />);
    await waitFor(() => expect(screen.getByText("CERTIFICATE")).toBeTruthy());
    expect(screen.getAllByText("CERTIFICATE")).toHaveLength(1);
    expect(screen.getAllByText("MOCK INTERVIEW")).toHaveLength(1);
    expect(screen.getAllByTestId("certificate-card")).toHaveLength(1);
  });

  it("says what opens the module's assessment rather than offering a locked one", async () => {
    render(<JourneyBoard courseId={7} />);
    await waitFor(() => expect(screen.getAllByTestId("module-triad").length).toBe(2));
    // The locked paper's tile states its condition instead of a question count.
    expect(screen.getByText("After all lessons")).toBeTruthy();
  });
});
