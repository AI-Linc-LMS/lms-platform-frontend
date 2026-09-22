import { afterEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";
import type { ReactNode } from "react";

/**
 * The AI Tutor on a phone: the dashboard's composer, the session room and its quiz.
 *
 * Measured on an iPhone 14 (390px): the quick-start, level and length chips were 33px, "Show all"
 * 29px, the room's back / plan / editor / conversation buttons 40px, and the quiz a centred dialog
 * over a full-bleed dark room. The room itself was never opened live - starting a session costs
 * money - so it is rendered here with the realtime hook stubbed out.
 *
 * jsdom has no layout. What is pinned is where each phone value was emitted: inside the
 * max-width:599.95px block, and nowhere a desktop browser can match.
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
      matches,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    };
  }) as unknown as typeof window.matchMedia;
}
afterEach(() => {
  window.matchMedia = realMatchMedia;
});

// ---- app seams --------------------------------------------------------------------------------
const tutor = vi.hoisted(() => ({
  start: vi.fn(async () => null),
  end: vi.fn(async () => undefined),
  keepaliveEnd: vi.fn(),
  phase: "listening",
  sessionId: "s-1",
  cards: [],
  planIndex: 0,
  reconnecting: false,
  idleWarning: true,
  confirmPresence: vi.fn(),
  remainingSeconds: 600,
  getLevels: () => ({ input: 0, output: 0 }),
  caption: "",
  transcript: [],
  shareCode: vi.fn(),
  reportRunResult: vi.fn(),
  setQuizOpen: vi.fn(),
  submitQuizAnswer: vi.fn(),
  reportQuizSkipped: vi.fn(),
  tutorTurnId: 0,
  error: null,
}));
vi.mock("@/lib/hooks/useRealtimeTutor", () => ({ useRealtimeTutor: () => tutor }));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn(), prefetch: vi.fn() }),
  useSearchParams: () => new URLSearchParams("topic=Recursion&level=beginner&minutes=10"),
}));
vi.mock("@tanstack/react-query", async (orig) => ({
  ...(await orig<typeof import("@tanstack/react-query")>()),
  useQueryClient: () => ({ invalidateQueries: vi.fn() }),
}));
vi.mock("@/components/layout/MainLayout", () => ({
  MainLayout: ({ children }: { children: ReactNode }) => <div data-testid="layout">{children}</div>,
}));
vi.mock("@/components/common/Toast", () => ({ useToast: () => ({ showToast: vi.fn() }) }));
// WebGL ribbon: nothing to lay out in jsdom.
vi.mock("@/components/ai-tutor/room/TutorVoice", () => ({
  TutorVoice: () => <div data-testid="voice" />,
  PHASE_LABEL: {},
}));

import TutorSessionPage from "@/app/ai-tutor/session/[id]/page";
import { TopicComposer } from "./dashboard/TopicComposer";
import { QuizOverlay } from "./room/QuizOverlay";
import { ConversationPanel } from "./room/ConversationPanel";
import type { PooledQuestion } from "@/lib/services/ai-tutor.service";

// ---- emitted CSS, split by where it applies -----------------------------------------------------
const MEDIA_BLOCK = /@media ([^{]+)\{((?:[^{}]*\{[^{}]*\})*)\}/g;
const PHONE_QUERY = "(max-width:599.95px)";
function cssOf(el: Element): { phone: string; unscoped: string } {
  const sheets = Array.from(document.querySelectorAll("style"))
    .map((s) => s.textContent ?? "")
    .join("\n");
  const classes = Array.from(el.classList).filter((c) => c.startsWith("css-") || c.startsWith("mui-"));
  const pick = (text: string) =>
    classes
      .flatMap((c) => text.split(/(?=\.(?:css|mui)-)/).filter((chunk) => chunk.startsWith(`.${c}`)))
      .join("\n");
  let phone = "";
  for (const m of sheets.matchAll(MEDIA_BLOCK)) if (m[1].trim() === PHONE_QUERY) phone += `\n${m[2]}`;
  const unscoped = sheets.replace(MEDIA_BLOCK, (block, q: string) => (q.trim() === PHONE_QUERY ? "" : block));
  return { phone: pick(phone), unscoped: pick(unscoped) };
}

const QUESTION: PooledQuestion = {
  id: 1,
  question: "What does range(3) produce?",
  image: "",
  image_alt: "",
  options: [
    { id: "a", label: "0, 1, 2" },
    { id: "b", label: "1, 2, 3" },
  ],
  style: "single",
  difficulty: "medium",
  topic: "loops",
};

// ================================================================================================

describe("the composer", () => {
  it("gives every chip a 44px target on a phone and keeps the desktop pill", () => {
    render(<TopicComposer onStart={vi.fn()} />);
    for (const name of ["Recursion", "Some idea", "10 min"]) {
      const css = cssOf(screen.getByRole("button", { name }));
      expect(css.phone).toMatch(/min-height:44px/);
      expect(css.unscoped).not.toMatch(/min-height:44px/);
    }
  });
});

describe("the session room", () => {
  it("makes back, plan, editor, conversation and end 44px on a phone, and 40px elsewhere", () => {
    render(<TutorSessionPage />);
    const back = screen.getByRole("button", { name: "Leave session" });
    expect(cssOf(back).phone).toMatch(/width:44px/);
    expect(cssOf(back).unscoped).toMatch(/width:40px/);
    expect(cssOf(back).unscoped).not.toMatch(/44px/);

    expect(cssOf(screen.getByRole("button", { name: "Today's plan" })).phone).toMatch(/height:44px/);

    for (const pressed of screen.getAllByRole("button", { pressed: false })) {
      expect(cssOf(pressed).phone).toMatch(/height:44px/);
      expect(cssOf(pressed).unscoped).toMatch(/height:40px/);
    }
    const end = screen.getByRole("button", { name: /End session/ });
    expect(cssOf(end).phone).toMatch(/min-height:44px/);
    expect(cssOf(end).unscoped).not.toMatch(/min-height:44px/);
  });

  it("keeps the idle prompt's answer at 44px on a phone", () => {
    render(<TutorSessionPage />);
    const css = cssOf(screen.getByRole("button", { name: /still here/ }));
    expect(css.phone).toMatch(/min-height:44px/);
    expect(css.unscoped).not.toMatch(/min-height:44px/);
  });

  it("clears the notch: the top bar pads by the safe-area inset on a phone only", () => {
    render(<TutorSessionPage />);
    const bar = screen.getByRole("button", { name: "Leave session" }).parentElement as HTMLElement;
    expect(cssOf(bar).phone).toMatch(/padding-top:calc\(12px \+ env\(safe-area-inset-top\)\)/);
    expect(cssOf(bar).unscoped).not.toMatch(/safe-area-inset-top/);
  });
});

describe("the quiz", () => {
  it("is a bottom sheet over the room on a phone and the original dialog on a desktop", () => {
    viewport(390);
    const { unmount } = render(<QuizOverlay question={QUESTION} onAnswer={vi.fn()} onClose={vi.fn()} />);
    expect(screen.getByTestId("quiz-sheet")).toBeTruthy();
    expect(document.querySelector(".MuiDrawer-paperAnchorBottom")).toBeTruthy();
    expect(document.querySelector(".MuiDialog-root")).toBeNull();
    unmount();

    viewport(1440);
    render(<QuizOverlay question={QUESTION} onAnswer={vi.fn()} onClose={vi.fn()} />);
    expect(screen.queryByTestId("quiz-sheet")).toBeNull();
    expect(document.querySelector(".MuiDialog-root")).toBeTruthy();
  });

  it("puts Skip and Check under the thumb at 44px on a phone", () => {
    viewport(390);
    render(<QuizOverlay question={QUESTION} onAnswer={vi.fn()} onClose={vi.fn()} />);
    for (const name of ["Skip", "Check my answer"]) {
      const css = cssOf(screen.getByRole("button", { name }));
      expect(css.phone).toMatch(/min-height:44px/);
      expect(css.unscoped).not.toMatch(/min-height:44px/);
    }
  });

  it("can still be skipped on a phone, and says so to the tutor", async () => {
    viewport(390);
    const onClose = vi.fn();
    render(<QuizOverlay question={QUESTION} onAnswer={vi.fn()} onClose={onClose} />);
    // From inside the sheet: the phone path, not the dialog.
    const sheet = screen.getByTestId("quiz-sheet");
    fireEvent.click(within(sheet).getByRole("button", { name: "Skip" }));
    await vi.waitFor(() => expect(onClose).toHaveBeenCalledWith(false));
  });
});

describe("the conversation panel", () => {
  it("has a 44px close on a phone", () => {
    render(<ConversationPanel entries={[]} liveCaption="" onClose={vi.fn()} />);
    const css = cssOf(screen.getByRole("button", { name: "Close conversation" }));
    expect(css.phone).toMatch(/min-height:44px/);
    expect(css.unscoped).not.toMatch(/min-height:44px/);
  });
});
