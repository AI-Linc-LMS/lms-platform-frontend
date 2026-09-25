/**
 * Trimming the silence a container added, without ever trimming a word.
 *
 * This is the risky half of the fix: the reported defect is words going missing at a
 * chunk boundary, and a careless trim would cause exactly that for real. So the rule the
 * code follows - only remove what is below -65 dBFS, keep a pad, and never remove more
 * than 600ms - is pinned here.
 */

import { describe, expect, it } from "vitest";
import { audibleRange, scheduledAt, BLOCK_PAUSE } from "./narration-player";

const SR = 24000;

/** silence, then a tone, then silence - the shape every mp3 from the route has. */
function shaped(lead: number, speech: number, tail: number, amp = 0.5): Float32Array {
  const n = Math.round((lead + speech + tail) * SR);
  const data = new Float32Array(n);
  const from = Math.round(lead * SR);
  const to = Math.round((lead + speech) * SR);
  for (let i = from; i < to; i += 1) data[i] = amp * Math.sin((2 * Math.PI * 220 * i) / SR);
  return data;
}

describe("what comes off the ends of a chunk", () => {
  it("removes the container's lead-in and padding", () => {
    // 50ms lead and 135ms tail are the numbers measured in the production mp3s.
    const { offset, duration } = audibleRange(shaped(0.05, 1.0, 0.135), SR);
    expect(offset).toBeGreaterThan(0.02);
    expect(offset).toBeLessThan(0.05);
    expect(duration).toBeLessThan(1.0 + 0.05 + 0.135);
  });

  it("never starts after the first word or stops before the last one", () => {
    for (const [lead, speech, tail] of [
      [0.05, 1.0, 0.135],
      [0.0, 0.4, 0.0],
      [0.3, 0.2, 0.3],
      [0.02, 3.0, 0.9],
    ] as const) {
      const { offset, duration } = audibleRange(shaped(lead, speech, tail), SR);
      expect(offset, `lead ${lead}`).toBeLessThanOrEqual(lead);
      expect(offset + duration, `tail ${tail}`).toBeGreaterThanOrEqual(lead + speech);
    }
  });

  it("keeps a pad, so a quiet first consonant is not shaved off", () => {
    const { offset } = audibleRange(shaped(0.05, 1.0, 0.1), SR);
    expect(0.05 - offset).toBeGreaterThanOrEqual(0.01);
  });

  it("refuses to cut more than 600ms from an end, however quiet it looks", () => {
    const { offset, duration } = audibleRange(shaped(4.0, 0.5, 4.0), SR);
    expect(offset).toBeLessThanOrEqual(0.6);
    expect(8.5 - (offset + duration)).toBeLessThanOrEqual(0.6);
  });

  it("leaves a chunk that is all silence exactly as it is", () => {
    // Reducing it to nothing would drop it from the schedule and take its block's
    // highlight with it.
    const { offset, duration } = audibleRange(new Float32Array(SR), SR);
    expect(offset).toBe(0);
    expect(duration).toBeCloseTo(1, 5);
  });

  it("says nothing about an empty buffer rather than producing a negative duration", () => {
    expect(audibleRange(new Float32Array(0), SR)).toEqual({ offset: 0, duration: 0 });
  });
});

describe("which block the page should be showing", () => {
  const schedule = [
    { chunk: "first", startAt: 0, endAt: 1 },
    { chunk: "second", startAt: 1 + BLOCK_PAUSE, endAt: 2 + BLOCK_PAUSE },
  ];

  it("holds the block that just finished through the pause, instead of jumping early", () => {
    // The element chain set the next block active, scrolled to it, and only THEN started
    // loading its audio - so the page sat on a paragraph in silence. That is the moment
    // the learner described as the voice skipping it.
    expect(scheduledAt(schedule, 1.05)?.chunk).toBe("first");
    expect(scheduledAt(schedule, 1 + BLOCK_PAUSE + 0.001)?.chunk).toBe("second");
  });

  it("shows nothing before the first sound", () => {
    expect(scheduledAt(schedule, -0.5)).toBeNull();
  });

  it("stays on the last block after the audio has run out", () => {
    expect(scheduledAt(schedule, 99)?.chunk).toBe("second");
  });
});
