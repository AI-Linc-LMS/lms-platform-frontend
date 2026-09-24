/**
 * "15-min practice" has to mean the learner practised.
 *
 * A learner reported the goal ticked on a day they had opened nothing, and each case below is a
 * way that happened: the dashboard's own minutes, the minutes just before a click into a lesson,
 * a menu that lists content, a results page, and a lesson tab left open and walked away from.
 * The last two tests are the other half - real work, and a video, still count.
 */
import { render, act } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useTimeTracking } from "./useTimeTracking";
import { pulsePractice, resetPracticePulse } from "@/lib/activity/practicePulse";
import type { TrackTimePayload } from "@/lib/services/activity.service";

const trackTime = vi.fn((payload: TrackTimePayload) => Promise.resolve({ ok: !!payload }));

vi.mock("@/lib/services/activity.service", () => ({
  activityService: { trackTime: (p: TrackTimePayload) => trackTime(p) },
  getTimeTrackingSessionId: () => "session-under-test",
}));

let pathname = "/dashboard";
vi.mock("next/navigation", () => ({ usePathname: () => pathname }));

const LESSON = "/adaptive-courses/12/submodule/34/article/56";
const CODING = "/adaptive-courses/12/submodule/34/coding/7";
const QUIZ_RUNTIME = "/adaptive-quizzes/session/abc";

function Harness() {
  useTimeTracking();
  return null;
}

/**
 * Every delta posted so far, summed.
 *
 * Reads the legacy `is_learning` flag when no split is present, so these assertions measure the
 * practice minutes a SERVER would record rather than the shape of the payload. Without that, a
 * client that stopped sending the split would satisfy every "must not count" case by sending
 * nothing at all, and the tests would pass on a regression.
 */
function posted() {
  return trackTime.mock.calls.reduce(
    (acc, call) => {
      const payload: TrackTimePayload = call[0];
      acc.total += payload.time_spent_seconds;
      acc.learning +=
        payload.learning_seconds ?? (payload.is_learning ? payload.time_spent_seconds : 0);
      return acc;
    },
    { total: 0, learning: 0 },
  );
}

/** Advance the clock and let the 60s heartbeat fire `minutes` times. */
async function tickMinutes(minutes: number) {
  for (let i = 0; i < minutes; i++) {
    await act(async () => {
      await vi.advanceTimersByTimeAsync(60_000);
    });
  }
}

/** The learner does something, the way a reader or a coder would. */
function interact() {
  act(() => {
    window.dispatchEvent(new Event("mousemove"));
  });
}

/** Keep interacting through `minutes` of heartbeats - a learner who is actually working. */
async function workFor(minutes: number) {
  for (let i = 0; i < minutes; i++) {
    interact();
    await act(async () => {
      await vi.advanceTimersByTimeAsync(60_000);
    });
  }
}

