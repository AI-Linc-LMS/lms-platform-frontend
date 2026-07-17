"use client";

import { AnimatedRing } from "@/components/scorecard/shared";

interface GradientRingProps {
  /** 0–100 percentage. */
  value: number;
  size?: number;
  strokeWidth?: number;
  /** Caption shown under the number (e.g. "PASS"). */
  caption?: string;
  valueFontSize?: number;
  glow?: boolean;
  /** Override the gradient stops (defaults to the signature violet→pink). */
  from?: string;
  to?: string;
}

/**
 * The signature violet→pink percentage ring — a thin wrapper over the scorecard
 * AnimatedRing fed the AI gradient stops, used for pass-rate / completion visuals.
 */
export function GradientRing({
  value,
  size = 168,
  strokeWidth = 12,
  caption,
  valueFontSize,
  glow = true,
  from = "#7c3aed",
  to = "#ec4899",
}: GradientRingProps) {
  return (
    <AnimatedRing
      value={value}
      size={size}
      strokeWidth={strokeWidth}
      color={from}
      colorEnd={to}
      caption={caption}
      valueFontSize={valueFontSize}
      glow={glow}
    />
  );
}
