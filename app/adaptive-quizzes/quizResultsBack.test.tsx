import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import "@/lib/i18n";

/**
 * Back from a quiz's results returns to where the learner came from.
 *
 * Reported: finishing "Re-quiz: Installation Procedures (targeted)" - a re-quiz of "Introduction to
 * Python and Installation - Adaptive Quiz", started inside the course - showed "Back to library"
 * and landed on the standalone Adaptive Quizzes page. The results page knew the course only from
 * a `?from=` link parameter, and starting the re-quiz dropped it; a re-quiz's own config is in no
 * course, so nothing else could say where it belonged. The server now names the attempt's course
 * topic (`origin`, through the chain's original attempt), and every hop carries `?from=` on.
 */

class NoopObserver { observe() {} unobserve() {} disconnect() {} takeRecords() { return []; } }
(globalThis as unknown as { IntersectionObserver: unknown }).IntersectionObserver = NoopObserver;

const nav = vi.hoisted(() => ({
  search: "",
  push: vi.fn(),
}));
vi.mock("next/navigation", () => ({
  useParams: () => ({ sessionId: "requiz-1" }),
  useSearchParams: () => new URLSearchParams(nav.search),
  useRouter: () => ({ push: nav.push, replace: vi.fn(), back: vi.fn(), prefetch: vi.fn() }),
}));
vi.mock("@/components/layout/MainLayout", () => ({ MainLayout: ({ children }: { children: ReactNode }) => <>{children}</> }));
vi.mock("@/components/common/Toast", () => ({ useToast: () => ({ showToast: vi.fn() }) }));
vi.mock("@/hooks/useAdaptiveFeatureGuard", () => ({ useAdaptiveFeatureGuard: () => true }));
const nextStep = vi.hoisted(() => ({ calls: [] as unknown[][] }));
vi.mock("@/components/adaptive-course/NextStepCard", () => ({
  NextStepCard: () => null,
  useNextStep: (...args: unknown[]) => {
    nextStep.calls.push(args);
    return { next: null, alreadyCompleted: false };
  },
}));
vi.mock("@/hooks/useStreamingNarration", () => ({
  useStreamingNarration: () => ({
    headline: "", score_summary: null, skill_mastery: [], target_outcome: null, per_question: [], misconceptions: [],
    remediation_path: [{ step: 1, action_kind: "requiz", content_type: "requiz", title: "Take the re-quiz" }],
    status: { headline: "ready", per_question: "ready", misconceptions: "ready", remediation_path: "ready" },
    anySectionReady: true, allDone: true, retrySection: vi.fn(),
  }),
}));
// The results sections themselves are not what this test is about. (KpiRail's count-up is loaded
// with a runtime require that the test bundler cannot resolve.)
vi.mock("@/components/scorecard/shared", async (orig) => ({
  ...(await orig<Record<string, unknown>>()),
  KpiRail: () => null,
}));
vi.mock("@/components/adaptive-quiz/results/ResultStrip", () => ({ ResultStrip: () => null }));
vi.mock("@/components/adaptive-quiz/results/SkillMasteryHeatmap", () => ({ SkillMasteryHeatmap: () => null }));
vi.mock("@/components/adaptive-quiz/results/MisconceptionCallout", () => ({ MisconceptionCallout: () => null }));
vi.mock("@/components/adaptive-quiz/results/PerQuestionBreakdown", () => ({ PerQuestionBreakdown: () => null }));
vi.mock("@/components/adaptive-quiz/results/NarrationComposer", () => ({ NarrationComposer: () => null }));
vi.mock("@/components/adaptive-quiz/results/TargetOutcomeBanner", () => ({ TargetOutcomeBanner: () => null }));
vi.mock("@/components/adaptive-quiz/results/RemediationPathCard", () => ({
  RemediationPathCard: ({ onStartPath }: { onStartPath?: () => void }) => (
    <button type="button" onClick={() => onStartPath?.()}>Start the re-quiz</button>
  ),
}));

const TOPIC = { course_id: 13, course_title: "Python Basics", submodule_id: 1443, submodule_title: "Introduction to Python and Installation" };
const service = vi.hoisted(() => ({ session: null as unknown, spawnRequiz: vi.fn() }));
vi.mock("@/lib/services/adaptive-quiz.service", () => ({
  adaptiveQuizService: {
    getSession: () => Promise.resolve(service.session),
    spawnRequiz: service.spawnRequiz,
  },
}));

