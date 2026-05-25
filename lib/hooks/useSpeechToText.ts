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
  state: string;
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

/** Compute peak RMS energy (0-1) of an audio blob via WebAudio decoding. */
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
      let sumSquares = 0;
      // Sample at most 4000 evenly spaced points for speed
      const step = Math.max(1, Math.floor(ch.length / 4000));
      let count = 0;
      for (let i = 0; i < ch.length; i += step) {
        sumSquares += ch[i] * ch[i];
        count++;
      }
      return count > 0 ? Math.sqrt(sumSquares / count) : 0;
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

  const sendChunkToWhisper = useCallback(async (blob: Blob) => {
    if (pausedRef.current || whisperFailedRef.current || blob.size < 1000) return;
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
          whisperFailedRef.current = true;
          return;
        }
        // Everything else (400 bad chunk, 429 rate limit, 502/503 upstream
        // hiccup, 5xx) is treated as transient. Disable only after many
        // consecutive failures so brief outages don't kill the whole session.
        whisperConsecutiveFailuresRef.current += 1;
        if (whisperConsecutiveFailuresRef.current >= WHISPER_MAX_CONSECUTIVE_FAILURES) {
          whisperFailedRef.current = true;
        }
        return;
      }
      const data = (await res.json()) as { text?: string };
      const text = typeof data?.text === "string" ? data.text.trim() : "";
      // Any 2xx response counts as a healthy round-trip — reset the failure counter.
      whisperConsecutiveFailuresRef.current = 0;
      // Reject empty results and known Whisper silent-audio hallucinations.
      if (!text || isWhisperHallucination(text)) return;
      setTranscript((prev) => (prev ? `${prev} ${text}` : text));
      onFinalRef.current?.(text);
    } catch {
      // Network error or aborted — count as transient.
      whisperConsecutiveFailuresRef.current += 1;
      if (whisperConsecutiveFailuresRef.current >= WHISPER_MAX_CONSECUTIVE_FAILURES) {
        whisperFailedRef.current = true;
      }
    }
  }, [lang]);

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
      if (!rec || !wantsListeningRef.current || pausedRef.current) return;
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
    wantsListeningRef.current = true;
    whisperFailedRef.current = false;
    const rec = new SpeechRecognition();
    rec.continuous = continuous;
    rec.interimResults = true;
    rec.lang = lang;
    rec.onstart = () => {
      lastSuccessfulResultAtRef.current = Date.now();
    };
    rec.onresult = (event: SpeechRecognitionResultEvent) => {
      if (pausedRef.current) return;
      // Got a result → recognition is healthy. Reset error counters.
      consecutiveErrorsRef.current = 0;
      lastErrorTypeRef.current = null;
      lastSuccessfulResultAtRef.current = Date.now();
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
      // Permission errors are non-recoverable — user must act.
      if (errType === "not-allowed" || errType === "service-not-allowed") {
        wantsListeningRef.current = false;
        browserSttDisabledRef.current = true;
        setIsListening(false);
        setError("Microphone access denied. Please allow microphone permission and try again.");
        setMode(preferWhisper ? "whisper-only" : "unavailable");
        return;
      }
      // Silent / transient — let onend reschedule, don't surface anything.
      if (errType === "no-speech" || errType === "aborted") {
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
      if (!wantsListeningRef.current || pausedRef.current || browserSttDisabledRef.current) return;
      // If we ended without an error or are between attempts, restart promptly.
      // The retry scheduler handles backoff for error cases; here, we cover the
      // normal "session ended due to silence" path.
      if (consecutiveErrorsRef.current === 0) {
        tryStartRecognition(rec);
      }
      // else: scheduleRetry will call rec.start() at the right time
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
  }, [continuous, lang, preferWhisper, scheduleRetry, tryStartRecognition, error, tip]);

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
          void sendChunkToWhisper(completeBlob);
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
          // Can't get mic — give up on Whisper (browser STT may still work).
          whisperFailedRef.current = true;
          return;
        }
      }

      const stream = streamRef.current;
      if (!stream) return;
      attachRecorder(stream);
    } finally {
      whisperStartingRef.current = false;
    }
  }, [preferWhisper, streamIsAlive, attachRecorder]);

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
    if (pausedRef.current) return;

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
      startWhisperRecording();
      return;
    }

    // No browser STT and Whisper not allowed — the user must type their answer.
    browserSttDisabledRef.current = true;
    setMode("unavailable");
    setError("Speech recognition is not supported in this browser. Please type your answer.");
    setNeedsTypingFallback(true);
  }, [startBrowserStt, startWhisperRecording, preferWhisper]);

  const stop = useCallback(() => {
    startedRef.current = false;
    stopBrowserStt();
  }, [stopBrowserStt]);

  useEffect(() => {
    pausedRef.current = paused;
    if (!startedRef.current) return;
    if (paused) {
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
      return;
    }
    // Resume — defer to avoid running setState within the effect body.
    let cancelled = false;
    const timer = setTimeout(() => {
      if (cancelled || pausedRef.current) return;
      if (!browserSttDisabledRef.current) startBrowserStt();
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
  }, [paused, preferWhisper, startBrowserStt, ensureWhisperRunning, clearRetryTimeout]);

  // Watchdog: if continuous mode and recognition silently dies, restart it.
  // Also keeps Whisper alive — MediaRecorder can be killed by the browser
  // (fullscreen focus shifts, codec drops, tab throttling) without firing
  // a visible error, so we re-check every 2s and restart if needed.
  useEffect(() => {
    if (!continuous || !startedRef.current) return;
    const id = setInterval(() => {
      if (pausedRef.current) return;
      // Browser STT
      if (!browserSttDisabledRef.current && recognitionRef.current) {
        try {
          const state = recognitionRef.current.state;
          if (state === "stopped" || state === "inactive") {
            tryStartRecognition(recognitionRef.current);
          }
        } catch {}
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
