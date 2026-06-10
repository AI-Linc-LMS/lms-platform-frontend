"use client";

import type { ReactNode } from "react";
import { SectionShell } from "@/components/scorecard/shared";

/**
 * The signature radial-mesh backdrop for the Adaptive Quiz module — indigo,
 * purple, and pink blooms that establish the module's identity at a glance.
 * Reused across every adaptive surface so the student and admin pages feel
 * like part of the same atlas as the scorecard.
 */
export const ADAPTIVE_RADIAL_MESH = [
  "radial-gradient(circle at 8% 0%, color-mix(in srgb, #6366f1 22%, transparent) 0%, transparent 55%)",
  "radial-gradient(circle at 95% 5%, color-mix(in srgb, #ec4899 18%, transparent) 0%, transparent 55%)",
  "radial-gradient(circle at 50% 110%, color-mix(in srgb, #a855f7 22%, transparent) 0%, transparent 60%)",
];

interface AdaptiveSectionShellProps {
  /** Optional override — reach into the scorecard SectionShell directly for
   *  one-off variations. Most callers should leave this alone. */
  radialMesh?: string[];
  meshOpacity?: number;
  children: ReactNode;
}

/** Adaptive Quiz module's signature card shell. Wraps the scorecard
 *  `SectionShell` with the indigo→purple→pink radial mesh so every page
 *  inherits the same backdrop without rewriting it. */
export function AdaptiveSectionShell({
  radialMesh = ADAPTIVE_RADIAL_MESH,
  meshOpacity = 0.55,
  children,
}: AdaptiveSectionShellProps) {
  return (
    <SectionShell radialMesh={radialMesh} meshOpacity={meshOpacity}>
      {children}
    </SectionShell>
  );
}

/** Bundle of accent values used by every AdaptiveSectionHero call. Mirrors the
 *  scorecard's per-section accent gradient convention. */
export const ADAPTIVE_ACCENTS = {
  indigo: { top: "#6366f1", bottom: "#4338ca" },
  purple: { top: "#a855f7", bottom: "#7c3aed" },
  pink: { top: "#ec4899", bottom: "#db2777" },
  emerald: { top: "#10b981", bottom: "#047857" },
} as const;

export type AdaptiveAccent = keyof typeof ADAPTIVE_ACCENTS;
