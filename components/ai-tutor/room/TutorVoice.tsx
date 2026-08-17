"use client";

import { useEffect, useMemo, useRef } from "react";
import dynamic from "next/dynamic";
import { Box, Typography } from "@mui/material";
import type { StrandsLive } from "./Strands";
import type { TutorPhase } from "@/lib/hooks/useRealtimeTutor";

/**
 * `ogl` is a WebGL library and it has no business blocking the room's first paint. Loading it
 * dynamically means the dark shell, the top bar, the plan rail and the captions are on screen
 * immediately, and the ribbon fades in a beat later — which is fine, because at that moment the
 * session POST and the microphone prompt are still in flight anyway. `ssr: false` because the
 * shader needs a real canvas.
 *
 * The placeholder is a thin violet line rather than a spinner: it occupies the ribbon's space
 * without implying the page is stuck.
 */
const Strands = dynamic(() => import("./Strands"), {
  ssr: false,
  loading: () => (
    <Box sx={{ width: "100%", height: "100%", display: "grid", placeItems: "center" }}>
      <Box
        sx={{
          width: "min(70%, 560px)",
          height: 3,
          borderRadius: 9999,
          background:
            "linear-gradient(90deg, transparent, rgba(168,85,247,0.8), transparent)",
          animation: "tutorRibbonBoot 1.6s ease-in-out infinite",
          "@keyframes tutorRibbonBoot": {
            "0%, 100%": { opacity: 0.25, transform: "scaleX(0.6)" },
            "50%": { opacity: 1, transform: "scaleX(1)" },
          },
          "@media (prefers-reduced-motion: reduce)": { animation: "none", opacity: 0.6 },
        }}
      />
    </Box>
  ),
});

/**
 * The tutor's presence: React Bits' Strands, driven by whoever is actually talking.
 *
 * Two things make this work rather than just look nice.
 *
 * **It answers to both voices.** When the tutor speaks the strands ride its output level;
 * when the learner speaks they ride the microphone, and the palette shifts to pink. That is
 * what makes the screen read as a conversation instead of a speaker with a visualiser on it.
 *
 * **Nothing here re-renders per frame.** The audio level is read through a getter inside
 * Strands' own rAF loop via `liveRef`. This component renders when the *phase* changes —
 * five or six times a minute — and not once in between, which matters because it sits beside
 * a live WebRTC encode and a Monaco instance.
 *
 * `fitSingleRibbon` is not optional. The shader's taper envelope repeats once `uv.x` leaves
 * its first lobe, so in any wide container the effect tiles into a row of lens shapes and
 * reads as a rendering glitch. See that prop's docstring in `Strands.tsx`.
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

/** Phases where the status dot should pulse, i.e. something is actively happening. */
const LIVE_PHASES = new Set<TutorPhase>([
  "connecting",
  "listening",
  "student-speaking",
  "thinking",
  "speaking",
]);

export function TutorVoice({
  phase,
  getLevels,
  /** Fills its parent. The room gives it the whole stage while the canvas is empty. */
  height = "100%",
  showLabel = true,
}: {
  phase: TutorPhase;
  getLevels: () => { mic: number; tutor: number };
  height?: number | string;
  showLabel?: boolean;
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

      // Ride whichever side is live. When neither is, sit at a low idle so the ribbon still
      // breathes rather than freezing into a static image.
      const target =
        current === "speaking"
          ? levels.tutor
          : current === "student-speaking"
            ? levels.mic
            : 0.05;

      // Asymmetric smoothing: snap up on an onset so a syllable actually lands, ease down so
      // the ribbon does not flicker on every gap between words.
      const boosted = Math.min(1, target * 3.1);
      const k = boosted > smoothedRef.current ? 0.45 : 0.12;
      smoothedRef.current += (boosted - smoothedRef.current) * k;
      const amp = smoothedRef.current;

      liveRef.current = {
        colors: look.colors,
        speed: look.speed + amp * 0.6,
        waviness: look.waviness + amp * 0.75,
        // A wide amplitude range is what makes speech legible in the ribbon rather than a
        // constant shimmer: quiet is nearly flat, loud genuinely swells.
        amplitude: 0.7 + amp * 3.0,
        thickness: 0.6 + amp * 0.7,
        glow: 2.4 + amp * 2.0,
        intensity: 0.5 + amp * 0.5,
        saturation: look.saturation,
      };

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, [getLevels, reduceMotion]);

  const look = PHASE_LOOK[phase] ?? PHASE_LOOK.idle;
  const isLive = LIVE_PHASES.has(phase);

  return (
    <Box sx={{ position: "relative", width: "100%", height }}>
      <Strands
        colors={look.colors}
        count={look.count}
        speed={look.speed}
        waviness={look.waviness}
        saturation={look.saturation}
        amplitude={reduceMotion ? 0.7 : 1}
        thickness={0.7}
        glow={2.6}
        taper={2.2}
        spread={1}
        intensity={0.6}
        opacity={1}
        scale={1.35}
        fitSingleRibbon
        liveRef={reduceMotion ? undefined : (liveRef as { current: StrandsLive })}
        paused={reduceMotion}
      />

      {showLabel ? (
        <Box
          sx={{
            position: "absolute",
            left: "50%",
            bottom: 0,
            transform: "translateX(-50%)",
            display: "flex",
            alignItems: "center",
            gap: 1,
            px: 1.75,
            py: 0.75,
            borderRadius: 9999,
            bgcolor: "rgba(13,7,32,0.62)",
            border: "1px solid rgba(255,255,255,0.14)",
            pointerEvents: "none",
          }}
        >
          <Box
            sx={{
              width: 7,
              height: 7,
              borderRadius: "50%",
              bgcolor: phase === "student-speaking" ? "#f472b6" : "#a855f7",
              animation:
                isLive && !reduceMotion ? "tutorPulse 1.4s ease-in-out infinite" : "none",
              "@keyframes tutorPulse": {
                "0%, 100%": { opacity: 1, transform: "scale(1)" },
                "50%": { opacity: 0.45, transform: "scale(0.75)" },
              },
            }}
          />
          <Typography
            sx={{
              fontSize: "0.76rem",
              fontWeight: 600,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              color: "rgba(255,255,255,0.95)",
              whiteSpace: "nowrap",
              '[dir="rtl"] &': { letterSpacing: "normal", textTransform: "none" },
            }}
          >
            {PHASE_LABEL[phase]}
          </Typography>
        </Box>
      ) : null}
    </Box>
  );
}
