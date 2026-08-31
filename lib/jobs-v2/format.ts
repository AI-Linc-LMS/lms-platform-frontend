/**
 * Jobs v2 — the one formatter.
 *
 * Four copies of `formatDate` and two of `getPostedLabel` lived across the student and admin
 * screens; they had already drifted (one hardcoded `en-IN`, one fabricated "Recently" for rows
 * with no date, one crashed on an invalid string). This module replaces all of them.
 *
 * Two rules the copies broke:
 *   1. **Locale comes from i18n, never a hardcoded `"en-IN"`.** An Arabic tenant reading Latin
 *      dates in a right-to-left column is the bug that motivated this.
 *   2. **A missing value returns `null`, never an invented label.** The caller omits the chip.
 *      `postedLabel` must not say "Recently" about a job whose date the API never sent.
 */

import i18n from "@/lib/i18n";

/** Whatever the API sends for a date: ISO string, epoch ms, Date, or nothing at all. */
export type DateInput = string | number | Date | null | undefined;

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

function locale(): string {
  return i18n?.language || "en";
}

function t(key: string, options?: Record<string, unknown>): string {
  return i18n.t(key, options) as unknown as string;
}

/** Parse defensively. An unparseable value is `null`, not `NaN` leaking into the UI. */
export function toDate(value: DateInput): Date | null {
  if (value === null || value === undefined || value === "") return null;
  const d = value instanceof Date ? value : new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

export interface FormatDateOptions {
  /** Append the time of day. */
  withTime?: boolean;
  /** What to render when there is no usable date. Defaults to an em dash. */
  fallback?: string;
  /** "short" (12 Mar 2026, default) | "long" (12 March 2026) | "numeric" (12/03/2026). */
  style?: "short" | "long" | "numeric";
}

/** The module's only date renderer. */
export function formatDate(value: DateInput, options: FormatDateOptions = {}): string {
  const { withTime = false, fallback = "—", style = "short" } = options;
  const d = toDate(value);
  if (!d) return fallback;
  const opts: Intl.DateTimeFormatOptions = {
    day: "numeric",
    month: style === "numeric" ? "numeric" : style === "long" ? "long" : "short",
    year: "numeric",
  };
  if (withTime) {
    opts.hour = "2-digit";
    opts.minute = "2-digit";
  }
  try {
    return new Intl.DateTimeFormat(locale(), opts).format(d);
  } catch {
    return d.toISOString().slice(0, 10);
  }
}

/**
 * "3 hours ago" / "in 2 days", locale-aware. Returns `null` for a missing or unparseable
 * value so the caller can drop the chip rather than print a placeholder.
 */
export function relativeTime(value: DateInput): string | null {
  const d = toDate(value);
  if (!d) return null;
  const diff = d.getTime() - Date.now();
  const abs = Math.abs(diff);
  let unit: Intl.RelativeTimeFormatUnit;
  let amount: number;
  if (abs < HOUR) {
    unit = "minute";
    amount = Math.round(diff / MINUTE);
  } else if (abs < DAY) {
    unit = "hour";
    amount = Math.round(diff / HOUR);
  } else if (abs < 30 * DAY) {
    unit = "day";
    amount = Math.round(diff / DAY);
  } else if (abs < 365 * DAY) {
    unit = "month";
    amount = Math.round(diff / (30 * DAY));
  } else {
    unit = "year";
    amount = Math.round(diff / (365 * DAY));
  }
  try {
    return new Intl.RelativeTimeFormat(locale(), { numeric: "auto" }).format(amount, unit);
  } catch {
    return formatDate(d);
  }
}

/**
 * "Posted 2 days ago". **Returns `null` when there is no date** — the old copies printed
 * "Recently", which told the learner something the API never said.
 */
export function postedLabel(value: DateInput): string | null {
  const when = relativeTime(value);
  if (!when) return null;
  return t("jobsV2.meta.posted", { when });
}

export type DeadlineUrgency = "none" | "soon" | "urgent" | "past";

export interface DeadlineLabel {
  text: string;
  urgency: DeadlineUrgency;
  /** Whole days remaining; negative once the deadline has passed. */
  daysLeft: number;
}

/**
 * The application deadline, with the urgency the card tints itself by.
 * `urgent` <= 2 days, `soon` <= 7 days, `past` once it is behind us.
 */
export function deadlineLabel(value: DateInput): DeadlineLabel | null {
  const d = toDate(value);
  if (!d) return null;
  const diff = d.getTime() - Date.now();
  const daysLeft = Math.ceil(diff / DAY);
  if (diff < 0) {
    return {
      text: t("jobsV2.meta.deadlinePassed", { date: formatDate(d) }),
      urgency: "past",
      daysLeft,
    };
  }
  const urgency: DeadlineUrgency = daysLeft <= 2 ? "urgent" : daysLeft <= 7 ? "soon" : "none";
  if (daysLeft <= 7) {
    const when = relativeTime(d) ?? formatDate(d);
    return { text: t("jobsV2.meta.deadlineSoon", { when }), urgency, daysLeft };
  }
  return { text: t("jobsV2.meta.deadline", { date: formatDate(d) }), urgency, daysLeft };
}

/** Locale-grouped integer. Used for every count in the module. */
export function formatCount(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) return "—";
  try {
    return new Intl.NumberFormat(locale()).format(value);
  } catch {
    return String(value);
  }
}

