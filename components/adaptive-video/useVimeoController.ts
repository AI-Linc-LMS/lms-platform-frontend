"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Thin wrapper over Vimeo's iframe postMessage API - no @vimeo/player dependency,
 * same protocol the existing VideoPlayer uses. Gives the companion the control it
 * needs for timeline sync: live current time, play/pause/seek/rate, and rewind
 * detection (a backwards seek = the confusion signal feeding comprehension).
 *
 * TWO protocol details this hook got wrong, and why check-ins never fired on their own:
 *
 * 1. WIRE NAMES. `timeupdate` / `seeked` / `ended` are @vimeo/player SDK names. The raw embed
 *    emits the legacy Froogaloop names `playProgress` / `seek` / `finish`. Subscribing to
 *    "timeupdate" is even ACKed by the player, and the ticks still arrive as `playProgress` -
 *    so the ack is a false positive and every tick fell through the switch and was dropped.
 *    `setCurrentTime` was then only ever called by `seekTo()` itself, which is why clicking a
 *    chapter was the one thing that moved the clock, and therefore the one thing that armed a
 *    check-in. We now subscribe to and handle BOTH spellings, exactly as the platform's other
 *    Vimeo surface already does (components/video/components/VimeoPlayer.tsx:157-165, :192).
 *
 * 2. HANDSHAKE TIMING. The subscriptions were posted from the iframe's `load` event, when the
 *    player is not yet listening - those posts are silently dropped. Only `ready` is a handshake
 *    the player answers, so that is where we subscribe.
 *
 * There is also a local fallback ticker: if we believe the video is playing but the player has
 * gone quiet, the clock advances locally so coverage and check-ins still work on an embed whose
 * events we cannot see.
 */
export interface VimeoController {
  /** Callback ref - wire onto `<iframe ref={...}>`. Stores the node and attaches the player
   *  listeners on load itself, so the component never touches a ref value during render. */
  setIframe: (node: HTMLIFrameElement | null) => void;
  currentTime: number;
  duration: number;
  isPlaying: boolean;
  playbackRate: number;
  /** Backwards seeks observed this watch - {from, to}. */
  rewinds: { from: number; to: number }[];
  /** Bumps each time the video fires "ended" - lets the consumer score the watch on real
   *  completion, not only on unmount/navigation. */
  endedTick: number;
  play: () => void;
  pause: () => void;
  seekTo: (seconds: number) => void;
  /** Set playback speed (e.g. 0.9 for the plain-English watch mode's slower pace). */
  setRate: (rate: number) => void;
}

/** Both spellings of every event we care about: SDK name first, raw wire name second. */
const PLAYER_EVENTS = [
  "play",
  "pause",
  "timeupdate",
  "playProgress",
  "seeked",
  "seek",
  "ended",
  "finish",
] as const;

/** How long the player may stay silent while "playing" before the local ticker takes over. */
const SILENCE_BEFORE_LOCAL_TICK_MS = 1500;
const LOCAL_TICK_MS = 250;

function post(iframe: HTMLIFrameElement | null, method: string, value?: unknown) {
  if (!iframe?.contentWindow) return;
  iframe.contentWindow.postMessage(JSON.stringify(value === undefined ? { method } : { method, value }), "*");
}

