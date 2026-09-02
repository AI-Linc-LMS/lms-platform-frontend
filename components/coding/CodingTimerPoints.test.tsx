// @vitest-environment jsdom
/**
 * "After submitting a coding question, the timer resets to 0:00 instead of showing the actual
 *  time taken."
 *
 * The displayed elapsed was `baseMs + (running ? now - anchor : 0)`. Submitting flips `running`
 * false, which discarded the whole ticked term. `baseMs` is `server_now - started_at` captured
 * once when the session payload was fetched, so for a session begun in this sitting it is a few
 * milliseconds - and the clock snapped from the real time taken straight back to 0:00.
 */

import { act, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { CodingTimerPoints } from "./CodingTimerPoints";

const DECAY = { base: 100, floor: 10, grace: 60, half_life: 300, hint_penalty: 0.1 };

/** The clock as the learner reads it, e.g. "4:10".
 *  No \b anchors: the label runs straight into the value ("On the clock0:00"), so there is no
 *  word boundary before the digits. */
function shownClock(): string {
  const m = document.body.textContent?.match(/\d+:\d{2}/);
  return m ? m[0] : "";
}

function renderTimer(running: boolean, startedAt: string, serverNow: string, earned: number | null = null) {
  return render(
    <CodingTimerPoints
      decay={DECAY as never}
      startedAt={startedAt}
      serverNow={serverNow}
      running={running}
      earned={earned}
    />,
  );
}

describe("the coding timer after submit", () => {
  const T0 = 1_700_000_000_000;

  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: false });
    vi.setSystemTime(T0);
  });
  afterEach(() => vi.useRealTimers());

  it("holds the time actually taken when the learner submits", () => {
    // A session begun in this sitting: server_now == started_at, so baseMs is 0 and the whole
    // clock is the locally ticked term - exactly the case the old ternary threw away.
    const iso = new Date(T0).toISOString();
    const view = renderTimer(true, iso, iso);

    act(() => void vi.advanceTimersByTime(250_000)); // 4:10 of solving
    expect(shownClock()).toBe("4:10");

    // Submit: `running` goes false and `earned` arrives.
    view.rerender(
      <CodingTimerPoints decay={DECAY as never} startedAt={iso} serverNow={iso} running={false} earned={42} />,
    );

    expect(shownClock()).toBe("4:10");
  });

  it("keeps counting while the learner is still solving", () => {
    const iso = new Date(T0).toISOString();
    renderTimer(true, iso, iso);
    act(() => void vi.advanceTimersByTime(65_000));
    expect(shownClock()).toBe("1:05");
  });

  it("still includes time from a session resumed later", () => {
    // baseMs carries the server-side elapsed from before this sitting; it must be ADDED to the
    // ticked term, not replaced by it.
    const started = new Date(T0 - 600_000).toISOString(); // begun 10 minutes ago
    const serverNow = new Date(T0).toISOString();
    renderTimer(true, started, serverNow);

    expect(shownClock()).toBe("10:00");
    act(() => void vi.advanceTimersByTime(30_000));
    expect(shownClock()).toBe("10:30");
  });

  it("stops advancing once submitted", () => {
    const iso = new Date(T0).toISOString();
    const view = renderTimer(true, iso, iso);
    act(() => void vi.advanceTimersByTime(120_000));

    view.rerender(
      <CodingTimerPoints decay={DECAY as never} startedAt={iso} serverNow={iso} running={false} earned={7} />,
    );
    const frozen = shownClock();

    act(() => void vi.advanceTimersByTime(120_000));
    expect(shownClock()).toBe(frozen);
  });
});
