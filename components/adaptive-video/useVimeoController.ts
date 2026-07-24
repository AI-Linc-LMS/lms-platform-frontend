"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Thin wrapper over Vimeo's iframe postMessage API - no @vimeo/player dependency,
 * same protocol the existing VideoPlayer uses. Gives the companion the control it
 * needs for timeline sync: live current time, play/pause/seek/rate, and rewind
 * detection (a backwards seek = the confusion signal feeding comprehension).
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
  play: () => void;
  pause: () => void;
  seekTo: (seconds: number) => void;
  /** Set playback speed (e.g. 0.9 for the plain-English watch mode's slower pace). */
  setRate: (rate: number) => void;
}

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
  const lastTimeRef = useRef(0);

  // Callback ref: store the node and register the Vimeo listeners once it loads. Doing the setup
  // inside a `load` listener (instead of an onLoad prop + a ref object) keeps all ref access out of
  // render, which the react-hooks/refs rule requires.
  const setIframe = useCallback((node: HTMLIFrameElement | null) => {
    iframeRef.current = node;
    if (!node) return;
    const wire = () => {
      ["ready", "play", "pause", "timeupdate", "seeked", "ended"].forEach((ev) =>
        post(node, "addEventListener", ev)
      );
      post(node, "getDuration");
    };
    node.addEventListener("load", wire);
  }, []);

  useEffect(() => {
    const handler = (e: MessageEvent) => {
      if (!iframeRef.current || e.source !== iframeRef.current.contentWindow) return;
      let data: { event?: string; method?: string; value?: unknown; data?: { seconds?: number; duration?: number } };
      try {
        data = typeof e.data === "string" ? JSON.parse(e.data) : e.data;
      } catch {
        return;
      }

      const event = data.event || data.method;
      const payload = data.data || (data.value as { seconds?: number; duration?: number } | undefined);

      switch (event) {
        case "ready":
          post(iframeRef.current, "addEventListener", "timeupdate");
          post(iframeRef.current, "getDuration");
          break;
        case "getDuration":
          if (typeof data.value === "number") setDuration(data.value);
          break;
        case "play":
          setIsPlaying(true);
          break;
        case "pause":
        case "ended":
          setIsPlaying(false);
          break;
        case "timeupdate": {
          const s = payload?.seconds ?? 0;
          if (payload?.duration && !duration) setDuration(payload.duration);
          setCurrentTime(s);
          lastTimeRef.current = s;
          break;
        }
        case "seeked": {
          const to = payload?.seconds ?? 0;
          const from = lastTimeRef.current;
          if (from - to > 2) setRewinds((r) => [...r, { from: Math.round(from), to: Math.round(to) }]);
          setCurrentTime(to);
          lastTimeRef.current = to;
          break;
        }
      }
    };
    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, [duration]);

  const play = useCallback(() => post(iframeRef.current, "play"), []);
  const pause = useCallback(() => post(iframeRef.current, "pause"), []);
  const seekTo = useCallback((seconds: number) => {
    post(iframeRef.current, "setCurrentTime", seconds);
    setCurrentTime(seconds);
    lastTimeRef.current = seconds;
  }, []);
  const setRate = useCallback((rate: number) => {
    post(iframeRef.current, "setPlaybackRate", rate);
    setPlaybackRate(rate);
  }, []);

  return { setIframe, currentTime, duration, isPlaying, playbackRate, rewinds, play, pause, seekTo, setRate };
}
