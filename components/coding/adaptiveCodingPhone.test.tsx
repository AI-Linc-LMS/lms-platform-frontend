import { afterEach, describe, expect, it, vi } from "vitest";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { useEffect } from "react";

/**
 * The adaptive coding workspace on a phone.
 *
 * At 390px the desktop two-column workspace collapses to one column, which put the editor under
 * the whole problem statement, the mentor card, the mastery panel and the attempt history: a
 * learner had to scroll a screen and a half to type, and back up to read the statement. On a phone
 * the workspace is three tabs (Problem / Code / Results); from 600px up it is the original grid.
 *
 * It is ONE component tree at every width. A tablet rotating across 600px must not remount the
 * editor (undo history, cursor) or the timer (it re-anchors to a stale server clock and rewinds).
 */

// ---- viewport: a matchMedia whose listeners can be fired, so a rotation can be simulated ------
const realMatchMedia = window.matchMedia;
let width = 390;
const lists = new Set<{ query: string; listeners: Set<(e: { matches: boolean }) => void> }>();
function evaluate(query: string) {
  const max = /max-width:\s*([\d.]+)px/.exec(query);
  const min = /min-width:\s*([\d.]+)px/.exec(query);
  if (max) return width <= parseFloat(max[1]);
  if (min) return width >= parseFloat(min[1]);
  return false;
}
function installViewport(w: number) {
  width = w;
  lists.clear();
  window.matchMedia = ((query: string) => {
    const entry = { query, listeners: new Set<(e: { matches: boolean }) => void>() };
    lists.add(entry);
    return {
      get matches() { return evaluate(query); },
      media: query, onchange: null,
      addListener: (fn: (e: { matches: boolean }) => void) => entry.listeners.add(fn),
      removeListener: (fn: (e: { matches: boolean }) => void) => entry.listeners.delete(fn),
      addEventListener: (_: string, fn: (e: { matches: boolean }) => void) => entry.listeners.add(fn),
      removeEventListener: (_: string, fn: (e: { matches: boolean }) => void) => entry.listeners.delete(fn),
      dispatchEvent: vi.fn(),
    };
  }) as unknown as typeof window.matchMedia;
}
function resize(w: number) {
  act(() => {
    width = w;
    for (const l of lists) for (const fn of l.listeners) fn({ matches: evaluate(l.query) });
  });
}
afterEach(() => {
  window.matchMedia = realMatchMedia;
});

// ---- fixtures -----------------------------------------------------------------------------------
const problem = {
  id: 3874, title: "Calculate Total Price with Tax", difficulty_level: "Easy" as const,
  problem_statement: "<p>Read a price and a tax rate.</p>", input_format: "", output_format: "",
  sample_input: "100\n18", sample_output: "118.0", constraints: "", template_code: { python: "print()" },
  tags: "", target_skills: ["python overview"], topic: "",
};
const results = (passed: number) => ({
  results: [
    { index: 1, passed: true, input: "100\n18", expected: "118.0", actual: "118.0", verdict: "Accepted", stderr: null, compile_output: null },
    { index: 2, passed: passed === 2, input: "59.99\n7.5", expected: "64.49", actual: passed === 2 ? "64.49" : "64.48925", verdict: "", stderr: null, compile_output: null },
  ],
  passed, failed: 2 - passed, total: 2, first_failing_index: passed === 2 ? null : 2, compile_error: null, status: "", all_passed: passed === 2,
});
const session = {
  id: "s1", config: 819, problem, language: "python", status: "active" as const, run_count: 1, submit_count: 0,
  hints_revealed: 0, passed: false, last_source: "print(1)", allow_clipboard: false,
  points: { base: 150, grace: 300, dec: 5, iv: 60, floor: 30 },
  server_now: "2026-09-22T10:05:00Z", started_at: "2026-09-22T10:00:00Z", completed_at: null,
  latest_submission: { test_results: results(1), diagnosis: null },
};

const mounts = vi.hoisted(() => ({ editor: 0, timer: 0, mastery: 0, history: 0 }));
const run = vi.hoisted(() => vi.fn());
vi.mock("@/lib/services/adaptive-coding.service", () => ({
  adaptiveCodingService: {
    getProblem: () => Promise.resolve(problem),
    getActiveSession: () => Promise.resolve(session),
    runWithDiagnosis: run,
  },
}));
function useMountCount(key: keyof typeof mounts) {
  useEffect(() => {
    mounts[key] += 1;
  }, [key]);
}
vi.mock("@/components/editor/MonacoEditor", () => ({
  CodeEditor: ({ height }: { height: string }) => {
    useMountCount("editor");
    return <textarea data-testid="editor" data-height={height} aria-label="editor" />;
  },
}));
vi.mock("@/components/coding/CodingTimerPoints", () => ({
  CodingTimerPoints: () => {
    useMountCount("timer");
    return <div data-testid="timer" />;
  },
}));
vi.mock("@/components/coding/MentorAnalysisCard", () => ({ MentorAnalysisCard: () => <div data-testid="mentor" /> }));
vi.mock("@/components/coding/CodingMasteryPanel", () => ({
  CodingMasteryPanel: () => {
    useMountCount("mastery");
    return <div data-testid="mastery" />;
  },
}));
vi.mock("@/components/coding/AdaptiveCodingSubmissions", () => ({
  AdaptiveCodingSubmissions: () => {
    useMountCount("history");
    return <div data-testid="history" />;
  },
}));
vi.mock("@/components/common/Toast", () => ({ useToast: () => ({ showToast: vi.fn() }) }));
vi.mock("react-i18next", () => ({ useTranslation: () => ({ t: (k: string) => k.split(".").pop() }) }));

import { AdaptiveCodingSolve } from "./AdaptiveCodingSolve";

