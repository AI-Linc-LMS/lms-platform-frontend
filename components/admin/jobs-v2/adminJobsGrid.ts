import type { SxProps, Theme } from "@mui/material/styles";

export type AdminJobsTab = "platform" | "available";

export const ADMIN_JOB_STATUS_STYLES: Record<string, { bg: string; color: string }> = {
  active: { bg: "rgba(34, 197, 94, 0.12)", color: "#16a34a" },
  inactive: { bg: "rgba(99, 102, 241, 0.12)", color: "#6366f1" },
  closed: { bg: "rgba(100, 116, 139, 0.12)", color: "#64748b" },
  completed: { bg: "rgba(34, 197, 94, 0.08)", color: "#15803d" },
  on_hold: { bg: "rgba(245, 158, 11, 0.12)", color: "#d97706" },
};

export const ADMIN_JOB_STATUS_OPTIONS = [
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
  { value: "closed", label: "Closed" },
  { value: "completed", label: "Completed" },
  { value: "on_hold", label: "On Hold" },
] as const;

export const ADMIN_JOBS_HEADER_LABEL_SX: SxProps<Theme> = {
  fontWeight: 700,
  color: "#64748b",
  textTransform: "uppercase",
  letterSpacing: "0.05em",
  fontSize: "0.65rem",
  lineHeight: 1.2,
  wordBreak: "break-word",
  overflowWrap: "anywhere",
};

export function getShowAdminJobDateColumns(
  adminTab: AdminJobsTab,
  platformJobCount: number
): boolean {
  return !(adminTab === "platform" && platformJobCount < 10);
}

export function getAdminJobsGridTemplateColumns(
  adminTab: AdminJobsTab,
  showDateColumns: boolean
): string {
  if (adminTab === "available") {
    return showDateColumns
      ? "40px 52px minmax(160px,1.9fr) minmax(140px,1.35fr) minmax(112px,1.05fr) minmax(128px,1.05fr) 96px minmax(96px,1.1fr) minmax(64px,0.58fr) 44px"
      : "40px 52px minmax(160px,2fr) minmax(140px,1.4fr) minmax(112px,1.1fr) minmax(128px,1.1fr) 96px 44px";
  }
  return showDateColumns
    ? "40px 52px minmax(160px,1.8fr) minmax(140px,1.25fr) minmax(112px,1fr) minmax(112px,0.95fr) minmax(120px,1fr) 96px minmax(88px,0.9fr) minmax(88px,0.9fr) 44px"
    : "40px 52px minmax(160px,1.9fr) minmax(140px,1.3fr) minmax(112px,1.05fr) minmax(112px,0.95fr) minmax(120px,1.05fr) 96px 44px";
}

export function formatAdminJobsDate(d?: string): string {
  if (!d) return "-";
  try {
    return new Date(d).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return d;
  }
}

export function daysUntilAdminJobDeadline(d?: string): number | null {
  if (!d) return null;
  try {
    const now = new Date();
    const deadline = new Date(d);
    return Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  } catch {
    return null;
  }
}

export const ADMIN_PAGE_SIZE_OPTIONS = [10, 25, 50] as const;
export const DEFAULT_ADMIN_PAGE_SIZE = 10;
