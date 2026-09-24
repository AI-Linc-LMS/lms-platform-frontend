// @vitest-environment jsdom
/**
 * "The read aloud feature is not synchronised with the scrolling. We need to scroll it
 * manually."
 *
 * Two things have to be true for that report to be fixed, and the second matters as much
 * as the first: the page has to follow the voice, AND it has to stop the instant the
 * learner scrolls. A page that drags a reader back to the narrator is worse than one that
 * never moved.
 *
 * Every assertion here runs against the REAL article body, which renders by assigning
 * innerHTML - so this also pins down that the blocks are tagged on the elements that end
 * up on the page, not on a parsed copy of the html string.
 */

import { act, render } from "@testing-library/react";
import { useRef, useState } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { AdaptiveArticleBody } from "@/components/adaptive-quiz/article/AdaptiveArticleBody";
import { useNarrationFollow } from "./useNarrationFollow";
import { NARRATE_ATTR, type NarrationSegment } from "@/lib/utils/article-speech";

// Monaco and Prism are irrelevant here and cost seconds to transform.
vi.mock("@/components/adaptive-quiz/article/CodeBlock", () => ({
  CodeBlock: ({ code }: { code: string }) => <pre data-stub-code>{code}</pre>,
}));
vi.mock("@/components/adaptive-quiz/article/RunnableCodeBlock", () => ({
  RunnableCodeBlock: ({ initialCode }: { initialCode: string }) => <pre data-stub-code>{initialCode}</pre>,
}));

const HTML = `
  <div>
    <h2>Chapter one</h2>
    <p>${"The first paragraph runs on for a while so that it is its own chunk. ".repeat(5)}</p>
    <p>${"The second paragraph is also long enough to stand alone in the narration. ".repeat(5)}</p>
    <p>${"And a third, which is where the learner will be when they scroll away. ".repeat(5)}</p>
  </div>
`;

const scrolled: Array<{ id: string | null; behavior?: string; block?: string }> = [];

/** Stable identity on purpose. AdaptiveArticleBody re-renders its body from scratch when
 *  `explainTerms` changes identity, so a fresh `[]` per render would rebuild the DOM under
 *  the test and throw away the rectangles it had just placed. */
const NO_TERMS: string[] = [];

/** Places a block at a chosen viewport offset so "is it comfortably in view?" is a
 *  decision this test controls rather than jsdom's all-zero rectangles. */
function placeBlocks(root: HTMLElement, topFor: (index: number) => number) {
  root.querySelectorAll<HTMLElement>(`[${NARRATE_ATTR}]`).forEach((el, i) => {
    const top = topFor(i);
    el.getBoundingClientRect = () =>
      ({ top, bottom: top + 120, height: 120, left: 0, right: 600, width: 600, x: 0, y: top, toJSON: () => ({}) }) as DOMRect;
  });
}

const noop = () => {};

function Harness({ onSegments }: { onSegments?: (s: NarrationSegment[]) => void }) {
  const bodyRef = useRef<HTMLDivElement | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [active, setActive] = useState(false);
  const follow = useNarrationFollow({ activeId, containerRef: bodyRef, active });
  return (
    <div>
      <button data-testid="play" onClick={() => setActive(true)} />
      <button data-testid="stop" onClick={() => setActive(false)} />
      <button data-testid="resume" onClick={follow.resume} />
      <span data-testid="following">{String(follow.following)}</span>
      <span data-testid="speak" onClick={(e) => setActiveId((e.target as HTMLElement).title || null)} />
      <div ref={bodyRef}>
        <AdaptiveArticleBody html={HTML} explainTerms={NO_TERMS} onExplain={noop} onSegments={onSegments} />
      </div>
    </div>
  );
}

beforeEach(() => {
  scrolled.length = 0;
  Element.prototype.scrollIntoView = function (arg?: boolean | ScrollIntoViewOptions) {
    const opts = typeof arg === "object" ? arg : undefined;
    scrolled.push({
      id: (this as HTMLElement).getAttribute(NARRATE_ATTR),
      behavior: opts?.behavior,
      block: opts?.block,
    });
  };
  window.matchMedia = ((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })) as unknown as typeof window.matchMedia;
});

describe("the page follows the voice", () => {
  it("reports the rendered body's blocks so narration has somewhere to point", () => {
    // FAILS BEFORE THE FIX: the body had no onSegments at all, and nothing anywhere
    // related a moment of narration to an element.
    let reported: NarrationSegment[] = [];
    render(<Harness onSegments={(s) => { reported = s; }} />);
    expect(reported.length).toBeGreaterThanOrEqual(4);
    expect(reported[0].text).toBe("Chapter one");
  });

  it("scrolls the block being spoken into view", () => {
    let reported: NarrationSegment[] = [];
    const { getByTestId, container } = render(<Harness onSegments={(s) => { reported = s; }} />);
    act(() => { getByTestId("play").click(); });
    // Everything is far below the fold, so every block needs a scroll to be read.
    placeBlocks(container as HTMLElement, () => 4000);
    const third = reported[3].id;
    act(() => { getByTestId("speak").setAttribute("title", third); getByTestId("speak").click(); });

    expect(scrolled.map((s) => s.id)).toContain(third);
    expect(container.querySelector(`[${NARRATE_ATTR}="${third}"]`)?.getAttribute("data-narrating")).toBe("true");
  });

  it("leaves the page alone when the block is already comfortably in view", () => {
    // Otherwise the article twitches on every paragraph even when the learner can
    // already see it.
    let reported: NarrationSegment[] = [];
    const { getByTestId, container } = render(<Harness onSegments={(s) => { reported = s; }} />);
    act(() => { getByTestId("play").click(); });
    placeBlocks(container as HTMLElement, () => 300); // inside the band, 88..720
    act(() => {
      getByTestId("speak").setAttribute("title", reported[2].id);
      getByTestId("speak").click();
    });
    expect(scrolled).toHaveLength(0);
    expect(container.querySelector(`[${NARRATE_ATTR}="${reported[2].id}"]`)?.getAttribute("data-narrating")).toBe("true");
  });

  it("jumps instead of gliding when the reader asked for less motion", () => {
    window.matchMedia = ((query: string) => ({
      matches: query.includes("prefers-reduced-motion"),
      media: query, onchange: null,
      addListener: vi.fn(), removeListener: vi.fn(),
      addEventListener: vi.fn(), removeEventListener: vi.fn(), dispatchEvent: vi.fn(),
    })) as unknown as typeof window.matchMedia;

    let reported: NarrationSegment[] = [];
    const { getByTestId, container } = render(<Harness onSegments={(s) => { reported = s; }} />);
    act(() => { getByTestId("play").click(); });
    placeBlocks(container as HTMLElement, () => 4000);
    act(() => { getByTestId("speak").setAttribute("title", reported[1].id); getByTestId("speak").click(); });
    expect(scrolled[0].behavior).toBe("auto");
  });
});

