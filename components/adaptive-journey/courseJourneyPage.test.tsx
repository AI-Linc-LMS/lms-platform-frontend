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

// The course page keeps its open tab in the URL, so it needs the app router.
vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: vi.fn(), push: vi.fn(), back: vi.fn(), prefetch: vi.fn() }),
  usePathname: () => "/adaptive-courses/7",
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock("@/lib/hooks/useInstantNavigation", () => ({
  useInstantNavigation: () => ({ push: vi.fn(), prefetch: vi.fn(), replace: vi.fn(), isPending: false }),
}));
vi.mock("./JourneySidePanels", () => ({ JourneySidePanels: () => null }));
// The certificate station drags in jspdf + html-to-image and does its own server round trip.
// Its own tests cover it; here we only need to know the spine mounted it, exactly ONCE - it
// used to render twice, as a milestone wrapper plus the full card nested beneath it.
vi.mock("./spine/CertificateMilestone", () => ({
  CertificateMilestone: () => <div data-testid="certificate-card">CERTIFICATE</div>,
}));
vi.mock("@/lib/contexts/ClientInfoContext", () => ({
  useIsAiVoiceTutorEnabled: () => true,
  useIsInterviewV2Enabled: () => false,
}));
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

    // Two modules AND the week's paper, each once. The paper used to be taken off the rail and
    // redrawn as a tile inside every module's card: one paper became two tiles, each sitting on
    // a single topic, and a learner who finished one topic opened it expecting that topic's
    // questions. It covers the week, so it gets one station of its own after the modules.
    expect(screen.getAllByTestId("journey-node")).toHaveLength(3);
    expect(screen.getAllByText("Module 1 checkpoint")).toHaveLength(1);

    // No tiles on a module at all - not the tutor (the card carries a "Learn with AI Tutor"
    // pill, and a tile beside it was a second control for one thing) and not the assessment.
    expect(screen.queryByTestId("module-triad")).toBeNull();
    expect(screen.queryByText("AI TUTOR")).toBeNull();
    expect(screen.queryByText("No assessment")).toBeNull();

    // The tutor is offered on the module they are on - by the pill, which is now the only
    // control for it.
    expect(screen.getAllByRole("button", { name: /with the AI Tutor/ }).length).toBeGreaterThanOrEqual(1);
    // And the minutes are no longer reported on the card. That went with the tile, and it is
    // a deliberate loss rather than an oversight: the tile was a second control for the same
    // thing, sitting in a row of steps, and that is what made an optional help read as work.
    // The tutor's own surface still has the history.
    expect(screen.queryByText("22 min session")).toBeNull();

    // The certificate is the course's ONLY terminal milestone. The entry level-gauge used to
    // sit here too, which put the first thing a learner does at the end of their course - and
    // ticked it the moment they sat the gauge.
    expect(screen.queryByText("Interview: Python")).toBeNull();
    // Exactly one certificate station, carrying the real card's machinery.
    expect(screen.getAllByTestId("certificate-card")).toHaveLength(1);

    // And where the course leads is now its own section rather than 78 rows below the spine -
    // which is why it read as "there are no jobs" on a 28-week course.
    expect(screen.getByRole("tab", { name: /Jobs & Resume/ })).toBeTruthy();
    expect(screen.queryByText("Where this takes you")).toBeNull();
  });

  it("renders each milestone exactly once", async () => {
    // The interview exists as a top card AND as a milestone; the certificate used to be in the
    // side rail. Either could easily have ended up on the page twice.
    render(<JourneyBoard courseId={7} />);
    await waitFor(() => expect(screen.getAllByTestId("certificate-card")).toHaveLength(1));
    // The reported bug: the certificate rendered twice, as a milestone card AND the full
    // certificate card nested under it, saying the same thing in two voices.
    expect(screen.getAllByTestId("certificate-card")).toHaveLength(1);
  });

  it("draws the week's paper once, after the modules it covers", async () => {
    render(<JourneyBoard courseId={7} />);
    await waitFor(() => expect(screen.getAllByTestId("journey-node").length).toBe(3));
    const titles = screen.getAllByTestId("journey-node").map((n) => n.textContent ?? "");
    // Order matters: the paper closes the week, so it reads as covering what came before it
    // rather than as one more topic.
    expect(titles[0]).toContain("Variables and types");
    expect(titles[2]).toContain("Module 1 checkpoint");
    // And it is the ONLY place the paper appears - the duplication is what was reported.
    expect(titles.filter((t) => t.includes("Module 1 checkpoint"))).toHaveLength(1);
  });
});


describe("the course's sections", () => {
  it("offers one tab per thing the course actually has", async () => {
    render(<JourneyBoard courseId={7} />);
    await waitFor(() => expect(screen.getByRole("tab", { name: /Journey/ })).toBeTruthy());
    for (const name of [/Journey/, /AI Tutor/, /Assessments/, /Level Check/, /Jobs & Resume/, /Certificate/]) {
      expect(screen.getByRole("tab", { name })).toBeTruthy();
    }
  });

  it("opens on the journey", async () => {
    render(<JourneyBoard courseId={7} />);
    await waitFor(() => expect(screen.getByRole("tab", { name: /Journey/ })).toBeTruthy());
    expect(screen.getByRole("tab", { name: /Journey/ })).toHaveAttribute("aria-selected", "true");
    expect(screen.getAllByTestId("journey-node").length).toBeGreaterThan(0);
  });

  it("offers each section exactly once", async () => {
    // There was a white strip of status pills under the tab bar saying the same six words
    // again. Two rows of section navigation, one above the other, is one row too many.
    render(<JourneyBoard courseId={7} />);
    await waitFor(() => expect(screen.getByRole("tab", { name: /Journey/ })).toBeTruthy());
    for (const name of [/Journey/, /AI Tutor/, /Assessments/, /Level Check/, /Jobs & Resume/, /Certificate/]) {
      expect(screen.getAllByRole("tab", { name })).toHaveLength(1);
    }
  });
});
