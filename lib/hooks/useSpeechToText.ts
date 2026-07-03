"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { registerMediaStream } from "@/lib/utils/media-stream-registry";
import { blobToWav } from "@/lib/utils/audio-to-wav";
import { detectBrowser, detectPlatform } from "@/lib/utils/browser-detect";
import { getAudioConstraints } from "@/lib/utils/audio-constraints";

const WHISPER_CHUNK_MS = 2000;
const TRANSCRIBE_API = "/api/transcribe";
const MAX_BROWSER_STT_RETRIES = 5;
const BROWSER_STT_RETRY_DELAYS_MS = [500, 1000, 2000, 3000, 4000];
const EDGE_TIP_RETRY_THRESHOLD = 2;
const MAC_TIP_RETRY_THRESHOLD = 2;
// Whisper transient-error policy: tolerate this many consecutive non-fatal
// failures (502 gateway / 503 upstream busy / 429 rate-limited / network)
// before permanently disabling Whisper for the rest of the session. A single
// 502 used to kill Whisper outright; this lets brief OpenAI hiccups recover.
const WHISPER_MAX_CONSECUTIVE_FAILURES = 8;
// HTTP statuses that should be treated as permanent (don't retry).
const WHISPER_FATAL_STATUSES = new Set<number>([401, 403]);
// Threshold (0-1 normalized RMS) below which we consider a chunk silent and skip
// sending it to Whisper. Whisper otherwise hallucinates phrases like
// "Thanks for watching" / "subscribe" / "mic testing" on quiet audio.
const WHISPER_MIN_RMS = 0.012;
// TTS-bleed guard: a FINAL transcript that completes within this window after unpausing
// (interviewer just stopped speaking) can only be the tail of the interviewer's own voice —
// a human answer can't be spoken AND finalized that fast. The recognizer is now kept ALIVE
// through the interviewer's turn (see the paused effect), so this is what keeps the last
// TTS words from leaking into the candidate's answer.
const UNPAUSE_FINAL_GUARD_MS = 400;
// Lower-cased patterns that match Whisper's silent-audio hallucinations. These
// regularly appear when the speaker pauses; we drop chunks that match.
const WHISPER_HALLUCINATION_PATTERNS: RegExp[] = [
  /^thanks?(\s+(you|so much))?(\s+for\s+watching)?\.?$/i,
  /^thank\s+you(\s+so\s+much)?(\s+for\s+watching)?\.?$/i,
  /^thanks\s+for\s+watching!?$/i,
  /please\s+(subscribe|like\s+(and\s+)?subscribe)/i,
  /(don'?t\s+forget\s+to\s+(like|subscribe))/i,
  /(subscribe\s+to\s+(my|the)\s+channel)/i,
  /^(mic\s+(testing|check))(\s+\d+(\s+\d+)*)?\.?$/i,
  /^(testing\s+\d+(\s+\d+)*)\.?$/i,
  /^(?:\d+\s+){3,}\d+\.?$/, // bare counts like "1 2 3 4 5 6 ..."
  /^(bye+\.?|good\s*bye\.?|see\s+you\s+(soon|later)\.?)$/i,
  /^you\.?$/i,
  /^\.+$/,
  /^♪+$/,
  /^\[?\s*(music|applause|silence|inaudible|background\s+noise)\s*\]?\.?$/i,
];

interface SpeechRecognitionInstance {
  start: () => void;
  stop: () => void;
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((event: SpeechRecognitionResultEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
  onstart: (() => void) | null;
}

interface SpeechRecognitionResultEvent {
  resultIndex: number;
  results: {
    length: number;
    [index: number]: {
      length: number;
      isFinal: boolean;
      [index: number]: { transcript: string };
    };
  };
}

interface SpeechRecognitionErrorEvent {
  error: string;
}

/** True if a Whisper transcription is a known silent-audio hallucination. */
function isWhisperHallucination(text: string): boolean {
  const trimmed = text.trim();
  if (!trimmed) return true;
  // Very short outputs (<= 2 chars) are noise.
  if (trimmed.replace(/[\W_]+/g, "").length < 3) return true;
  return WHISPER_HALLUCINATION_PATTERNS.some((re) => re.test(trimmed));
}

/** Peak WINDOWED RMS energy (0-1) of an audio blob via WebAudio decoding.
 *
 * Deliberately the max RMS over ~250ms windows, NOT the whole-chunk mean: a single word in the
 * tail of a 2s chunk (the candidate starting to answer mid-rotation) averages out to near-silence
 * over the full chunk and used to fail the VAD gate — silently dropping the opening words of the
 * answer. The windowed peak keeps the gate's anti-hallucination value while passing onset chunks. */
async function computeAudioEnergy(blob: Blob): Promise<number> {
  if (typeof window === "undefined") return 1;
  const AudioCtx =
    (window as typeof window & { webkitAudioContext?: typeof AudioContext })
      .AudioContext ??
    (window as typeof window & { webkitAudioContext?: typeof AudioContext })
      .webkitAudioContext;
  if (!AudioCtx) return 1;
  try {
    const arrayBuffer = await blob.arrayBuffer();
    const ctx = new AudioCtx();
    try {
      const buf = await ctx.decodeAudioData(arrayBuffer.slice(0));
      const ch = buf.getChannelData(0);
      const windowSize = Math.max(1, Math.floor(buf.sampleRate * 0.25));
      // Sample at most ~4000 evenly spaced points across the whole chunk for speed.
      const step = Math.max(1, Math.floor(ch.length / 4000));
      let peak = 0;
      for (let start = 0; start < ch.length; start += windowSize) {
        const end = Math.min(start + windowSize, ch.length);
        let sumSquares = 0;
        let count = 0;
        for (let i = start; i < end; i += step) {
          sumSquares += ch[i] * ch[i];
          count++;
        }
        if (count > 0) peak = Math.max(peak, Math.sqrt(sumSquares / count));
      }
      return peak;
    } finally {
      try {
        await ctx.close();
      } catch {}
    }
  } catch {
    // Decoding failed (codec mismatch etc.) — fall through; don't drop the chunk.
    return 1;
  }
}

export interface UseSpeechToTextOptions {
  onFinal?: (text: string) => void;
  onInterim?: (text: string) => void;
  lang?: string;
  continuous?: boolean;
  preferWhisper?: boolean;
  paused?: boolean;
  /**
   * Force a specific STT engine instead of auto-deciding. The take page sets this from the
   * device-check result so the interview uses the EXACT engine that passed the mic test
   * rather than re-deciding (which is why a test could pass but the interview fail). The key
   * case: Edge, where native SpeechRecognition exists but is broken — device-check finds
   * Whisper works, so we force "whisper" and skip the broken native path (and its ~10s of
   * failing retries) entirely.
   */
  forcedEngine?: "browser" | "whisper";
}

export type SttMode = "browser" | "whisper-only" | "unavailable";

export interface UseSpeechToTextReturn {
  start: () => void;
  stop: () => void;
  transcript: string;
  isListening: boolean;
  error: string | null;
  /** Tip message shown to user (e.g. Edge online-speech setting). Cleared on success. */
  tip: string | null;
  /** Current effective STT mode after errors/fallbacks. */
  mode: SttMode;
  /** True after browser STT has exhausted retries. UI should switch to typing fallback. */
  needsTypingFallback: boolean;
}

export function useSpeechToText(
  options: UseSpeechToTextOptions = {}
): UseSpeechToTextReturn {
  const {
    onFinal,
    onInterim,
    lang = "en-US",
    continuous = true,
    preferWhisper = true,
    paused = false,
    forcedEngine,
  } = options;

  const [transcript, setTranscript] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tip, setTip] = useState<string | null>(null);
  const [mode, setMode] = useState<SttMode>("browser");
  const [needsTypingFallback, setNeedsTypingFallback] = useState(false);

  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const wantsListeningRef = useRef(false);
  const startedRef = useRef(false);
  const whisperFailedRef = useRef(false);
  // True once Whisper has been PROMOTED to the active transcriber — i.e. browser STT either
  // isn't available (Safari/Firefox) or has exhausted its retry budget. Whisper is "on hold"
  // until this flips to true, which avoids burning OpenAI quota on every working Chrome
  // session. Once active, the watchdog keeps Whisper alive the same way it used to.
  const whisperActiveRef = useRef(false);
  const pausedRef = useRef(paused);
  const onFinalRef = useRef(onFinal);
  const onInterimRef = useRef(onInterim);
  const browserSttDisabledRef = useRef(false);
  const consecutiveErrorsRef = useRef(0);
  const retryTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSuccessfulResultAtRef = useRef<number>(0);
  const lastErrorTypeRef = useRef<string | null>(null);
  const whisperConsecutiveFailuresRef = useRef(0);
  // Guard so a watchdog tick and a natural rotation don't both spin up a
  // second MediaRecorder while ensureWhisperRunning is mid-acquisition.
  const whisperStartingRef = useRef(false);
  // Liveness of the native recognizer, maintained in onstart/onend. The hand-rolled
  // SpeechRecognition has no real `.state`, so this — plus result-freshness — is how the
  // watchdog tells a live recognizer from one that has silently died/wedged.
  const recognitionRunningRef = useRef(false);
  // When we last flipped paused -> unpaused; drives the TTS-bleed final guard in onresult.
  const unpausedAtRef = useRef(0);
  // The native recognizer reported a mic-permission denial (it fires not-allowed even while
  // the browser's permission PROMPT is still open). Drives the permission-specific message
  // and the Permissions-API recovery below.
  const permissionDeniedRef = useRef(false);
  // Live PermissionStatus we subscribed to (cleared on unmount).
  const permissionWatchRef = useRef<PermissionStatus | null>(null);

  useEffect(() => {
    onFinalRef.current = onFinal;
    onInterimRef.current = onInterim;
    pausedRef.current = paused;
  });

  const clearRetryTimeout = useCallback(() => {
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
      retryTimeoutRef.current = null;
    }
  }, []);

  /** Whisper is permanently gone for this session. If it was the ACTIVE transcriber (browser
   *  STT already disabled), the mic affordance must not stay lit with nobody transcribing —
   *  surface the typing fallback so the candidate isn't stuck talking to a dead pipeline. */
  const markWhisperDead = useCallback(() => {
    whisperFailedRef.current = true;
    if (whisperActiveRef.current && browserSttDisabledRef.current) {
      setIsListening(false);
      setMode("unavailable");
      setNeedsTypingFallback(true);
      setError(
        permissionDeniedRef.current
          ? "Microphone access is blocked. Allow the mic in your browser and speech will resume automatically — or type your answer."
          : "Voice transcription is unavailable — please type your answer."
      );
    }
  }, []);

  const sendChunkToWhisper = useCallback(async (blob: Blob, recordedWhilePaused: boolean) => {
    // Gate on whether the chunk STARTED while paused (interviewer speaking), not on the pause
    // state at send time: a chunk that began while the candidate was answering and got cut off
    // by the interviewer starting to speak still carries the END of their answer — dropping it
    // at send time (the old behavior) lost those last words.
    if (recordedWhilePaused || whisperFailedRef.current || blob.size < 1000) return;
    // Voice-activity gate: skip silent/quiet chunks so Whisper doesn't hallucinate.
    const energy = await computeAudioEnergy(blob);
    if (energy < WHISPER_MIN_RMS) return;
    let file: Blob = blob;
    let filename = "chunk.webm";
    if (blob.type.includes("mp4") || blob.type.includes("m4a")) filename = "chunk.m4a";
    try {
      const wavBlob = await blobToWav(blob);
      if (wavBlob.size > 0) {
        file = wavBlob;
        filename = "chunk.wav";
      }
    } catch {}
    const form = new FormData();
    form.append("file", file, filename);
    const langCode = lang.slice(0, 2);
    if (langCode) form.append("language", langCode);
    try {
      const res = await fetch(TRANSCRIBE_API, { method: "POST", body: form });
      if (!res.ok) {
        // 401 / 403 → auth or config error — permanent.
        if (WHISPER_FATAL_STATUSES.has(res.status)) {
          markWhisperDead();
          return;
        }
        // Everything else (400 bad chunk, 429 rate limit, 502/503 upstream
        // hiccup, 5xx) is treated as transient. Disable only after many
        // consecutive failures so brief outages don't kill the whole session.
        whisperConsecutiveFailuresRef.current += 1;
        if (whisperConsecutiveFailuresRef.current >= WHISPER_MAX_CONSECUTIVE_FAILURES) {
          markWhisperDead();
        }
        return;
      }
      const data = (await res.json()) as { text?: string };
      const text = typeof data?.text === "string" ? data.text.trim() : "";
      // Any 2xx response counts as a healthy round-trip — reset the failure counter.
      whisperConsecutiveFailuresRef.current = 0;
      // Reject empty results and known Whisper silent-audio hallucinations.
      if (!text || isWhisperHallucination(text)) return;
      // Real speech made it through — clear any stale error (e.g. the permission scare from
      // a not-allowed fired while the browser's permission prompt was still open).
      setError(null);
      setIsListening(true);
      setTranscript((prev) => (prev ? `${prev} ${text}` : text));
      onFinalRef.current?.(text);
    } catch {
      // Network error or aborted — count as transient.
      whisperConsecutiveFailuresRef.current += 1;
      if (whisperConsecutiveFailuresRef.current >= WHISPER_MAX_CONSECUTIVE_FAILURES) {
        markWhisperDead();
      }
    }
  }, [lang, markWhisperDead]);

  const tryStartRecognition = useCallback((rec: SpeechRecognitionInstance) => {
    try {
      rec.start();
    } catch {
      // start() throws if already started — safe to ignore
    }
  }, []);

  const scheduleRetry = useCallback(() => {
    if (browserSttDisabledRef.current || !wantsListeningRef.current) return;
    const attempt = consecutiveErrorsRef.current;
    if (attempt > MAX_BROWSER_STT_RETRIES) {
      // Browser STT exhausted retries. Promote Whisper to active transcriber if allowed,
      // otherwise drop to typing fallback. This is the main "Edge gives `network` repeatedly,
      // so switch to OpenAI's Whisper" path — exactly the case the user asked us to handle.
      browserSttDisabledRef.current = true;
      const wasNetwork = lastErrorTypeRef.current === "network";

      if (preferWhisper && !whisperFailedRef.current) {
        whisperActiveRef.current = true;
        setMode("whisper-only");
        setIsListening(true); // Whisper is the active transcriber now — keep the "Listening" affordance lit.
        // Kick Whisper on in the background. The recorder will start producing chunks
        // every WHISPER_CHUNK_MS and pipe transcripts through the same onFinal callback.
        void startWhisperRecording();
        // No UI error — Whisper is taking over silently. The user keeps talking.
        return;
      }

      // Whisper isn't an option (disabled or already failed) — surface the typing fallback.
      setNeedsTypingFallback(true);
      setMode("unavailable");
      setError(
        wasNetwork
          ? "Speech recognition needs internet. Check your connection and type your answer."
          : "Speech recognition unavailable — please type your answer."
      );
      return;
    }
    const delay = BROWSER_STT_RETRY_DELAYS_MS[Math.min(attempt - 1, BROWSER_STT_RETRY_DELAYS_MS.length - 1)];
    clearRetryTimeout();
    retryTimeoutRef.current = setTimeout(() => {
      const rec = recognitionRef.current;
      // No paused gate: restarts run even during interviewer TTS so the engine stays warm
      // (results are suppressed in onresult while paused).
      if (!rec || !wantsListeningRef.current) return;
      tryStartRecognition(rec);
    }, delay);
    // `startWhisperRecording` is referenced in the body above but defined LATER in this
    // component scope. JS closures resolve names at call time, so it works at runtime
    // (matches the existing `attachRecorder` ↔ `ensureWhisperRunning` pattern in this file).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clearRetryTimeout, tryStartRecognition, preferWhisper]);

  const startBrowserStt = useCallback(() => {
    if (typeof window === "undefined") return;
    if (browserSttDisabledRef.current) return;
    const Win = window as Window & {
      SpeechRecognition?: new () => SpeechRecognitionInstance;
      webkitSpeechRecognition?: new () => SpeechRecognitionInstance;
    };
    const SpeechRecognition = Win.SpeechRecognition ?? Win.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      // No browser STT — rely on Whisper if available.
      browserSttDisabledRef.current = true;
      setMode(preferWhisper ? "whisper-only" : "unavailable");
      if (!preferWhisper) {
        setError("Speech recognition is not supported in this browser. Please type your answer.");
        setNeedsTypingFallback(true);
      }
      return;
    }
    // NOTE: whisperFailedRef is deliberately NOT reset here — only start() resets it. This
    // used to re-enable a fatally-failed Whisper endpoint on every per-turn resume, hiding
    // real outages behind an endless retry loop.
    wantsListeningRef.current = true;
    const rec = new SpeechRecognition();
    rec.continuous = continuous;
    rec.interimResults = true;
    rec.lang = lang;
    rec.onstart = () => {
      recognitionRunningRef.current = true;
      lastSuccessfulResultAtRef.current = Date.now();
    };
    rec.onresult = (event: SpeechRecognitionResultEvent) => {
      // Got a result → the ENGINE is healthy, whatever the pause state (during interviewer TTS
      // the recognizer stays alive and hears the interviewer). Stamp liveness BEFORE the paused
      // gate so the watchdog doesn't judge a warm-but-suppressed recognizer "deaf" and churn it.
      consecutiveErrorsRef.current = 0;
      lastErrorTypeRef.current = null;
      lastSuccessfulResultAtRef.current = Date.now();
      // Suppress transcripts while the interviewer speaks — the recognizer is kept warm purely
      // so the candidate's first words after the question aren't lost to a cold start.
      if (pausedRef.current) return;
      // TTS-bleed guard: a final that completes this soon after unpausing is the tail of the
      // interviewer's own voice still in the recognizer's buffer, not the candidate.
      if (Date.now() - unpausedAtRef.current < UNPAUSE_FINAL_GUARD_MS) return;
      if (error) setError(null);
      if (tip) setTip(null);
      let interim = "";
      let final = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const t = event.results[i][0].transcript;
        if (event.results[i].isFinal) final += t + " ";
        else interim += t;
      }
      const combined = final || interim;
      if (combined) {
        onInterimRef.current?.(combined);
        // Browser STT is the PRIMARY transcriber now — accept its final transcript
        // unconditionally. Whisper runs as a fallback only after browser STT exhausts its
        // retry budget, so the two never both emit finals for the same speech window.
        if (final) {
          setTranscript((prev) => (prev ? `${prev} ${final.trim()}` : final.trim()));
          onFinalRef.current?.(final.trim());
        }
      }
    };
    rec.onerror = (e: SpeechRecognitionErrorEvent) => {
      const errType = e.error;
      // Permission errors: the native recognizer fires not-allowed even while the browser's
      // permission PROMPT is still open (first visit), so this must NOT be treated as a
      // terminal "denied forever". Three-part handling:
      //  1. cascade to Whisper — its getUserMedia is the REAL permission test: if the user
      //     granted (or grants a second later), capture starts and the interview just works;
      //  2. watch the Permissions API — the moment mic permission flips to granted, browser
      //     STT is restored automatically and any error clears (the old code left a sticky
      //     "Microphone access denied" on screen even after the user clicked Allow);
      //  3. only if Whisper's own mic acquisition fails too (a genuine hard denial) does
      //     markWhisperDead surface the typing fallback with a permission-specific message.
      if (errType === "not-allowed" || errType === "service-not-allowed") {
        permissionDeniedRef.current = true;
        browserSttDisabledRef.current = true;
        armPermissionRecovery();
        if (preferWhisper && !whisperFailedRef.current) {
          whisperActiveRef.current = true;
          setMode("whisper-only");
          void startWhisperRecording();
          return;
        }
        setIsListening(false);
        setNeedsTypingFallback(true);
        setMode("unavailable");
        setError("Microphone access denied. Please allow microphone permission and try again.");
        return;
      }
      // Silent / transient — Web Speech auto-stops on silence and fires these constantly.
      // Don't bump the error counter (these aren't real failures) but DO ensure we come back:
      // onend normally restarts us, but if a browser fires onerror WITHOUT a following onend
      // (or onend refuses), a short one-shot restart keeps us listening. Uses a fixed 400ms
      // delay (NOT scheduleRetry), so silence never consumes the retry budget or wrongly
      // promotes to Whisper/typing.
      if (errType === "no-speech" || errType === "aborted") {
        // Restart even while paused — the recognizer must stay WARM through the interviewer's
        // TTS so the candidate's first words after the question land in a live engine (results
        // are suppressed by the pausedRef gate in onresult, so nothing leaks).
        if (!retryTimeoutRef.current && wantsListeningRef.current && !browserSttDisabledRef.current) {
          retryTimeoutRef.current = setTimeout(() => {
            retryTimeoutRef.current = null;
            const r = recognitionRef.current;
            if (!r || !wantsListeningRef.current || browserSttDisabledRef.current) return;
            tryStartRecognition(r);
          }, 400);
        }
        return;
      }
      // network / audio-capture / language-not-supported / generic →
      // keep listening enabled and retry with backoff. Only surface the
      // "needs internet" message once retries are exhausted (handled in
      // scheduleRetry → MAX_BROWSER_STT_RETRIES branch).
      // Whisper keeps running independently, so the user can still answer.
      lastErrorTypeRef.current = errType;
      // network, audio-capture, language-not-supported, generic etc. → retry with backoff.
      consecutiveErrorsRef.current += 1;
      const browser = detectBrowser();
      const platform = detectPlatform();
      if (
        browser === "edge" &&
        platform === "windows" &&
        consecutiveErrorsRef.current >= EDGE_TIP_RETRY_THRESHOLD &&
        !tip
      ) {
        setTip(
          "If speech isn't recognized in Edge: open Windows Settings → Privacy & Security → Speech and turn on Online speech recognition, then reload."
        );
      } else if (
        browser === "edge" &&
        platform === "mac" &&
        consecutiveErrorsRef.current >= MAC_TIP_RETRY_THRESHOLD &&
        !tip
      ) {
        setTip(
          "If speech isn't recognized in Edge on macOS, allow microphone access in System Settings -> Privacy & Security -> Microphone and reload. If it still fails, continue and type answers."
        );
      } else if (
        platform === "mac" &&
        (browser === "chrome" || browser === "safari" || browser === "other") &&
        consecutiveErrorsRef.current >= MAC_TIP_RETRY_THRESHOLD &&
        !tip
      ) {
        setTip(
          "If speech isn't recognized on macOS, confirm microphone permission for your browser in System Settings -> Privacy & Security -> Microphone. You can continue the interview and type answers if needed."
        );
      }
      // Whisper keeps running independently — do NOT terminate the wrapper here.
      scheduleRetry();
    };
    rec.onend = () => {
      recognitionRunningRef.current = false;
      // Restart even while paused (interviewer speaking) — keeping the recognizer warm through
      // TTS is the fix for losing the candidate's opening words to a cold start; transcripts
      // are suppressed via the pausedRef gate in onresult.
      if (!wantsListeningRef.current || browserSttDisabledRef.current) return;
      // Normal "session ended due to silence" path → restart promptly.
      if (consecutiveErrorsRef.current === 0) {
        tryStartRecognition(rec);
      } else if (!retryTimeoutRef.current) {
        // Counter is nonzero but no backoff timer is pending (e.g. a no-speech/aborted
        // early-returned after a prior transient error left the counter > 0). Don't strand
        // recognition dead — arm a retry instead of doing nothing.
        scheduleRetry();
      }
      // else: a scheduleRetry backoff is already pending and will call rec.start().
    };
    recognitionRef.current = rec;
    try {
      rec.start();
      setIsListening(true);
      setError(null);
    } catch {
      wantsListeningRef.current = false;
      setError("Could not start microphone. Allow microphone permission and try again.");
    }
    // `armPermissionRecovery`/`startWhisperRecording` are referenced in onerror above but
    // defined LATER in this scope; closures resolve at call time (established pattern here).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [continuous, lang, preferWhisper, scheduleRetry, tryStartRecognition, error, tip]);

  /** Subscribe (once) to the mic PermissionStatus so a user who grants permission AFTER the
   *  recognizer already fired `not-allowed` (the prompt was still open, or they fixed it via
   *  the address bar) gets speech back automatically — no reload, no stale "access denied". */
  const armPermissionRecovery = useCallback(() => {
    if (permissionWatchRef.current || typeof navigator === "undefined") return;
    try {
      navigator.permissions
        ?.query({ name: "microphone" as PermissionName })
        .then((status) => {
          permissionWatchRef.current = status;
          status.onchange = () => {
            if (status.state !== "granted" || !startedRef.current) return;
            permissionDeniedRef.current = false;
            // Browser STT is the primary engine again — demote the denial-cascade Whisper
            // so the two never emit duplicate finals for the same speech.
            whisperActiveRef.current = false;
            const recorder = mediaRecorderRef.current;
            if (recorder && recorder.state !== "inactive") {
              try {
                recorder.stop();
              } catch {}
              mediaRecorderRef.current = null;
            }
            browserSttDisabledRef.current = false;
            consecutiveErrorsRef.current = 0;
            setNeedsTypingFallback(false);
            setError(null);
            setMode("browser");
            startBrowserStt();
          };
        })
        .catch(() => {});
    } catch {
      // Permissions API unavailable (older Safari) — the Whisper cascade still covers recovery.
    }
  }, [startBrowserStt]);

  const pickWhisperMimeType = useCallback((): string => {
    if (MediaRecorder.isTypeSupported("audio/webm;codecs=opus")) return "audio/webm;codecs=opus";
    if (MediaRecorder.isTypeSupported("audio/webm")) return "audio/webm";
    if (MediaRecorder.isTypeSupported("audio/mp4")) return "audio/mp4";
    return "";
  }, []);

  const streamIsAlive = useCallback((stream: MediaStream | null): boolean => {
    if (!stream) return false;
    const tracks = stream.getAudioTracks();
    return tracks.length > 0 && tracks.some((t) => t.readyState === "live" && t.enabled);
  }, []);

  /**
   * Build a new MediaRecorder on the given stream and wire rotating-recorder
   * semantics: each recording lasts WHISPER_CHUNK_MS, then stops and produces
   * a complete self-contained file (with full codec header), and a fresh
   * recorder is started for the next chunk. This is required because
   * MediaRecorder's chunked output (`start(timeslice)`) only puts the header
   * in the *first* chunk — every subsequent chunk is headerless and OpenAI
   * rejects them with "Invalid file format".
   */
  const attachRecorder = useCallback(
    (stream: MediaStream) => {
      const mimeType = pickWhisperMimeType();
      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : {});
      mediaRecorderRef.current = recorder;
      // Pause state when THIS recording began — decides whether the assembled chunk is
      // candidate speech (send) or interviewer-TTS-era audio (drop). See sendChunkToWhisper.
      const recordedWhilePaused = pausedRef.current;
      // Buffer the (typically single) data event for this recording session.
      const buffered: Blob[] = [];
      let rotationTimeout: ReturnType<typeof setTimeout> | null = null;

      const clearRotation = () => {
        if (rotationTimeout) {
          clearTimeout(rotationTimeout);
          rotationTimeout = null;
        }
      };

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) buffered.push(e.data);
      };

      recorder.onstop = () => {
        clearRotation();
        // Assemble the complete recording into one blob with valid header,
        // then send it to Whisper.
        if (buffered.length > 0) {
          const type = recorder.mimeType || mimeType || "audio/webm";
          const completeBlob = new Blob(buffered, { type });
          buffered.length = 0;
          void sendChunkToWhisper(completeBlob, recordedWhilePaused);
        }
        // Start the next rotation if we still want recording.
        if (!startedRef.current || pausedRef.current) return;
        if (mediaRecorderRef.current !== recorder) return; // superseded
        const live = streamIsAlive(streamRef.current);
        if (!live) {
          void ensureWhisperRunning();
          return;
        }
        // Defer to the next tick to let the recorder fully release.
        setTimeout(() => {
          if (!startedRef.current || pausedRef.current) return;
          if (mediaRecorderRef.current !== recorder) return;
          // Build a fresh recorder for the next chunk.
          mediaRecorderRef.current = null;
          void ensureWhisperRunning();
        }, 0);
      };

      recorder.onerror = () => {
        clearRotation();
        if (!startedRef.current || pausedRef.current) return;
        void ensureWhisperRunning();
      };

      try {
        // Start WITHOUT a timeslice — we want the data delivered at stop time
        // as a complete recording (header + frames).
        recorder.start();
        // Stop after WHISPER_CHUNK_MS so the next rotation can begin.
        rotationTimeout = setTimeout(() => {
          if (mediaRecorderRef.current !== recorder) return;
          try {
            if (recorder.state !== "inactive") recorder.stop();
          } catch {}
        }, WHISPER_CHUNK_MS);
      } catch {
        clearRotation();
        // Couldn't start — try a fresh stream/recorder once.
        void ensureWhisperRunning();
      }
    },
    [pickWhisperMimeType, sendChunkToWhisper, streamIsAlive]
    // ensureWhisperRunning intentionally omitted: it is hoisted via closure.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  );

  /**
   * Make sure a Whisper MediaRecorder is actively recording. Idempotent: if a
   * recorder is already running, no-op. Re-acquires the mic stream if its
   * tracks have ended. Safe to call repeatedly from watchdog or error paths.
   */
  const ensureWhisperRunning = useCallback(async () => {
    if (!preferWhisper) return;
    if (!startedRef.current || pausedRef.current) return;
    if (whisperFailedRef.current) return;
    // Race guard — only one in-flight start at a time.
    if (whisperStartingRef.current) return;

    const existing = mediaRecorderRef.current;
    if (existing && existing.state === "recording" && streamIsAlive(streamRef.current)) {
      return; // Already healthy.
    }

    whisperStartingRef.current = true;
    try {
      // Tear down any half-dead recorder.
      if (existing) {
        try {
          if (existing.state !== "inactive") existing.stop();
        } catch {}
        mediaRecorderRef.current = null;
      }

      // Re-acquire the stream if it's dead.
      if (!streamIsAlive(streamRef.current)) {
        if (streamRef.current) {
          try {
            streamRef.current.getTracks().forEach((t) => t.stop());
          } catch {}
          streamRef.current = null;
        }
        try {
          const stream = await navigator.mediaDevices.getUserMedia({
            audio: getAudioConstraints(),
          });
          if (!startedRef.current || pausedRef.current) {
            stream.getTracks().forEach((t) => t.stop());
            return;
          }
          streamRef.current = stream;
          registerMediaStream(stream);
        } catch {
          // Can't get mic — give up on Whisper (browser STT may still work). If Whisper was
          // the only transcriber, this also surfaces the typing fallback.
          markWhisperDead();
          return;
        }
      }

      const stream = streamRef.current;
      if (!stream) return;
      attachRecorder(stream);
    } finally {
      whisperStartingRef.current = false;
    }
  }, [preferWhisper, streamIsAlive, attachRecorder, markWhisperDead]);

  // Public start hook for Whisper. Idempotent.
  const startWhisperRecording = useCallback(async () => {
    await ensureWhisperRunning();
  }, [ensureWhisperRunning]);

  const stopBrowserStt = useCallback(() => {
    wantsListeningRef.current = false;
    clearRetryTimeout();
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {}
      recognitionRef.current = null;
    }
    const recorder = mediaRecorderRef.current;
    if (recorder && recorder.state !== "inactive") {
      try {
        recorder.stop();
      } catch {}
      mediaRecorderRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setIsListening(false);
  }, [clearRetryTimeout]);

  const start = useCallback(() => {
    startedRef.current = true;
    setTranscript("");
    setError(null);
    setTip(null);
    setMode("browser");
    setNeedsTypingFallback(false);
    browserSttDisabledRef.current = false;
    consecutiveErrorsRef.current = 0;
    lastErrorTypeRef.current = null;
    whisperFailedRef.current = false;
    whisperConsecutiveFailuresRef.current = 0;
    whisperActiveRef.current = false;
    permissionDeniedRef.current = false;
    if (pausedRef.current) return;

    // Honor the engine the device-check page proved works in THIS browser, so the interview
    // never diverges from the mic test. "whisper" → go straight to Whisper, skipping the
    // (possibly broken, e.g. on Edge) native SpeechRecognition and its ~10s of failing
    // retries. "browser" falls through to the normal browser-first path below (with Whisper
    // still available as the after-retries safety net).
    if (forcedEngine === "whisper" && preferWhisper) {
      browserSttDisabledRef.current = true;
      whisperActiveRef.current = true;
      setMode("whisper-only");
      setIsListening(true); // Whisper-only mode — light the "Listening" affordance so it's truthful.
      startWhisperRecording();
      return;
    }

    // Browser STT is the primary path; Whisper stays on hold and only takes over if
    // browser STT is unsupported (Safari/Firefox) or fails permanently (Edge `network`
    // bug, exhausted retries, etc.). This keeps OpenAI cost at zero for the common case
    // while preserving the fallback for browsers that need it.
    const Win = typeof window !== "undefined"
      ? (window as Window & {
          SpeechRecognition?: new () => SpeechRecognitionInstance;
          webkitSpeechRecognition?: new () => SpeechRecognitionInstance;
        })
      : null;
    const hasBrowserStt = !!(Win?.SpeechRecognition ?? Win?.webkitSpeechRecognition);

    if (hasBrowserStt) {
      startBrowserStt();
      // Whisper deliberately NOT started here. It is promoted later by `scheduleRetry`
      // (after MAX_BROWSER_STT_RETRIES) or by the explicit no-support branch below.
      return;
    }

    if (preferWhisper) {
      // No native STT in this browser — promote Whisper to active transcriber immediately.
      browserSttDisabledRef.current = true;
      whisperActiveRef.current = true;
      setMode("whisper-only");
      setIsListening(true); // Whisper-only mode — light the "Listening" affordance so it's truthful.
      startWhisperRecording();
      return;
    }

    // No browser STT and Whisper not allowed — the user must type their answer.
    browserSttDisabledRef.current = true;
    setMode("unavailable");
    setError("Speech recognition is not supported in this browser. Please type your answer.");
    setNeedsTypingFallback(true);
  }, [startBrowserStt, startWhisperRecording, preferWhisper, forcedEngine]);

  const stop = useCallback(() => {
    startedRef.current = false;
    stopBrowserStt();
  }, [stopBrowserStt]);

  useEffect(() => {
    pausedRef.current = paused;
    if (!startedRef.current) return;
    if (paused) {
      // Keep the browser recognizer ALIVE through the interviewer's TTS. Tearing it down here
      // and cold-starting on resume (the old behavior) opened a ~300-800ms dead window at the
      // exact moment candidates start answering — the "it doesn't recognize my voice as soon
      // as I start speaking" bug. Transcripts are suppressed by the pausedRef gate in onresult,
      // and the UNPAUSE_FINAL_GUARD drops the interviewer-voice tail after resume.
      // Only the Whisper recorder stops (each chunk costs a transcription call, and its
      // MediaRecorder re-arms instantly on resume — it has no cold-start problem).
      const recorder = mediaRecorderRef.current;
      if (recorder && recorder.state !== "inactive") {
        try {
          recorder.stop();
        } catch {}
        mediaRecorderRef.current = null;
      }
      return;
    }
    // Resume — the interviewer stopped speaking, the candidate may start instantly.
    unpausedAtRef.current = Date.now();
    // Defer to avoid running setState within the effect body.
    let cancelled = false;
    const timer = setTimeout(() => {
      if (cancelled || pausedRef.current) return;
      // The recognizer usually survived the pause (kept warm above) — only build a new one if
      // it's genuinely not running (e.g. the browser killed it and every restart path missed).
      if (!browserSttDisabledRef.current && !recognitionRunningRef.current) {
        const rec = recognitionRef.current;
        if (rec) tryStartRecognition(rec);
        else startBrowserStt();
      }
      // Whisper only resumes when it's the active fallback. If browser STT is still
      // healthy, Whisper stays idle and the avatar's TTS-driven pause doesn't trigger
      // an unnecessary Whisper start.
      if (whisperActiveRef.current && !whisperFailedRef.current) {
        void ensureWhisperRunning();
      }
    }, 0);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [paused, preferWhisper, startBrowserStt, ensureWhisperRunning, clearRetryTimeout, tryStartRecognition]);

  // Watchdog: if continuous mode and recognition silently dies, restart it.
  // Also keeps Whisper alive — MediaRecorder can be killed by the browser
  // (fullscreen focus shifts, codec drops, tab throttling) without firing
  // a visible error, so we re-check every 2s and restart if needed.
  useEffect(() => {
    if (!continuous || !startedRef.current) return;
    const id = setInterval(() => {
      // Runs even while paused: the recognizer is deliberately kept warm through interviewer
      // TTS, so the watchdog must keep maintaining it there too. (Whisper stays pause-gated —
      // ensureWhisperRunning itself refuses to start while paused.)
      // Browser STT — the hand-rolled SpeechRecognition has no real `.state`, so detect a
      // dead-or-deaf recognizer from our onstart/onend liveness flag + result-freshness.
      // Skip while a scheduleRetry backoff is pending so the watchdog never fights it.
      if (!browserSttDisabledRef.current && recognitionRef.current && wantsListeningRef.current && !retryTimeoutRef.current) {
        const stale = Date.now() - lastSuccessfulResultAtRef.current > 8000; // running but deaf >8s
        if (recognitionRunningRef.current && stale) {
          // Running but silently deaf — stop() forces a clean onend → restart cycle.
          try { recognitionRef.current.stop(); } catch {}
        } else if (!recognitionRunningRef.current) {
          // Not running and nothing scheduled to restart it — the watchdog IS the recovery,
          // so clear the error counter and restart directly.
          consecutiveErrorsRef.current = 0;
          tryStartRecognition(recognitionRef.current);
        }
      }
      // Whisper — only if it's been PROMOTED to active fallback. Whisper stays on hold
      // when browser STT is healthy, so the watchdog doesn't spin it up speculatively.
      if (whisperActiveRef.current && !whisperFailedRef.current) {
        const rec = mediaRecorderRef.current;
        const streamLive = streamIsAlive(streamRef.current);
        if (!rec || rec.state !== "recording" || !streamLive) {
          void ensureWhisperRunning();
        }
      }
    }, 2000);
    return () => clearInterval(id);
  }, [continuous, isListening, tryStartRecognition, preferWhisper, ensureWhisperRunning, streamIsAlive]);

  useEffect(() => {
    return () => {
      clearRetryTimeout();
      if (permissionWatchRef.current) {
        permissionWatchRef.current.onchange = null;
        permissionWatchRef.current = null;
      }
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {}
        recognitionRef.current = null;
      }
      const rec = mediaRecorderRef.current;
      if (rec && rec.state !== "inactive") {
        try {
          rec.stop();
        } catch {}
        mediaRecorderRef.current = null;
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
    };
  }, [clearRetryTimeout]);

  return {
    start,
    stop,
    transcript,
    isListening,
    error,
    tip,
    mode,
    needsTypingFallback,
  };
}
