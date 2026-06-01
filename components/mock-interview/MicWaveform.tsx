"use client";

import { Box } from "@mui/material";
import { memo, useEffect, useRef } from "react";

interface MicWaveformProps {
  /**
   * Ref to a live 0..1 microphone-loudness value. The take page updates this every
   * animation frame from the Web Audio analyser, so we read it imperatively here instead
   * of taking it through React state (which would re-render the whole page on every audio
   * tick). The bars' heights scale with this value, so the wave genuinely reacts to how
   * loud the candidate is speaking instead of looking static.
   */
  levelRef?: { current: number };
  /** True while the mic is actively listening — bars animate; otherwise they rest low. */
  active?: boolean;
  /** Number of bars to render. */
  bars?: number;
  /** Bar + glow colour (defaults to the success/green token). */
  color?: string;
}

const DEFAULT_BARS = 9;

/**
 * A compact equaliser-style mic waveform. Each bar oscillates on its own sine phase and its
 * amplitude is driven by the live loudness, giving an obvious "you're being heard" signal
 * that grows with the candidate's voice. Driven entirely by requestAnimationFrame + direct
 * DOM writes — no React re-renders per frame.
 */
export const MicWaveform = memo(function MicWaveform({
  levelRef,
  active = false,
  bars = DEFAULT_BARS,
  color = "var(--ats-success)",
}: MicWaveformProps) {
  const barRefs = useRef<Array<HTMLSpanElement | null>>([]);
  const rafRef = useRef<number | null>(null);
  const phaseRef = useRef(0);
  // Smoothed level so the bars don't jitter frame-to-frame on noisy input.
  const smoothedRef = useRef(0);
  const activeRef = useRef(active);

  useEffect(() => {
    activeRef.current = active;
  }, [active]);

  useEffect(() => {
    const tick = () => {
      const raw = Math.min(1, Math.max(0, levelRef?.current ?? 0));
      // Gain-up: speech typically sits around 0.05–0.35 on the analyser, so multiply to use
      // the full bar range, then clamp.
      const boosted = Math.min(1, raw * 3.2);
      // Exponential smoothing — quick to rise, slightly slower to fall.
      const prev = smoothedRef.current;
      smoothedRef.current =
        boosted > prev ? prev + (boosted - prev) * 0.5 : prev + (boosted - prev) * 0.25;
      const level = smoothedRef.current;
      const isActive = activeRef.current;

      phaseRef.current += 0.45;
      const phase = phaseRef.current;
      const count = barRefs.current.length;
      const mid = (count - 1) / 2;

      barRefs.current.forEach((bar, i) => {
        if (!bar) return;
        // Center bars swing taller than edge bars for a natural equaliser shape.
        const centerFalloff = 1 - Math.abs(i - mid) / (mid + 1);
        const wave = 0.5 + 0.5 * Math.sin(phase + i * 0.7);
        // Idle: a gentle low shimmer so the user knows the mic is live. Active: amplitude
        // tracks loudness, scaled by the per-bar wave + center falloff.
        const baseline = isActive ? 0.16 : 0.12;
        const amplitude = isActive
          ? level * (0.45 + 0.55 * centerFalloff) * (0.4 + 0.6 * wave)
          : 0.08 * wave;
        const heightPct = Math.max(8, Math.min(100, (baseline + amplitude) * 100));
        bar.style.height = `${heightPct}%`;
        bar.style.opacity = isActive
          ? String(0.55 + 0.45 * level)
          : "0.35";
      });
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
  }, [levelRef]);

  return (
    <Box
      aria-hidden
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "3px",
        height: 26,
        minWidth: bars * 6,
      }}
    >
      {Array.from({ length: bars }).map((_, i) => (
        <Box
          key={i}
          component="span"
          ref={(el: HTMLSpanElement | null) => {
            barRefs.current[i] = el;
          }}
          sx={{
            display: "block",
            width: 3,
            height: "20%",
            borderRadius: 999,
            backgroundColor: color,
            transition: "height 0.07s linear, opacity 0.12s linear",
          }}
        />
      ))}
    </Box>
  );
});
