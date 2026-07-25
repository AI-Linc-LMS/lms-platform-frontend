"use client";

import { Box } from "@mui/material";
import { memo, useEffect, useRef } from "react";

interface PauseProgressBarProps {
  /**
   * Live progress source, 0..1. Read every animation frame; never causes a React
   * re-render of this component (the bar's width + opacity + background are mutated
   * directly on the DOM node). The parent component must never need to re-render to
   * change the visual - that's the whole point of this lift-out.
   */
  progressRef: { current: number };
  isListening: boolean;
}

export const PauseProgressBar = memo(function PauseProgressBar({
  progressRef,
  isListening,
}: PauseProgressBarProps) {
  const fillRef = useRef<HTMLDivElement | null>(null);
  const rafRef = useRef<number | null>(null);
  const lastAppliedRef = useRef<number>(-1);
  const isListeningRef = useRef(isListening);

  useEffect(() => {
    isListeningRef.current = isListening;
  }, [isListening]);

  useEffect(() => {
    const apply = () => {
      const el = fillRef.current;
      if (el) {
        const raw = progressRef.current;
        const clamped = Math.min(1, Math.max(0, raw || 0));
        if (Math.abs(clamped - lastAppliedRef.current) > 0.005) {
          lastAppliedRef.current = clamped;
          el.style.width = `${clamped * 100}%`;
          const isPaused = clamped > 0;
          el.style.opacity = isPaused || isListeningRef.current ? "1" : "0.25";
          el.style.background = isPaused
            ? "linear-gradient(90deg, var(--accent-indigo) 0%, var(--accent-indigo-dark) 100%)"
            : "var(--ats-success)";
        }
      }
      rafRef.current = window.requestAnimationFrame(apply);
    };
    rafRef.current = window.requestAnimationFrame(apply);
    return () => {
      if (rafRef.current !== null) {
        window.cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, [progressRef]);

  return (
    <Box
      sx={{
        position: "relative",
        height: 6,
        borderRadius: 999,
        backgroundColor: "var(--surface)",
        overflow: "hidden",
        border: "1px solid var(--border-default)",
      }}
    >
      <Box
        ref={fillRef}
        sx={{
          position: "absolute",
          inset: 0,
          width: "0%",
          background: "var(--ats-success)",
          opacity: 0.25,
          transition: "width 100ms linear, background 200ms ease, opacity 200ms ease",
        }}
      />
    </Box>
  );
});
