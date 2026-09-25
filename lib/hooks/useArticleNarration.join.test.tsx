// @vitest-environment jsdom
/**
 * "[Adaptive Course] The read aloud feature is skipping some words when there is a
 *  sentence or paragraph change."
 *
 * The page started following the voice by cutting narration at block boundaries, which
 * took an article from about two audio files to about fifteen - a file boundary at almost
 * every paragraph. Measured in Chromium on the real production mp3s, each of those
 * boundaries cost 373ms of dead air: 185ms of encoder delay and padding that no decoder
 * can trim (the route's mp3 carries no gapless header at all), plus ~190ms of loading and
 * decoding an <audio> element that did not exist until the previous one's `ended` had
 * fired. The synthesiser's own pause between the same two sentences inside a single file
 * is 45ms.
 *
 * These tests hold the two properties that removes: the silence a container added is
 * trimmed off before a chunk is scheduled, and the gap between two chunks is a number
 * this code chose rather than whatever the decode happened to take.
 */

import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useArticleNarration } from "./useArticleNarration";
import { BLOCK_PAUSE } from "@/lib/utils/narration-player";
import type { NarrationSegment } from "@/lib/utils/article-speech";

const SAMPLE_RATE = 24000;
/** The shape measured in the production audio: silence, speech, silence. */
const LEAD_SILENCE = 0.05;
const SPEECH = 1.0;
const TAIL_SILENCE = 0.135;

function fakeBuffer() {
  const total = Math.round((LEAD_SILENCE + SPEECH + TAIL_SILENCE) * SAMPLE_RATE);
  const data = new Float32Array(total);
  const from = Math.round(LEAD_SILENCE * SAMPLE_RATE);
  const to = Math.round((LEAD_SILENCE + SPEECH) * SAMPLE_RATE);
  for (let i = from; i < to; i += 1) data[i] = 0.5 * Math.sin((2 * Math.PI * 220 * i) / SAMPLE_RATE);
  return { sampleRate: SAMPLE_RATE, length: total, duration: total / SAMPLE_RATE, numberOfChannels: 1, getChannelData: () => data };
}

type Start = { when: number; offset: number; duration: number };
const starts: Start[] = [];

class FakeAudioContext {
  state = "running";
  destination = {};
  /** A real clock, so the scheduling loop actually reaches the end of the article
   *  instead of parking forever on a currentTime that never moves. */
  private readonly t0 = performance.now();
  get currentTime() {
    return (performance.now() - this.t0) / 1000;
  }
  createBufferSource() {
    return {
      buffer: null as unknown,
      onended: null as (() => void) | null,
      connect: () => {},
      start: (when: number, offset: number, duration: number) => starts.push({ when, offset, duration }),
      stop: () => {},
    };
  }
  decodeAudioData() {
    return Promise.resolve(fakeBuffer() as unknown as AudioBuffer);
  }
  resume() {
    return Promise.resolve();
  }
  close() {
    return Promise.resolve();
  }
}

/** Two paragraphs, each long enough that chunkSegments gives it its own audio file -
 *  which is what puts a file boundary between them in the first place. */
const SEGMENTS: NarrationSegment[] = [
  { id: "ns-0", text: `A paragraph about loops. ${"It repeats work until told to stop. ".repeat(5)}` },
  { id: "ns-1", text: `A paragraph about lists. ${"They hold items in order. ".repeat(6)}` },
];

describe("the join between two narration chunks", () => {
  beforeEach(() => {
    starts.length = 0;
    vi.stubGlobal("fetch", vi.fn(async () => ({ ok: true, arrayBuffer: async () => new ArrayBuffer(16) })));
    vi.stubGlobal("AudioContext", FakeAudioContext);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("schedules the next block itself rather than waiting for an element to end", async () => {
    // Before this change nothing was ever scheduled: the next <audio> was constructed
    // inside the previous one's `ended` handler, so at the moment the join had to be
    // seamless the element that had to make the sound did not exist yet.
    const { result } = renderHook(() => useArticleNarration("<p>x</p>", SEGMENTS));
    act(() => result.current.toggle());
    await waitFor(() => expect(starts.length).toBe(2));
    act(() => result.current.stop());
  });

  it("puts exactly one chosen beat between them, not whatever the decode took", async () => {
    const { result } = renderHook(() => useArticleNarration("<p>x</p>", SEGMENTS));
    act(() => result.current.toggle());
    await waitFor(() => expect(starts.length).toBe(2));

    const firstEnds = starts[0].when + starts[0].duration;
    expect(starts[1].when - firstEnds).toBeCloseTo(BLOCK_PAUSE, 5);
    // ...and that beat is a fraction of the 373ms the element handoff cost.
    expect(BLOCK_PAUSE).toBeLessThan(0.2);
    act(() => result.current.stop());
  });

  it("puts the highlight out when the article ends, and leaves no timer behind", async () => {
    // Reaching the end is not a stop, so nothing else clears the loop that drives the
    // highlight - and a loop still running would put the last block back the moment the
    // hook cleared it.
    const { result } = renderHook(() => useArticleNarration("<p>x</p>", SEGMENTS));
    act(() => result.current.toggle());
    await waitFor(() => expect(starts.length).toBe(2));
    await waitFor(() => expect(result.current.playing).toBe(false), { timeout: 5000 });
    expect(result.current.activeId).toBeNull();
    // Give the loop several ticks to contradict that, if it were still alive.
    await new Promise((r) => setTimeout(r, 250));
    expect(result.current.activeId).toBeNull();
  });

  it("plays from before the first word and past the last one, so the trim cannot clip", async () => {
    const { result } = renderHook(() => useArticleNarration("<p>x</p>", SEGMENTS));
    act(() => result.current.toggle());
    await waitFor(() => expect(starts.length).toBe(2));

    for (const s of starts) {
      // The container's leading silence is gone...
      expect(s.offset).toBeGreaterThan(0);
      expect(s.offset).toBeLessThan(LEAD_SILENCE);
      // ...but playback still begins before the first sample of speech and ends after
      // the last one. A trim that cut into either would be the bug, committed on purpose.
      expect(s.offset + s.duration).toBeGreaterThan(LEAD_SILENCE + SPEECH);
      // And the silence that used to sit at the join is not being played through.
      expect(s.duration).toBeLessThan(LEAD_SILENCE + SPEECH + TAIL_SILENCE);
    }
    act(() => result.current.stop());
  });
});
