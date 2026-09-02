"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Narrates an adaptive article in the professional OpenAI "onyx" voice (the same
 * voice the mock interview uses, via /api/tts) instead of the robotic browser
 * speechSynthesis. The article is chunked (the route caps input at 4000 chars)
 * and played gaplessly by prefetching the next chunk while the current one plays.
 * Falls back to speechSynthesis if cloud TTS is unavailable (503), so narration
 * never hard-fails.
 *
 * TWO reported defects lived here, and both came from the same shape of mistake -
 * a single mutable slot standing in for something there can be more than one of.
 *
 * 1. MULTIPLE VOICES THAT NOTHING COULD STOP. Cancellation was one shared boolean
 *    that `start()` reset at its own entry, so a later start UN-cancelled every
 *    earlier run still suspended in an await. The audio handle was a single slot
 *    too, so the second run overwrote the first and `stop()` could no longer reach
 *    it - the orphan played to the end of its chunk (up to 3500 characters, minutes
 *    of speech) with no way out but a page refresh. Cancellation is now a monotonic
 *    run id that only `stop()` advances, every live audio element is tracked in a
 *    Set, and the in-flight fetch is abortable.
 *
 * 2. CODE WAS DELETED RATHER THAN READ. `htmlToText` removed every `<code>` node,
 *    which matches inline code in prose as well as block code. "the `for` loop uses
 *    `range()`" narrated as "the loop uses", so the learner heard a broken sentence
 *    rather than a gap. Block and inline code need opposite treatment, and the
 *    source HTML already distinguishes them: block code is always `<pre data-lang>`.
 */

type TtsError = Error & { status?: number };

/** Symbols a learner needs to HEAR, applied before the generic punctuation pass below
 *  (which would otherwise consume the "." in `self.` and make that rule unreachable). */
const CODE_SPEECH: Array<[RegExp, string]> = [
  [/->/g, " arrow "],
  [/<=/g, " less than or equal to "],
  [/>=/g, " greater than or equal to "],
  [/!==?/g, " not equals "],
  [/===?/g, " equals "],
];

/** Turn one inline code node into something speakable: `range()` -> "range",
 *  `snake_case` -> "snake case", `arr.length` -> "arr dot length". */
function speakInlineCode(raw: string): string {
  const t = raw.trim();
  if (!t) return " ";
  // A long or multi-line "inline" node is really a block in disguise - announce it.
  if (t.length > 60 || t.includes("\n")) return " a code snippet shown on screen ";
  let s = t.replace(/\(\s*\)$/, "");
  for (const [re, word] of CODE_SPEECH) s = s.replace(re, word);
  s = s.replace(/_/g, " ");
  s = s.replace(/([a-z0-9])([A-Z])/g, "$1 $2");
  s = s.replace(/([A-Za-z_)\]])\.([A-Za-z_])/g, "$1 dot $2");
  s = s.replace(/\//g, " slash ");
  return ` ${s} `;
}

/** Exported for tests: what the learner actually hears, given the article HTML. */
export function htmlToText(html: string): string {
  if (typeof window === "undefined" || !html) return "";
  const tmp = document.createElement("div");
  tmp.innerHTML = html;

  // Block code: ANNOUNCE it, never read it. A 30-line <pre> spoken character by
  // character is unlistenable and desynchronises the narration from the screen.
  // Must run before the inline pass below, so that pass can only match true inline
  // nodes. `data-lang` is guaranteed by the generation prompt.
  tmp.querySelectorAll("pre").forEach((pre) => {
    const codeEl = pre.querySelector("code");
    const lang = (pre.getAttribute("data-lang") || codeEl?.getAttribute("data-lang") || "").trim();
    const lines = (pre.textContent || "").trim().split("\n").filter(Boolean).length;
    pre.replaceWith(document.createTextNode(
      ` Here is ${lang ? `a ${lang}` : "a"} code example, ${lines} line${lines === 1 ? "" : "s"}, shown on screen. `,
    ));
  });

  // Inline code carries meaning mid-sentence, so it has to be read, not dropped.
  tmp.querySelectorAll("code").forEach((c) => {
    c.replaceWith(document.createTextNode(speakInlineCode(c.textContent || "")));
  });

  // Images carry no text; the caption beside them is prose the learner should hear.
  tmp.querySelectorAll("figure > img, figure > picture, svg").forEach((el) => el.remove());

  // textContent concatenates without regard for block boundaries, so "<h2>Loops</h2><p>A loop"
  // came out as "LoopsA loop" and was narrated as one run-on word. Separate the blocks.
  tmp.querySelectorAll("h1, h2, h3, h4, h5, h6, p, li, div, br, tr, blockquote, section")
    .forEach((el) => el.after(document.createTextNode(" ")));

  return (tmp.textContent || "")
    .replace(/\s+/g, " ")
    // The spaces padding a spoken code node must not leave a gap before punctuation:
    // "O(n) , where" reads with an audible stumble.
    .replace(/\s+([,.;:!?])/g, "$1")
    .trim();
}

/** Split into synthesis chunks. The FIRST chunk is deliberately short: the learner
 *  waits for it in silence, and a 3500-character first chunk is what made Read aloud
 *  feel like it had not responded (which is what got it clicked again). Exported for tests. */