describe("useTimeTracking: practice minutes", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-09-24T09:00:00Z"));
    trackTime.mockClear();
    resetPracticePulse();
    pathname = "/dashboard";
    Object.defineProperty(document, "hidden", { configurable: true, value: false });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("does not credit practice for time on the dashboard", async () => {
    render(<Harness />);
    await workFor(20);
    expect(posted().total).toBeGreaterThan(0);
    expect(posted().learning).toBe(0);
  });

  it("credits only the seconds after a click into a lesson, not the dashboard minutes before it", async () => {
    const { rerender } = render(<Harness />);
    // 50s on the dashboard, then into a lesson, then the heartbeat at 60s.
    interact();
    await act(async () => {
      await vi.advanceTimersByTimeAsync(50_000);
    });
    pathname = LESSON;
    await act(async () => {
      rerender(<Harness />);
    });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(10_000);
    });

    const { total, learning } = posted();
    expect(total).toBe(60);
    // 10 of those 60 seconds were on the lesson. Before this fix the whole delta was tagged by
    // the route it ended on, so all 60 counted as practice.
    expect(learning).toBe(10);
  });

  it("does not credit practice for a lesson tab that was opened and walked away from", async () => {
    pathname = LESSON;
    render(<Harness />);
    interact(); // they arrive, and then do nothing at all
    await tickMinutes(20);

    const { total, learning } = posted();
    expect(total).toBeGreaterThan(0);
    // Practice stops within a heartbeat of the 3-minute idle limit. It must be nowhere near the
    // 15-minute goal: an abandoned tab used to bank the full 10-minute presence limit, two
    // thirds of the goal, for nothing.
    expect(learning).toBeLessThanOrEqual(4 * 60);
  });

  it("does not credit practice while the tab is in the background", async () => {
    pathname = LESSON;
    render(<Harness />);
    interact();
    act(() => {
      Object.defineProperty(document, "hidden", { configurable: true, value: true });
      document.dispatchEvent(new Event("visibilitychange"));
    });
    trackTime.mockClear(); // drop the flush that records the moment they left
    await tickMinutes(30);
    expect(posted().total).toBe(0);
    expect(posted().learning).toBe(0);
  });

  it("does not credit a navigation that happens while the tab is in the background", async () => {
    pathname = "/dashboard";
    const { rerender } = render(<Harness />);
    interact();
    act(() => {
      Object.defineProperty(document, "hidden", { configurable: true, value: true });
      document.dispatchEvent(new Event("visibilitychange"));
    });
    trackTime.mockClear();
    await tickMinutes(30); // half an hour in a background tab
    pathname = LESSON;
    await act(async () => {
      rerender(<Harness />); // a redirect lands while they are still away
    });
    act(() => {
      Object.defineProperty(document, "hidden", { configurable: true, value: false });
      document.dispatchEvent(new Event("visibilitychange"));
    });
    await workFor(1);

    // Only the minute they were actually back, never the half hour they were not.
    expect(posted().total).toBeLessThanOrEqual(120);
  });

  it("does not credit practice for the submodule menu, the quiz picker or a results page", async () => {
    for (const p of [
      "/adaptive-courses/12/submodule/34",
      "/adaptive-quizzes",
      "/adaptive-quizzes/start",
      "/adaptive-quizzes/session/abc/results",
      "/adaptive-courses/12/journey",
      "/roadmaps/python",
    ]) {
      trackTime.mockClear();
      pathname = p;
      const { unmount } = render(<Harness />);
      await workFor(3);
      expect(posted(), `${p} must not count as practice`).toMatchObject({ learning: 0 });
      expect(posted().total, `${p} must still count as presence`).toBeGreaterThan(0);
      unmount();
    }
  });

  it("still credits practice for real work on a lesson, a problem and a quiz", async () => {
    for (const p of [LESSON, CODING, QUIZ_RUNTIME, "/assessments/final/take"]) {
      trackTime.mockClear();
      pathname = p;
      const { unmount } = render(<Harness />);
      await workFor(16);
      const { total, learning } = posted();
      expect(learning, `${p} must count as practice`).toBeGreaterThanOrEqual(15 * 60);
      expect(learning).toBeLessThanOrEqual(total);
      unmount();
    }
  });

  it("still credits practice for a video the learner is watching without touching anything", async () => {
    pathname = "/adaptive-courses/12/submodule/34/video/9";
    render(<Harness />);
    for (let i = 0; i < 16; i++) {
      act(() => {
        pulsePractice(); // the player reports playback; the learner touches nothing
      });
      await act(async () => {
        await vi.advanceTimersByTimeAsync(60_000);
      });
    }
    expect(posted().learning).toBeGreaterThanOrEqual(15 * 60);
  });

  it("never reports more practice than presence", async () => {
    pathname = LESSON;
    render(<Harness />);
    await workFor(10);
    for (const call of trackTime.mock.calls) {
      const payload: TrackTimePayload = call[0];
      expect(payload.learning_seconds ?? 0).toBeLessThanOrEqual(payload.time_spent_seconds);
    }
  });
});
