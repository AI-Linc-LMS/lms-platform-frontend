"use client";

import { useEffect, useRef, useState } from "react";
import { pickBestVoice, voicesReady, warmVoices, initializeVoicePreferences } from "@/lib/utils/tts-voice-picker";

const TTS_RESUME_DELAY_MS = 120;
const TTS_SAFETY_TIMEOUT_MS = 45000;
const TTS_API = "/api/tts";
const CLOUD_TTS_FETCH_TIMEOUT_MS = 10000;
const CLOUD_TTS_START_TIMEOUT_MS = 3500;
const CLOUD_TTS_RETRY_DELAYS_MS = [0, 350, 900];
const CLOUD_503_COOLDOWN_MS = 120000;

export type VoiceSource = "browser" | "cloud" | "browser-fallback";

export interface UseInterviewerVoiceOptions {
  question?: string;
  isSpeaking: boolean;
  onSpeakStart?: () => void;
  onSpeakComplete?: () => void;
}

export interface UseInterviewerVoiceReturn {
  /** Which path was used for the most recent utterance. */
  source: VoiceSource | null;
  /** True while the audio is actually playing (browser or cloud). */
  audioActive: boolean;
}

interface CachedClip {
  url: string;
  blob: Blob;
}

export function useInterviewerVoice(
  options: UseInterviewerVoiceOptions
): UseInterviewerVoiceReturn {
  const { question, isSpeaking, onSpeakStart, onSpeakComplete } = options;
  const [source, setSource] = useState<VoiceSource | null>(null);
  const [audioActive, setAudioActive] = useState(false);

  const cancelledRef = useRef(false);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const audioElRef = useRef<HTMLAudioElement | null>(null);
  const audioObjectUrlRef = useRef<string | null>(null);
  const cloudCacheRef = useRef<Map<string, CachedClip>>(new Map());
  const safetyTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sessionIdRef = useRef(0);
  const cloudBlockedUntilRef = useRef(0);
  const onSpeakStartRef = useRef(onSpeakStart);
  const onSpeakCompleteRef = useRef(onSpeakComplete);

  useEffect(() => {
    onSpeakStartRef.current = onSpeakStart;
    onSpeakCompleteRef.current = onSpeakComplete;
  });

  useEffect(() => {
    warmVoices();
    initializeVoicePreferences();
  }, []);

  useEffect(() => {
    const cache = cloudCacheRef.current;
    return () => {
      cache.forEach((clip) => {
        try {
          URL.revokeObjectURL(clip.url);
        } catch {}
      });
      cache.clear();
    };
  }, []);

  useEffect(() => {
    if (!question || !isSpeaking) return;

    const sessionId = sessionIdRef.current + 1;
    sessionIdRef.current = sessionId;
    cancelledRef.current = false;
    let didStart = false;
    let finishing = false;

    const isStale = () => cancelledRef.current || sessionIdRef.current !== sessionId;

    const cleanupAudio = () => {
      if (audioElRef.current) {
        try {
          audioElRef.current.pause();
        } catch {}
        audioElRef.current.src = "";
        audioElRef.current = null;
      }
      if (audioObjectUrlRef.current) {
        // Don't revoke cached URLs — they're managed by cloudCacheRef.
        audioObjectUrlRef.current = null;
      }
    };

    const clearSafetyTimeout = () => {
      if (safetyTimeoutRef.current) {
        clearTimeout(safetyTimeoutRef.current);
        safetyTimeoutRef.current = null;
      }
    };

    const finish = () => {
      if (finishing || isStale()) return;
      finishing = true;
      cancelledRef.current = true;
      clearSafetyTimeout();
      cleanupAudio();
      setAudioActive(false);
      onSpeakCompleteRef.current?.();
    };

    const wait = (ms: number) => new Promise<void>((resolve) => {
      setTimeout(resolve, ms);
    });

    const waitForAudioStart = async (audio: HTMLAudioElement): Promise<boolean> => {
      if (audio.readyState >= 3) return true;
      return new Promise<boolean>((resolve) => {
        let done = false;
        const timer = setTimeout(() => {
          if (done) return;
          done = true;
          cleanup();
          resolve(audio.readyState >= 2);
        }, CLOUD_TTS_START_TIMEOUT_MS);

        const onReady = () => {
          if (done) return;
          done = true;
          cleanup();
          resolve(true);
        };

        const onErr = () => {
          if (done) return;
          done = true;
          cleanup();
          resolve(false);
        };

        const cleanup = () => {
          clearTimeout(timer);
          audio.removeEventListener("canplay", onReady);
          audio.removeEventListener("canplaythrough", onReady);
          audio.removeEventListener("error", onErr);
        };

        audio.addEventListener("canplay", onReady, { once: true });
        audio.addEventListener("canplaythrough", onReady, { once: true });
        audio.addEventListener("error", onErr, { once: true });
      });
    };

    const fetchCloudClip = async (): Promise<CachedClip | null> => {
      let cached = cloudCacheRef.current.get(question);
      if (cached) return cached;

      for (let i = 0; i < CLOUD_TTS_RETRY_DELAYS_MS.length; i++) {
        if (isStale()) return null;
        const delay = CLOUD_TTS_RETRY_DELAYS_MS[i];
        if (delay > 0) await wait(delay);

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), CLOUD_TTS_FETCH_TIMEOUT_MS);

        try {
          const res = await fetch(TTS_API, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ text: question }),
            signal: controller.signal,
          });

          if (isStale()) return null;

          if (!res.ok) {
            if (res.status === 503) {
              cloudBlockedUntilRef.current = Date.now() + CLOUD_503_COOLDOWN_MS;
              return null;
            }
            continue;
          }

          const blob = await res.blob();
          if (!blob.size) continue;
          const contentType = (blob.type || "").toLowerCase();
          if (contentType && !contentType.includes("audio")) continue;

          const url = URL.createObjectURL(blob);
          cached = { url, blob };
          cloudCacheRef.current.set(question, cached);
          return cached;
        } catch {
          // Continue retries for transient failures.
        } finally {
          clearTimeout(timeoutId);
        }
      }

      return null;
    };

    const playBrowser = async (isFallback: boolean) => {
      if (isStale()) return;
      if (typeof window === "undefined" || !("speechSynthesis" in window)) {
        finish();
        return;
      }

      try {
        window.speechSynthesis.cancel();
      } catch {}

      // Chrome on Mac silences audio when speak() is called immediately after cancel().
      // A short delay lets the audio pipeline reset.
      await wait(60);
      if (isStale()) return;

      await voicesReady();
      if (isStale()) return;

      const picked = pickBestVoice("en-US");
      if (!picked) {
        finish();
        return;
      }

      const utterance = new SpeechSynthesisUtterance(question);
      utterance.lang = "en-US";
      utterance.rate = 0.95;
      utterance.pitch = 1.0;
      utterance.volume = 1.0;
      utterance.voice = picked.voice;
      utteranceRef.current = utterance;
      setSource(isFallback ? "browser-fallback" : "browser");

      let firedComplete = false;

      // Chrome on Mac pauses speechSynthesis silently after ~15s of speech.
      // Periodic resume() keeps it alive for longer answers.
      let keepAliveInterval: ReturnType<typeof setInterval> | null = null;

      const clearKeepAlive = () => {
        if (keepAliveInterval) {
          clearInterval(keepAliveInterval);
          keepAliveInterval = null;
        }
      };

      utterance.onstart = () => {
        if (isStale()) return;
        if (!didStart) {
          didStart = true;
          onSpeakStartRef.current?.();
        }
        setAudioActive(true);
        keepAliveInterval = setInterval(() => {
          try {
            if (window.speechSynthesis.speaking) {
              window.speechSynthesis.pause();
              window.speechSynthesis.resume();
            } else {
              clearKeepAlive();
            }
          } catch {}
        }, 10000);
      };
      utterance.onend = () => {
        if (firedComplete) return;
        firedComplete = true;
        clearKeepAlive();
        finish();
      };
      utterance.onerror = () => {
        if (firedComplete) return;
        firedComplete = true;
        clearKeepAlive();
        finish();
      };

      try {
        // resume() ensures synthesis isn't in a suspended/paused state before speaking.
        // This is the primary fix for inaudible audio on macOS Chrome/Safari.
        window.speechSynthesis.resume();
        window.speechSynthesis.speak(utterance);
      } catch {
        clearKeepAlive();
        finish();
      }
    };

    const playCloud = async () => {
      if (isStale()) return;

      if (Date.now() < cloudBlockedUntilRef.current) {
        await playBrowser(true);
        return;
      }

      try {
        const clip = await fetchCloudClip();
        if (!clip) {
          await playBrowser(true);
          return;
        }

        if (isStale()) return;

        const audio = new Audio(clip.url);
        audio.preload = "auto";
        audio.volume = 1.0;
        audio.defaultPlaybackRate = 1;
        audio.playbackRate = 1;
        try {
          audio.preservesPitch = true;
        } catch {}

        const canStart = await waitForAudioStart(audio);
        if (isStale()) return;
        if (!canStart) {
          await playBrowser(true);
          return;
        }

        audioElRef.current = audio;
        audioObjectUrlRef.current = clip.url;
        setSource("cloud");

        audio.onplay = () => {
          if (isStale()) return;
          if (!didStart) {
            didStart = true;
            onSpeakStartRef.current?.();
          }
          setAudioActive(true);
        };
        audio.onended = finish;
        audio.onerror = () => {
          if (isStale()) return;
          void playBrowser(true);
        };

        await audio.play();
      } catch {
        await playBrowser(true);
      }
    };

    const start = () => {
      if (cancelledRef.current) return;
      void playCloud();
    };

    const startTimerId = setTimeout(start, TTS_RESUME_DELAY_MS);
    safetyTimeoutRef.current = setTimeout(finish, TTS_SAFETY_TIMEOUT_MS);

    return () => {
      cancelledRef.current = true;
      sessionIdRef.current += 1;
      clearTimeout(startTimerId);
      clearSafetyTimeout();
      try {
        window.speechSynthesis.cancel();
      } catch {}
      cleanupAudio();
      utteranceRef.current = null;
      setAudioActive(false);
    };
  }, [question, isSpeaking]);

  return { source, audioActive };
}