export function useVimeoController(): VimeoController {
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [rewinds, setRewinds] = useState<{ from: number; to: number }[]>([]);
  const [endedTick, setEndedTick] = useState(0);
  const lastTimeRef = useRef(0);
  // Refs, not state, so the message listener registers ONCE. Depending on `duration` used to tear
  // down and re-add the listener on every duration change, which is both wasteful and a way to
  // miss messages mid-swap.
  const durationRef = useRef(0);
  const rateRef = useRef(1);
  /** Wall-clock of the last message the PLAYER sent us - the local ticker stands down while warm. */
  const lastPlayerMessageRef = useRef(0);

  const subscribe = useCallback((node: HTMLIFrameElement | null) => {
    PLAYER_EVENTS.forEach((ev) => post(node, "addEventListener", ev));
    post(node, "getDuration");
  }, []);

  // Callback ref: store the node and ask for `ready`. The real subscription happens in the `ready`
  // branch of the handler below - posting it here (on `load`) is too early to be heard.
  const setIframe = useCallback(
    (node: HTMLIFrameElement | null) => {
      iframeRef.current = node;
      if (!node) return;
      const wire = () => {
        post(node, "addEventListener", "ready");
        // Also try the full set: on a cached/bfcached frame `ready` may already have fired before
        // we were mounted, in which case this is our only chance to subscribe.
        subscribe(node);
      };
      node.addEventListener("load", wire);
    },
    [subscribe],
  );

  useEffect(() => {
    const handler = (e: MessageEvent) => {
      const frame = iframeRef.current;
      if (!frame || e.source !== frame.contentWindow) return;
      let data: { event?: string; method?: string; value?: unknown; data?: { seconds?: number; duration?: number } };
      try {
        data = typeof e.data === "string" ? JSON.parse(e.data) : e.data;
      } catch {
        return;
      }

      const event = data.event || data.method;
      const payload = data.data || (data.value as { seconds?: number; duration?: number } | undefined);

      /** One path for every flavour of "the playhead is now at N", whatever it was called. */
      const applyTime = (raw: unknown) => {
        const s = Number(raw ?? 0);
        if (!Number.isFinite(s)) return;
        const d = Number(payload?.duration ?? 0);
        if (d > 0 && Math.abs(d - durationRef.current) > 0.5) {
          durationRef.current = d;
          setDuration(d);
        }
        // Rewind detection on the time delta rather than on a `seeked` event: protocol-independent,
        // and it still holds when the local ticker is driving the clock.
        const from = lastTimeRef.current;
        if (from - s > 2) setRewinds((r) => [...r, { from: Math.round(from), to: Math.round(s) }]);
        lastTimeRef.current = s;
        lastPlayerMessageRef.current = Date.now();
        setCurrentTime(s);
      };

      switch (event) {
        case "ready":
          subscribe(frame);
          break;
        case "getDuration":
          if (typeof data.value === "number" && data.value > 0) {
            durationRef.current = data.value;
            setDuration(data.value);
          }
          break;
        case "play":
          setIsPlaying(true);
          lastPlayerMessageRef.current = Date.now();
          break;
        case "pause":
          setIsPlaying(false);
          break;
        case "ended":
        case "finish":
          setIsPlaying(false);
          setEndedTick((t) => t + 1);
          break;
        case "timeupdate":
        case "playProgress":
        case "seeked":
        case "seek":
          applyTime(payload?.seconds);
          break;
      }
    };
    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, [subscribe]);

  // Fallback ticker. If the player claims to be playing but has told us nothing for a beat, advance
  // the clock ourselves. Insurance against exactly the failure this hook shipped with: an embed
  // whose method calls work while its events never arrive would otherwise sit at 0:00 forever.
  // Steps are small enough to stay inside the consumer's "this was played, not skipped" window.
  useEffect(() => {
    if (!isPlaying) return;
    const id = window.setInterval(() => {
      if (Date.now() - lastPlayerMessageRef.current < SILENCE_BEFORE_LOCAL_TICK_MS) return;
      setCurrentTime((t) => {
        const next = t + (LOCAL_TICK_MS / 1000) * rateRef.current;
        if (durationRef.current && next > durationRef.current) return t;
        lastTimeRef.current = next;
        return next;
      });
    }, LOCAL_TICK_MS);
    return () => window.clearInterval(id);
  }, [isPlaying]);

  // The local mirrors keep isPlaying/rate honest even when the player never echoes the command,
  // which is what lets the fallback ticker above be trusted.
  const play = useCallback(() => {
    post(iframeRef.current, "play");
    setIsPlaying(true);
    lastPlayerMessageRef.current = Date.now();
  }, []);
  const pause = useCallback(() => {
    post(iframeRef.current, "pause");
    setIsPlaying(false);
  }, []);
  const seekTo = useCallback((seconds: number) => {
    post(iframeRef.current, "setCurrentTime", seconds);
    setCurrentTime(seconds);
    lastTimeRef.current = seconds;
    lastPlayerMessageRef.current = Date.now();
  }, []);
  const setRate = useCallback((rate: number) => {
    post(iframeRef.current, "setPlaybackRate", rate);
    rateRef.current = rate;
    setPlaybackRate(rate);
  }, []);

  return { setIframe, currentTime, duration, isPlaying, playbackRate, rewinds, endedTick, play, pause, seekTo, setRate };
}
