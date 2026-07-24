"use client";

import { Box } from "@mui/material";
import { Icon } from "@iconify/react";

interface AdaptiveCardBackdropProps {
  /** Primary hex accent - feeds the icon tint, glow, and gradient wash. */
  accent: string;
  /** Optional secondary hex - reserved for future use. */
  accentEnd?: string;
  /** Iconify name for the corner glyph. Pick something with rounded /
   *  organic geometry so the partial crop reads as decorative, not chopped. */
  watermarkIcon?: string;
  /** Icon size in pixels. The icon is positioned with negative top/right
   *  offsets so it bleeds half off the corner - the "chapter 2 bento" feel. */
  watermarkSize?: number;
}

/**
 * Decorative backdrop for adaptive-quiz cards, mirroring the scorecard
 * Chapter 2 BentoCard pattern:
 *
 *   1. A large, low-opacity icon glyph anchored to the top-right corner with
 *      negative offsets so it bleeds half off the edge.
 *   2. A blurred radial glow sitting behind the icon, giving it a soft halo.
 *   3. A diagonal gradient wash across the whole card surface (155° from
 *      accent-tinted corner toward transparent).
 *
 * All three layers are absolutely positioned and ``pointer-events: none`` so
 * card content over the top stays interactive.
 *
 * NOTE: the cards apply their own accent-tinted border and corner radius -
 * this component just paints the decoration.
 */
export function AdaptiveCardBackdrop({
  accent,
  watermarkIcon = "mdi:robot-happy-outline",
  watermarkSize = 200,
}: AdaptiveCardBackdropProps) {
  return (
    <>
      {/* Diagonal gradient wash - gives the whole card an accent-tinted bias
          toward the top-right corner. 155deg matches the BentoCard pattern. */}
      <Box
        aria-hidden
        sx={{
          position: "absolute",
          inset: 0,
          backgroundImage: `linear-gradient(155deg, color-mix(in srgb, ${accent} 10%, transparent) 0%, transparent 55%)`,
          pointerEvents: "none",
        }}
      />

      {/* Blurred radial glow behind the glyph */}
      <Box
        aria-hidden
        sx={{
          position: "absolute",
          top: -80,
          right: -80,
          width: 240,
          height: 240,
          borderRadius: "50%",
          background: `radial-gradient(circle, color-mix(in srgb, ${accent} 28%, transparent) 0%, transparent 65%)`,
          filter: "blur(28px)",
          pointerEvents: "none",
        }}
      />

      {/* Large decorative icon glyph - partly off-edge by design */}
      <Box
        aria-hidden
        sx={{
          position: "absolute",
          top: -32,
          right: -32,
          color: accent,
          opacity: 0.11,
          pointerEvents: "none",
          // Force the icon to its full size by sizing the wrapper too.
          width: watermarkSize,
          height: watermarkSize,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Icon
          icon={watermarkIcon}
          width={watermarkSize}
          height={watermarkSize}
        />
      </Box>
    </>
  );
}
