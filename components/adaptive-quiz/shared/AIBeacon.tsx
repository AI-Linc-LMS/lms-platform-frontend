"use client";

import { Box } from "@mui/material";
import { motion, useReducedMotion } from "framer-motion";

interface AIBeaconProps {
  size?: number;
  /** When set, the beacon's outer ring pulses at this BPM. Defaults to a calm 24bpm. */
  bpm?: number;
}

/**
 * Small animated orb avatar — the visual signature of the adaptive engine.
 *
 * Used inside the Difficulty Pulse strip and the AI Tutor sidecar header.
 * Visual language: indigo→pink gradient (matches the scorecard accent palette),
 * a slow ambient pulse, and a tiny inner highlight so it reads as a "living"
 * surface instead of a static dot.
 */
export function AIBeacon({ size = 28, bpm = 24 }: AIBeaconProps) {
  const reduce = useReducedMotion();
  const periodSec = 60 / Math.max(1, bpm);

  return (
    <Box
      sx={{
        position: "relative",
        width: size,
        height: size,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
      }}
    >
      {/* Pulse ring */}
      <Box
        component={motion.div}
        aria-hidden
        sx={{
          position: "absolute",
          inset: 0,
          borderRadius: "50%",
          background:
            "radial-gradient(circle, color-mix(in srgb, var(--accent-purple, #6366f1) 35%, transparent) 0%, transparent 60%)",
          filter: "blur(2px)",
        }}
        animate={reduce ? undefined : { scale: [1, 1.4, 1], opacity: [0.85, 0.25, 0.85] }}
        transition={reduce ? undefined : { duration: periodSec, repeat: Infinity, ease: "easeInOut" }}
      />
      {/* Core orb */}
      <Box
        component={motion.div}
        sx={{
          position: "relative",
          width: size * 0.62,
          height: size * 0.62,
          borderRadius: "50%",
          background:
            "linear-gradient(135deg, var(--accent-indigo, #6366f1) 0%, var(--accent-purple, #a855f7) 55%, #ec4899 100%)",
          boxShadow: "0 0 0 1px color-mix(in srgb, white 25%, transparent) inset",
        }}
        animate={reduce ? undefined : { y: [0, -1.5, 0] }}
        transition={reduce ? undefined : { duration: periodSec * 0.85, repeat: Infinity, ease: "easeInOut" }}
      />
      {/* Tiny specular highlight */}
      <Box
        aria-hidden
        sx={{
          position: "absolute",
          top: size * 0.22,
          left: size * 0.32,
          width: size * 0.12,
          height: size * 0.12,
          borderRadius: "50%",
          background: "rgba(255,255,255,0.85)",
          filter: "blur(0.5px)",
        }}
      />
    </Box>
  );
}
