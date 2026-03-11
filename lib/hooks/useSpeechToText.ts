"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { registerMediaStream } from "@/lib/utils/media-stream-registry";

const WHISPER_CHUNK_MS = 4000;
const TRANSCRIBE_API = "/api/transcribe";

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
}

export interface UseSpeechToTextReturn {
  start: () => void;
  stop: () => void;
  transcript: string;
  isListening: boolean;
  error: string | null;
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
  } = options;

  const [transcript, setTranscript] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const wantsListeningRef = useRef(false);
  const whisperFailedRef = useRef(false);
  const onFinalRef = useRef(onFinal);
  const onInterimRef = useRef(onInterim);
  onFinalRef.current = onFinal;
  onInterimRef.current = onInterim;

  const sendChunkToWhisper = useCallback(async (blob: Blob) => {
    if (whisperFailedRef.current || blob.size < 100) return;
    const form = new FormData();
    form.append("file", blob, "chunk.webm");
    const langCode = lang.slice(0, 2);
    if (langCode) form.append("language", langCode);
    try {
      const res = await fetch(TRANSCRIBE_API, { method: "POST", body: form });
      if (!res.ok) {
        if (res.status === 401 || res.status === 502 || res.status === 503) whisperFailedRef.current = true;
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

  const startBrowserStt = useCallback(() => {
    if (typeof window === "undefined") return;
    const Win = window as Window & {
      SpeechRecognition?: new () => SpeechRecognitionInstance;
      webkitSpeechRecognition?: new () => SpeechRecognitionInstance;
    };
    const SpeechRecognition = Win.SpeechRecognition ?? Win.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setError("Speech recognition not supported in this browser. Try Chrome.");
      return;
    }
    wantsListeningRef.current = true;
    whisperFailedRef.current = false;
    const rec = new SpeechRecognition();
    rec.continuous = continuous;
    rec.interimResults = true;
    rec.lang = lang;
    rec.onresult = (event: SpeechRecognitionResultEvent) => {
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
      if (e.error === "not-allowed") {
        wantsListeningRef.current = false;
        setIsListening(false);
        setError("Microphone access denied. Allow microphone when you start the interview.");
      } else if (e.error === "no-speech") {
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
      } catch {}
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
  }, [continuous, lang, preferWhisper]);

  const startWhisperRecording = useCallback(async () => {
    if (!preferWhisper) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      registerMediaStream(stream);
      const recorder = new MediaRecorder(stream);
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
  }, []);

  const start = useCallback(() => {
    setTranscript("");
    setError(null);
    startBrowserStt();
    startWhisperRecording();
  }, [startBrowserStt, startWhisperRecording]);

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
  }, []);

  return {
    start,
    stop,
    transcript,
    isListening,
    error,
  };
}
