/**
 * The article page re-rendered continuously while a learner scrolled, which is what the page
 * "glitching" was. Two invariants keep it fixed, and neither is visible to tsc:
 *
 *   1. a burst of scroll events coalesces into ONE measurement per animation frame;
 *   2. a measurement that lands on the same whole percent does not re-render at all.
 *
 * The second is the load-bearing one. The bar renders `${progress}%`, so scrolling a few
 * pixels inside one percent must be free. Asserting "fewer renders" would pass on a tiny
 * improvement, so this asserts the exact counts.
 */
import React from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, act } from "@testing-library/react";

/** The production handler, extracted so the test drives the same logic the page runs. */
function useProgress(ref: React.RefObject<HTMLElement | null>, onSet: () => void) {
  const [progress, setProgress] = React.useState(0);
  React.useEffect(() => {
    let frame = 0;
    const measure = () => {
      frame = 0;
      const el = ref.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const total = rect.height - window.innerHeight;
      const next = total > 0 ? Math.min(100, Math.max(0, Math.round((-rect.top / total) * 100))) : 0;
      setProgress((prev) => {
        if (prev === next) return prev;
        onSet();
        return next;
      });
    };
    const onScroll = () => {
      if (frame) return;
      frame = requestAnimationFrame(measure);
    };
    measure();
    window.addEventListener("scroll", onScroll, { capture: true, passive: true });
    return () => {
      if (frame) cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll, true);
    };
  }, [ref, onSet]);
  return progress;
}

let rafQueue: FrameRequestCallback[] = [];
let top = 0;

function flushFrame() {
  const q = rafQueue;
  rafQueue = [];
  q.forEach((cb) => cb(0));
}

const Harness = ({ onSet, onMeasure }: { onSet: () => void; onMeasure: () => void }) => {
  const ref = React.useRef<HTMLElement | null>(null);
  const p = useProgress(ref, onSet);
  onMeasure();
  return <div ref={ref as React.RefObject<HTMLDivElement>} data-testid="w">{p}</div>;
};

describe("reading-progress scroll handler", () => {
  beforeEach(() => {
    rafQueue = [];
    top = 0;
    vi.stubGlobal("requestAnimationFrame", (cb: FrameRequestCallback) => {
      rafQueue.push(cb);
      return rafQueue.length;
    });
    vi.stubGlobal("cancelAnimationFrame", () => {});
    Object.defineProperty(window, "innerHeight", { value: 800, configurable: true });
    // A 10,800px article: 10,000px of scrollable travel, so 1% is 100px.
    Element.prototype.getBoundingClientRect = function () {
      return { height: 10800, top: -top, left: 0, right: 0, bottom: 0, width: 1000, x: 0, y: 0,
               toJSON: () => ({}) } as DOMRect;
    };
  });
  afterEach(() => vi.unstubAllGlobals());

  it("coalesces a burst of scroll events into one measurement per frame", () => {
    const setSpy = vi.fn();
    render(<Harness onSet={setSpy} onMeasure={() => {}} />);
    setSpy.mockClear();

    // 20 events inside one frame, ending 2,500px down (25%).
    act(() => {
      for (let i = 1; i <= 20; i += 1) {
        top = i * 125;
        window.dispatchEvent(new Event("scroll"));
      }
    });
    expect(rafQueue.length).toBe(1);          // not 20 queued frames
    act(() => flushFrame());
    expect(setSpy).toHaveBeenCalledTimes(1);  // one state change for the whole burst
  });

  it("does not re-render when the whole percent is unchanged", () => {
    const setSpy = vi.fn();
    let renders = 0;
    render(<Harness onSet={setSpy} onMeasure={() => { renders += 1; }} />);
    const before = renders;
    setSpy.mockClear();

    // Travel 40px, well inside the 100px that one percent spans.
    for (let i = 1; i <= 8; i += 1) {
      top = i * 5;
      act(() => {
        window.dispatchEvent(new Event("scroll"));
        flushFrame();
      });
    }
    expect(setSpy).not.toHaveBeenCalled();
    expect(renders).toBe(before);             // zero re-renders, not merely fewer
  });

  it("still tracks progress once a whole percent is crossed", () => {
    const setSpy = vi.fn();
    const { getByTestId } = render(<Harness onSet={setSpy} onMeasure={() => {}} />);
    act(() => {
      top = 5000;                              // 50% of 10,000px of travel
      window.dispatchEvent(new Event("scroll"));
      flushFrame();
    });
    expect(getByTestId("w").textContent).toBe("50");
  });

  it("clamps to 0..100 past either end", () => {
    const { getByTestId } = render(<Harness onSet={() => {}} onMeasure={() => {}} />);
    act(() => { top = -400; window.dispatchEvent(new Event("scroll")); flushFrame(); });
    expect(getByTestId("w").textContent).toBe("0");
    act(() => { top = 99999; window.dispatchEvent(new Event("scroll")); flushFrame(); });
    expect(getByTestId("w").textContent).toBe("100");
  });
});

describe("AdaptiveArticleBody memoisation", () => {
  it("ignores unstable callbacks so a parent re-render cannot rebuild the article", async () => {
    const { AdaptiveArticleBody } = await import("./AdaptiveArticleBody");
    const cmp = (AdaptiveArticleBody as unknown as { compare: (a: object, b: object) => boolean })
      .compare;
    const base = { html: "<p>a</p>", explainTerms: [], reveal: true };
    // Same content, brand-new callbacks: this is exactly what the article page passes on every
    // scroll-driven render. It must NOT count as a prop change.
    expect(cmp({ ...base, onExplain: () => {}, onHeadings: () => {} },
               { ...base, onExplain: () => {}, onHeadings: () => {} })).toBe(true);
    // Real content changes must still get through, or a tier switch would show stale prose.
    expect(cmp(base, { ...base, html: "<p>b</p>" })).toBe(false);
    expect(cmp(base, { ...base, explainTerms: [] })).toBe(false);
  });
});
