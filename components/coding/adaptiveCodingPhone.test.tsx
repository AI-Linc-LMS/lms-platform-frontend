import { afterEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";

/**
 * The adaptive coding workspace on a phone.
 *
 * At 390px the desktop two-column workspace collapses to one column, which put the editor under
 * the whole problem statement, the mentor card, the mastery panel and the attempt history: a
 * learner had to scroll a screen and a half to type, and back up to read the statement. On a phone
 * the workspace is three tabs (Problem / Code / Results); from 600px up it is the original grid.
 *
 * The desktop branch is asserted too: a screen of 600px or more must never see the tab bar.
 */

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

const problem = {
  id: 3874, title: "Calculate Total Price with Tax", difficulty_level: "Easy" as const,
  problem_statement: "<p>Read a price and a tax rate.</p>", input_format: "", output_format: "",
  sample_input: "100\n18", sample_output: "118.0", constraints: "", template_code: { python: "print()" },
  tags: "", target_skills: ["python overview"], topic: "",
};
const session = {
  id: "s1", config: 819, problem, language: "python", status: "active" as const, run_count: 1, submit_count: 0,
  hints_revealed: 0, passed: false, last_source: "print(1)", allow_clipboard: false, points: null,
  server_now: "2026-09-22T10:05:00Z", started_at: "2026-09-22T10:00:00Z", completed_at: null,
  latest_submission: {
    test_results: {
      results: [
        { index: 1, passed: true, input: "100\n18", expected: "118.0", actual: "118.0", verdict: "Accepted", stderr: null, compile_output: null },
        { index: 2, passed: false, input: "59.99\n7.5", expected: "64.49", actual: "64.48925", verdict: "Wrong Answer", stderr: null, compile_output: null },
      ],
      passed: 1, failed: 1, total: 2, first_failing_index: 2, compile_error: null, status: "wrong_answer", all_passed: false,
    },
    diagnosis: null,
  },
};

vi.mock("@/lib/services/adaptive-coding.service", () => ({
  adaptiveCodingService: {
    getProblem: () => Promise.resolve(problem),
    getActiveSession: () => Promise.resolve(session),
  },
}));
vi.mock("@/components/editor/MonacoEditor", () => ({
  CodeEditor: ({ height }: { height: string }) => <div data-testid="editor" data-height={height} />,
}));
vi.mock("@/components/coding/MentorAnalysisCard", () => ({ MentorAnalysisCard: () => <div data-testid="mentor" /> }));
vi.mock("@/components/coding/CodingMasteryPanel", () => ({ CodingMasteryPanel: () => <div data-testid="mastery" /> }));
vi.mock("@/components/coding/AdaptiveCodingSubmissions", () => ({ AdaptiveCodingSubmissions: () => <div data-testid="history" /> }));
vi.mock("@/components/common/Toast", () => ({ useToast: () => ({ showToast: vi.fn() }) }));
vi.mock("react-i18next", () => ({ useTranslation: () => ({ t: (k: string) => k.split(".").pop() }) }));

import { AdaptiveCodingSolve } from "./AdaptiveCodingSolve";

const pane = (testId: string) => screen.getByTestId(testId).closest("[role=tabpanel]") as HTMLElement;

describe("adaptive coding workspace", () => {
  it("is Problem / Code / Results tabs on a phone, opening on the problem", async () => {
    viewport(390);
    render(<AdaptiveCodingSolve configId={819} problemId={3874} />);
    expect(await screen.findByRole("tablist")).toBeInTheDocument();
    const tabs = screen.getAllByRole("tab");
    expect(tabs.map((t) => t.textContent)).toEqual(["problemTab", "codeTab", "resultsTab1/2"]);
    expect(tabs[0]).toHaveAttribute("aria-selected", "true");
    // One pane at a time; the editor stays mounted (hidden) so switching tabs keeps its state.
    expect(pane("history")).toBeVisible();
    expect(pane("editor")).not.toBeVisible();
    expect(screen.getByTestId("editor")).toHaveAttribute("data-height", "55vh");

    fireEvent.click(tabs[1]);
    expect(pane("editor")).toBeVisible();
    expect(pane("history")).not.toBeVisible();

    fireEvent.click(tabs[2]);
    expect(pane("mentor")).toBeVisible();
    expect(screen.getByText("1 / 2 tests passed")).toBeVisible();
  });

  it("keeps every action reachable on a phone: Run and Submit sit in the Code tab", async () => {
    viewport(390);
    render(<AdaptiveCodingSolve configId={819} problemId={3874} />);
    fireEvent.click((await screen.findAllByRole("tab"))[1]);
    expect(screen.getByRole("button", { name: "Run" })).toBeVisible();
    expect(screen.getByRole("button", { name: "Submit" })).toBeVisible();
    expect(screen.getByRole("button", { name: /Custom input/ })).toBeVisible();
  });

  it("stays the two-column grid with no tab bar from 600px up", async () => {
    viewport(1440);
    render(<AdaptiveCodingSolve configId={819} problemId={3874} />);
    expect(await screen.findByTestId("editor")).toHaveAttribute("data-height", "60vh");
    expect(screen.queryByRole("tablist")).toBeNull();
    expect(screen.queryByTestId("coding-phone")).toBeNull();
    // Problem, editor and results are all on screen at once, as on main.
    expect(screen.getByTestId("history")).toBeVisible();
    expect(screen.getByTestId("mentor")).toBeVisible();
    expect(screen.getByText("1 / 2 tests passed")).toBeVisible();
  });
});
