import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";

/**
 * The live adaptive quiz on a phone opens on the question.
 *
 * The desktop layout is three columns: a timer / points / skill-confidence rail, the question,
 * and the AI tutor. Collapsed to one column at 390px that put the rail first, so a learner
 * scrolled past a timer ring and a skills card to reach the question. On a phone the question
 * comes first, then the tutor, then the rail - through `order` inside the phone media block only,
 * so the desktop columns keep their source order.
 */

const MEDIA_BLOCK = /@media ([^{]+)\{((?:[^{}]*\{[^{}]*\})*)\}/g;
const PHONE_QUERY = "(max-width:599.95px)";
function cssOf(el: Element): { phone: string; unscoped: string } {
  const sheets = Array.from(document.querySelectorAll("style")).map((s) => s.textContent ?? "").join("\n");
  const classes = Array.from(el.classList).filter((c) => c.startsWith("css-") || c.startsWith("mui-"));
  const pick = (text: string) =>
    classes.flatMap((c) => text.split(/(?=\.(?:css|mui)-)/).filter((chunk) => chunk.startsWith(`.${c}`))).join("\n");
  let phone = "";
  for (const m of sheets.matchAll(MEDIA_BLOCK)) if (m[1].trim() === PHONE_QUERY) phone += `\n${m[2]}`;
  const unscoped = sheets.replace(MEDIA_BLOCK, (block, q: string) => (q.trim() === PHONE_QUERY ? "" : block));
  return { phone: pick(phone), unscoped: pick(unscoped) };
}

class NoopObserver { observe() {} unobserve() {} disconnect() {} takeRecords() { return []; } }
(globalThis as unknown as { IntersectionObserver: unknown }).IntersectionObserver = NoopObserver;

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn(), prefetch: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));

const question = {
  mcq_id: 9001, question_text: "Which command prints the installed Python version?",
  options: [{ id: "A", label: "A", value: "python --version" }, { id: "B", label: "B", value: "python -v2" }],
  target_skill: "installation procedures", difficulty_label: "Medium", selector_rationale: "", predicted_p_correct: 0.55,
  points: null, served_at: null,
};
vi.mock("@/hooks/useAdaptiveSession", () => ({
  useAdaptiveSession: () => ({
    loading: false, error: null, currentQuestion: question, thetaHistory: {}, selectedOption: null, setSelectedOption: vi.fn(),
    confidence: null, setConfidence: vi.fn(), submit: vi.fn(), submitting: false, hintsRemaining: 2, askHint: vi.fn(),
    hintRevealed: null, askingHint: false, hintTeaser: "", lastReward: null, sessionPoints: 40, questionStartMs: Date.now(),
    resetForNextQuestion: vi.fn(),
    session: {
      id: "s1", status: "active", question_count: 3, hints_used: 0, source_attempt: null,
      ability_state: { "installation procedures": -0.3 }, se_state: { "installation procedures": 0.8 },
      config: { id: 1, quiz_title: "Python install quiz", is_active: true, target_skills: [], min_questions: 8, max_questions: 20, se_threshold: 0.3, confidence_prompt_enabled: true, hint_tokens: 2 },
    },
  }),
}));

import { AdaptiveQuizLayout } from "./AdaptiveQuizLayout";

describe("live quiz order on a phone", () => {
  it("puts the question first, the tutor second and the rail last, on a phone only", () => {
    render(<AdaptiveQuizLayout sessionId="s1" />);
    expect(screen.getByText("Which command prints the installed Python version?")).toBeInTheDocument();
    const order = (id: string) => cssOf(screen.getByTestId(id));
    expect(order("quiz-question-slot").phone).toMatch(/order:0/);
    expect(order("quiz-tutor-rail").phone).toMatch(/order:1/);
    expect(order("quiz-left-rail").phone).toMatch(/order:2/);
    // Desktop keeps source order: no `order` a wider screen can match.
    for (const id of ["quiz-question-slot", "quiz-tutor-rail", "quiz-left-rail"]) {
      expect(order(id).unscoped, id).not.toMatch(/order:/);
    }
    // Submit is the one full-width, 48px action on a phone.
    const submit = screen.getByRole("button", { name: "Submit answer" });
    expect(cssOf(submit).phone).toMatch(/min-height:48px/);
    expect(cssOf(submit).unscoped).not.toMatch(/min-height:48px/);
  });
});
