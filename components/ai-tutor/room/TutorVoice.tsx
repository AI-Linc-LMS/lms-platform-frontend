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

/**
 * Per-phase look.
 *
 * Every palette leads with a near-white so the ribbon has a hot core, then falls through
 * lavender into a cooler indigo or cyan at the tapered ends. That gradient across the strand
 * is what makes it read as light rather than as a coloured line; a single-hue palette rendered
 * flat and plasticky no matter how much glow was thrown at it.
 *
 * The shader distributes a palette along each strand via `uv.x * 0.30` plus a per-strand
 * offset, so more entries means more visible colour, not just a different colour.
 *
 * Violet is the tutor and pink is the learner. That distinction is the only thing the colour
 * has to communicate, so the two never share their second hue.
 */
/**
 * Per-phase look, on the glass-orb preset.
 *
 * The palette is fixed - orange, violet, cyan - and deliberately NOT varied per phase. Rotating
 * hues inside a refracting sphere reads as the glass changing material rather than as the tutor
 * changing state, which is the opposite of informative.
 *
 * State is carried by MOTION instead, which is also what was asked for: the orb turns over faster
 * when someone is talking. `count` and `waviness` shift with it so a fast orb also looks busier,
 * and the learner is distinguished from the tutor by being quicker and more agitated rather than
 * by being a different colour.
 */
const PALETTE = ["#F97316", "#7C3AED", "#06B6D4"];

const PHASE_LOOK: Record<
  TutorPhase,
  { colors: string[]; count: number; speed: number; waviness: number; saturation: number }
> = {
  idle: { colors: PALETTE, count: 3, speed: 0.18, waviness: 1.3, saturation: 1.5 },
  starting: { colors: PALETTE, count: 3, speed: 0.34, waviness: 1.4, saturation: 1.5 },
  connecting: { colors: PALETTE, count: 3, speed: 0.7, waviness: 1.55, saturation: 1.45 },
  listening: { colors: PALETTE, count: 3, speed: 0.26, waviness: 1.35, saturation: 1.5 },
  // The learner: quicker and more agitated than the tutor, same glass.
  "student-speaking": { colors: PALETTE, count: 3, speed: 1.15, waviness: 1.95, saturation: 1.6 },
  thinking: { colors: PALETTE, count: 3, speed: 1.5, waviness: 1.8, saturation: 1.45 },
  speaking: { colors: PALETTE, count: 3, speed: 0.8, waviness: 1.6, saturation: 1.5 },
  ending: { colors: PALETTE, count: 2, speed: 0.14, waviness: 1.0, saturation: 0.8 },
  ended: { colors: PALETTE, count: 2, speed: 0.1, waviness: 0.9, saturation: 0.5 },
  failed: { colors: ["#FCA5A5", "#DC2626", "#7C3AED"], count: 2, speed: 0.12, waviness: 1.0, saturation: 1.0 },
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
        /**
         * Speed carries the voice. This was the explicit ask, and it suits the orb: a sphere of
         * moving light reads its energy from how fast the bands turn over, far more than from how
         * far they travel. It also cannot push anything out of frame, because the glass masks
         * everything outside its own radius.
         */
        speed: look.speed + amp * 1.6,
        waviness: look.waviness + amp * 0.35,
        // Amplitude and thickness stay near the preset. Inside a refracting sphere a big swing
        // just smears against the rim rather than reading as loudness.
        amplitude: 0.8 + amp * 0.25,
        thickness: 1.0,
        glow: 2.7 + amp * 0.5,
        intensity: 0.4 + amp * 0.25,
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
      {/* The glass-orb preset.

          `fitSingleRibbon` is deliberately absent. It computes `uScale` from the container's
          aspect ratio to keep a full-width ribbon from tiling, and that is the wrong problem
          here: the orb is a circle whose radius comes from `glassSize`, so the sphere bounds the
          visual and `scale` stays a fixed 1.2. Leaving the fit on would fight the preset and
          stretch the bands inside the glass on a wide container. */}
      <Strands
        colors={look.colors}
        count={look.count}
        speed={look.speed}
        waviness={look.waviness}
        saturation={look.saturation}
        amplitude={reduceMotion ? 0.7 : 0.8}
        thickness={1}
        glow={2.7}
        taper={6}
        spread={1.1}
        intensity={0.4}
        opacity={1}
        scale={1.2}
        glass
        refraction={1.05}
        dispersion={1.3}
        glassSize={0.54}
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
