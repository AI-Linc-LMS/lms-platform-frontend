"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  chunkSegments,
  chunkText,
  chunkBlockAt,
  htmlToText,
  type NarrationSegment,
  type SpeechChunk,
} from "@/lib/utils/article-speech";
import {
  audibleRange,
  scheduledAt,
  BLOCK_PAUSE,
  SCHEDULE_AHEAD,
  START_LEAD,
  type ScheduledChunk,
} from "@/lib/utils/narration-player";

/**
 * Narrates an adaptive article in the professional OpenAI "onyx" voice (the same
 * voice the mock interview uses, via /api/tts) instead of the robotic browser
 * speechSynthesis. The article is chunked and played gaplessly by prefetching the
 * chunks ahead of the one playing. Falls back to speechSynthesis if cloud TTS is
 * unavailable (503), so narration never hard-fails.
 *
 * THREE reported defects have lived here. The first two came from the same shape of
 * mistake - a single mutable slot standing in for something there can be more than one
 * of - and the third from there being no relation at all between the audio and the page.
 *
 * 1. MULTIPLE VOICES THAT NOTHING COULD STOP. Cancellation was one shared boolean
 *    that `start()` reset at its own entry, so a later start UN-cancelled every
 *    earlier run still suspended in an await. The audio handle was a single slot
 *    too, so the second run overwrote the first and `stop()` could no longer reach
 *    it - the orphan played to the end of its chunk (up to 3500 characters, minutes
 *    of speech) with no way out but a page refresh. Cancellation is now a monotonic
 *    run id that only `stop()` advances, every live audio element is tracked in a
 *    Set, and the in-flight fetches are abortable.
 *
 * 2. CODE WAS DELETED RATHER THAN READ. `htmlToText` removed every `<code>` node,
 *    which matches inline code in prose as well as block code. "the `for` loop uses
 *    `range()`" narrated as "the loop uses", so the learner heard a broken sentence
 *    rather than a gap. Block and inline code need opposite treatment, and the
 *    source HTML already distinguishes them: block code is always `<pre data-lang>`.
 *
 * 3. THE PAGE DID NOT FOLLOW THE VOICE. The article was flattened into one string and
 *    cut into 3500-character chunks, so one chunk was minutes of speech with nothing to
 *    point at - the learner scrolled by hand to keep up. The mp3 the route returns has
 *    no timing marks, so the fix is NOT to guess where the voice is inside a long file:
 *    it is to make the file short enough that its boundaries are the answer. Chunks are
 *    cut at block boundaries (lib/utils/article-speech.ts) and a chunk holding one block
 *    is exact by construction. `activeId` names the block being spoken; useNarrationFollow
 *    turns that into a highlight and a scroll the learner can take back at any time.
 *
 * 4. THE JOINS BETWEEN THOSE SHORT FILES WERE HEARD AS MISSING WORDS. Fifteen files a page
 *    instead of two put a file boundary at almost every paragraph, and the boundary cost
 *    373 measured milliseconds of silence: the mp3's own untrimmable encoder delay and
 *    padding, plus the load and decode of an <audio> element that was not constructed
 *    until the previous one's `ended` had already fired. Audio is no longer handed to a
 *    media element at all where Web Audio exists - each chunk is decoded, its container
 *    silence trimmed, and the buffers scheduled back to back on one AudioContext
 *    (lib/utils/narration-player.ts). The highlight is driven from that same schedule, so
 *    it is now exact rather than a beat early.
 */

type TtsError = Error & { status?: number };

export { htmlToText, chunkText };
export type { NarrationSegment };

/** How many chunks are fetched ahead of the one playing. A chunk is now a paragraph
 *  rather than a page, so one chunk of lead time is no longer enough to cover a slow
 *  synthesis - a two-word heading is about a second of audio. Three keeps the queue
 *  ahead of the voice without putting a burst of requests on the route. */
const LOOKAHEAD = 3;