function requizSession(origin: typeof TOPIC | null) {
  return {
    id: "requiz-1", status: "completed", started_at: "2026-09-11T10:00:00Z", completed_at: "2026-09-11T10:06:00Z",
    question_count: 1, hints_used: 0, ability_state: {}, se_state: {}, pending_question: null,
    ai_narration: null, ai_narration_generated_at: null,
    config: {
      id: 4013, quiz_title: "Re-quiz: Installation Procedures (targeted)", is_active: true, target_skills: [],
      min_questions: 4, max_questions: 8, se_threshold: 0.4, confidence_prompt_enabled: true, hint_tokens: 1,
    },
    responses: [{ order_index: 0, mcq: 1, mcq_detail: null, target_skill: "installation procedures", selected_option: "A", is_correct: true, confidence: null, time_ms: 9000, hint_used: false, theta_after: {}, se_after: {}, asked_at: "2026-09-11T10:01:00Z" }],
    source_attempt: { session_id: "orig-1", quiz_title: "Introduction to Python and Installation - Adaptive Quiz", completed_at: "2026-09-11T09:50:00Z" },
    attempt_chain: { total: 1, attempts: [] },
    origin,
  };
}

import ResultsPage from "./session/[sessionId]/results/page";

async function backButton() {
  return waitFor(() => screen.getByRole("button", { name: /\bBack\b/ }));
}

beforeEach(() => {
  nav.search = "";
  nav.push.mockReset();
  nextStep.calls = [];
  service.spawnRequiz.mockReset();
});

describe("quiz results Back", () => {
  it("returns a re-quiz opened without ?from= to its course topic, named", async () => {
    service.session = requizSession(TOPIC);
    render(<ResultsPage />);
    const back = await backButton();
    expect(back).toHaveTextContent("Back to Introduction to Python and Installation");
    fireEvent.click(back);
    expect(nav.push).toHaveBeenCalledWith("/adaptive-courses/13/submodule/1443");
    // Next is worked out in the same topic.
    expect(nextStep.calls.at(-1)?.slice(0, 2)).toEqual([13, 1443]);
  });

  it("keeps the launch point when there is one, and names the topic it points at", async () => {
    service.session = requizSession(TOPIC);
    nav.search = `from=${encodeURIComponent("/adaptive-courses/13/submodule/1443?from=/roadmaps/infosys/step/5")}`;
    render(<ResultsPage />);
    const back = await backButton();
    expect(back).toHaveTextContent("Back to Introduction to Python and Installation");
    fireEvent.click(back);
    expect(nav.push).toHaveBeenCalledWith("/adaptive-courses/13/submodule/1443?from=/roadmaps/infosys/step/5");
  });

  it("goes back to a roadmap or the library when that is where the quiz was opened", async () => {
    service.session = requizSession(TOPIC);
    nav.search = `from=${encodeURIComponent("/roadmaps/infosys/step/5")}`;
    const { unmount } = render(<ResultsPage />);
    expect(await backButton()).toHaveTextContent("Back to roadmap");
    unmount();

    nav.search = `from=${encodeURIComponent("/adaptive-quizzes")}`;
    render(<ResultsPage />);
    const back = await backButton();
    expect(back).toHaveTextContent("Back to library");
    fireEvent.click(back);
    expect(nav.push).toHaveBeenCalledWith("/adaptive-quizzes");
  });

  it("falls back to the library only for a quiz in no course", async () => {
    service.session = requizSession(null);
    render(<ResultsPage />);
    const back = await backButton();
    expect(back).toHaveTextContent("Back to library");
    fireEvent.click(back);
    expect(nav.push).toHaveBeenCalledWith("/adaptive-quizzes");
  });

  it("ignores a ?from= that leaves the site", async () => {
    service.session = requizSession(TOPIC);
    nav.search = `from=${encodeURIComponent("//evil.example/phish")}`;
    render(<ResultsPage />);
    fireEvent.click(await backButton());
    expect(nav.push).toHaveBeenCalledWith("/adaptive-courses/13/submodule/1443");
  });

  it("carries the launch point into the re-quiz it starts", async () => {
    service.session = requizSession(TOPIC);
    service.spawnRequiz.mockResolvedValue({ session_id: "requiz-2", config_id: 4014 });
    nav.search = `from=${encodeURIComponent("/adaptive-courses/13/submodule/1443")}`;
    render(<ResultsPage />);
    fireEvent.click(await waitFor(() => screen.getByRole("button", { name: "Start the re-quiz" })));
    await waitFor(() =>
      expect(nav.push).toHaveBeenCalledWith(
        `/adaptive-quizzes/session/requiz-2?from=${encodeURIComponent("/adaptive-courses/13/submodule/1443")}`,
      ),
    );
  });
});
