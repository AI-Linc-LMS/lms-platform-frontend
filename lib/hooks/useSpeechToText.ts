"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import {
  transcribeAudioBlob,
  isServerSttEnabled,
} from "@/lib/services/speech-to-text.service";

const CHUNK_MS = 4000; // Send audio every 4s when using server STT

function getRecorderMimeType(): string {
  const types = ["audio/webm;codecs=opus", "audio/webm", "audio/ogg;codecs=opus"];
  for (const m of types) {
    if (typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported(m))
      return m;
  }
  return "audio/webm";
}

export interface UseSpeechToTextOptions {
  /** Stream to record from (required for server STT). */
  streamRef?: React.RefObject<MediaStream | null>;
  /** Called with final transcript segments (append to answer). */
  onFinal?: (text: string) => void;
  /** Called with interim/combined transcript for display. */
  onInterim?: (text: string) => void;
  /** Lang for browser recognition only (e.g. "en-US"). */
  lang?: string;
  /** Continuous mode: keep appending (take page). Single shot: one result (device-check). */
  continuous?: boolean;
}

export interface UseSpeechToTextReturn {
  start: () => void;
  stop: () => void;
  transcript: string;
  isListening: boolean;
  error: string | null;
  /** True when using server STT (e.g. Canary Qwen 2.5B). */
  isServerMode: boolean;
}

/**
 * Speech-to-text: uses server STT (e.g. Canary Qwen 2.5B) when configured and stream is available,
 * otherwise falls back to browser Web Speech API.
 */
export function useSpeechToText(
  options: UseSpeechToTextOptions = {}
): UseSpeechToTextReturn {
  const {
    streamRef,
    onFinal,
    onInterim,
    lang = "en-US",
    continuous = true,
  } = options;

  const [transcript, setTranscript] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isServerMode, setIsServerMode] = useState(false);

  const recognitionRef = useRef<any>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunkBufferRef = useRef<Blob[]>([]);
  const streamRefCurrent = streamRef?.current;

  const tryServerStt = useCallback((): boolean => {
    if (!isServerSttEnabled() || !streamRef?.current) return false;
    const stream = streamRef.current;
    const hasAudio =
      stream.getAudioTracks().length > 0 &&
      stream.getAudioTracks()[0].readyState === "live";
    return hasAudio;
  }, [streamRef?.current]);

  const startServerStt = useCallback(() => {
    const stream = streamRef?.current;
    if (!stream) return;
    try {
      const mime = getRecorderMimeType();
      const rec = new MediaRecorder(stream, { mimeType: mime });
      mediaRecorderRef.current = rec;

      rec.ondataavailable = async (e) => {
        if (e.data.size === 0) return;
        const blob = e.data;
        try {
          const { text } = await transcribeAudioBlob(blob);
          if (text) {
            setTranscript((prev) => (prev ? `${prev} ${text}` : text));
            onFinal?.(text);
          }
        } catch (err) {
          setError(err instanceof Error ? err.message : "Transcription failed");
        }
      };

      rec.start(CHUNK_MS);
      setIsListening(true);
      setIsServerMode(true);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Recording failed");
      setIsServerMode(false);
    }
  }, [streamRef, onFinal]);

  const stopServerStt = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current = null;
    }
    setIsListening(false);
  }, []);

  const startBrowserStt = useCallback(() => {
    if (typeof window === "undefined") return;
    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setError("Speech recognition not supported");
      return;
    }
    const rec = new SpeechRecognition();
    rec.continuous = continuous;
    rec.interimResults = continuous;
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
        onInterim?.(combined);
        if (final) onFinal?.(final.trim());
      }
    };
    rec.onerror = (e: any) => {
      if (e.error !== "no-speech") setError("Speech recognition error");
    };
    rec.onend = () => {
      if (isListening && recognitionRef.current) {
        try {
          recognitionRef.current.start();
        } catch {}
      }
    };
    recognitionRef.current = rec;
    rec.start();
    setIsListening(true);
    setIsServerMode(false);
    setError(null);
  }, [continuous, lang, onFinal, onInterim, isListening]);

  const stopBrowserStt = useCallback(() => {
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
    if (tryServerStt()) {
      startServerStt();
    } else {
      startBrowserStt();
    }
  }, [tryServerStt, startServerStt, startBrowserStt]);

  const stop = useCallback(() => {
    if (isServerMode) {
      stopServerStt();
    } else {
      stopBrowserStt();
    }
  }, [isServerMode, stopServerStt, stopBrowserStt]);

  // Keep browser recognition alive when continuous
  useEffect(() => {
    if (!continuous || !isListening || isServerMode) return;
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
  }, [continuous, isListening, isServerMode]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
        mediaRecorderRef.current.stop();
        mediaRecorderRef.current = null;
      }
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
    isServerMode,
  };
}
