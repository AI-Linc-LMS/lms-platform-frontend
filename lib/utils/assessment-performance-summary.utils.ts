import type { AssessmentResult } from "@/lib/services/assessment.service";

export type PerformanceTone = "danger" | "warning" | "success";

export function getPerformanceTier(stats: AssessmentResult["stats"]): {
  label: string;
  tone: PerformanceTone;
} {
  const maxM = Math.max(stats?.maximum_marks || 1, 1e-6);
  const scorePct = (stats?.score / maxM) * 100;
  const acc = stats?.accuracy_percent || 0;

  if (acc < 40 || scorePct < 22) {
    return { label: "Needs Improvement", tone: "danger" };
  }
  if (acc < 65 || scorePct < 52) {
    return { label: "Good", tone: "warning" };
  }
  return { label: "Strong Performance", tone: "success" };
}

export function humanizeAssessmentStatus(status: string): string {
  if (!status?.trim()) return "—";
  return status.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

/** e.g. 6.0 / 40 */
export function formatScoreVersusMax(score: number, max: number): string {
  const s = (Number.isFinite(score) ? score : 0).toFixed(1);
  const m = Number.isFinite(max) ? String(Math.round(max)) : "0";
  return `${s} / ${m}`;
}

/** Score as % of max marks, one decimal */
export function formatScoreAttainmentPercent(
  stats: AssessmentResult["stats"],
): string {
  const maxM = Math.max(stats?.maximum_marks || 1, 1e-6);
  const p = ((stats?.score ?? 0) / maxM) * 100;
  return `${(Number.isFinite(p) ? p : 0).toFixed(1)}%`;
}

export function formatAccuracyReportPercent(n: number): string {
  if (!Number.isFinite(n)) return "0.00%";
  return `${n.toFixed(2)}%`;
}

export function formatPlacementReportPercent(n: number): string {
  if (!Number.isFinite(n)) return "0.0%";
  return `${n.toFixed(1)}%`;
}

export function formatPercentileReport(n: number): string {
  if (!Number.isFinite(n)) return "0.0%";
  return `${Math.min(100, n).toFixed(1)}%`;
}

/** PDF RGB */
export const PERFORMANCE_TONE_PDF = {
  danger: {
    text: [185, 28, 28] as const,
    bg: [254, 226, 226] as const,
    border: [248, 113, 113] as const,
  },
  warning: {
    text: [180, 83, 9] as const,
    bg: [255, 247, 237] as const,
    border: [251, 191, 36] as const,
  },
  success: {
    text: [21, 128, 61] as const,
    bg: [220, 252, 231] as const,
    border: [74, 222, 128] as const,
  },
} as const;

export const STATUS_INFO_PDF = {
  text: [29, 78, 216] as const,
  bg: [239, 246, 255] as const,
  border: [96, 165, 250] as const,
} as const;

/** Submission / workflow status → badge palette */
export type SubmissionBadgeKind = "success" | "warning" | "info" | "neutral";

export function getSubmissionBadgeKind(status: string): SubmissionBadgeKind {
  const s = (status || "").toLowerCase();
  if (s.includes("fail") || s.includes("reject") || s.includes("cancel")) {
    return "neutral";
  }
  if (s.includes("complete") || s.includes("submit")) {
    return "success";
  }
  if (s.includes("progress") || s.includes("draft") || s.includes("start")) {
    return "warning";
  }
  return "info";
}

export const SUBMISSION_BADGE_PDF = {
  success: {
    text: [21, 128, 61] as const,
    bg: [220, 252, 231] as const,
    border: [74, 222, 128] as const,
  },
  warning: {
    text: [180, 83, 9] as const,
    bg: [255, 247, 237] as const,
    border: [251, 191, 36] as const,
  },
  info: STATUS_INFO_PDF,
  neutral: {
    text: [71, 85, 105] as const,
    bg: [241, 245, 249] as const,
    border: [203, 213, 225] as const,
  },
} as const;

/** Web hex */
export const PERFORMANCE_TONE_HEX = {
  danger: { text: "#b91c1c", bg: "#fee2e2", border: "#f87171" },
  warning: { text: "#b45309", bg: "#fff7ed", border: "#fbbf24" },
  success: { text: "#15803d", bg: "#dcfce7", border: "#4ade80" },
} as const;

export const STATUS_INFO_HEX = {
  text: "#1d4ed8",
  bg: "#eff6ff",
  border: "#60a5fa",
} as const;

export const SUBMISSION_BADGE_HEX: Record<
  SubmissionBadgeKind,
  { text: string; bg: string; border: string }
> = {
  success: { text: "#15803d", bg: "#dcfce7", border: "#4ade80" },
  warning: { text: "#b45309", bg: "#fff7ed", border: "#fbbf24" },
  info: STATUS_INFO_HEX,
  neutral: { text: "#475569", bg: "#f1f5f9", border: "#cbd5e1" },
};
