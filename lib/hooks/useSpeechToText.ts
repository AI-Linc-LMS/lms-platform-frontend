"use client";

import { useState, useRef, useCallback, useEffect } from "react";

export interface UseSpeechToTextOptions {
  /** Called with final transcript segments (append to answer). */
  onFinal?: (text: string) => void;
  /** Called with interim/live transcript for display. */
  onInterim?: (text: string) => void;
  /** Lang for browser Web Speech API (e.g. "en-US"). */
  lang?: string;
  /** Continuous mode: keep listening and appending. */
  continuous?: boolean;
}

export interface UseSpeechToTextReturn {
  start: () => void;
  stop: () => void;
  transcript: string;
  isListening: boolean;
  error: string | null;
}

/**
 * Speech-to-text using the browser Web Speech API.
 *
 * Production agents typically use streaming cloud APIs instead (same one-click UX):
 * - Google Cloud Speech-to-Text (streaming), AWS Transcribe, Azure Speech Services,
 *   AssemblyAI, Deepgram — they consume the existing mic stream (already granted on
 *   "Start Interview") and stream audio to the server; no extra user gesture needed.
 * This hook uses the built-in Web Speech API so no backend or API key is required.
 */
export function useSpeechToText(
  options: UseSpeechToTextOptions = {}
): UseSpeechToTextReturn {
  const {
    onFinal,
    onInterim,
    lang = "en-US",
    continuous = true,
  } = options;

  const [transcript, setTranscript] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const recognitionRef = useRef<any>(null);
  const wantsListeningRef = useRef(false);
  const onFinalRef = useRef(onFinal);
  const onInterimRef = useRef(onInterim);
  onFinalRef.current = onFinal;
  onInterimRef.current = onInterim;

  const startBrowserStt = useCallback(() => {
    if (typeof window === "undefined") return;
    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setError("Speech recognition not supported in this browser. Try Chrome.");
      return;
    }
    wantsListeningRef.current = true;
    const rec = new SpeechRecognition();
    rec.continuous = continuous;
    rec.interimResults = true;
    rec.lang = lang;
    rec.onresult = (event: any) => {
      let interim = "";
      let final = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const t = event.results[i][0].transcript;
        if (event.results[i].isFinal) final += t + " ";
        else interim += t;
      }
      const combined = final || interim;
      if (combined) {
        setTranscript((prev) => (prev ? `${prev} ${combined.trim()}` : combined.trim()));
        onInterimRef.current?.(combined);
        if (final) onFinalRef.current?.(final.trim());
      }
    };
    rec.onerror = (e: any) => {
      if (e.error === "not-allowed") {
        wantsListeningRef.current = false;
        setIsListening(false);
        setError("Microphone access denied. Allow microphone when you start the interview.");
      } else if (e.error === "no-speech") {
        // Ignore — user didn't speak yet
      } else if (e.error === "network") {
        wantsListeningRef.current = false;
        setIsListening(false);
        setError("Speech recognition needs internet. Check your connection.");
      } else if (e.error !== "aborted") {
        wantsListeningRef.current = false;
        setIsListening(false);
        setError("Speech recognition error. Use Chrome and start the interview again.");
      }
    };
    rec.onend = () => {
      if (!wantsListeningRef.current) return;
      try {
        rec.start();
      } catch {
        // Restart failed; leave stopped
      }
    };
    recognitionRef.current = rec;
    try {
      rec.start();
      setIsListening(true);
      setError(null);
    } catch (err) {
      wantsListeningRef.current = false;
      setError("Could not start microphone. Allow microphone permission and try again.");
    }
  }, [continuous, lang]);

  const stopBrowserStt = useCallback(() => {
    wantsListeningRef.current = false;
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {}
      recognitionRef.current = null;
    }
    setIsListening(false);
  }, []);

  const start = useCallback(() => {
    setTranscript("");
    setError(null);
    startBrowserStt();
  }, [startBrowserStt]);

  const stop = useCallback(() => {
    stopBrowserStt();
  }, [stopBrowserStt]);

  useEffect(() => {
    if (!continuous || !isListening) return;
    const id = setInterval(() => {
      if (recognitionRef.current) {
        try {
          const state = recognitionRef.current.state;
          if (state === "stopped" || state === "inactive") {
            recognitionRef.current.start();
          }
        } catch {}
      }
    }, 2000);
    return () => clearInterval(id);
  }, [continuous, isListening]);

  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {}
        recognitionRef.current = null;
      }
    };
  }, []);

  return {
    start,
    stop,
    transcript,
    isListening,
    error,
  };
}
