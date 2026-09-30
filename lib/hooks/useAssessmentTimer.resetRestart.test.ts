/**
 * reset() followed by start() has to leave the clock running.
 *
 * The interval is owned by an effect keyed on `isRunning`, but `reset()` also clears the interval
 * imperatively and sets `isRunning` to false. When a caller resets and then starts within one tick -
 * which is what the assessment take page's deferred remaining_time handler does - React batches the
 * two updates, `isRunning` ends at the same `true` it started from, the effect never re-runs, and the
 * interval that reset() had just cleared was never re-created. `isRunning` said the exam was being
 * timed while the clock stood still.
 *
 * This is not confined to the take page: any resume that lands both calls in one tick did it.
 */

import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useAssessmentTimer } from "./useAssessmentTimer";

describe("useAssessmentTimer reset/start", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("counts down after a reset and start in the SAME tick", () => {
    const { result } = renderHook(() =>
      useAssessmentTimer({ initialTimeSeconds: 600, autoStart: false }),
    );

    act(() => result.current.start());
    act(() => vi.advanceTimersByTime(2000));
    expect(result.current.remainingSeconds).toBe(598);

    // Both in one act(): the batching that broke it.
    act(() => {
      result.current.reset(1740);
      result.current.start();
    });
    expect(result.current.remainingSeconds).toBe(1740);

    act(() => vi.advanceTimersByTime(3000));
    expect(result.current.remainingSeconds).toBe(1737);
  });

  it("stays stopped after a reset with no start", () => {
    const { result } = renderHook(() =>
      useAssessmentTimer({ initialTimeSeconds: 600, autoStart: false }),
    );
    act(() => result.current.start());
    act(() => vi.advanceTimersByTime(2000));

    act(() => result.current.reset(1740));
    act(() => vi.advanceTimersByTime(5000));
    expect(result.current.remainingSeconds).toBe(1740);
  });

  it("does not run at all until start is called", () => {
    const { result } = renderHook(() =>
      useAssessmentTimer({ initialTimeSeconds: 600, autoStart: false }),
    );
    act(() => vi.advanceTimersByTime(5000));
    expect(result.current.remainingSeconds).toBe(600);
  });

  it("still fires onTimeUp after a reset and restart", () => {
    const onTimeUp = vi.fn();
    const { result } = renderHook(() =>
      useAssessmentTimer({ initialTimeSeconds: 600, autoStart: false, onTimeUp }),
    );
    act(() => result.current.start());
    act(() => {
      result.current.reset(3);
      result.current.start();
    });
    act(() => vi.advanceTimersByTime(4000));
    expect(result.current.remainingSeconds).toBe(0);
    expect(onTimeUp).toHaveBeenCalledTimes(1);
  });
});
