"use client";

import { ReactNode } from "react";
import { SectionHero } from "@/components/scorecard/shared";

/** Accent tones for the header's left strip / icon badge. */
const ACCENTS = {
  indigo: { top: "var(--accent-indigo)", bottom: "var(--accent-indigo-dark)" },
  purple: { top: "#a855f7", bottom: "#7c3aed" },
  pink: { top: "#ec4899", bottom: "#db2777" },
  emerald: { top: "#10b981", bottom: "#047857" },
  amber: { top: "#f59e0b", bottom: "#d97706" },
  cyan: { top: "#06b6d4", bottom: "#0891b2" },
  rose: { top: "#f43f5e", bottom: "#e11d48" },
} as const;

export type ModuleAccent = keyof typeof ACCENTS;

/**
 * The one page header used across every module (student + admin) so pages stay
 * consistent: an uppercase eyebrow (the module/section it belongs to), a big
 * bold title, a detailed one/two-line description, a coloured left accent bar
 * (or an icon badge), and a right-hand action slot — "not just a header, but
 * something you can act from".
 *
 * A thin wrapper over the existing SectionHero primitive so it inherits the
 * design system's spacing, entrance animation, and responsive type scale.
 */
export function ModulePageHeader({
  eyebrow,
  title,
  description,
  accent = "indigo",
  icon,
  action,
}: {
  /** Uppercase category, e.g. "LEARN" or "ASSESSMENT MANAGEMENT". */
  eyebrow: string;
  title: string;
  /** A real description of what the module does — not a one-liner label. */
  description?: string;
  accent?: ModuleAccent;
  /** Optional Iconify icon → shows an icon badge instead of the accent bar. */
  icon?: string;
  /** Right-side action(s): a button, menu, or any node. */
  action?: ReactNode;
}) {
  const tone = ACCENTS[accent];
  return (
    <SectionHero
      chapter={eyebrow}
      title={title}
      subtitle={description}
      accentTop={tone.top}
      accentBottom={tone.bottom}
      iconBadge={
        icon
          ? {
              icon,
              gradient: `linear-gradient(135deg, ${tone.top} 0%, ${tone.bottom} 100%)`,
            }
          : undefined
      }
      rightSlot={action}
    />
  );
}
