import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, renderHook, screen, within } from "@testing-library/react";

/**
 * Profile + scorecard on a phone. jsdom has no layout, so what is pinned here is structure: the
 * activity heatmap ships a month-at-a-time phone form next to the untouched desktop year wall,
 * sub-12px type is raised on `xs` only, and chart ticks follow the same floor.
 */

import fs from "node:fs";
import path from "node:path";

import { ActivityHeatmap } from "./ActivityHeatmap";
import { phoneText, PHONE_MIN_REM } from "@/components/common/mobile/phoneText";
import { useChartTick } from "@/components/scorecard/shared/useChartTick";

const day = (n: number) => ({
  Quiz: n,
  Article: 0,
  Assignment: 0,
  CodingProblem: 0,
  DevCodingProblem: 0,
  VideoTutorial: 0,
  total: n,
});

describe("ActivityHeatmap on a phone", () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date(2026, 2, 15, 12));
  });
  afterEach(() => vi.useRealTimers());

  it("keeps the desktop year wall and adds a separate month view beside it", () => {
    render(<ActivityHeatmap heatmapData={{}} />);
    expect(screen.getByTestId("heatmap-year-view")).toBeInTheDocument();
    expect(screen.getByTestId("heatmap-month-view")).toBeInTheDocument();
  });

  it("puts the twelve month pickers in a ScrollRow instead of a row that runs off the screen", () => {
    render(<ActivityHeatmap heatmapData={{}} />);
    const row = screen.getByRole("group", { name: "Month" });
    const months = within(row).getAllByRole("button");
    expect(months).toHaveLength(12);
    // Opens on the current month.
    expect(within(row).getByRole("button", { name: "Mar" })).toHaveAttribute("aria-pressed", "true");
  });

  it("lays out one month as tappable days and shows a tapped day's detail inline", () => {
    render(<ActivityHeatmap heatmapData={{ "2026-03-10": day(3) }} />);
    const view = screen.getByTestId("heatmap-month-view");
    const days = within(view).getAllByRole("button", { name: /^2026-03-\d\d, / });
    expect(days).toHaveLength(31);

    const detail = screen.getByTestId("heatmap-day-detail");
    expect(detail).toHaveTextContent("Tap a day");

    fireEvent.click(within(view).getByRole("button", { name: "2026-03-10, 3 activities" }));
    expect(detail).toHaveTextContent("2026-03-10");
    expect(detail).toHaveTextContent("Quizzes: 3");
  });

  it("switches month when a month chip is tapped, and totals only that month", () => {
    render(<ActivityHeatmap heatmapData={{ "2026-03-10": day(3), "2026-02-02": day(1) }} />);
    const view = screen.getByTestId("heatmap-month-view");
    expect(view).toHaveTextContent("3 activities");
    fireEvent.click(within(screen.getByRole("group", { name: "Month" })).getByRole("button", { name: "Feb" }));
    expect(view).toHaveTextContent("February 2026");
    expect(view).toHaveTextContent("1 activity");
    expect(within(view).getAllByRole("button", { name: /^2026-02-\d\d, / })).toHaveLength(28);
  });
});

describe("phoneText", () => {
  it("raises sub-12px type on xs and leaves the authored size on sm and up", () => {
    expect(phoneText(0.62)).toEqual({ xs: `${PHONE_MIN_REM}rem`, sm: "0.62rem" });
  });

  it("never shrinks type that was already large enough", () => {
    expect(phoneText(0.9)).toEqual({ xs: "0.9rem", sm: "0.9rem" });
  });
});

describe("useChartTick", () => {
  const mockMatch = (matches: boolean) =>
    vi.spyOn(window, "matchMedia").mockImplementation(
      (query: string) =>
        ({
          matches,
          media: query,
          onchange: null,
          addListener: vi.fn(),
          removeListener: vi.fn(),
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
          dispatchEvent: vi.fn(),
        }) as unknown as MediaQueryList,
    );

  afterEach(() => vi.restoreAllMocks());

  it("lifts a 10px axis tick to 12px on a phone", () => {
    mockMatch(true);
    const { result } = renderHook(() => useChartTick());
    expect(result.current(10)).toBe(12);
  });

  it("keeps the authored tick size on a desktop", () => {
    mockMatch(false);
    const { result } = renderHook(() => useChartTick());
    expect(result.current(10)).toBe(10);
  });
});

describe("no desktop-only small type reaches a phone", () => {
  /**
   * A literal like `fontSize: "0.62rem"` is 9.9px on every breakpoint. Each one on these
   * surfaces now goes through phoneText, which floors `xs` at 12px. The resume templates are a
   * scaled paper preview with their own layout program and are deliberately out of scope.
   */
  const roots = ["components/scorecard", "components/profile", "app/profile", "app/user/scorecard"];
  const walk = (dir: string): string[] => {
    const abs = path.resolve(process.cwd(), dir);
    if (!fs.existsSync(abs)) return [];
    return fs.readdirSync(abs, { withFileTypes: true }).flatMap((e) => {
      const rel = path.join(dir, e.name);
      if (e.isDirectory()) return rel.includes(`${path.sep}resume`) ? [] : walk(rel);
      return /\.tsx$/.test(e.name) && !/\.test\./.test(e.name) ? [rel] : [];
    });
  };
  const files = roots.flatMap((r) => walk(r));

  it("finds the files it is meant to scan", () => {
    expect(files.length).toBeGreaterThan(20);
  });

  it("has no bare sub-12px rem fontSize left", () => {
    const small = /fontSize:\s*"0\.(?:[0-6]\d*|7[0-4]?)rem"/;
    const offenders = files.flatMap((f) =>
      fs
        .readFileSync(f, "utf8")
        .split("\n")
        .map((line, i) => (small.test(line) ? `${f}:${i + 1}` : null))
        .filter((x): x is string => x !== null),
    );
    expect(offenders).toEqual([]);
  });
});
