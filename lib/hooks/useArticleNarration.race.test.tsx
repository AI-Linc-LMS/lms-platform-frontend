// @vitest-environment jsdom
/**
 * "Starting Read Aloud again before the first playback begins can trigger multiple voices
 *  that cannot all be stopped without refreshing the page."
 *
 * The synthesis fetch takes seconds, and the button used to read "Stop" for all of it while
 * nothing was audible - so the learner pressed it again. That third press (start, stop, start)
 * reset the single shared cancel flag and un-cancelled the run still suspended in its fetch.
 * Both runs then reached `new Audio(...)`, the second overwrote the single audio handle, and
 * `stop()` could no longer reach the first. It played to the end of its chunk with no way out.
 *
 * These tests hold the fetch open, which is exactly the window the learner clicks in.
 */

import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useArticleNarration } from "./useArticleNarration";

const HTML = "<p>A loop repeats work until it is told to stop.</p>";

/** Every Audio the hook constructs, so a test can see the one a stop failed to reach. */
class FakeAudio {
  static made: FakeAudio[] = [];
  paused = false;
  played = false;
  src: string;
  onended: (() => void) | null = null;
  onerror: (() => void) | null = null;
  constructor(src: string) {
    this.src = src;
    FakeAudio.made.push(this);
  }
  play() {
    this.played = true;
    return Promise.resolve();
  }
  pause() {
    this.paused = true;
  }
}

/** A fetch whose responses this test releases by hand. */
function deferredFetch() {
  const pending: Array<{ resolve: () => void; signal?: AbortSignal }> = [];
  const fn = vi.fn((_url: string, init?: RequestInit) => {
    return new Promise((resolve, reject) => {
      const settle = () => resolve({ ok: true, blob: async () => new Blob(["x"]) });
      pending.push({ resolve: settle, signal: init?.signal ?? undefined });
      init?.signal?.addEventListener("abort", () => {
        const e = new Error("aborted");
        e.name = "AbortError";
        reject(e);
      });
    });
  });
  return { fn, pending };
}

describe("clicking Read aloud again during the silent synthesis wait", () => {
  let fetchCtl: ReturnType<typeof deferredFetch>;

  beforeEach(() => {
    fetchCtl = deferredFetch();
    FakeAudio.made = [];
    vi.stubGlobal("fetch", fetchCtl.fn);
    vi.stubGlobal("Audio", FakeAudio);
    // Assigned onto the real URL rather than stubbed over it: replacing the class drops its
    // statics, and jsdom's unmount cleanup then trips over the missing revokeObjectURL.
    URL.createObjectURL = vi.fn(() => `blob:${FakeAudio.made.length}`) as typeof URL.createObjectURL;
    URL.revokeObjectURL = vi.fn() as typeof URL.revokeObjectURL;
  });

  afterEach(() => vi.unstubAllGlobals());

  it("the button does not claim to be playing while the learner hears silence", async () => {
    // The UI lie that provoked the whole thing: `playing` was set before any audio existed,
    // so the control read "Stop" through the entire synthesis wait.
    const { result } = renderHook(() => useArticleNarration(HTML));

    await act(async () => void result.current.toggle());

    expect(result.current.loading).toBe(true);
    expect(result.current.playing).toBe(false);
  });

  it("start, stop, start never produces a second voice", async () => {
    const { result } = renderHook(() => useArticleNarration(HTML));

    await act(async () => void result.current.toggle()); // click A - start, fetch hangs
    await act(async () => result.current.stop()); // click B - the learner hears nothing, presses again
    await act(async () => void result.current.toggle()); // click C - starts a fresh run

    // Release every synthesis response, including the one belonging to the abandoned run A.
    await act(async () => {
      fetchCtl.pending.forEach((p) => p.resolve());
      await Promise.resolve();
      await Promise.resolve();
    });

    const playing = FakeAudio.made.filter((a) => a.played && !a.paused);
    expect(playing.length).toBeLessThanOrEqual(1);
  });

  it("stop silences the audio it started", async () => {
    const { result } = renderHook(() => useArticleNarration(HTML));

    await act(async () => void result.current.toggle());
    await act(async () => {
      fetchCtl.pending.forEach((p) => p.resolve());
      await Promise.resolve();
      await Promise.resolve();
    });
    expect(FakeAudio.made.some((a) => a.played)).toBe(true);

    await act(async () => result.current.stop());

    expect(FakeAudio.made.filter((a) => a.played && !a.paused)).toHaveLength(0);
    expect(result.current.playing).toBe(false);
  });

  it("aborts the in-flight synthesis instead of paying for a voice nobody will hear", async () => {
    const { result } = renderHook(() => useArticleNarration(HTML));
    await act(async () => void result.current.toggle());

    expect(fetchCtl.pending[0].signal?.aborted).toBe(false);
    await act(async () => result.current.stop());
    expect(fetchCtl.pending[0].signal?.aborted).toBe(true);
  });

  it("a stop does not fall back to the robotic browser voice", async () => {
    // stop() aborts the fetch, which rejects. That rejection must read as "cancelled",
    // not as "cloud TTS is down" - otherwise every stop starts speechSynthesis instead.
    const speak = vi.fn();
    vi.stubGlobal("speechSynthesis", { speak, cancel: vi.fn() });
    vi.stubGlobal("SpeechSynthesisUtterance", class {});

    const { result } = renderHook(() => useArticleNarration(HTML));
    await act(async () => void result.current.toggle());
    await act(async () => {
      result.current.stop();
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(speak).not.toHaveBeenCalled();
  });

  it("the button comes back to life after narration finishes on its own", async () => {
    const { result } = renderHook(() => useArticleNarration(HTML));

    await act(async () => void result.current.toggle());
    await act(async () => {
      fetchCtl.pending.forEach((p) => p.resolve());
      await Promise.resolve();
      await Promise.resolve();
    });
    // Playback ends by itself.
    await act(async () => {
      FakeAudio.made.forEach((a) => a.onended?.());
      await Promise.resolve();
    });
    expect(result.current.playing).toBe(false);

    // The next press must START, not be swallowed as a stop.
    await act(async () => void result.current.toggle());
    expect(result.current.loading).toBe(true);
  });
});
