import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { createRef } from "react";
import { AssessmentTimerBar } from "./AssessmentTimerBar";
import { AssessmentNavigation } from "./AssessmentNavigation";
import { QuizQuestionList } from "@/components/quiz/QuizQuestionList";

/**
 * Taking an assessment on a 360px phone.
 *
 * - The header (title, timer, camera preview, calculator/notes, Submit) sat in one row; a long
 *   title wrapped to 3+ lines and pushed the tools and Submit off the right edge.
 * - On a phone the Previous / Next bar becomes a bottom action bar that also carries Submit,
 *   wired to the SAME handler as the header's Submit.
 * - Moving between questions scrolled the whole paper down to the answered-questions list,
 *   because the list kept its current row visible with `scrollIntoView`, which scrolls every
 *   scrollable ancestor. It now scrolls only the list's own box.
 *
 * Everything is CSS under the phone media query: one React tree at every width, so crossing 600px
 * never remounts the timer, the camera <video> or the question list.
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

// A matchMedia whose answer can be flipped, firing the registered listeners (as a browser does
// when a window is resized across 600px).
let phoneMatches = false;
const listeners = new Set<(e: { matches: boolean }) => void>();
function installMatchMedia() {
  window.matchMedia = ((query: string) => {
    const isPhoneQuery = /max-width:\s*599\.95px/.test(query);
    return {
      get matches() {
        return isPhoneQuery ? phoneMatches : false;
      },
      media: query,
      onchange: null,
      addListener: (l: (e: { matches: boolean }) => void) => listeners.add(l),
      removeListener: (l: (e: { matches: boolean }) => void) => listeners.delete(l),
      addEventListener: (_: string, l: (e: { matches: boolean }) => void) => listeners.add(l),
      removeEventListener: (_: string, l: (e: { matches: boolean }) => void) => listeners.delete(l),
      dispatchEvent: () => true,
    };
  }) as unknown as typeof window.matchMedia;
}
function crossTo(phone: boolean) {
  phoneMatches = phone;
  act(() => {
    for (const l of [...listeners]) l({ matches: phone });
  });
}

const sections = [{ title: "Section A", section_type: "quiz", questions: [{ id: 1 }, { id: 2 }, { id: 3 }] }];
const questions = Array.from({ length: 12 }, (_, i) => ({ id: i + 1, question: `Question ${i + 1}`, answered: i < 2 }));

function Paper({ current = 1, onSubmit = vi.fn() }: { current?: number; onSubmit?: () => void }) {
  const videoRef = createRef<HTMLVideoElement>();
  return (
    <>
      <AssessmentTimerBar
        title="Full Stack Web Development Mid-Term Proctored Assessment - Batch 2026 Section B"
        formattedTime="57:49"
        isLastQuestion={false}
        submitting={false}
        onSubmit={onSubmit}
        proctoringVideoRef={videoRef}
        faceCount={1}
        assessmentToolsSlot={<button aria-label="Calculator">c</button>}
      />
      <AssessmentNavigation
        currentSectionIndex={0}
        currentQuestionIndex={0}
        totalQuestions={3}
        sections={sections}
        currentSectionQuestionCount={3}
        isLastQuestion={false}
        onPrevious={vi.fn()}
        onNext={vi.fn()}
        phoneSubmitSlot={<button onClick={onSubmit}>Submit</button>}
      />
      <QuizQuestionList questions={questions} currentQuestionId={current} onQuestionClick={vi.fn()} />
    </>
  );
}

beforeEach(() => {
  phoneMatches = false;
  listeners.clear();
  installMatchMedia();
});
afterEach(() => {
  vi.restoreAllMocks();
});

describe("assessment header on a phone", () => {
  it("clamps the title to two lines and hides the header Submit, only inside the phone block", () => {
    render(<Paper />);
    const title = screen.getByTestId("assessment-title");
    const { phone, unscoped } = cssOf(title);
    expect(phone).toMatch(/-webkit-line-clamp:\s*2/);
    expect(phone).toMatch(/flex:\s*1 1 100%/);
    expect(unscoped).not.toMatch(/line-clamp/);
    // Desktop keeps the original 1.5rem title.
    expect(unscoped).toMatch(/font-size:\s*1\.5rem/);

    const submit = screen.getByTestId("assessment-submit");
    expect(cssOf(submit).phone).toMatch(/display:\s*none/);
    expect(cssOf(submit).unscoped).not.toMatch(/display:\s*none/);
  });

  it("keeps the timer on-screen and the camera preview visible but smaller on a phone", () => {
    render(<Paper />);
    const timer = screen.getByTestId("assessment-timer");
    expect(cssOf(timer).phone).toMatch(/flex-shrink:\s*0/);
    const cam = document.querySelector("video")!.parentElement!;
    const { phone, unscoped } = cssOf(cam);
    expect(phone).toMatch(/width:\s*48px\s*!important/);
    expect(phone).not.toMatch(/display:\s*none/);
    expect(unscoped).not.toMatch(/48px/);
  });

  it("wraps the header onto two rows only on a phone", () => {
    render(<Paper />);
    const header = screen.getByTestId("assessment-title").parentElement!;
    expect(cssOf(header).phone).toMatch(/flex-wrap:\s*wrap/);
    expect(cssOf(header).unscoped).not.toMatch(/flex-wrap:\s*wrap/);
  });
});

describe("phone bottom action bar", () => {
  it("pins Previous / Next / Submit to the bottom, clear of the safe area, on a phone only", () => {
    render(<Paper />);
    const bar = screen.getByTestId("assessment-action-bar");
    const { phone, unscoped } = cssOf(bar);
    expect(phone).toMatch(/bottom:\s*0/);
    expect(phone).toMatch(/top:\s*auto/);
    expect(phone).toMatch(/safe-area-inset-bottom/);
    expect(unscoped).not.toMatch(/safe-area-inset-bottom/);
    expect(unscoped).toMatch(/top:\s*90px/);

    const slot = screen.getByTestId("assessment-phone-submit");
    expect(cssOf(slot).unscoped).toMatch(/display:\s*none/);
    expect(cssOf(slot).phone).toMatch(/display:\s*flex/);
    expect(bar.textContent).toMatch(/Previous|previous/);
  });

  it("the bar's Submit calls the same handler as the header Submit", () => {
    const onSubmit = vi.fn();
    render(<Paper onSubmit={onSubmit} />);
    fireEvent.click(screen.getByTestId("assessment-submit"));
    fireEvent.click(screen.getByTestId("assessment-phone-submit").querySelector("button")!);
    expect(onSubmit).toHaveBeenCalledTimes(2);
  });
});

describe("question change does not jump the page to the answered list", () => {
  it("never calls scrollIntoView; it scrolls only the list's own box", () => {
    const spy = vi.fn();
    Element.prototype.scrollIntoView = spy;
    const { rerender } = render(<Paper current={1} />);
    rerender(<Paper current={9} />);
    rerender(<Paper current={2} />);
    expect(spy).not.toHaveBeenCalled();
  });

  it("scrollRowIntoList moves the list, never its ancestors", async () => {
    const { scrollRowIntoList } = await import("@/components/quiz/QuizQuestionList");
    const outer = document.createElement("div");
    const list = document.createElement("ul");
    const row = document.createElement("li");
    outer.appendChild(list);
    list.appendChild(row);
    outer.scrollTop = 0;
    list.getBoundingClientRect = () => ({ top: 100, bottom: 300 }) as DOMRect;
    row.getBoundingClientRect = () => ({ top: 400, bottom: 450 }) as DOMRect;
    let listTop = 0;
    Object.defineProperty(list, "scrollTop", { get: () => listTop, set: (v: number) => { listTop = v; } });
    scrollRowIntoList(list, row);
    expect(listTop).toBe(162); // 450 - (300 - 12)
    expect(outer.scrollTop).toBe(0);
  });
});

describe("one tree at every width", () => {
  it("crossing 600px does not remount the timer, the camera video or the question list", () => {
    render(<Paper />);
    const video = document.querySelector("video");
    const timer = screen.getByTestId("assessment-timer");
    const list = document.querySelector("nav ul");
    expect(video && list).toBeTruthy();

    crossTo(true);
    expect(document.querySelector("video")).toBe(video);
    expect(screen.getByTestId("assessment-timer")).toBe(timer);
    expect(document.querySelector("nav ul")).toBe(list);
    expect(document.querySelectorAll("video")).toHaveLength(1);

    crossTo(false);
    expect(document.querySelector("video")).toBe(video);
    expect(screen.getByTestId("assessment-timer")).toBe(timer);
    expect(document.querySelector("nav ul")).toBe(list);
  });
});
