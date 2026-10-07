// @vitest-environment jsdom
/**
 * The editor has to draw itself when it is finally shown.
 *
 * Reported on mobile: "The coding ide for coding questions is not visible restraining the user
 * to attempt the question" - the Code tab showed the language picker, Run and Submit, and then
 * a blank area.
 *
 * The cause is not the coding screen. Monaco measures its container once, when it initialises,
 * and caches that. The phone layout keeps one tree at every width and hides inactive panes with
 * `display: none` rather than unmounting them, so the editor initialises inside a zero-sized box
 * while the Problem tab is on top, and renders nothing when the learner switches to Code.
 */

import { render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const layout = vi.fn();
let capturedOnMount: ((ed: unknown, mon: unknown) => void) | null = null;

vi.mock("next/dynamic", () => ({
  default: (_loader: unknown, _opts: unknown) =>
    function FakeMonaco(props: { onMount?: (ed: unknown, mon: unknown) => void }) {
      capturedOnMount = props.onMount ?? null;
      return <div data-testid="fake-monaco" />;
    },
}));

/** jsdom gives everything zero size and has no ResizeObserver, so both are supplied here. */
let observed: Element | null = null;
let fire: (() => void) | null = null;
class FakeResizeObserver {
  constructor(private cb: () => void) {}
  observe(el: Element) {
    observed = el;
    fire = this.cb;
  }
  disconnect() {
    fire = null;
  }
}

function sizeOf(el: HTMLElement, w: number, h: number) {
  Object.defineProperty(el, "offsetWidth", { value: w, configurable: true });
  Object.defineProperty(el, "offsetHeight", { value: h, configurable: true });
}

import { CodeEditor } from "./MonacoEditor";

/** Enough of the real objects for handleEditorMount to run to the end. */
const fakeEditor = () => ({
  layout,
  addCommand: () => undefined,
  onDidChangeModelContent: () => ({ dispose() {} }),
  createDecorationsCollection: () => ({ clear() {}, set() {} }),
  getValue: () => "",
  getPosition: () => null,
  setValue: () => undefined,
  setPosition: () => undefined,
  updateOptions: () => undefined,
});
const fakeMonaco = () => ({
  KeyMod: { CtrlCmd: 1, Shift: 2, Alt: 4 },
  KeyCode: { KeyX: 10, KeyC: 11, KeyV: 12, KeyA: 13, Insert: 14 },
  Range: class {},
  editor: { setTheme: () => undefined },
});

describe("an editor that mounts inside a hidden tab", () => {
  beforeEach(() => {
    layout.mockClear();
    observed = null;
    fire = null;
    capturedOnMount = null;
    vi.stubGlobal("ResizeObserver", FakeResizeObserver);
    vi.stubGlobal("requestAnimationFrame", (cb: FrameRequestCallback) => {
      cb(0);
      return 0;
    });
  });
  afterEach(() => vi.unstubAllGlobals());

  it("lays out again when the pane it lives in is finally shown", () => {
    const { getByTestId } = render(<CodeEditor value="print('hi')" height="55vh" />);
    const shell = getByTestId("code-editor-shell") as HTMLElement;
    // Mounted hidden: Monaco measured nothing.
    sizeOf(shell, 0, 0);
    capturedOnMount?.(fakeEditor(), fakeMonaco());
    expect(layout).not.toHaveBeenCalled();

    // The learner taps "Code" and the pane becomes display:block.
    sizeOf(shell, 360, 420);
    fire?.();
    expect(layout).toHaveBeenCalledTimes(1);
  });

  it("does not keep re-laying out on ordinary resizes", () => {
    // automaticLayout already handles those; fighting it would be churn on every keystroke
    // that changes the wrap width.
    const { getByTestId } = render(<CodeEditor value="x" height="55vh" />);
    const shell = getByTestId("code-editor-shell") as HTMLElement;
    sizeOf(shell, 0, 0);
    capturedOnMount?.(fakeEditor(), fakeMonaco());

    sizeOf(shell, 360, 420);
    fire?.();
    sizeOf(shell, 400, 420);
    fire?.();
    sizeOf(shell, 420, 500);
    fire?.();
    expect(layout).toHaveBeenCalledTimes(1);
  });

  it("lays out again if the pane is hidden and shown a second time", () => {
    // Problem -> Code -> Problem -> Code. The second return must not be blank either.
    const { getByTestId } = render(<CodeEditor value="x" height="55vh" />);
    const shell = getByTestId("code-editor-shell") as HTMLElement;
    sizeOf(shell, 0, 0);
    capturedOnMount?.(fakeEditor(), fakeMonaco());

    sizeOf(shell, 360, 420);
    fire?.();
    sizeOf(shell, 0, 0);
    fire?.();
    sizeOf(shell, 360, 420);
    fire?.();
    expect(layout).toHaveBeenCalledTimes(2);
  });

  it("watches the shell element itself", () => {
    const { getByTestId } = render(<CodeEditor value="x" height="55vh" />);
    expect(observed).toBe(getByTestId("code-editor-shell"));
  });
});

describe("an editor told directly that it has been revealed", () => {
  /**
   * The observer above was the first fix, and the blank editor was reported AGAIN afterwards.
   *
   * It depends on a geometry transition being observed, and on `hadSize` having been false
   * when the effect first ran. Neither is guaranteed: a `display: none` ancestor, a remount,
   * or an effect that happens to run while the pane is already on top all defeat it - silently
   * and permanently, because once Monaco holds a zero it has no reason to measure again.
   *
   * `revealKey` takes the guessing out. The tabbed surface already knows which pane is on top,
   * so it says so, and a change is a direct instruction rather than a hope.
   */
  beforeEach(() => {
    layout.mockClear();
    observed = null;
    fire = null;
    capturedOnMount = null;
    vi.stubGlobal("ResizeObserver", FakeResizeObserver);
    vi.stubGlobal("requestAnimationFrame", (cb: FrameRequestCallback) => {
      cb(0);
      return 0;
    });
  });
  afterEach(() => vi.unstubAllGlobals());

  it("lays out when the key changes, with NO resize observed at all", () => {
    const { getByTestId, rerender } = render(
      <CodeEditor value="x" height="55vh" revealKey="problem" />,
    );
    const shell = getByTestId("code-editor-shell") as HTMLElement;
    sizeOf(shell, 0, 0);
    capturedOnMount?.(fakeEditor(), fakeMonaco());
    layout.mockClear();

    // The learner taps Code. The pane now has a box, but nothing fires the observer.
    sizeOf(shell, 360, 420);
    rerender(<CodeEditor value="x" height="55vh" revealKey="code" />);
    expect(layout).toHaveBeenCalled();
  });

  it("does not lay out into a box that is still zero", () => {
    // A key change while the pane is STILL hidden would cache another zero.
    const { getByTestId, rerender } = render(
      <CodeEditor value="x" height="55vh" revealKey="problem" />,
    );
    const shell = getByTestId("code-editor-shell") as HTMLElement;
    sizeOf(shell, 0, 0);
    capturedOnMount?.(fakeEditor(), fakeMonaco());
    layout.mockClear();

    rerender(<CodeEditor value="x" height="55vh" revealKey="results" />);
    expect(layout).not.toHaveBeenCalled();
  });

  it("retries, because the webfont can resolve after the tab switch", () => {
    // Monaco lays out against the box AND the font. One attempt against a fallback metric
    // leaves the text misplaced, which reads as broken even though the editor is there.
    vi.useFakeTimers();
    const { getByTestId, rerender } = render(
      <CodeEditor value="x" height="55vh" revealKey="problem" />,
    );
    const shell = getByTestId("code-editor-shell") as HTMLElement;
    sizeOf(shell, 0, 0);
    capturedOnMount?.(fakeEditor(), fakeMonaco());
    layout.mockClear();

    sizeOf(shell, 360, 420);
    rerender(<CodeEditor value="x" height="55vh" revealKey="code" />);
    const immediate = layout.mock.calls.length;
    vi.advanceTimersByTime(500);
    expect(layout.mock.calls.length).toBeGreaterThan(immediate);
    vi.useRealTimers();
  });

  it("is inert on a surface that never hides the editor", () => {
    // Desktop passes nothing, and must not pay for any of this.
    const { getByTestId, rerender } = render(<CodeEditor value="x" height="60vh" />);
    const shell = getByTestId("code-editor-shell") as HTMLElement;
    sizeOf(shell, 800, 600);
    capturedOnMount?.(fakeEditor(), fakeMonaco());
    layout.mockClear();
    rerender(<CodeEditor value="y" height="60vh" />);
    expect(layout).not.toHaveBeenCalled();
  });
});
