import { afterEach, describe, expect, it, vi } from "vitest";
import { act, renderHook, waitFor } from "@testing-library/react";
import { useFullscreenMonitor } from "./useFullscreenMonitor";
import { useFullscreenHandler } from "./useFullscreenHandler";
import {
  expectNoFullscreenApi,
  installFullscreenApi,
} from "@/lib/fullscreen/fullscreenTestDouble";

/**
 * A learner on a phone must never be trapped by a fullscreen requirement their browser cannot
 * meet.
 *
 * Reported by two Agileology learners on learn.agileologyedu.com: iPhone Safari, "Python
 * Assessment 1", clock running at 57:50, and a modal reading "Fullscreen Mode Required ... Press
 * F11" over the paper with one button, "Enter Fullscreen Mode", that did nothing at all. iOS
 * Safari implements no Fullscreen API for ordinary elements, so all four `requestFullscreen`
 * variants were `undefined`: nothing ran, nothing threw, the promise resolved, and the page read
 * that as a request it could then find unsatisfied - for ever.
 *
 * jsdom has no Fullscreen API either, which makes the DEFAULT document here an accurate iPhone and
 * makes the desktop case the one that must be installed (see `fullscreenTestDouble`). Every test
 * below has its desktop twin, because the fix must not quietly drop invigilation where it works.
 */

let installed: { uninstall: () => void; leave: () => void; enter: () => void } | null =
  null;

afterEach(() => {
  installed?.uninstall();
  installed = null;
});

describe("useFullscreenMonitor on a device with no Fullscreen API", () => {
  it("says so, instead of reporting a successful no-op", async () => {
    expect(expectNoFullscreenApi()).toBe(true);
    const { result } = renderHook(() => useFullscreenMonitor());

    await waitFor(() => expect(result.current.isSupported).toBe(false));

    // The old hook resolved `undefined` here and the caller took that for success.
    let entered: boolean | undefined;
    await act(async () => {
      entered = await result.current.enterFullscreen();
    });
    expect(entered).toBe(false);
    expect(result.current.isFullscreen).toBe(false);
  });

  it("records no FULLSCREEN_EXIT violation, and reports that fullscreen was never enforced", async () => {
    const { result } = renderHook(() => useFullscreenMonitor());
    await waitFor(() => expect(result.current.isSupported).toBe(false));

    act(() => {
      document.dispatchEvent(new Event("fullscreenchange"));
      document.dispatchEvent(new Event("webkitfullscreenchange"));
    });

    expect(result.current.violations).toEqual([]);
    // The half that matters: an empty violation list is ALSO what a clean desktop attempt looks
    // like. `hasEnteredFullscreen` is what stops the record claiming this attempt was invigilated
    // in a mode the device never had.
    expect(result.current.hasEnteredFullscreen).toBe(false);
  });
});

describe("useFullscreenMonitor on a desktop document (the control)", () => {
  it("enters fullscreen, reports it, and still records an exit as a violation", async () => {
    installed = installFullscreenApi();
    const { result } = renderHook(() => useFullscreenMonitor());
    await waitFor(() => expect(result.current.isSupported).toBe(true));

    let entered: boolean | undefined;
    await act(async () => {
      entered = await result.current.enterFullscreen();
    });
    expect(entered).toBe(true);
    await waitFor(() => expect(result.current.isFullscreen).toBe(true));
    expect(result.current.hasEnteredFullscreen).toBe(true);

    act(() => installed!.leave());

    await waitFor(() => expect(result.current.violations).toHaveLength(1));
    expect(result.current.violations[0]!.type).toBe("FULLSCREEN_EXIT");
    // Still true after leaving: the requirement WAS in force for this attempt.
    expect(result.current.hasEnteredFullscreen).toBe(true);
  });
});

function renderHandler(overrides: Record<string, unknown> = {}) {
  const onLeftFullscreen = vi.fn();
  const onEscapePressed = vi.fn();
  const enterFullscreen = vi.fn(async () => false);
  const hook = renderHook(() =>
    useFullscreenHandler({
      enabled: true,
      submitting: false,
      enterFullscreen,
      promptOnFullscreenExit: true,
      onLeftFullscreen,
      onEscapePressed,
      ...overrides,
    })
  );
  return { ...hook, onLeftFullscreen, onEscapePressed, enterFullscreen };
}

describe("useFullscreenHandler on a device with no Fullscreen API", () => {
  it("never raises the blocking warning and never opens the exit prompt", async () => {
    const { result, onLeftFullscreen } = renderHandler();
    await waitFor(() => expect(result.current.fullscreenSupported).toBe(false));

    act(() => {
      document.dispatchEvent(new Event("fullscreenchange"));
    });

    // Before this fix the same event ran `onLeftFullscreen`, which opens the "submit or return to
    // fullscreen" dialog whose "Continue test" led straight back to the blocking modal.
    expect(onLeftFullscreen).not.toHaveBeenCalled();
    expect(result.current.showFullscreenWarning).toBe(false);
  });

  it("does not intercept Escape", async () => {
    const { result, onEscapePressed } = renderHandler();
    await waitFor(() => expect(result.current.fullscreenSupported).toBe(false));

    act(() => {
      document.dispatchEvent(
        new KeyboardEvent("keydown", { key: "Escape", bubbles: true })
      );
    });

    expect(onEscapePressed).not.toHaveBeenCalled();
  });

  it("clears the warning when the button is pressed, so it cannot loop for ever", async () => {
    const { result } = renderHandler();
    await waitFor(() => expect(result.current.fullscreenSupported).toBe(false));

    act(() => result.current.setShowFullscreenWarning(true));
    expect(result.current.showFullscreenWarning).toBe(true);

    await act(async () => {
      await result.current.handleReEnterFullscreen();
    });

    // The loop in the bug report: tap, no-op, modal still there, clock still running.
    expect(result.current.showFullscreenWarning).toBe(false);
  });
});

describe("useFullscreenHandler on a desktop document (the control)", () => {
  it("still opens the exit prompt when the learner leaves fullscreen", async () => {
    installed = installFullscreenApi();
    const { result, onLeftFullscreen } = renderHandler();
    await waitFor(() => expect(result.current.fullscreenSupported).toBe(true));

    act(() => installed!.enter());
    act(() => installed!.leave());

    expect(onLeftFullscreen).toHaveBeenCalled();
  });

  it("still intercepts Escape while in fullscreen", async () => {
    installed = installFullscreenApi();
    const { result, onEscapePressed } = renderHandler();
    await waitFor(() => expect(result.current.fullscreenSupported).toBe(true));

    act(() => installed!.enter());
    act(() => {
      document.dispatchEvent(
        new KeyboardEvent("keydown", { key: "Escape", bubbles: true })
      );
    });

    expect(onEscapePressed).toHaveBeenCalled();
  });

  it("still shows the generic warning when there is no exit prompt wired up", async () => {
    installed = installFullscreenApi();
    const { result } = renderHandler({
      promptOnFullscreenExit: false,
      onLeftFullscreen: undefined,
    });
    await waitFor(() => expect(result.current.fullscreenSupported).toBe(true));

    act(() => installed!.enter());
    act(() => installed!.leave());

    expect(result.current.showFullscreenWarning).toBe(true);
  });
});
