"use client";

import type { ReactNode } from "react";
import { SectionHero } from "@/components/scorecard/shared";
import { ASSESSMENT_ACCENTS, type AssessmentAccent } from "./AssessmentSectionShell";

interface AssessmentSectionHeroProps {
  /** Small eyebrow above the title (e.g. "ASSESSMENTS", "MANAGE · Testing 01"). */
  chapter: string;
  title: string;
  subtitle?: string;
  accent?: AssessmentAccent;
  /** Iconify (MDI) name for the gradient badge. */
  icon?: string;
  /** Right-aligned actions (primary button, status chips, etc.). */
  rightSlot?: ReactNode;
}

/**
 * The canonical assessment-admin page header. Wraps the scorecard `SectionHero`
 * (eyebrow + gradient icon badge + title + subtitle + rightSlot) with the module's
 * accent, replacing the bespoke gradient-clip `<Typography variant="h4">` headers.
 */
export function AssessmentSectionHero({
  chapter,
  title,
  subtitle,
  accent = "indigo",
  icon = "mdi:clipboard-text-outline",
  rightSlot,
}: AssessmentSectionHeroProps) {
  const tone = ASSESSMENT_ACCENTS[accent];
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
