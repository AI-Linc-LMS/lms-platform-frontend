/**
 * The join between two narration chunks.
 *
 * Read aloud used to be two big audio files per article; since the page started following
 * the voice it is about fifteen, cut at block boundaries. The learner then reported words
 * going missing "when there is a sentence or paragraph change" - at the joins. Measuring
 * the real production audio (three mp3s from /api/tts, decoded and compared sample by
 * sample against a single-file render of the same words) showed that no sound is actually
 * lost: the two-file split contains 170ms MORE speech than the one-file render of the same
 * text. What the split adds is silence, and a lot of it:
 *
 *   - Each mp3 begins with the encoder's delay and ends with its padding. OpenAI's mp3
 *     carries no Xing/Info/LAME gapless header at all, so no decoder anywhere can trim
 *     them: measured in Chromium, 50ms of silence before the first word of one file and
 *     135ms after the last word of the one before it.
 *   - The next <audio> element did not exist until the previous one's `ended` fired, so
 *     its load and decode happened inside the gap: another ~190ms.
 *
 * 373ms, measured, at every paragraph. For comparison, the synthesiser's own pause between
 * those same two sentences inside a single file is 45ms. Eight times the natural beat, at
 * a moment when the highlight has already moved on to the next paragraph, is heard as the
 * voice having skipped it.
 *
 * So the fix is not to make the files bigger again - that would give back the exact
 * follow-along the small files bought. It is to stop handing audio to a media element at
 * all: decode each chunk, trim the silence the container added, and schedule the buffers
 * on one AudioContext at sample-accurate times. The gap between two blocks then stops
 * being an accident of decode latency and becomes a number chosen here.
 *
 * Rendered offline and measured sample by sample on that same production audio, the join
 * between those two paragraphs comes out at:
 *
 *      one mp3, as the synthesiser made it          45ms  (its own sentence pause)
 *      two mp3s with a PERFECT element handoff     185ms  (the floor an element can reach)
 *      two mp3s as they play in Chromium today     373ms
 *      two mp3s through this module                120ms
 *
 * and the trim stops 26ms AFTER the last audible sample of one chunk and starts 25ms
 * BEFORE the first audible sample of the next, so no word is touched.
 */

/** The beat between two blocks. The synthesiser's own sentence pause measured 45ms; a
 *  paragraph deserves a little more than a sentence, and the 20ms of pad kept at each end
 *  of a chunk brings the join to about 120ms. Unlike the 373ms it replaces it is the same
 *  every time, which is what makes it read as punctuation rather than as a fault. */
export const BLOCK_PAUSE = 0.08;

/** How far in front of the playhead chunks are scheduled. Enough that a slow synthesis has
 *  time to land, small enough that the queue is not the whole article at once. */
export const SCHEDULE_AHEAD = 2.0;

/** A little runway before the first sample, so scheduling cannot land in the past. */
export const START_LEAD = 0.08;

/** -60 dBFS: a thousandth of full scale. Nothing above this is ever removed, which is
 *  what makes the trim safe; nothing below it has ever been heard by anybody. Measured
 *  against the production audio, this is also the line that actually catches the mp3's
 *  padding - a floor of -65 left 110ms of decoder decay behind and the join came out
 *  LONGER than doing nothing at all. */
const SILENCE_FLOOR = 10 ** (-60 / 20);
/** 5ms windows: one stray sample of decoder ringing must not count as speech. */
const WINDOW_SECONDS = 0.005;
/** Kept either side of the speech, so a quiet first consonant survives the trim. */
const EDGE_PAD = 0.02;
/** However quiet a chunk looks, never cut more than this from an end. A real leading
 *  silence is tens of milliseconds; anything larger means the detector is wrong, and the
 *  safe answer to being wrong is to play the audio as it came. */
const MAX_EDGE_TRIM = 0.6;

export type AudibleRange = {
  /** Seconds into the buffer at which to start playing. */
  offset: number;
  /** Seconds to play. */
  duration: number;
};

/**
 * Where the sound in a decoded chunk actually starts and stops.
 *
 * Only inaudible samples are removed, and never more than MAX_EDGE_TRIM of them, so this
 * cannot clip a word - which is the whole point, because clipping words at the join is the
 * defect being fixed and a careless trim would reintroduce it for real.
 */
export function audibleRange(data: Float32Array, sampleRate: number): AudibleRange {
  const total = data.length / sampleRate;
  if (!Number.isFinite(total) || total <= 0) return { offset: 0, duration: 0 };

  const win = Math.max(1, Math.round(WINDOW_SECONDS * sampleRate));
  const loud = (i: number) => {
    let sum = 0;
    const end = Math.min(i + win, data.length);
    for (let k = i; k < end; k += 1) sum += data[k] * data[k];
    return Math.sqrt(sum / (end - i)) > SILENCE_FLOOR;
  };

  let first = 0;
  while (first < data.length && !loud(first)) first += win;
  if (first >= data.length) return { offset: 0, duration: total }; // silent chunk: leave it alone

  let last = data.length - win;
  while (last > first && !loud(last)) last -= win;

  const head = Math.min(first / sampleRate, MAX_EDGE_TRIM);
  const tail = Math.min(total - Math.min(total, (last + win) / sampleRate), MAX_EDGE_TRIM);
  const offset = Math.max(0, head - EDGE_PAD);
  const duration = Math.max(0, total - offset - Math.max(0, tail - EDGE_PAD));
  return { offset, duration };
}

/** One scheduled chunk: the blocks it covers and the window of context time it owns. */
export type ScheduledChunk<T> = { chunk: T; startAt: number; endAt: number };

/**
 * The chunk being spoken at context time `t`: the last one whose start has passed.
 *
 * During the BLOCK_PAUSE between two chunks this keeps the one that just finished rather
 * than jumping early - the old element chain highlighted the next block before its audio
 * had loaded, which is precisely the moment the learner described as words being skipped.
 */
export function scheduledAt<T>(schedule: Array<ScheduledChunk<T>>, t: number): ScheduledChunk<T> | null {
  let found: ScheduledChunk<T> | null = null;
  for (const entry of schedule) {
    if (t < entry.startAt) break;
    found = entry;
  }
  return found;
}