async function fetchChunk(text: string, signal: AbortSignal): Promise<Response> {
  const res = await fetch("/api/tts", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text }),
    signal,
  });
  if (!res.ok) {
    const err: TtsError = new Error(`tts ${res.status}`);
    err.status = res.status;
    throw err;
  }
  return res;
}

/** Exactly the same requests, in exactly the same number, whichever way they are played:
 *  the two paths differ only in what they do with the bytes that come back. */
async function fetchChunkUrl(text: string, signal: AbortSignal): Promise<string> {
  return URL.createObjectURL(await (await fetchChunk(text, signal)).blob());
}

async function fetchChunkBytes(text: string, signal: AbortSignal): Promise<ArrayBuffer> {
  return (await fetchChunk(text, signal)).arrayBuffer();
}

/** Safari still only has the prefixed constructor. Absent entirely under jsdom, which is
 *  why the element path below is the one the unit tests exercise. */
function audioContextCtor(): typeof AudioContext | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as {
    AudioContext?: typeof AudioContext;
    webkitAudioContext?: typeof AudioContext;
  };
  return w.AudioContext ?? w.webkitAudioContext ?? null;
}

const isAbort = (e: unknown) => (e as Error | undefined)?.name === "AbortError";

type Utterance = { id: string; text: string };

/** The browser fallback in ~200-char utterances rather than one giant one: Chrome
 *  silently truncates a long utterance after about 15 seconds. speechSynthesis
 *  queues them itself, and cancel() still clears the whole queue. Each utterance
 *  remembers the block it came from, so the fallback follows along too - and from an
 *  OBSERVED start (`onstart`) rather than an apportioned one. */
function browserUtterances(chunks: SpeechChunk[]): Utterance[] {
  const out: Utterance[] = [];
  for (const chunk of chunks) {
    if (!chunk.parts.length) {
      for (const piece of chunkText(chunk.text, 200, 200)) out.push({ id: "", text: piece });
      continue;
    }
    for (const part of chunk.parts) {
      for (const piece of chunkText(part.text, 200, 200)) out.push({ id: part.id, text: piece });
    }
  }
  return out;
}