describe("and stops fighting the learner the moment they scroll", () => {
  it("suspends auto-follow on a wheel gesture and does not scroll again", () => {
    let reported: NarrationSegment[] = [];
    const { getByTestId, container } = render(<Harness onSegments={(s) => { reported = s; }} />);
    act(() => { getByTestId("play").click(); });
    placeBlocks(container as HTMLElement, () => 4000);

    act(() => { getByTestId("speak").setAttribute("title", reported[1].id); getByTestId("speak").click(); });
    expect(scrolled).toHaveLength(1);
    expect(getByTestId("following").textContent).toBe("true");

    // The learner scrolls away by hand.
    act(() => { window.dispatchEvent(new Event("wheel")); });
    expect(getByTestId("following").textContent).toBe("false");

    // The voice moves on. The page must NOT move with it.
    act(() => { getByTestId("speak").setAttribute("title", reported[2].id); getByTestId("speak").click(); });
    act(() => { getByTestId("speak").setAttribute("title", reported[3].id); getByTestId("speak").click(); });
    expect(scrolled).toHaveLength(1);
    // The highlight still tracks the voice: that is how the learner finds their way back.
    expect(container.querySelector(`[${NARRATE_ATTR}="${reported[3].id}"]`)?.getAttribute("data-narrating")).toBe("true");
  });

  it("suspends on a touch drag and on a scrolling key, but not on a plain keystroke", () => {
    const { getByTestId } = render(<Harness />);
    act(() => { getByTestId("play").click(); });

    act(() => { window.dispatchEvent(new KeyboardEvent("keydown", { key: "a" })); });
    expect(getByTestId("following").textContent).toBe("true");

    act(() => { window.dispatchEvent(new KeyboardEvent("keydown", { key: "PageDown" })); });
    expect(getByTestId("following").textContent).toBe("false");

    // Two acts: React batches a stop and a start in one tick into no change at all.
    act(() => { getByTestId("stop").click(); });
    act(() => { getByTestId("play").click(); });
    expect(getByTestId("following").textContent).toBe("true");
    act(() => { window.dispatchEvent(new Event("touchmove")); });
    expect(getByTestId("following").textContent).toBe("false");
  });

  it("gives following back only when asked, and catches up when it does", () => {
    let reported: NarrationSegment[] = [];
    const { getByTestId, container } = render(<Harness onSegments={(s) => { reported = s; }} />);
    act(() => { getByTestId("play").click(); });
    placeBlocks(container as HTMLElement, () => 4000);
    act(() => { getByTestId("speak").setAttribute("title", reported[1].id); getByTestId("speak").click(); });
    act(() => { window.dispatchEvent(new Event("wheel")); });
    act(() => { getByTestId("speak").setAttribute("title", reported[3].id); getByTestId("speak").click(); });
    expect(scrolled).toHaveLength(1);

    act(() => { getByTestId("resume").click(); });
    expect(getByTestId("following").textContent).toBe("true");
    expect(scrolled.at(-1)!.id).toBe(reported[3].id);
  });

  it("re-arms following for the next run and clears the highlight when narration stops", () => {
    let reported: NarrationSegment[] = [];
    const { getByTestId, container } = render(<Harness onSegments={(s) => { reported = s; }} />);
    act(() => { getByTestId("play").click(); });
    act(() => { getByTestId("speak").setAttribute("title", reported[1].id); getByTestId("speak").click(); });
    act(() => { window.dispatchEvent(new Event("wheel")); });
    expect(getByTestId("following").textContent).toBe("false");

    act(() => { getByTestId("stop").click(); });
    expect(container.querySelector("[data-narrating]")).toBeNull();

    act(() => { getByTestId("play").click(); });
    expect(getByTestId("following").textContent).toBe("true");
  });

  it("leaves nothing listening after the learner navigates away mid-playback", () => {
    const add = vi.spyOn(window, "addEventListener");
    const remove = vi.spyOn(window, "removeEventListener");
    const { getByTestId, unmount } = render(<Harness />);
    act(() => { getByTestId("play").click(); });

    const added = add.mock.calls.filter(([e]) => ["wheel", "touchmove", "keydown"].includes(e as string)).length;
    expect(added).toBe(3);
    unmount();
    const removed = remove.mock.calls.filter(([e]) => ["wheel", "touchmove", "keydown"].includes(e as string)).length;
    expect(removed).toBe(3);
    add.mockRestore();
    remove.mockRestore();
  });
});
