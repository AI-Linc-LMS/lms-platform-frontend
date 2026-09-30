/**
 * A clock that mounts when the exam starts has to be started from an effect.
 *
 * Reported: "I have taken the assessment inside the course of impacteers, the timer is not working."
 *
 * `LiveAssessmentTimerBar` is rendered inside `{assessmentStarted && (...)}` with
 * `autoStart={false}`, and `useAssessmentTimer` initialises `isRunning` from that flag - so the
 * countdown does not move until someone calls `start()` through the ref.
 *
 * The take page used to make that call on the line straight after it set `assessmentStarted`. That
 * only worked for a PROCTORED paper, because that branch does
 * `flushSync(() => setAssessmentStarted(true))` and then awaits a frame loop attaching the camera, so
 * the bar had mounted and the ref was attached by the time `start()` ran. The non-proctored branch is
 * a plain `setAssessmentStarted(true)`; React batches it, the bar had not rendered, the ref was still
 * null, and `?.start()` quietly did nothing. The learner saw a clock sitting at its full duration and
 * never moving - which is exactly what 112 journey assessments generated with
 * `proctoring_enabled=false` did.
 *
 * These tests use a harness with the page's shape rather than the 2,800-line page itself, and they
 * run BOTH orderings: the broken one is kept as a test so the reason the fix is shaped this way
 * cannot be lost.
 */

import { render, screen, act } from "@testing-library/react";
import { useEffect, useRef, useState } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  LiveAssessmentTimerBar,
  type AssessmentTimerControl,
} from "./LiveAssessmentTimerBar";

/**
 * The take page's structure: the bar exists only once the exam has started.
 *
 * `deferredReset` reproduces the page's remaining_time effect, which schedules ONE
 * `requestIdleCallback` on its first run - before the learner has pressed Start - and resets the
 * clock from inside it. `readStartedFrom` is the part that mattered: reading the captured state
 * leaves the clock stopped, reading a ref restarts it.
 */
function Harness({
  startFrom,
  deferredReset,
  readStartedFrom = "ref",
}: {
  startFrom: "same-tick" | "effect";
  deferredReset?: { afterMs: number; toSeconds: number };
  readStartedFrom?: "ref" | "closure";
}) {
  const [started, setStarted] = useState(false);
  const controlRef = useRef<AssessmentTimerControl | null>(null);
  const startedRef = useRef(false);
  const liveStartedRef = useRef(started);
  liveStartedRef.current = started;

  // The page's deferred reset: scheduled once, on the first run, when `started` is still false.
  const scheduledRef = useRef(false);
  useEffect(() => {
    if (!deferredReset || scheduledRef.current) return;
    scheduledRef.current = true;
    const capturedStarted = started; // what the stale closure saw
    setTimeout(() => {
      controlRef.current?.reset(deferredReset.toSeconds);
      const isStarted =
        readStartedFrom === "ref" ? liveStartedRef.current : capturedStarted;
      if (isStarted) controlRef.current?.start();
    }, deferredReset.afterMs);
  }, [deferredReset, started, readStartedFrom]);

  // The fix: after the commit, so the ref is attached whenever this runs.
  useEffect(() => {
    if (startFrom !== "effect") return;
    if (!started || startedRef.current) return;
    const control = controlRef.current;
    if (!control) return;
    startedRef.current = true;
    control.start();
  }, [started, startFrom]);

  return (
    <>
      <button
        onClick={() => {
          setStarted(true);
          // The old shape: a batched setState, then straight through a ref that is still null.
          if (startFrom === "same-tick") controlRef.current?.start();
        }}
      >
        Start assessment
      </button>
      {started && (
        <LiveAssessmentTimerBar
          ref={controlRef}
          initialTimeSeconds={600}
          autoStart={false}
          onTimeUp={() => {}}
          title="Week 1 Final"
          isLastQuestion={false}
          submitting={false}
          onSubmit={() => {}}
        />
      )}
    </>
  );
}

/** The clock as the learner reads it. The formatter does not zero-pad the minutes. */
function clockReads(): string {
  const match = document.body.textContent?.match(/\d{1,2}:\d{2}/);
  if (!match) throw new Error(`no clock rendered: ${document.body.textContent}`);
  return match[0];
}

function startExam() {
  act(() => {
    screen.getByText("Start assessment").click();
  });
}

function advance(seconds: number) {
  act(() => {
    vi.advanceTimersByTime(seconds * 1000);
  });
}

describe("a timer bar that mounts when the exam starts", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("counts down when started from an effect", () => {
    render(<Harness startFrom="effect" />);
    startExam();
    expect(clockReads()).toBe("10:00");
    advance(3);
    expect(clockReads()).toBe("9:57");
  });

  it("does NOT count down when started in the same tick as the mount", () => {
    // The bug, kept as a test. If this ever starts passing, the ordering hazard has gone away and
    // the effect above is no longer load-bearing - but until then, this is why it exists.
    render(<Harness startFrom="same-tick" />);
    startExam();
    expect(clockReads()).toBe("10:00");
    advance(3);
    expect(clockReads()).toBe("10:00");
  });

  it("keeps counting past the first tick", () => {
    render(<Harness startFrom="effect" />);
    startExam();
    advance(65);
    expect(clockReads()).toBe("8:55");
  });
});

describe("the deferred reset that runs a second after the learner presses Start", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("keeps the clock running when it reads the ref", () => {
    // remaining_time on a first attempt is duration - 1, so this effect always fires; it is not a
    // resume-only path.
    render(
      <Harness startFrom="effect" deferredReset={{ afterMs: 3000, toSeconds: 1740 }} />,
    );
    startExam();
    advance(2);
    expect(clockReads()).toBe("9:58"); // running, before the reset lands
    advance(1); // t=3s: the deferred reset fires and rewinds to 29:00
    expect(clockReads()).toBe("29:00");
    advance(3); // and it must still be counting afterwards
    expect(clockReads()).toBe("28:57");
  });

  it("freezes the clock when it reads the captured state instead", () => {
    // The shape that shipped: reset() stops the clock and the stale closure says "not started", so
    // nothing restarts it. The learner sat in front of a frozen full-duration timer.
    render(
      <Harness
        startFrom="effect"
        readStartedFrom="closure"
        deferredReset={{ afterMs: 3000, toSeconds: 1740 }}
      />,
    );
    startExam();
    advance(3);
    expect(clockReads()).toBe("29:00");
    advance(5);
    expect(clockReads()).toBe("29:00"); // stopped, and rewound to the full duration
  });
});
