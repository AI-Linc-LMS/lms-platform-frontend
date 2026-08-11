import { describe, expect, it, vi, afterEach } from "vitest";
import { render } from "@testing-library/react";
import { useTrail } from "./RoadmapTrail";

/**
 * Regression: the trail hook ran a layout effect on every render and unconditionally set state
 * with a fresh object, so setPaths -> render -> effect -> setPaths never terminated. That
 * shipped and took the whole roadmap page down with React error #185.
 *
 * jsdom reports zero-size rects, so the guard has to be exercised with stubbed geometry --
 * otherwise `measure` returns early on `!W.width` and the test would pass against broken code.
 */
function stubLayout() {
  // Geometry must be STABLE per element. A counter-based stub returns different rects on every
  // call, so the measure can never settle and the test would fail even against correct code --
  // which is exactly what it did on the first attempt.
  const seen = new Map<HTMLElement, number>();
  return vi
    .spyOn(HTMLElement.prototype, "getBoundingClientRect")
    .mockImplementation(function (this: HTMLElement) {
      const host = this.dataset?.trailHost === "1";
      if (!seen.has(this)) seen.set(this, seen.size);
      const top = host ? 0 : (seen.get(this) as number) * 60;
      return {
        left: 0, right: 200, top, bottom: top + 40,
        width: 200, height: host ? 400 : 40, x: 0, y: top,
        toJSON: () => ({}),
      } as DOMRect;
    });
}

afterEach(() => vi.restoreAllMocks());

function Harness() {
  const { wrap, registry, Trail } = useTrail();
  return (
    <div ref={wrap} data-trail-host="1">
      {Trail}
      <div ref={registry.step(0)}>step one</div>
      <div ref={registry.sub(0, 0)}>sub one</div>
      <div ref={registry.step(1)}>step two</div>
    </div>
  );
}

describe("useTrail", () => {
  it("settles instead of looping forever", () => {
    stubLayout();
    // A runaway update loop throws "Maximum update depth exceeded" out of render.
    expect(() => render(<Harness />)).not.toThrow();
  });

  it("renders both path layers", () => {
    stubLayout();
    const { container } = render(<Harness />);
    expect(container.querySelectorAll("path")).toHaveLength(2);
  });

  it("maps the viewBox 1:1 so measured coordinates are not rescaled", () => {
    stubLayout();
    const { container } = render(<Harness />);
    expect(container.querySelector("svg")?.getAttribute("preserveAspectRatio")).toBe("none");
  });
});