export function chunkText(text: string, first = 400, rest = 3500): string[] {
  const sentences = text.match(/[^.!?]+[.!?]+(?:\s|$)|[^.!?]+$/g) || [text];
  const chunks: string[] = [];
  let cur = "";
  const max = () => (chunks.length === 0 ? first : rest);
  for (const s of sentences) {
    if ((cur + s).length > max()) {
      if (cur.trim()) chunks.push(cur.trim());
      if (s.length > max()) {
        const size = max();
        for (let i = 0; i < s.length; i += size) chunks.push(s.slice(i, i + size).trim());
        cur = "";
      } else {
        cur = s;
      }
    } else {
      cur += s;
    }
  }
  if (cur.trim()) chunks.push(cur.trim());
  return chunks.filter(Boolean);
}

async function fetchChunkUrl(text: string, signal: AbortSignal): Promise<string> {
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
  return URL.createObjectURL(await res.blob());
}

const isAbort = (e: unknown) => (e as Error | undefined)?.name === "AbortError";

/** The browser fallback in ~200-char utterances rather than one giant one: Chrome
 *  silently truncates a long utterance after about 15 seconds. speechSynthesis
 *  queues them itself, and cancel() still clears the whole queue. */
function browserUtterances(text: string): string[] {
  return chunkText(text, 200, 200);
}

export function useArticleNarration(html: string) {
  const [playing, setPlaying] = useState(false);
  const [loading, setLoading] = useState(false);
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
  /** "A run is alive", tracked outside React state so a click landing inside the
   *  async gap is never misread by a stale render. */
  const activeRef = useRef(false);

  const audios = () => (liveAudioRef.current ??= new Set());
  const urls = () => (liveUrlsRef.current ??= new Set());

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
    urls().forEach((u) => URL.revokeObjectURL(u));
    urls().clear();
    resolveRef.current?.();
    resolveRef.current = null;
    if (typeof window !== "undefined") window.speechSynthesis?.cancel();
    setPlaying(false);
    setLoading(false);
  }, []);

  const playWithBrowser = useCallback((text: string) => {
    if (typeof window === "undefined" || !window.speechSynthesis) {
      activeRef.current = false;
      setPlaying(false);
      setLoading(false);
      return;
    }
    window.speechSynthesis.cancel();
    const parts = browserUtterances(text);
    parts.forEach((part, i) => {
      const u = new SpeechSynthesisUtterance(part);
      u.rate = 0.97;
      u.pitch = 1.0;
      if (i === parts.length - 1) {
        u.onend = () => {
          activeRef.current = false;
          setPlaying(false);
        };
      }
      u.onerror = () => {
        activeRef.current = false;
        setPlaying(false);
      };
      window.speechSynthesis.speak(u);
    });
    setPlaying(true);
    setLoading(false);
  }, []);

  const start = useCallback(async () => {
    const text = htmlToText(html);
    if (!text) return;
    const chunks = chunkText(text);

    stop(); // idempotent hard kill of anything still alive, and it bumps the run id
    const myRun = runIdRef.current; // captured AFTER the bump, so a later start invalidates us
    const stale = () => runIdRef.current !== myRun;
    activeRef.current = true;
    const ac = new AbortController();
    abortRef.current = ac;

    // `playing` stays false until sound actually starts. It used to be set here, so the
    // button read "Stop" over total silence for the whole synthesis wait - the lie that
    // made learners click again and provoke the race.
    setLoading(true);

    const fetchChunk = (t: string) => {
      const p = fetchChunkUrl(t, ac.signal);
      // Attach a catch at creation: a prefetch we later abandon must not surface as an
      // unhandled rejection when stop() aborts it.
      p.then((u) => urls().add(u)).catch(() => {});
      return p;
    };

    // Resolve the first chunk up front so a 503 (cloud TTS off) trips the
    // browser fallback before we commit to the cloud path.
    let nextUrl: Promise<string>;
    try {
      nextUrl = fetchChunk(chunks[0]);
      await nextUrl;
    } catch (e) {
      if (stale() || isAbort(e)) return; // a stop, not a failure - do NOT start the browser voice
      playWithBrowser(text); // 503 / network - fall back to browser voice
      return;
    }

    for (let i = 0; i < chunks.length; i += 1) {
      if (stale()) return;
      // nextUrl was prefetched during the previous chunk's playback.
      const url = await nextUrl.catch(() => "");
      if (stale()) return;
      if (!url) {
        playWithBrowser(chunks.slice(i).join(" "));
        return;
      }
      // Kick off the next chunk's fetch now, so it loads while this one plays.
      if (i + 1 < chunks.length) nextUrl = fetchChunk(chunks[i + 1]);
      setLoading(false);
      setPlaying(true);
      await new Promise<void>((resolve) => {
        resolveRef.current = resolve;
        const audio = new Audio(url);
        audios().add(audio);
        const done = () => {
          URL.revokeObjectURL(url);
          urls().delete(url);
          audios().delete(audio);
          resolveRef.current = null;
          resolve();
        };
        audio.onended = done;
        audio.onerror = done;
        audio.play().catch(done);
      });
      if (stale()) return;
    }
    if (!stale()) {
      // Terminal path: clear activeRef too, or the next click would be read as a stop
      // and the button would look dead.
      activeRef.current = false;
      setPlaying(false);
      setLoading(false);
    }
  }, [html, playWithBrowser, stop]);

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

  return { playing, loading, toggle, stop };
}
