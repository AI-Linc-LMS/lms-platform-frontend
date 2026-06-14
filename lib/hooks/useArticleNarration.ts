"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Narrates an adaptive article in the professional OpenAI "onyx" voice (the same
 * voice the mock interview uses, via /api/tts) instead of the robotic browser
 * speechSynthesis. The article is chunked (the route caps input at 4000 chars)
 * and played gaplessly by prefetching the next chunk while the current one plays.
 * Falls back to speechSynthesis if cloud TTS is unavailable (503), so narration
 * never hard-fails.
 */

type TtsError = Error & { status?: number };

function htmlToText(html: string): string {
  if (typeof window === "undefined" || !html) return "";
  const tmp = document.createElement("div");
  tmp.innerHTML = html;
  // Don't read code / captions aloud — it's noise.
  tmp.querySelectorAll("pre, code, figure, figcaption").forEach((el) => el.remove());
  return (tmp.textContent || "").replace(/\s+/g, " ").trim();
}

function chunkText(text: string, max = 3500): string[] {
  const sentences = text.match(/[^.!?]+[.!?]+(?:\s|$)|[^.!?]+$/g) || [text];
  const chunks: string[] = [];
  let cur = "";
  for (const s of sentences) {
    if ((cur + s).length > max) {
      if (cur.trim()) chunks.push(cur.trim());
      if (s.length > max) {
        for (let i = 0; i < s.length; i += max) chunks.push(s.slice(i, i + max).trim());
        cur = "";
      } else {
        cur = s;
      }
    } else {
      cur += s;
    }
  }
  if (cur.trim()) chunks.push(cur.trim());
  return chunks.filter(Boolean);
}

async function fetchChunkUrl(text: string): Promise<string> {
  const res = await fetch("/api/tts", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text }),
  });
  if (!res.ok) {
    const err: TtsError = new Error(`tts ${res.status}`);
    err.status = res.status;
    throw err;
  }
  return URL.createObjectURL(await res.blob());
}

export function useArticleNarration(html: string) {
  const [playing, setPlaying] = useState(false);
  const [loading, setLoading] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const resolveRef = useRef<(() => void) | null>(null);
  const stopRef = useRef(false);

  const cleanupAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = "";
      audioRef.current = null;
    }
  };

  const stop = useCallback(() => {
    stopRef.current = true;
    cleanupAudio();
    resolveRef.current?.();
    resolveRef.current = null;
    if (typeof window !== "undefined") window.speechSynthesis?.cancel();
    setPlaying(false);
    setLoading(false);
  }, []);

  const playWithBrowser = useCallback((text: string) => {
    if (typeof window === "undefined" || !window.speechSynthesis) {
      setPlaying(false);
      setLoading(false);
      return;
    }
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.rate = 0.97;
    u.pitch = 1.0;
    u.onend = () => setPlaying(false);
    u.onerror = () => setPlaying(false);
    window.speechSynthesis.speak(u);
    setPlaying(true);
    setLoading(false);
  }, []);

  const start = useCallback(async () => {
    const text = htmlToText(html);
    if (!text) return;
    const chunks = chunkText(text);
    stopRef.current = false;
    setLoading(true);
    setPlaying(true);

    // Resolve the first chunk up front so a 503 (cloud TTS off) trips the
    // browser fallback before we commit to the cloud path.
    let nextUrl: Promise<string>;
    try {
      nextUrl = fetchChunkUrl(chunks[0]);
      await nextUrl;
    } catch {
      if (stopRef.current) return;
      playWithBrowser(text); // 503 / network — fall back to browser voice
      return;
    }

    for (let i = 0; i < chunks.length; i += 1) {
      if (stopRef.current) return;
      // nextUrl was prefetched during the previous chunk's playback.
      const url = await nextUrl.catch(() => "");
      if (!url) {
        playWithBrowser(chunks.slice(i).join(" "));
        return;
      }
      // Kick off the next chunk's fetch now, so it loads while this one plays.
      if (i + 1 < chunks.length) nextUrl = fetchChunkUrl(chunks[i + 1]);
      if (stopRef.current) {
        URL.revokeObjectURL(url);
        return;
      }
      setLoading(false);
      await new Promise<void>((resolve) => {
        resolveRef.current = resolve;
        const audio = new Audio(url);
        audioRef.current = audio;
        const done = () => {
          URL.revokeObjectURL(url);
          resolveRef.current = null;
          resolve();
        };
        audio.onended = done;
        audio.onerror = done;
        audio.play().catch(done);
      });
    }
    if (!stopRef.current) setPlaying(false);
  }, [html, playWithBrowser]);

  const toggle = useCallback(() => {
    if (playing) stop();
    else void start();
  }, [playing, start, stop]);

  // Stop when the article body changes (e.g. tier switch) and on unmount.
  useEffect(() => {
    stopRef.current = false;
    return () => stop();
  }, [html, stop]);

  return { playing, loading, toggle, stop };
}
