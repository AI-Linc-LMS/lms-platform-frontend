import { afterEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";

/**
 * Interview (realtime v2) and Mock Interview (legacy) on a phone.
 *
 * Measured on an iPhone 14 (390px), with the demo student's pages served from fixtures (every
 * demo account is profile-gated out of both modules and the live data is read-only): the v2
 * composer's chips were 26px, the scheduled card's status chip hung past the card edge and its
 * "Start Now" was squeezed beside a wrapped date, the section tabs ran off the screen with the
 * active one out of sight, and every interview dialog was a centred desktop dialog.
 *
 * jsdom has no layout. What is pinned is the structure (sheet or dialog) and where each phone
 * value was emitted: inside the max-width:599.95px block, and nowhere a desktop can match.
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
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn(), prefetch: vi.fn() }),
}));
vi.mock("react-i18next", () => ({ useTranslation: () => ({ t: (key: string) => key }) }));
vi.mock("@/components/editor/MonacoEditor", () => ({ CodeEditor: () => <textarea aria-label="code" /> }));

import { InterviewComposer } from "@/components/interview/InterviewComposer";
import { EndInterviewDialog } from "./EndInterviewDialog";
import { FullscreenWarningDialog } from "./FullscreenWarningDialog";
import { MCQQuestionModal } from "./MCQQuestionModal";
import { CodingQuestionModal } from "./CodingQuestionModal";
import { ScheduledInterviewsTable } from "./ScheduledInterviewsTable";
import { PreviousInterviewsTable } from "./PreviousInterviewsTable";
import { InterviewStats } from "./InterviewStats";
import type { MockInterview } from "@/lib/services/mock-interview.service";

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

const interview = (over: Partial<MockInterview>): MockInterview => ({
  id: 103,
  title: "SQL joins",
  topic: "SQL",
  subtopic: "Joins",
  difficulty: "Hard",
  duration_minutes: 15,
  status: "scheduled",
  created_at: "2026-09-20T10:00:00Z",
  scheduled_date_time: "2026-09-30T09:30:00Z",
  ...over,
});

// ================================================================================================

describe("the realtime interview composer", () => {
  it("gives the suggestion and option chips a 44px target on a phone only", () => {
    render(<InterviewComposer />);
    for (const name of ["React hooks", "Technical", "Medium", "10 min"]) {
      const css = cssOf(screen.getByRole("button", { name }));
      expect(css.phone).toMatch(/min-height:44px/);
      expect(css.unscoped).not.toMatch(/min-height:44px/);
    }
  });

  it("lays the five suggestions in one sideways row on a phone instead of three wrapped rows", () => {
    render(<InterviewComposer />);
    const row = screen.getByRole("button", { name: "React hooks" }).parentElement as HTMLElement;
    expect(cssOf(row).phone).toMatch(/flex-wrap:nowrap/);
    expect(cssOf(row).phone).toMatch(/overflow-x:auto/);
    expect(cssOf(row).unscoped).toMatch(/flex-wrap:wrap/);
    expect(cssOf(row).unscoped).not.toMatch(/overflow-x:auto/);
  });
});

describe("the interview dialogs", () => {
  const sheetCss = () => cssOf(document.querySelector(".MuiDialog-root") as Element);

  it("pins End Interview to the bottom edge on a phone and leaves the desktop dialog untouched", () => {
    viewport(390);
    const { unmount } = render(<EndInterviewDialog open onConfirm={vi.fn()} onCancel={vi.fn()} />);
    expect(sheetCss().phone).toMatch(/align-items:flex-end/);
    expect(sheetCss().phone).toMatch(/border-radius:20px 20px 0 0/);
    unmount();

    viewport(1440);
    render(<EndInterviewDialog open onConfirm={vi.fn()} onCancel={vi.fn()} />);
    // No sheet styles at all on a desktop: the Dialog gets exactly main's props.
    expect(sheetCss().phone).toBe("");
    expect(sheetCss().unscoped).not.toMatch(/flex-end|20px 20px 0 0/);
  });

  it("keeps both End Interview actions reachable and working on a phone", () => {
    viewport(390);
    const onConfirm = vi.fn();
    const onCancel = vi.fn();
    render(<EndInterviewDialog open onConfirm={onConfirm} onCancel={onCancel} />);
    expect(sheetCss().phone).toMatch(/align-items:flex-end/);
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    fireEvent.click(screen.getByRole("button", { name: /End Interview/ }));
    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it("makes the fullscreen warning and the MCQ ask sheets too, still not dismissable by Escape", () => {
    viewport(390);
    const { unmount } = render(<FullscreenWarningDialog open onReEnterFullscreen={vi.fn()} />);
    expect(sheetCss().phone).toMatch(/align-items:flex-end/);
    unmount();

    const onSubmit = vi.fn();
    render(
      <MCQQuestionModal
        open
        multiSelect={false}
        options={[
          { id: "a", text: "useMemo" },
          { id: "b", text: "useCallback" },
        ]}
        onSubmit={onSubmit}
      />,
    );
    expect(sheetCss().phone).toMatch(/align-items:flex-end/);
    fireEvent.keyDown(document.querySelector(".MuiDialog-root") as Element, { key: "Escape" });
    expect(screen.getByText("Quick Multiple Choice")).toBeTruthy();
  });

  it("gives the coding ask the whole phone, and the desktop its 92vh dialog", () => {
    const problem = { title: "Two sum", statement: "Return indices.", starter_code: "", language: "python" };
    viewport(390);
    const { unmount } = render(<CodingQuestionModal open problem={problem as never} onSubmit={vi.fn()} />);
    expect(document.querySelector(".MuiDialog-paperFullScreen")).toBeTruthy();
    unmount();

    viewport(1440);
    render(<CodingQuestionModal open problem={problem as never} onSubmit={vi.fn()} />);
    expect(document.querySelector(".MuiDialog-paperFullScreen")).toBeNull();
  });
});

describe("the interview lists", () => {
  it("stacks a scheduled card's date and full-width Start Now on a phone", () => {
    render(<ScheduledInterviewsTable interviews={[interview({})]} onViewDetails={vi.fn()} />);
    const start = screen.getByRole("button", { name: /Start Now/ });
    const actions = start.parentElement as HTMLElement;
    const footer = actions.parentElement as HTMLElement;
    expect(cssOf(footer).phone).toMatch(/flex-direction:column/);
    expect(cssOf(footer).unscoped).not.toMatch(/flex-direction:column/);
    expect(cssOf(start).phone).toMatch(/min-height:44px/);
    expect(cssOf(start).unscoped).not.toMatch(/min-height:44px/);
  });

  it("lets the scheduled card's header wrap on a phone so the status chip stays inside the card", () => {
    render(<ScheduledInterviewsTable interviews={[interview({})]} onViewDetails={vi.fn()} />);
    const chip = screen.getByText("Scheduled").closest(".MuiChip-root") as HTMLElement;
    const header = chip.parentElement as HTMLElement;
    expect(cssOf(header).phone).toMatch(/flex-wrap:wrap/);
    expect(cssOf(header).unscoped).not.toMatch(/flex-wrap:wrap/);
  });

  it("gives a previous interview a full-width 44px View Result on a phone", () => {
    render(<PreviousInterviewsTable interviews={[interview({ status: "completed", id: 101 })]} />);
    const card = screen.getByText("SQL joins").closest(".MuiPaper-root") as HTMLElement;
    const view = within(card).getByRole("button", { name: /View Result/ });
    expect(cssOf(view).phone).toMatch(/min-height:44px/);
    expect(cssOf(view).phone).toMatch(/width:100%/);
    expect(cssOf(view).unscoped).not.toMatch(/min-height:44px/);
  });

  it("packs the four stats into two compact columns on a phone", () => {
    render(<InterviewStats totalInterviews={4} completedInterviews={2} scheduledInterviews={1} averageScore={66} />);
    const grid = screen.getByText("4").closest(".MuiPaper-root")?.parentElement?.parentElement as HTMLElement;
    expect(cssOf(grid).phone).toMatch(/grid-template-columns:repeat\(2, minmax\(0, 1fr\)\)/);
    expect(cssOf(grid).unscoped).not.toMatch(/minmax\(0, 1fr\)/);
  });
});