const tab = (name: RegExp) => screen.getAllByRole("tab").find((t) => name.test(t.textContent ?? "")) as HTMLElement;

describe("adaptive coding workspace", () => {
  it("is Problem / Code / Results tabs on a phone, opening on the problem", async () => {
    installViewport(390);
    render(<AdaptiveCodingSolve configId={819} problemId={3874} />);
    expect(await screen.findByRole("tablist")).toBeInTheDocument();
    const tabs = screen.getAllByRole("tab");
    expect(tabs.map((t) => t.textContent)).toEqual(["problemTab", "codeTab", "resultsTab1/2"]);
    expect(tabs[0]).toHaveAttribute("aria-selected", "true");
    // One tab's pieces at a time; the editor stays mounted (hidden) so switching keeps its state.
    expect(screen.getByTestId("history")).toBeVisible();
    expect(screen.getByTestId("editor")).not.toBeVisible();
    expect(screen.getByTestId("editor")).toHaveAttribute("data-height", "55vh");

    fireEvent.click(tabs[1]);
    expect(screen.getByTestId("editor")).toBeVisible();
    expect(screen.getByTestId("history")).not.toBeVisible();
    expect(screen.getByRole("button", { name: "Run" })).toBeVisible();
    expect(screen.getByRole("button", { name: "Submit" })).toBeVisible();

    fireEvent.click(tabs[2]);
    expect(screen.getByTestId("mentor")).toBeVisible();
    expect(screen.getByText("1 / 2 tests passed")).toBeVisible();
    // The timer and the way back are on every tab.
    expect(screen.getByTestId("timer")).toBeVisible();
  });

  it("stays the two-column grid with no tab bar from 600px up", async () => {
    installViewport(1440);
    render(<AdaptiveCodingSolve configId={819} problemId={3874} />);
    expect(await screen.findByTestId("editor")).toHaveAttribute("data-height", "60vh");
    expect(screen.queryByRole("tablist")).toBeNull();
    expect(screen.getByTestId("coding-workspace")).toHaveAttribute("data-layout", "desktop");
    // Problem, editor and results are all on screen at once, as on main.
    for (const id of ["history", "mentor", "editor", "timer"]) expect(screen.getByTestId(id)).toBeVisible();
    expect(screen.getByText("1 / 2 tests passed")).toBeVisible();
  });

  it("does not remount the editor, the timer or the panels when a tablet rotates across 600px", async () => {
    installViewport(390);
    Object.assign(mounts, { editor: 0, timer: 0, mastery: 0, history: 0 });
    render(<AdaptiveCodingSolve configId={819} problemId={3874} />);
    await screen.findByRole("tablist");
    const editorNode = screen.getByTestId("editor");

    resize(1024);
    expect(screen.queryByRole("tablist")).toBeNull();
    expect(screen.getByTestId("coding-workspace")).toHaveAttribute("data-layout", "desktop");
    resize(390);
    expect(screen.getByRole("tablist")).toBeInTheDocument();

    // Mounted exactly once each: undo history kept, and the clock keeps its original anchor
    // (a remount re-snapshotted the stale server_now and rewound the timer to 0:05).
    expect(mounts).toEqual({ editor: 1, timer: 1, mastery: 1, history: 1 });
    expect(screen.getByTestId("editor")).toBe(editorNode);
  });
});

describe("after a Run on a phone", () => {
  it("opens Results when the learner is not typing", async () => {
    installViewport(390);
    run.mockResolvedValueOnce({ test_results: results(2), diagnosis: null });
    render(<AdaptiveCodingSolve configId={819} problemId={3874} />);
    fireEvent.click((await screen.findAllByRole("tab"))[1]);
    fireEvent.click(screen.getByRole("button", { name: "Run" }));
    await waitFor(() => expect(tab(/^resultsTab/)).toHaveAttribute("aria-selected", "true"));
    expect(screen.getByText("All 2 tests passed")).toBeVisible();
  });

  it("does not pull a learner out of the editor mid-typing: a 'results ready' dot instead", async () => {
    installViewport(390);
    run.mockResolvedValueOnce({ test_results: results(2), diagnosis: null });
    render(<AdaptiveCodingSolve configId={819} problemId={3874} />);
    fireEvent.click((await screen.findAllByRole("tab"))[1]);
    const editor = screen.getByTestId("editor");
    editor.focus();
    fireEvent.click(screen.getByRole("button", { name: "Run" }));
    await waitFor(() => expect(screen.getByTestId("results-ready")).toBeInTheDocument());
    expect(tab(/^codeTab/)).toHaveAttribute("aria-selected", "true");
    expect(document.activeElement).toBe(editor);

    fireEvent.click(tab(/^resultsTab/));
    expect(screen.queryByTestId("results-ready")).toBeNull();
    expect(screen.getByText("All 2 tests passed")).toBeVisible();
  });

  it("does not jump to the previous run's results when the request fails", async () => {
    installViewport(390);
    run.mockRejectedValueOnce(new Error("Judge unavailable"));
    render(<AdaptiveCodingSolve configId={819} problemId={3874} />);
    fireEvent.click((await screen.findAllByRole("tab"))[1]);
    fireEvent.click(screen.getByRole("button", { name: "Run" }));
    await waitFor(() => expect(run).toHaveBeenCalled());
    await waitFor(() => expect(screen.getByRole("button", { name: "Run" })).not.toBeDisabled());
    // Let the post-request effects flush before asserting that nothing moved.
    await act(async () => {
      await new Promise((r) => setTimeout(r, 50));
    });
    expect(tab(/^codeTab/)).toHaveAttribute("aria-selected", "true");
    expect(screen.queryByTestId("results-ready")).toBeNull();
  });
});
