/**
 * The goal card's day strip must agree with the streak the rest of the app shows.
 *
 * The streak is one live computation over recorded activity (activity/utils/streak.py), and the
 * card lit today's flame optimistically whenever ANY of the three goals was done - including the
 * minutes-based practice goal, which needs no activity at all. So a learner could see a fire on
 * the card and a zero on the top-nav flame for the same day.
 */
import { render, screen } from "@testing-library/react";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { TodayGoalPanel } from "./TodayGoalPanel";
import type { TodayGoal } from "@/lib/types/dashboard";

/**
 * jsdom has no IntersectionObserver, and framer-motion's `useInView` - behind the AnimatedRing in
 * this card - reaches for it on mount, so the card cannot be rendered at all without one.
 *
 * Scoped to this file rather than the shared setup on purpose. framer-motion treats a missing
 * observer as "everything is in view" and a present one as the authority; a global stub that never
 * fires therefore leaves every `whileInView` element in the repo permanently out of view, which
 * failed seven tests in three unrelated files the first time this was tried.
 */
const realIntersectionObserver = window.IntersectionObserver;
beforeAll(() => {
  window.IntersectionObserver = class {
    readonly root = null;
    readonly rootMargin = "";
    readonly thresholds: ReadonlyArray<number> = [];
    observe() {}
    unobserve() {}
    disconnect() {}
    takeRecords(): IntersectionObserverEntry[] {
      return [];
    }
  } as unknown as typeof IntersectionObserver;
});
afterAll(() => {
  window.IntersectionObserver = realIntersectionObserver;
});

const DAY = "2026-09-24";

function goal(overrides: Partial<TodayGoal> = {}): TodayGoal {
  return {
    goals: [
      { key: "lesson", label: "Complete a lesson", done: false },
      { key: "practice", label: "15-min practice", done: false, minutes: 0, targetMinutes: 15 },
      { key: "quiz", label: "Take 1 quiz", done: false },
    ],
    completedCount: 0,
    totalCount: 3,
    percent: 0,
    lastDays: [{ date: DAY, label: "THU", active: false, isToday: true }],
    ...overrides,
  } as TodayGoal;
}

/** The strip cell for today is the only one rendered in these fixtures. */
function todayIsLit(container: HTMLElement): boolean {
  return container.querySelectorAll('[data-icon="mdi:fire"]').length > 0;
}

describe("TodayGoalPanel day strip", () => {
  it("does not light today's flame for a minutes-only day", () => {
    const g = goal({ completedCount: 1, percent: 33 });
    g.goals[1].done = true;
    g.goals[1].minutes = 16;
    const { container } = render(<TodayGoalPanel goal={g} />);
    expect(todayIsLit(container)).toBe(false);
  });

  it("lights today's flame as soon as a lesson is completed", () => {
    const g = goal({ completedCount: 1, percent: 33 });
    g.goals[0].done = true;
    const { container } = render(<TodayGoalPanel goal={g} />);
    expect(todayIsLit(container)).toBe(true);
  });

  it("keeps a flame the server has already recorded", () => {
    const g = goal({ lastDays: [{ date: DAY, label: "THU", active: true, isToday: true }] });
    const { container } = render(<TodayGoalPanel goal={g} />);
    expect(todayIsLit(container)).toBe(true);
  });

  it("says how many minutes were counted even once practice is done", () => {
    const g = goal({ completedCount: 1, percent: 33 });
    g.goals[1].done = true;
    g.goals[1].minutes = 16;
    render(<TodayGoalPanel goal={g} />);
    expect(screen.getByText("16 / 15 min")).toBeTruthy();
  });
});
