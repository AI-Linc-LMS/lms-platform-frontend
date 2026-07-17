"use client";

import type { ReactNode } from "react";
import { SectionShell } from "@/components/scorecard/shared";

/**
 * The assessment-management module's signature card shell + accents, mirroring the
 * adaptive-course/quiz pattern (which wraps the scorecard `SectionShell`). A cool
 * indigo→sky→teal radial mesh gives every assessment admin surface one identity, the
 * same way the adaptive module has its indigo→purple→pink mesh.
 */
export const ASSESSMENT_RADIAL_MESH = [
  "radial-gradient(circle at 8% 0%, color-mix(in srgb, #6366f1 20%, transparent) 0%, transparent 55%)",
  "radial-gradient(circle at 95% 5%, color-mix(in srgb, #0ea5e9 16%, transparent) 0%, transparent 55%)",
  "radial-gradient(circle at 50% 110%, color-mix(in srgb, #14b8a6 18%, transparent) 0%, transparent 60%)",
];

interface AssessmentSectionShellProps {
  radialMesh?: string[];
  meshOpacity?: number;
  children: ReactNode;
}

export function AssessmentSectionShell({
  radialMesh = ASSESSMENT_RADIAL_MESH,
  meshOpacity = 0.5,
  children,
}: AssessmentSectionShellProps) {
  return (
    <SectionShell radialMesh={radialMesh} meshOpacity={meshOpacity}>
      {children}
    </SectionShell>
  );
}

/** Per-surface accent gradients, matching the scorecard/adaptive convention. */
export const ASSESSMENT_ACCENTS = {
  indigo: { top: "#6366f1", bottom: "#4338ca" },
  violet: { top: "#7c3aed", bottom: "#6d28d9" },
  sky: { top: "#0ea5e9", bottom: "#0369a1" },
  teal: { top: "#14b8a6", bottom: "#0f766e" },
  amber: { top: "#f59e0b", bottom: "#b45309" },
  rose: { top: "#f43f5e", bottom: "#be123c" },
} as const;

export type AssessmentAccent = keyof typeof ASSESSMENT_ACCENTS;