export function useArticleNarration(html: string, segments?: NarrationSegment[]) {
  const [playing, setPlaying] = useState(false);
  const [loading, setLoading] = useState(false);
  /** The block being spoken right now, or null. The page follows this. */
  const [activeId, setActiveId] = useState<string | null>(null);
  /** Monotonic cancellation token. ONLY stop() advances it, so an earlier run can
   *  never be resurrected by a later start() the way a shared boolean allowed. */
  const runIdRef = useRef(0);
  /** Every audio element currently alive. A single slot could not be used to stop an
   *  orphan, which is what made the doubled voice unstoppable. */
  const liveAudioRef = useRef<Set<HTMLAudioElement> | null>(null);
  /** Object URLs not yet revoked, so a stop mid-playback does not leak the article's mp3. */
  const liveUrlsRef = useRef<Set<string> | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const resolveRef = useRef<(() => void) | null>(null);
  /** One context for the life of the page. Created inside the click that asks for
   *  narration - Safari refuses to let one started later make a sound. */
  const ctxRef = useRef<AudioContext | null>(null);
  /** Every buffer already handed to the audio thread. Scheduling runs ahead of the
   *  playhead, so a stop has to reach sounds that have not started yet. */
  const sourcesRef = useRef<Set<AudioBufferSourceNode> | null>(null);
  /** The timer the scheduling loop is parked on, and the one driving the highlight. */
  const waitTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const followTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  /** "A run is alive", tracked outside React state so a click landing inside the
   *  async gap is never misread by a stale render. */
  const activeRef = useRef(false);
  const audios = () => (liveAudioRef.current ??= new Set());
  const urls = () => (liveUrlsRef.current ??= new Set());
  const sources = () => (sourcesRef.current ??= new Set());

  const stop = useCallback(() => {
    runIdRef.current += 1; // invalidates EVERY in-flight run, including suspended ones
    activeRef.current = false;
    abortRef.current?.abort();
    abortRef.current = null;
    audios().forEach((a) => {
      a.pause();
      a.src = "";
    });
    audios().clear();
    sources().forEach((s) => {
      s.onended = null;
      try {
        s.stop();
      } catch {
        // already finished; nothing scheduled to cancel
      }
    });
    sources().clear();
    if (waitTimerRef.current) clearTimeout(waitTimerRef.current);
    waitTimerRef.current = null;
    if (followTimerRef.current) clearInterval(followTimerRef.current);
    followTimerRef.current = null;
    urls().forEach((u) => URL.revokeObjectURL(u));
    urls().clear();
    resolveRef.current?.();
    resolveRef.current = null;
    if (typeof window !== "undefined") window.speechSynthesis?.cancel();
    setPlaying(false);
    setLoading(false);
    setActiveId(null);
  }, []);

  const playWithBrowser = useCallback((parts: Utterance[]) => {
    if (typeof window === "undefined" || !window.speechSynthesis || !parts.length) {
      activeRef.current = false;
      setPlaying(false);
      setLoading(false);
      return;
    }
    window.speechSynthesis.cancel();
    parts.forEach((part, i) => {
      const u = new SpeechSynthesisUtterance(part.text);
      u.rate = 0.97;
      u.pitch = 1.0;
      // speechSynthesis DOES report position, so use it rather than an estimate.
      if (part.id) u.onstart = () => setActiveId(part.id);
      if (i === parts.length - 1) {
        u.onend = () => {
          activeRef.current = false;
          setPlaying(false);
          setActiveId(null);
        };
      }
      u.onerror = () => {
        activeRef.current = false;
        setPlaying(false);
        setActiveId(null);
      };
      window.speechSynthesis.speak(u);
    });
    setPlaying(true);
    setLoading(false);
  }, []);

  const start = useCallback(async () => {
    // `segments` is a dependency rather than a ref: the body reports its blocks from an
    // effect, so a callback that had baked in an earlier value would narrate the previous
    // article's layout. Rebuilding this callback when they change is the cheap, correct
    // way to stay current.
    const segs = segments;
    // Blocks are what makes following along possible. Without them (nothing has reported
    // the rendered body yet) narration still works exactly as it did before - it simply
    // cannot say where it is, which is better than pointing at the wrong paragraph.
    const chunks: SpeechChunk[] = segs?.length
      ? chunkSegments(segs)
      : chunkText(htmlToText(html)).map((t) => ({ text: t, parts: [] }));
    if (!chunks.length) return;

    stop(); // idempotent hard kill of anything still alive, and it bumps the run id
    const myRun = runIdRef.current; // captured AFTER the bump, so a later start invalidates us
    const stale = () => runIdRef.current !== myRun;
    activeRef.current = true;
    const ac = new AbortController();
    abortRef.current = ac;

    // Built here, BEFORE the first await, because everything up to it is still running
    // inside the click that asked for narration. Safari will not let a context created
    // after that point produce a sound, and there is no way to ask for the gesture back.
    const Ctor = audioContextCtor();
    let ctx: AudioContext | null = null;
    if (Ctor) {
      try {
        ctx = ctxRef.current ??= new Ctor();
        if (ctx.state === "suspended") void ctx.resume();
      } catch {
        ctx = null; // no Web Audio here; the element chain below still works
      }
    }

    // `playing` stays false until sound actually starts. It used to be set here, so the
    // button read "Stop" over total silence for the whole synthesis wait - the lie that
    // made learners click again and provoke the race.
    setLoading(true);

    const sounding = () => {
      setLoading(false);
      setPlaying(true);
    };
    const finished = () => {
      if (stale()) return;
      // Terminal path: clear activeRef too, or the next click would be read as a stop
      // and the button would look dead.
      activeRef.current = false;
      setPlaying(false);
      setLoading(false);
      setActiveId(null);
    };
    /** Park until `when` on the context clock, or until a stop releases us. */
    const waitUntil = (context: AudioContext, when: number) =>
      new Promise<void>((resolve) => {
        resolveRef.current = resolve;
        const tick = () => {
          const left = when - context.currentTime;
          if (stale() || left <= 0) {
            resolveRef.current = null;
            resolve();
            return;
          }
          waitTimerRef.current = setTimeout(tick, Math.min(200, Math.max(16, left * 1000)));
        };
        tick();
      });

    if (ctx) {
      const context = ctx;
      const decoded: Array<Promise<AudioBuffer> | null> = new Array(chunks.length).fill(null);
      const ensure = (i: number) => {
        if (i >= chunks.length || decoded[i]) return;
        const p = fetchChunkBytes(chunks[i].text, ac.signal).then((bytes) => context.decodeAudioData(bytes));
        // Attach a catch at creation: a prefetch we later abandon must not surface as an
        // unhandled rejection when stop() aborts it.
        p.catch(() => {});
        decoded[i] = p;
      };

      // Resolve the first chunk up front so a 503 (cloud TTS off) trips the
      // browser fallback before we commit to the cloud path.
      for (let k = 0; k <= LOOKAHEAD; k += 1) ensure(k);
      try {
        await decoded[0];
      } catch (e) {
        if (stale() || isAbort(e)) return; // a stop, not a failure - do NOT start the browser voice
        ac.abort(); // the lookahead fetches will fail the same way; do not leave them running
        playWithBrowser(browserUtterances(chunks));
        return;
      }

      // ONE loop drives the highlight, off the same clock the audio is scheduled against,
      // so where the page says the voice is and where it is are the same number. The
      // element chain could only ever highlight the next block BEFORE its audio had
      // loaded, which is the beat the learner heard as a skipped paragraph.
      const schedule: Array<ScheduledChunk<SpeechChunk>> = [];
      let shown: string | null = null;
      followTimerRef.current = setInterval(() => {
        if (stale()) return;
        const entry = scheduledAt(schedule, context.currentTime);
        if (!entry || !entry.chunk.parts.length) return;
        const span = Math.max(0.001, entry.endAt - entry.startAt);
        const id = chunkBlockAt(entry.chunk, (context.currentTime - entry.startAt) / span);
        if (id && id !== shown) {
          shown = id;
          setActiveId(id);
        }
      }, 60);

      let cursor = 0;
      for (let i = 0; i < chunks.length; i += 1) {
        if (stale()) return;
        // Keep the queue topped up: the next LOOKAHEAD chunks load while this one plays.
        for (let k = i; k <= i + LOOKAHEAD; k += 1) ensure(k);
        const buffer = await decoded[i]!.catch(() => null);
        if (stale()) return;
        if (!buffer) {
          // One chunk failed to synthesise. Let what is already scheduled finish, then
          // hand the REST to the browser voice rather than dropping it silently.
          ac.abort();
          await waitUntil(context, cursor);
          if (stale()) return;
          playWithBrowser(browserUtterances(chunks.slice(i)));
          return;
        }

        // Only the inaudible edges come off - the container's encoder delay and padding,
        // which no decoder can trim for us because the route's mp3 carries no gapless
        // header. What is left is every sample of speech the synthesiser produced.
        const { offset, duration } = audibleRange(buffer.getChannelData(0), buffer.sampleRate);
        if (duration <= 0) continue;

        const startAt = Math.max(cursor, context.currentTime + START_LEAD);
        const source = context.createBufferSource();
        source.buffer = buffer;
        source.connect(context.destination);
        source.onended = () => sources().delete(source);
        sources().add(source);
        source.start(startAt, offset, duration);
        schedule.push({ chunk: chunks[i], startAt, endAt: startAt + duration });
        sounding();

        // The join is this line: the next block begins one fixed beat after this one ends,
        // decided here rather than falling out of how long an element took to load.
        cursor = startAt + duration + BLOCK_PAUSE;
        await waitUntil(context, cursor - SCHEDULE_AHEAD);
      }
      await waitUntil(context, cursor);
      finished();
      return;
    }

    // No Web Audio (jsdom, and any browser old enough to lack it): the element chain, but
    // with the next element CONSTRUCTED AND BUFFERED while the current one plays rather
    // than inside its `ended` handler. That alone took the measured join from 373ms to
    // 192ms; the rest is silence inside the files, which only decoding can remove.
    const pending: Array<Promise<string> | null> = new Array(chunks.length).fill(null);
    const elements: Array<HTMLAudioElement | null> = new Array(chunks.length).fill(null);
    const prepare = (i: number) => {
      const p = pending[i];
      if (!p || elements[i]) return;
      p.then((url) => {
        if (stale() || !url || elements[i]) return;
        const audio = new Audio(url);
        audio.preload = "auto";
        audio.load?.();
        elements[i] = audio;
        audios().add(audio);
      }).catch(() => {});
    };
    const ensure = (i: number) => {
      if (i >= chunks.length || pending[i]) return;
      const p = fetchChunkUrl(chunks[i].text, ac.signal);
      p.then((u) => urls().add(u)).catch(() => {});
      pending[i] = p;
      prepare(i);
    };

    for (let k = 0; k <= LOOKAHEAD; k += 1) ensure(k);
    try {
      await pending[0];
    } catch (e) {
      if (stale() || isAbort(e)) return;
      ac.abort();
      playWithBrowser(browserUtterances(chunks));
      return;
    }

    for (let i = 0; i < chunks.length; i += 1) {
      if (stale()) return;
      for (let k = i; k <= i + LOOKAHEAD; k += 1) ensure(k);
      const url = await pending[i]!.catch(() => "");
      if (stale()) return;
      if (!url) {
        ac.abort();
        playWithBrowser(browserUtterances(chunks.slice(i)));
        return;
      }
      sounding();
      const chunk = chunks[i];
      if (chunk.parts.length) setActiveId(chunk.parts[0].id);
      await new Promise<void>((resolve) => {
        resolveRef.current = resolve;
        const audio = elements[i] ?? new Audio(url);
        elements[i] = audio;
        audios().add(audio);
        // `currentTime` is the ONLY position information an mp3 gives. A one-block chunk
        // ignores it entirely - the block IS the file - and only a group of short blocks
        // apportions the measured duration between them.
        let shown = chunk.parts.length ? chunk.parts[0].id : "";
        const onTime = () => {
          if (chunk.parts.length < 2) return;
          const d = audio.duration;
          if (!Number.isFinite(d) || d <= 0) return;
          const id = chunkBlockAt(chunk, audio.currentTime / d);
          if (id && id !== shown) {
            shown = id;
            setActiveId(id);
          }
        };
        const done = () => {
          audio.ontimeupdate = null;
          URL.revokeObjectURL(url);
          urls().delete(url);
          audios().delete(audio);
          resolveRef.current = null;
          resolve();
        };
        // Assigned as a property, like onended/onerror beside it: an Audio element in a
        // test is a stub, and reaching for addEventListener here would make this hook
        // untestable without one.
        audio.ontimeupdate = onTime;
        audio.onended = done;
        audio.onerror = done;
        audio.play().catch(done);
      });
      if (stale()) return;
    }
    finished();
  }, [html, segments, playWithBrowser, stop]);

  // Reads the ref rather than render state, so a click during the synthesis wait stops
  // the run instead of starting a second one. Deliberately NOT paired with a disabled
  // button: stopping is the learner's only escape from a slow synthesis.
  const toggle = useCallback(() => {
    if (activeRef.current) stop();
    else void start();
  }, [start, stop]);

  // Stop when the article body changes (e.g. tier switch) and on unmount. This used to
  // also reset the shared cancel flag, which resurrected the previous article's run.
  useEffect(() => stop, [html, stop]);

  // The context outlives individual runs - it is reused so the next Read aloud does not
  // have to build one outside a gesture - so only leaving the page closes it.
  useEffect(
    () => () => {
      ctxRef.current?.close().catch(() => {});
      ctxRef.current = null;
    },
    [],
  );

  return { playing, loading, activeId, toggle, stop };
}