/** "Showing 21-40 of 137", tabular and locale-grouped. */
export function rangeLabel(page: number, pageSize: number, total: number): string {
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);
  return t("jobsV2.pagination.showing", {
    from: formatCount(from),
    to: formatCount(to),
    total: formatCount(total),
  });
}

const NOT_DISCLOSED = /^(not\s*disclosed|undisclosed|n\/?a|none|-)$/i;

/**
 * The API sends `salary` as a free-text string ("8-12 LPA", "Not disclosed", sometimes a bare
 * number). We never invent a currency: a numeric-only value is grouped for readability and
 * anything else is passed through trimmed. `null` means "say nothing".
 */
export function formatSalary(value: string | number | null | undefined): string | null {
  if (value === null || value === undefined) return null;
  if (typeof value === "number") {
    return Number.isFinite(value) ? formatCount(value) : null;
  }
  const raw = value.trim();
  if (!raw || NOT_DISCLOSED.test(raw)) return null;
  if (/^\d+$/.test(raw)) return formatCount(Number(raw));
  return raw;
}

/**
 * "0-1" becomes "0-1 years"; "2 yrs" is left alone. The board currently shows the raw value in
 * the closed Select and the suffixed one in the open list, which is the same string twice.
 */
export function formatExperience(value: string | number | null | undefined): string | null {
  if (value === null || value === undefined) return null;
  const raw = String(value).trim();
  if (!raw || NOT_DISCLOSED.test(raw)) return null;
  if (/(year|yr|سنة|سنوات)/i.test(raw)) return raw;
  if (/^[\d.]+\s*(-|–|to)?\s*[\d.]*\+?$/.test(raw)) {
    return t("jobsV2.meta.yearsRange", { range: raw });
  }
  return raw;
}

/** A single-line location string from whatever shape the API used. */
export function formatLocation(value: string | string[] | null | undefined): string | null {
  if (!value) return null;
  const parts = Array.isArray(value) ? value : [value];
  const cleaned = parts.map((p) => p?.trim()).filter((p): p is string => Boolean(p));
  return cleaned.length ? cleaned.join(", ") : null;
}

/** Bytes for the resume drop zone: "1.4 MB". */
export function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes < 0) return "—";
  const units = ["B", "KB", "MB", "GB"];
  let n = bytes;
  let i = 0;
  while (n >= 1024 && i < units.length - 1) {
    n /= 1024;
    i += 1;
  }
  const formatted = i === 0 ? String(Math.round(n)) : n.toFixed(n >= 10 ? 0 : 1);
  return `${formatted} ${units[i]}`;
}

/** Case-folded token used for skill equality. Substring matching is what we are replacing. */
export function foldToken(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}
