/**
 * Section-wise performance table: row accents + status labels
 * (shared by analytics UI and PDF).
 */

export type SectionPerformanceStatusKind =
  | "critical"
  | "moderate"
  | "strongest";

export const SECTION_ROW_ACCENTS = [
  {
    solid: "#2563eb",
    light: "#dbeafe",
    text: "#1e40af",
    solidRgb: [37, 99, 235] as const,
    lightRgb: [219, 234, 254] as const,
    textRgb: [30, 64, 175] as const,
  },
  {
    solid: "#7c3aed",
    light: "#ede9fe",
    text: "#5b21b6",
    solidRgb: [124, 58, 237] as const,
    lightRgb: [237, 233, 254] as const,
    textRgb: [91, 33, 182] as const,
  },
  {
    solid: "#059669",
    light: "#d1fae5",
    text: "#065f46",
    solidRgb: [5, 150, 105] as const,
    lightRgb: [209, 250, 229] as const,
    textRgb: [6, 95, 70] as const,
  },
  {
    solid: "#dc2626",
    light: "#fee2e2",
    text: "#991b1b",
    solidRgb: [220, 38, 38] as const,
    lightRgb: [254, 226, 226] as const,
    textRgb: [153, 27, 27] as const,
  },
  {
    solid: "#d97706",
    light: "#ffedd5",
    text: "#9a3412",
    solidRgb: [217, 119, 6] as const,
    lightRgb: [255, 237, 213] as const,
    textRgb: [154, 52, 18] as const,
  },
] as const;

export type SectionRowAccent = (typeof SECTION_ROW_ACCENTS)[number];

export function sectionRowAccent(index: number): SectionRowAccent {
  return SECTION_ROW_ACCENTS[index % SECTION_ROW_ACCENTS.length]!;
}

export function maxSectionAvgPct(
  sections: readonly { average_percentage?: number | null }[],
): number {
  if (sections.length === 0) return 0;
  return Math.max(
    0,
    ...sections.map((s) =>
      s.average_percentage != null && Number.isFinite(s.average_percentage)
        ? s.average_percentage
        : 0,
    ),
  );
}

/**
 * Critical: under 40%, or cohort is weak (max still under 40%).
 * Strongest: tied for highest average % (when cohort has at least one section ≥ 40%).
 * Moderate: everything else in the “healthy” band.
 */
export function sectionPerformanceStatus(
  avgPct: number | null | undefined,
  maxAvgPctAmongSections: number,
): SectionPerformanceStatusKind {
  const p =
    avgPct != null && Number.isFinite(avgPct) ? Number(avgPct) : 0;
  if (maxAvgPctAmongSections < 40) return "critical";
  if (p < 40) return "critical";
  if (Math.abs(p - maxAvgPctAmongSections) < 0.051) return "strongest";
  return "moderate";
}

export function sectionPerformanceStatusLabel(
  kind: SectionPerformanceStatusKind,
): string {
  switch (kind) {
    case "critical":
      return "Critical gap";
    case "moderate":
      return "Moderate";
    case "strongest":
      return "Strongest";
  }
}

/** MUI-friendly status chip colors (filled pill). */
export const SECTION_STATUS_MUI: Record<
  SectionPerformanceStatusKind,
  { bgcolor: string; color: string }
> = {
  critical: { bgcolor: "#fee2e2", color: "#991b1b" },
  moderate: { bgcolor: "#ffedd5", color: "#9a3412" },
  strongest: { bgcolor: "#d1fae5", color: "#065f46" },
};

/** Filled status pill in vector PDF (matches SECTION_STATUS_MUI). */
export const SECTION_STATUS_PDF_RGB: Record<
  SectionPerformanceStatusKind,
  { bg: readonly [number, number, number]; fg: readonly [number, number, number] }
> = {
  critical: { bg: [254, 226, 226], fg: [153, 27, 27] },
  moderate: { bg: [255, 237, 213], fg: [154, 52, 18] },
  strongest: { bg: [209, 250, 229], fg: [6, 95, 70] },
};
