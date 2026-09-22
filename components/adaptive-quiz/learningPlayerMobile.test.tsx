import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";

/**
 * The learning player on a phone: the adaptive quiz library, article code blocks and the quiz
 * tutor rail.
 *
 * Measured on an iPhone 14 (390px) against the demo tenant: /adaptive-quizzes rendered 4,123 text
 * nodes under 12px, nearly all of them the same two labels repeated on every one of ~1,000 quiz
 * cards (a 9.9px "ADAPTIVE" eyebrow and 10.9px skill chips). An article code block's copy button
 * was a 25px target, and the tutor's "Spend 1 hint" button was 26px tall.
 *
 * jsdom has no layout, so what is pinned is the emitted CSS: each phone value lives inside the
 * max-width:599.95px block, and the rules a desktop browser can match still carry main's values.
 */

// ---- viewport ---------------------------------------------------------------------------------
const realMatchMedia = window.matchMedia;
function viewport(width: number) {
  window.matchMedia = ((query: string) => {
    const max = /max-width:\s*([\d.]+)px/.exec(query);
    const min = /min-width:\s*([\d.]+)px/.exec(query);
    let matches = false;
    if (max) matches = width <= parseFloat(max[1]);
    else if (min) matches = width >= parseFloat(min[1]);
    return {
      matches, media: query, onchange: null,
      addListener: vi.fn(), removeListener: vi.fn(), addEventListener: vi.fn(), removeEventListener: vi.fn(), dispatchEvent: vi.fn(),
    };
  }) as unknown as typeof window.matchMedia;
}
afterEach(() => {
  window.matchMedia = realMatchMedia;
});

// ---- emitted CSS, split by where it applies -----------------------------------------------------
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

vi.mock("@/components/common/prism-light", () => ({
  SyntaxHighlighter: ({ children }: { children: string }) => <pre>{children}</pre>,
}));

import { AdaptiveQuizCard } from "./AdaptiveQuizCard";
import { CodeBlock } from "./article/CodeBlock";
import { AITutorSidecar } from "./mid/AITutorSidecar";

const quiz = {
  config_id: 1248,
  quiz_title: "Introduction to Python and Installation",
  target_skills: ["python overview", "installation procedures", "python ides", "pip", "venv"],
  min_questions: 8,
  max_questions: 20,
  mcq_count: 18,
  hint_tokens: 2,
};

describe("adaptive quiz library card on a phone", () => {
  it("raises the eyebrow and the skill chips to 12px inside the phone block only", () => {
    viewport(390);
    render(<AdaptiveQuizCard data={quiz} onStart={() => {}} />);
    for (const label of ["Adaptive", "Python Overview", "+2"]) {
      const { phone, unscoped } = cssOf(screen.getByText(label));
      expect(phone, label).toMatch(/font-size:0\.75rem/);
      // Desktop keeps the authored size, and nothing sets the phone size where a desktop can see it.
      expect(unscoped, label).toMatch(/font-size:0\.6[28]rem/);
      expect(unscoped, label).not.toMatch(/font-size:0\.75rem/);
    }
  });
});

describe("article code block on a phone", () => {
  it("gives the copy button a 44px target on a phone and leaves the desktop button as it was", () => {
    viewport(390);
    render(<CodeBlock code={"sudo apt update"} language="bash" />);
    const copy = screen.getByRole("button", { name: "Copy code" });
    const { phone, unscoped } = cssOf(copy);
    expect(phone).toMatch(/width:44px/);
    expect(phone).toMatch(/height:44px/);
    expect(unscoped).not.toMatch(/width:44px/);
    // The language label clears the 12px floor on a phone too.
    expect(cssOf(screen.getByText("BASH")).phone).toMatch(/font-size:0\.75rem/);
  });
});

describe("AI tutor rail on a phone", () => {
  it("makes the spend-a-hint button a 44px, 12px-text target inside the phone block", () => {
    viewport(390);
    render(
      <AITutorSidecar
        hintTokensRemaining={2}
        onAskHint={() => {}}
        predictedPCorrect={0.55}
        difficultyLabel="Medium"
        targetSkill="installation procedures"
        avgSe={0.7}
      />,
    );
    const spend = screen.getByRole("button", { name: /Spend 1 hint/ });
    const { phone, unscoped } = cssOf(spend);
    expect(phone).toMatch(/min-height:44px/);
    expect(phone).toMatch(/font-size:0\.75rem/);
    expect(unscoped).toMatch(/font-size:0\.7rem/);
    expect(unscoped).not.toMatch(/min-height:44px/);
  });
});
