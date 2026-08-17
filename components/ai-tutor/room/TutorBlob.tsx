"use client";

import { useEffect, useRef } from "react";
import { Box } from "@mui/material";
import type { TutorPhase } from "@/lib/hooks/useRealtimeTutor";

/**
 * The tutor's presence on screen.
 *
 * Canvas 2D, not WebGL. A shader loop running next to a live WebRTC encode is a real
 * thermal and battery cost on the mid-range Android phones a lot of these learners use,
 * and the visual gain over a well-drawn 2D blob is small.
 *
 * The audio level is read through a getter ref at frame rate and never enters React state.
 * Putting an amplitude in state would re-render this component sixty times a second while
 * an audio encode is running, which is exactly the sort of thing that turns a smooth
 * conversation into a stuttering one.
 */

const PHASE_COLOURS: Record<string, [string, string]> = {
  idle: ["#a78bfa", "#7c3aed"],
  starting: ["#a78bfa", "#7c3aed"],
  connecting: ["#a78bfa", "#7c3aed"],
  listening: ["#8b5cf6", "#6d28d9"],
  "student-speaking": ["#f472b6", "#db2777"],
  thinking: ["#c4b5fd", "#8b5cf6"],
  speaking: ["#7c3aed", "#4c1d95"],
  ending: ["#cbd5e1", "#94a3b8"],
  ended: ["#cbd5e1", "#94a3b8"],
  failed: ["#fca5a5", "#dc2626"],
};

export function TutorBlob({
  phase,
  getLevels,
  size = 190,
}: {
  phase: TutorPhase;
  getLevels: () => { mic: number; tutor: number };
  size?: number;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const phaseRef = useRef(phase);
  phaseRef.current = phase;
  const rafRef = useRef<number | null>(null);
  const smoothedRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    ctx.scale(dpr, dpr);

    const reduceMotion = window.matchMedia?.(
      "(prefers-reduced-motion: reduce)"
    )?.matches;

    let t = 0;

    const draw = () => {
      const currentPhase = phaseRef.current;
      const levels = getLevels();
      // The blob answers to whichever voice is active, so it feels like a conversation
      // rather than a speaker.
      const target =
        currentPhase === "student-speaking"
          ? levels.mic
          : currentPhase === "speaking"
            ? levels.tutor
            : 0.06;

      smoothedRef.current += (target - smoothedRef.current) * 0.18;
      const amp = reduceMotion ? 0.08 : smoothedRef.current;

      t += reduceMotion ? 0.004 : 0.016;

      const [light, deep] = PHASE_COLOURS[currentPhase] ?? PHASE_COLOURS.idle;
      const cx = size / 2;
      const cy = size / 2;
      const base = size * 0.29;

      ctx.clearRect(0, 0, size, size);

      // Soft halo, sized by amplitude. This is the only "glow" on the page.
      const halo = ctx.createRadialGradient(cx, cy, base * 0.6, cx, cy, base * (1.5 + amp));
      halo.addColorStop(0, `${light}33`);
      halo.addColorStop(1, `${light}00`);
      ctx.fillStyle = halo;
      ctx.beginPath();
      ctx.arc(cx, cy, base * (1.5 + amp), 0, Math.PI * 2);
      ctx.fill();

      // The body: a circle perturbed by three out-of-phase harmonics so it never looks
      // like a pulsing ellipse.
      ctx.beginPath();
      const steps = 90;
      for (let i = 0; i <= steps; i += 1) {
        const angle = (i / steps) * Math.PI * 2;
        const wobble =
          Math.sin(angle * 3 + t * 1.7) * 0.045 +
          Math.sin(angle * 5 - t * 1.1) * 0.03 +
          Math.sin(angle * 2 + t * 0.6) * 0.05;
        const r = base * (1 + wobble * (0.5 + amp * 2.2) + amp * 0.22);
        const x = cx + Math.cos(angle) * r;
        const y = cy + Math.sin(angle) * r;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();

      const body = ctx.createLinearGradient(cx - base, cy - base, cx + base, cy + base);
      body.addColorStop(0, light);
      body.addColorStop(1, deep);
      ctx.fillStyle = body;
      ctx.fill();

      // A specular arc, so it reads as a body rather than a flat disc.
      ctx.beginPath();
      ctx.arc(cx - base * 0.28, cy - base * 0.3, base * 0.3, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(255,255,255,0.16)";
      ctx.fill();

      rafRef.current = requestAnimationFrame(draw);
    };

    rafRef.current = requestAnimationFrame(draw);
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, [getLevels, size]);

  return (
    <Box
      sx={{ width: size, height: size, display: "grid", placeItems: "center" }}
      aria-hidden
    >
      <canvas
        ref={canvasRef}
        style={{ width: size, height: size, display: "block" }}
      />
    </Box>
  );
}

export const PHASE_LABEL: Record<TutorPhase, string> = {
  idle: "Ready",
  starting: "Setting up",
  connecting: "Connecting",
  listening: "Listening",
  "student-speaking": "You're speaking",
  thinking: "Thinking",
  speaking: "Speaking",
  ending: "Wrapping up",
  ended: "Session ended",
  failed: "Couldn't connect",
};
