import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";

/**
 * The VALUES the attempt's record carries about fullscreen, not just the presence of the keys.
 *
 * These three fields are the only thing standing between "an iPhone attempt, which could not lock
 * the screen" and "a desktop attempt that behaved perfectly" — both produce an identical, empty
 * `fullscreen_exits` list. A test that only asserts the key names appear would pass with every
 * value inverted, which is how a record that lies gets shipped.
 *
 * The server's reader is `assessment/integrity.py::read_fullscreen_enforcement`. It takes
 * `fullscreen_supported: false` as "unavailable", takes the word `fullscreen_enforcement`
 * literally, and deliberately refuses to infer "enforced" from support alone — so the client must
 * never send a word it has not earned.
 */

import { installFullscreenApi } from "@/lib/fullscreen/fullscreenTestDouble";
import { useAssessmentProctoring } from "./useAssessmentProctoring";

const IPHONE =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 " +
  "(KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1";
const DESKTOP =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 " +
  "(KHTML, like Gecko) Chrome/126.0 Safari/537.36";

function setUserAgent(ua: string) {
  Object.defineProperty(window.navigator, "userAgent", { value: ua, configurable: true });
}

/** `installFullscreenApi` hands back its own teardown; jsdom's bare document is already an
 *  accurate iPhone, so "no API" needs no setup at all. */
let uninstall: (() => void) | null = null;

beforeEach(() => {
  vi.restoreAllMocks();
});

afterEach(() => {
  uninstall?.();
  uninstall = null;
});

function withFullscreenApi() {
  uninstall = installFullscreenApi().uninstall;
}

function record() {
  const { result } = renderHook(() => useAssessmentProctoring({ assessmentId: 1 }));
  return result;
}

describe("what the record says about fullscreen", () => {
  it("a phone says the lockdown was unavailable, and never that it was enforced", async () => {
    setUserAgent(IPHONE);

    const result = record();

    await waitFor(() => {
      expect(result.current.metadata.proctoring.fullscreen_supported).toBe(false);
    });
    expect(result.current.metadata.proctoring.fullscreen_enforcement).toBe("unavailable");
    expect(result.current.metadata.proctoring.device_class).toBe("mobile");
  });

  it("a desktop that never entered fullscreen claims NEITHER state", async () => {
    // The third state, and the reason this is a word and not a boolean. Sending "enforced" here
    // would be a claim nobody made; sending "unavailable" would be false.
    setUserAgent(DESKTOP);
    withFullscreenApi();

    const result = record();

    await waitFor(() => {
      expect(result.current.metadata.proctoring.fullscreen_supported).toBe(true);
    });
    expect(result.current.metadata.proctoring.fullscreen_enforcement).toBeUndefined();
    expect(result.current.metadata.proctoring.device_class).toBe("desktop");
  });

  it("a desktop that actually held fullscreen says so", async () => {
    setUserAgent(DESKTOP);
    withFullscreenApi();

    const result = record();
    await waitFor(() => {
      expect(result.current.metadata.proctoring.fullscreen_supported).toBe(true);
    });

    await act(async () => {
      await document.documentElement.requestFullscreen();
    });

    await waitFor(() => {
      expect(result.current.metadata.proctoring.fullscreen_enforcement).toBe("enforced");
    });
  });

  it("still says enforced after they leave it again", async () => {
    // "Enforced" is a statement about the sitting, so leaving does not retract it — the exit is
    // recorded separately, as a violation, which is the thing an examiner should see.
    setUserAgent(DESKTOP);
    withFullscreenApi();

    const result = record();
    await act(async () => {
      await document.documentElement.requestFullscreen();
    });
    await waitFor(() => {
      expect(result.current.metadata.proctoring.fullscreen_enforcement).toBe("enforced");
    });

    await act(async () => {
      await document.exitFullscreen();
    });

    expect(result.current.metadata.proctoring.fullscreen_enforcement).toBe("enforced");
  });

  it("recording a violation does not drop the three fields", async () => {
    // They travel in the same metadata object the violations setter rewrites, which is exactly
    // the kind of place a carried-forward field quietly disappears.
    setUserAgent(IPHONE);

    const result = record();
    await waitFor(() => {
      expect(result.current.metadata.proctoring.fullscreen_enforcement).toBe("unavailable");
    });

    // Drive a real violation through the document the detector listens to, rather than a method
    // the hook does not expose.
    act(() => {
      Object.defineProperty(document, "visibilityState", {
        value: "hidden", configurable: true,
      });
      document.dispatchEvent(new Event("visibilitychange"));
    });

    await waitFor(() => {
      expect(result.current.metadata.proctoring.fullscreen_supported).toBe(false);
    });
    expect(result.current.metadata.proctoring.fullscreen_enforcement).toBe("unavailable");
    expect(result.current.metadata.proctoring.device_class).toBe("mobile");
  });
});
