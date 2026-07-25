"use client";

import type { ReactNode } from "react";
import { SectionHero } from "@/components/scorecard/shared";
import { ADAPTIVE_ACCENTS, type AdaptiveAccent } from "./AdaptiveSectionShell";

interface AdaptiveSectionHeroProps {
  chapter: string;
  title: string;
  subtitle?: string;
  accent?: AdaptiveAccent;
  /** Iconify name shown in the gradient badge - pick something from MDI. */
  icon?: string;
  rightSlot?: ReactNode;
}

/**
 * Adaptive Quiz wrapper around the scorecard `SectionHero`. Defaults the
 * iconBadge gradient and accent strip to one of the module's canonical
 * accent colors, so every page header reads as the same module.
 */
export function AdaptiveSectionHero({
  chapter,
  title,
  subtitle,
  accent = "purple",
  icon = "mdi:robot-happy-outline",
  rightSlot,
}: AdaptiveSectionHeroProps) {
  const tone = ADAPTIVE_ACCENTS[accent];
  return (
    <SectionHero
      chapter={chapter}
      title={title}
      subtitle={subtitle}
      accentTop={tone.top}
      accentBottom={tone.bottom}
      iconBadge={{
        icon,
        gradient: `linear-gradient(135deg, ${tone.top} 0%, ${tone.bottom} 100%)`,
        shadow: `0 18px 32px -16px color-mix(in srgb, ${tone.top} 60%, transparent)`,
      }}
      rightSlot={rightSlot}
    />
  );
}
