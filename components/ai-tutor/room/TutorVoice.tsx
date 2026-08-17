"use client";

import { useEffect, useMemo, useRef } from "react";
import { Box, Typography } from "@mui/material";
import Strands, { type StrandsLive } from "./Strands";
import type { TutorPhase } from "@/lib/hooks/useRealtimeTutor";

/**
 * The tutor's presence: React Bits' Strands, driven by whoever is actually talking.
 *
 * Two things make this work rather than just look nice.
 *
 * **It answers to both voices.** When the tutor speaks the strands ride its output level;
 * when the learner speaks they ride the microphone, and the palette shifts. That is what
 * makes the screen read as a conversation instead of a speaker with a visualiser on it.
 *
 * **Nothing here re-renders per frame.** The audio level is read through a getter inside
 * Strands' own rAF loop via `liveRef`. This component renders when the *phase* changes —
 * five or six times a minute — and not once in between. That matters because this sits
 * beside a live WebRTC encode and a Monaco instance.
 *
 * Under `prefers-reduced-motion` the effect holds a still frame rather than unmounting, so
 * the tutor still has a presence and resuming is instant.
 */

/** Per-phase look. Violet is the tutor, pink is the learner, grey is inert. */
const PHASE_LOOK: Record<
  TutorPhase,
  { colors: string[]; count: number; speed: number; waviness: number; saturation: number }
> = {
  idle: { colors: ["#7C3AED", "#A855F7", "#6D28D9"], count: 3, speed: 0.18, waviness: 0.8, saturation: 1.1 },
  starting: { colors: ["#7C3AED", "#A855F7", "#6D28D9"], count: 3, speed: 0.25, waviness: 0.9, saturation: 1.1 },
  connecting: { colors: ["#A78BFA", "#7C3AED", "#C4B5FD"], count: 4, speed: 0.9, waviness: 1.3, saturation: 0.9 },
  listening: { colors: ["#7C3AED", "#A855F7", "#8B5CF6"], count: 3, speed: 0.22, waviness: 0.85, saturation: 1.2 },
  // The learner is talking: warmer, and visibly a different voice.
  "student-speaking": { colors: ["#EC4899", "#F472B6", "#A855F7"], count: 5, speed: 0.55, waviness: 1.5, saturation: 1.6 },
  // Thinking: fast churn, low amplitude. Motion without loudness.
  thinking: { colors: ["#C4B5FD", "#A855F7", "#8B5CF6"], count: 6, speed: 1.5, waviness: 2.1, saturation: 1.0 },
  speaking: { colors: ["#7C3AED", "#A855F7", "#06B6D4"], count: 5, speed: 0.6, waviness: 1.15, saturation: 1.6 },
  ending: { colors: ["#94A3B8", "#CBD5E1", "#A78BFA"], count: 2, speed: 0.15, waviness: 0.6, saturation: 0.5 },
  ended: { colors: ["#CBD5E1", "#94A3B8"], count: 2, speed: 0.1, waviness: 0.5, saturation: 0.35 },
  failed: { colors: ["#FCA5A5", "#DC2626"], count: 2, speed: 0.12, waviness: 0.6, saturation: 0.8 },
};

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

export function TutorVoice({
  phase,
  getLevels,
  height = 132,
}: {
  phase: TutorPhase;
  getLevels: () => { mic: number; tutor: number };
  height?: number | string;
}) {
  const liveRef = useRef<StrandsLive>({});
  const phaseRef = useRef(phase);
  phaseRef.current = phase;
  const smoothedRef = useRef(0);
  const rafRef = useRef<number | null>(null);

  const reduceMotion = useMemo(
    () =>
      typeof window !== "undefined" &&
      Boolean(window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches),
    []
  );

  useEffect(() => {
    if (reduceMotion) return;

    const tick = () => {
      const current = phaseRef.current;
      const look = PHASE_LOOK[current] ?? PHASE_LOOK.idle;
      const levels = getLevels();

      // Ride whichever side is live. When neither is, sit at a low idle so the strands
      // still breathe rather than freezing.
      const target =
        current === "speaking"
          ? levels.tutor
          : current === "student-speaking"
            ? levels.mic
            : 0.04;

      // Asymmetric smoothing: snap up on an onset so a syllable lands, ease down so the
      // effect does not flicker on every gap between words.
      const boosted = Math.min(1, target * 3.1);
      const k = boosted > smoothedRef.current ? 0.45 : 0.12;
      smoothedRef.current += (boosted - smoothedRef.current) * k;
      const amp = smoothedRef.current;

      liveRef.current = {
        colors: look.colors,
        speed: look.speed + amp * 0.55,
        waviness: look.waviness + amp * 0.7,
        amplitude: 0.55 + amp * 2.4,
        thickness: 0.5 + amp * 0.55,
        glow: 2.1 + amp * 1.6,
        intensity: 0.42 + amp * 0.5,
        saturation: look.saturation,
        scale: 1.5 - amp * 0.12,
      };

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, [getLevels, reduceMotion]);

  const look = PHASE_LOOK[phase] ?? PHASE_LOOK.idle;

  return (
    <Box
      sx={{
        position: "relative",
        width: "100%",
        height,
        borderRadius: "var(--radius-card)",
        overflow: "hidden",
        // The one dark surface in the room's lower bar. DESIGN.md treats a dark panel as a
        // brand surface, which is where saturated colour is allowed to live.
        background:
          "radial-gradient(120% 140% at 20% 120%, #241653 0%, #140b2b 55%, #0d0720 100%)",
      }}
      aria-hidden
    >
      <Strands
        colors={look.colors}
        count={look.count}
        speed={look.speed}
        waviness={look.waviness}
        saturation={look.saturation}
        amplitude={reduceMotion ? 0.6 : 1}
        thickness={0.7}
        glow={2.4}
        taper={3}
        spread={1}
        intensity={0.55}
        opacity={1}
        scale={1.5}
        liveRef={reduceMotion ? undefined : (liveRef as { current: StrandsLive })}
        paused={reduceMotion}
      />
      <Typography
        sx={{
          position: "absolute",
          left: 16,
          bottom: 12,
          fontSize: "0.68rem",
          fontWeight: 500,
          letterSpacing: "0.12em",
          textTransform: "uppercase",
          color: "rgba(255,255,255,0.72)",
          pointerEvents: "none",
          // Arabic loses its cursive joins under letter-spacing, per DESIGN.md.
          '[dir="rtl"] &': { letterSpacing: "normal", textTransform: "none" },
        }}
      >
        {PHASE_LABEL[phase]}
      </Typography>
    </Box>
  );
}
