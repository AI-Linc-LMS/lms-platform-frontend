"use client";

import { useEffect, useRef, useState } from "react";
import { pickBestVoice, voicesReady, warmVoices, initializeVoicePreferences } from "@/lib/utils/tts-voice-picker";
import { isChromiumBased } from "@/lib/utils/browser-detect";

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

// ---------------------------------------------------------------------------
// Module-level cloud-TTS clip cache (shared across hook instances and pages).
//
// Hoisted out of the hook so the OPENING question's clip can be prefetched BEFORE the avatar
// starts speaking — e.g. on interview-page mount or during device-check — killing the 1-3s of
// dead air between "Begin interview" and the interviewer's first word. Keyed by exact utterance
// text; a prefetch for text that later changes (tailored-plan swap) is simply never read, and
// playback falls back to today's on-demand fetch.
// ---------------------------------------------------------------------------
const CLIP_CACHE_MAX = 24;
const clipCache = new Map<string, CachedClip>();
const inflightClipFetches = new Map<string, Promise<CachedClip | null>>();
let cloudBlockedUntil = 0;

function cacheClip(text: string, clip: CachedClip) {
  if (clipCache.size >= CLIP_CACHE_MAX) {
    // Evict the oldest entry (Map preserves insertion order) and release its object URL.
    const oldest = clipCache.keys().next().value;
    if (oldest !== undefined) {
      const evicted = clipCache.get(oldest);
      clipCache.delete(oldest);
      try {
        if (evicted) URL.revokeObjectURL(evicted.url);
      } catch {}
    }
  }
  clipCache.set(text, clip);
}

/** Fetch a cloud-TTS clip for `text` into the module cache. Single-flight per text so a
 *  prefetch and a playback request never double-fetch the same utterance. */
async function fetchAndCacheClip(text: string): Promise<CachedClip | null> {
  const cached = clipCache.get(text);
  if (cached) return cached;
  const inflight = inflightClipFetches.get(text);
  if (inflight) return inflight;

  const doFetch = (async (): Promise<CachedClip | null> => {
    for (let i = 0; i < CLOUD_TTS_RETRY_DELAYS_MS.length; i++) {
      const delay = CLOUD_TTS_RETRY_DELAYS_MS[i];
      if (delay > 0) await new Promise<void>((r) => setTimeout(r, delay));

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), CLOUD_TTS_FETCH_TIMEOUT_MS);
      try {
        const res = await fetch(TTS_API, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text }),
          signal: controller.signal,
        });
        if (!res.ok) {
          if (res.status === 503) {
            cloudBlockedUntil = Date.now() + CLOUD_503_COOLDOWN_MS;
            return null;
          }
          continue;
        }
        const blob = await res.blob();
        if (!blob.size) continue;
        const contentType = (blob.type || "").toLowerCase();
        if (contentType && !contentType.includes("audio")) continue;
        const clip: CachedClip = { url: URL.createObjectURL(blob), blob };
        cacheClip(text, clip);
        return clip;
      } catch {
        // Transient — continue retries.
      } finally {
        clearTimeout(timeoutId);
      }
    }
    return null;
  })();

  inflightClipFetches.set(text, doFetch);
  try {
    return await doFetch;
  } finally {
    inflightClipFetches.delete(text);
  }
}

/** Warm the cloud-TTS cache for an utterance the interviewer is ABOUT to say (fire-and-forget).
 *  Call as early as the text is known — page mount, device-check proceed, /start resolve — so
 *  the avatar's first word plays from cache instead of paying a cold /api/tts round-trip. */
export function prefetchInterviewerClip(text: string | null | undefined): void {
  const t = (text || "").trim();
  if (!t || typeof window === "undefined") return;
  if (Date.now() < cloudBlockedUntil) return;
  void fetchAndCacheClip(t).catch(() => {});
}

// ---------------------------------------------------------------------------
// iOS/Safari audio unlock.
//
// WebKit only allows HTMLMediaElement.play() and the FIRST speechSynthesis.speak() when they
// happen synchronously inside a user gesture. Every interviewer utterance here plays AFTER
// awaited fetches (and turns 2+ have no gesture at all — silence auto-advance drives them), so
// without an unlock the interviewer is SILENT on iPhone/iPad (all iOS browsers are WebKit).
// The fix is the classic primer: ONE persistent <audio> element, "blessed" by playing a silent
// WAV inside the Begin/Start click, then reused for every cloud clip by swapping .src — a
// blessed element may keep playing programmatically; a fresh `new Audio()` per turn may not.
// ---------------------------------------------------------------------------
const SILENT_WAV =
  "data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA=";

