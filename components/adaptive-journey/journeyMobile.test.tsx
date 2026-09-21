import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";

/**
 * The course page's topic list and hero, as a phone uses them.
 *
 * jsdom has no layout, so this pins what a thumb and a screen reader depend on: the icon-only
 * buttons have names, the topic rows are the tap targets, and the phone-only sizing is emitted
 * under the phone media query (so desktop cannot pick it up).
 */

const push = vi.fn();
vi.mock("@/lib/hooks/useInstantNavigation", () => ({
  useInstantNavigation: () => ({ push, replace: vi.fn(), prefetch: vi.fn(), isPending: false }),
}));
vi.mock("./JourneySidePanels", () => ({ JourneySidePanels: () => null }));

const node = (id: number, title: string, status: string, submoduleId: number) => ({
  id,
  type: "topic",
  title,
  order: id,
  status,
  score: { earned: 0, total: 30 },
  weight: 1,
  basePoints: 30,
  unlockRule: "sequential",
  lockReason: status === "locked" ? "Finish the topic before this one" : null,
  isCalibration: false,
  content: { articles: 2, quizzes: 1, coding: 0, videos: 1 },
  itemCount: 4,
  questionCount: 0,
  proctored: false,
  durationMinutes: null,
  ref: { submoduleId },
});

const board = {
  contentLocked: false,
  unitNoun: "Module",
  course: {
    id: 7,
    title: "Python Basics",
    description: "Start from zero.",
    fieldTier: null,
    abilityIndex: null,
    enrolledCount: 12,
    certificateThreshold: 70,
    certificateEnabled: false,
    certificateTemplateUrl: null,
    certificateTitle: "",
    estHours: 6,
    sections: 1,
    items: 2,
    completionPct: 0,
    startedAt: null,
  },
  progressCard: { pointsEarned: 0, pointsTotal: 60, onTimeRate: null, nodesDone: 0, nodesTotal: 2, completionPct: 0 },
  calibration: { required: false, done: false, card: null },
  interview: { card: null },
  weeks: [
    {
      weekNo: 1,
      title: "Week 1",
      schedule: null,
      penaltyStrip: null,
      totals: { earned: 0, total: 60 },
      stepsDone: 0,
      stepsTotal: 2,
      nodes: [node(1, "Variables and types", "current", 101), node(2, "Control flow", "locked", 102)],
    },
  ],
};

vi.mock("@/lib/services/adaptive-journey.service", () => ({
  adaptiveJourneyService: { getJourney: () => Promise.resolve(board) },
}));

import { JourneyBoard } from "./JourneyBoard";

/** Every CSS rule emotion injected, as text. */
function injectedCss(): string {
  return Array.from(document.querySelectorAll("style"))
    .map((s) => s.textContent ?? "")
    .join("\n");
}

/** Removes every `<opener>...}` block, matching braces so nested rules go with their query. */
function stripMediaBlocks(css: string, opener: string): string {
  let out = "";
  let i = 0;
  for (;;) {
    const start = css.indexOf(opener, i);
    if (start === -1) return out + css.slice(i);
    out += css.slice(i, start);
    let depth = 1;
    let j = start + opener.length;
    for (; j < css.length && depth > 0; j++) {
      if (css[j] === "{") depth++;
      else if (css[j] === "}") depth--;
    }
    i = j;
  }
}

describe("JourneyBoard on a phone", () => {
  it("names the icon-only like button and reports its state", async () => {
    render(<JourneyBoard courseId={7} />);
    const like = await screen.findByRole("button", { name: "Like this course" });
    expect(like).toHaveAttribute("aria-pressed", "false");
    fireEvent.click(like);
    expect(screen.getByRole("button", { name: "Unlike this course" })).toHaveAttribute("aria-pressed", "true");
  });

  it("opens an unlocked topic from its row and leaves a locked one inert", async () => {
    push.mockClear();
    render(<JourneyBoard courseId={7} />);
    fireEvent.click(await screen.findByText("Variables and types"));
    expect(push).toHaveBeenCalledWith("/adaptive-courses/7/submodule/101");

    push.mockClear();
    fireEvent.click(screen.getByText("Control flow"));
    expect(push).not.toHaveBeenCalled();
    expect(screen.getByText("Finish the topic before this one")).toBeTruthy();
  });

  it("sizes the topic rows and the Continue button for a thumb only under the phone query", async () => {
    render(<JourneyBoard courseId={7} />);
    await screen.findByText("Variables and types");
    expect(screen.getAllByTestId("journey-node")).toHaveLength(2);
    const css = injectedCss().replace(/\s+/g, "");
    // Rules exist for the phone, and they live inside the max-width query - a bare
    // `min-height:44px` outside it would be the desktop regression this guards against.
    const phoneBlocks = css.match(/@media\(max-width:599\.95px\)\{[^@]*/g) ?? [];
    expect(phoneBlocks.some((b) => b.includes("min-height:56px"))).toBe(true);
    expect(phoneBlocks.some((b) => b.includes("min-height:44px"))).toBe(true);
    expect(phoneBlocks.some((b) => b.includes("min-height:48px"))).toBe(true);
    // And none of them leaks out: with every phone block cut away, the CSS any wider screen sees
    // carries no thumb-sized min-height at all.
    const outsidePhone = stripMediaBlocks(css, "@media(max-width:599.95px){");
    expect(outsidePhone).toContain("{"); // the cut left real rules behind, so the check is not vacuous
    for (const h of ["44px", "48px", "56px"]) expect(outsidePhone).not.toContain(`min-height:${h}`);
  });
});
