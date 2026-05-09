"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { registerMediaStream } from "@/lib/utils/media-stream-registry";
import { blobToWav } from "@/lib/utils/audio-to-wav";
import { detectBrowser, detectPlatform } from "@/lib/utils/browser-detect";

const WHISPER_CHUNK_MS = 2000;
const TRANSCRIBE_API = "/api/transcribe";
const MAX_BROWSER_STT_RETRIES = 5;
const BROWSER_STT_RETRY_DELAYS_MS = [500, 1000, 2000, 3000, 4000];
const EDGE_TIP_RETRY_THRESHOLD = 2;
const MAC_TIP_RETRY_THRESHOLD = 2;

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
  const pausedRef = useRef(paused);
  const onFinalRef = useRef(onFinal);
  const onInterimRef = useRef(onInterim);
  const browserSttDisabledRef = useRef(false);
  const consecutiveErrorsRef = useRef(0);
  const retryTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSuccessfulResultAtRef = useRef<number>(0);

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
        if ([400, 401, 502, 503].includes(res.status)) whisperFailedRef.current = true;
        return;
      }
      const data = (await res.json()) as { text?: string };
      const text = typeof data?.text === "string" ? data.text.trim() : "";
      if (text) {
        setTranscript((prev) => (prev ? `${prev} ${text}` : text));
        onFinalRef.current?.(text);
      }
    } catch {
      whisperFailedRef.current = true;
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
      browserSttDisabledRef.current = true;
      setNeedsTypingFallback(true);
      // If Whisper is also unavailable, fully unavailable. Otherwise hand off.
      setMode(whisperFailedRef.current ? "unavailable" : "whisper-only");
      setError(
        whisperFailedRef.current
          ? "Speech recognition unavailable — please type your answer."
          : "Speech recognition is having trouble — your typed answer or recorded voice will still be saved."
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
  }, [clearRetryTimeout, tryStartRecognition]);

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
      if (detectPlatform() === "mac") {
        setTip(
          "On macOS, live browser speech recognition can be limited. Keep microphone permission enabled for your browser in System Settings -> Privacy & Security -> Microphone."
        );
      }
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
        if (final && (!preferWhisper || whisperFailedRef.current)) {
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
        setError("Microphone access denied. Allow microphone permission and reload.");
        if (detectPlatform() === "mac") {
          setTip(
            "On macOS: open System Settings -> Privacy & Security -> Microphone and allow access for your browser, then reload this page."
          );
        }
        setMode(preferWhisper ? "whisper-only" : "unavailable");
        return;
      }
      // Silent / transient — just let onend reschedule.
      if (errType === "no-speech" || errType === "aborted") {
        return;
      }
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

  const startWhisperRecording = useCallback(async () => {
    if (!preferWhisper) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { noiseSuppression: true, echoCancellation: true },
      });
      streamRef.current = stream;
      registerMediaStream(stream);
      const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : MediaRecorder.isTypeSupported("audio/webm")
          ? "audio/webm"
          : MediaRecorder.isTypeSupported("audio/mp4")
            ? "audio/mp4"
            : "";
      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : {});
      mediaRecorderRef.current = recorder;
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) sendChunkToWhisper(e.data);
      };
      recorder.start(WHISPER_CHUNK_MS);
    } catch {
      whisperFailedRef.current = true;
    }
  }, [preferWhisper, sendChunkToWhisper]);

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
    if (!pausedRef.current) {
      startBrowserStt();
      startWhisperRecording();
    }
  }, [startBrowserStt, startWhisperRecording]);

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
      if (preferWhisper && streamRef.current) {
        const stream = streamRef.current;
        const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
          ? "audio/webm;codecs=opus"
          : MediaRecorder.isTypeSupported("audio/webm")
            ? "audio/webm"
            : MediaRecorder.isTypeSupported("audio/mp4")
              ? "audio/mp4"
              : "";
        const rec = new MediaRecorder(stream, mimeType ? { mimeType } : {});
        mediaRecorderRef.current = rec;
        rec.ondataavailable = (e) => {
          if (e.data.size > 0) sendChunkToWhisper(e.data);
        };
        rec.start(WHISPER_CHUNK_MS);
      } else if (preferWhisper) {
        startWhisperRecording();
      }
    }, 0);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [paused, preferWhisper, startBrowserStt, startWhisperRecording, sendChunkToWhisper, clearRetryTimeout]);

  // Watchdog: if continuous mode and recognition silently dies, restart it.
  useEffect(() => {
    if (!continuous || !isListening || browserSttDisabledRef.current) return;
    const id = setInterval(() => {
      if (!recognitionRef.current || pausedRef.current) return;
      try {
        const state = recognitionRef.current.state;
        if (state === "stopped" || state === "inactive") {
          tryStartRecognition(recognitionRef.current);
        }
      } catch {}
    }, 2000);
    return () => clearInterval(id);
  }, [continuous, isListening, tryStartRecognition]);

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