let sharedAudioEl: HTMLAudioElement | null = null;

function getSharedAudioEl(): HTMLAudioElement | null {
  if (typeof window === "undefined") return null;
  if (!sharedAudioEl) {
    sharedAudioEl = new Audio();
    sharedAudioEl.preload = "auto";
    // iOS: never take over the screen with the native player.
    (sharedAudioEl as HTMLAudioElement & { playsInline?: boolean }).playsInline = true;
  }
  return sharedAudioEl;
}

/** Call SYNCHRONOUSLY inside a user gesture (Begin/Start click), BEFORE any await. Primes both
 *  audio paths for WebKit: plays a silent WAV on the shared element (unlocks cloud TTS for the
 *  whole interview) and fires a zero-volume speechSynthesis utterance (unlocks the browser-voice
 *  fallback). No-ops harmlessly on browsers that don't need it. */
export function unlockInterviewerAudio(): void {
  if (typeof window === "undefined") return;
  try {
    const el = getSharedAudioEl();
    if (el && !el.src) {
      el.src = SILENT_WAV;
      el.volume = 0;
      void el
        .play()
        .then(() => {
          el.pause();
          el.volume = 1;
        })
        .catch(() => {
          el.volume = 1;
        });
    }
  } catch {
    /* best-effort */
  }
  try {
    if ("speechSynthesis" in window) {
      const primer = new SpeechSynthesisUtterance(" ");
      primer.volume = 0;
      window.speechSynthesis.speak(primer);
      window.speechSynthesis.cancel();
    }
  } catch {
    /* best-effort */
  }
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
  const safetyTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sessionIdRef = useRef(0);
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
  // Clips live in the module-level cache (shared + prefetchable); its LRU eviction owns
  // object-URL revocation, so there is no per-mount cleanup to do here.

  useEffect(() => {
    if (!isSpeaking) return;
    if (!question || !question.trim()) {
      // The parent flagged "speaking" but there's nothing to say. Fire completion promptly
      // so `isSpeaking` can't get stuck true and stall the take page (the avatar would
      // otherwise appear to speak forever with no audio — a freeze the watchdog would then
      // have to clean up). This is the source-level fix for that deadlock.
      const emptyTimer = setTimeout(() => {
        try {
          onSpeakCompleteRef.current?.();
        } catch {}
      }, 250);
      return () => clearTimeout(emptyTimer);
    }

    const sessionId = sessionIdRef.current + 1;
    sessionIdRef.current = sessionId;
    cancelledRef.current = false;
    let didStart = false;
    let finishing = false;
    // Guards a second concurrent browser-fallback (cloud play() can reject AND fire
    // onerror for the same failure → both would call playBrowser → double-speak).
    let browserStarted = false;
    // Set by playBrowser so the effect teardown can stop the keep-alive timers even when
    // speechSynthesis.cancel() doesn't reliably fire onend/onerror.
    let keepAliveCleanup: (() => void) | null = null;

    const isStale = () => cancelledRef.current || sessionIdRef.current !== sessionId;

    const cleanupAudio = () => {
      if (audioElRef.current) {
        try {
          audioElRef.current.pause();
        } catch {}
        // The element is the SHARED unlocked one — detach handlers + source but never destroy
        // it (its gesture blessing is what keeps iOS playing on gesture-less turns).
        audioElRef.current.onplaying = null;
        audioElRef.current.onended = null;
        audioElRef.current.onerror = null;
        audioElRef.current.src = "";
        audioElRef.current = null;
      }
      if (audioObjectUrlRef.current) {
        // Don't revoke cached URLs — they're managed by the module clip cache.
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
      // The blob is already fully downloaded before this runs, so an object-URL audio
      // reaches HAVE_FUTURE_DATA almost immediately. Require >=3 (not >=2 = only the
      // current frame) so we never start playback that then stalls/garbles mid-question.
      if (audio.readyState >= 3) return true;
      return new Promise<boolean>((resolve) => {
        let done = false;
        const timer = setTimeout(() => {
          if (done) return;
          done = true;
          cleanup();
          resolve(audio.readyState >= 3);
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
      // Module cache first — a prefetched opening question plays instantly from here. The
      // single-flight map inside fetchAndCacheClip also means an in-progress prefetch is
      // awaited rather than duplicated. The fetch itself intentionally has no isStale()
      // checks (a completed download is cached for future turns either way); staleness is
      // re-checked by the caller after the await.
      const clip = clipCache.get(question) ?? (await fetchAndCacheClip(question));
      if (isStale()) return null;
      return clip;
    };

    const playBrowser = async (isFallback: boolean) => {
      if (isStale()) return;
      // If cloud audio already produced sound for this utterance, never also speak it
      // with the browser voice — end instead of double-speaking.
      if (didStart) {
        finish();
        return;
      }
      if (typeof window === "undefined" || !("speechSynthesis" in window)) {
        finish();
        return;
      }
      // A failing cloud play() can both reject AND fire onerror — only the first call
      // should produce the fallback utterance.
      if (browserStarted) return;
      browserStarted = true;

      try {
        window.speechSynthesis.cancel();
      } catch {}

      // Chrome/Mac silences audio when speak() is called too soon after cancel(); 60ms
      // was sometimes too short (dropped first word / stutter). 130ms is reliable.
      await wait(130);
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
      // Periodic resume() keeps it alive — but the pause()/resume() audibly clips at
      // the boundary, so we only start it after ~13s (short questions finish first and
      // never get clipped; long ones get kept alive just before Chrome's ~15s pause).
      let keepAliveInterval: ReturnType<typeof setInterval> | null = null;
      let keepAliveTimeout: ReturnType<typeof setTimeout> | null = null;

      const clearKeepAlive = () => {
        if (keepAliveTimeout) {
          clearTimeout(keepAliveTimeout);
          keepAliveTimeout = null;
        }
        if (keepAliveInterval) {
          clearInterval(keepAliveInterval);
          keepAliveInterval = null;
        }
      };
      // Expose to the effect teardown — speechSynthesis.cancel() doesn't reliably fire
      // onend/onerror, so without this the keep-alive timers leak into the next utterance.
      keepAliveCleanup = clearKeepAlive;

      utterance.onstart = () => {
        if (isStale()) return;
        if (!didStart) {
          didStart = true;
          onSpeakStartRef.current?.();
        }
        setAudioActive(true);
        // The ~15s silent auto-pause this works around is a CHROMIUM bug. On Firefox/Safari
        // pause()/resume() itself is the unreliable part (clipped or never-resumed audio on
        // long questions) — so only arm the keep-alive on Chromium engines.
        if (isChromiumBased()) {
          keepAliveTimeout = setTimeout(() => {
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
          }, 13000);
        }
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

      if (Date.now() < cloudBlockedUntil) {
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

        // Reuse the ONE shared (gesture-unlocked) element — WebKit lets a blessed element keep
        // playing programmatically across turns, where a fresh `new Audio()` per utterance
        // would be blocked on iOS/Safari for every gesture-less turn (2+).
        const audio = getSharedAudioEl() ?? new Audio();
        try {
          audio.pause();
        } catch {}
        audio.onplaying = null;
        audio.onended = null;
        audio.onerror = null;
        audio.src = clip.url;
        audio.preload = "auto";
        audio.volume = 1.0;
        audio.muted = false;
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

        // Use `playing` (audio is actually rendering) not `play` (play() merely accepted)
        // to mark didStart — otherwise a clip that errors on full decode AFTER play() but
        // BEFORE any sound would set didStart and suppress the legitimate browser fallback,
        // leaving the question silent.
        audio.onplaying = () => {
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
          // If the cloud clip ALREADY started speaking, a mid-stream error must NOT
          // restart the sentence on the browser voice — that double-speak ("…about to
          // fall back") is exactly the reported artifact. Just end cleanly.
          if (didStart) {
            finish();
            return;
          }
          void playBrowser(true);
        };

        await audio.play();
      } catch {
        if (isStale()) return;
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
      keepAliveCleanup?.();
      try {
        window.speechSynthesis.cancel();
      } catch {}
      cleanupAudio();
      utteranceRef.current = null;
      setAudioActive(false);
      // If we already kicked off the utterance (didStart) but the effect is being torn
      // down before `onend` fired — usually because the parent flipped `isSpeaking`
      // to false (e.g., silence detector auto-advanced, new question replaced this one)
      // — fire the complete callback explicitly. Without this the avatar's `isAnimating`
      // would stay `true` and the lip-sync video would keep looping after the actual
      // audio is already gone. This is the root cause of the "lip sync continues after
      // voice stops" symptom.
      if (didStart && !finishing) {
        finishing = true;
        try {
          onSpeakCompleteRef.current?.();
        } catch {}
      }
    };
  }, [question, isSpeaking]);

  return { source, audioActive };
}
