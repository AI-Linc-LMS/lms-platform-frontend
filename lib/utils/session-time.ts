/**
 * Single source of truth for rendering a live session's time.
 *
 * A session now carries the IANA `timezone` it was scheduled in (the zone the admin/instructor
 * picked). We always show the time in THAT zone first, then — only when the viewer sits in a
 * different zone — append their own local wall-clock, e.g.:
 *
 *     "Jul 27, 2026, 6:00 PM GMT+4 (8:30 PM your time)"
 *
 * Every live-session surface (student, admin, instructor) routes through here so the dual-zone
 * rule stays consistent; the per-surface date/time granularity is passed via `format`.
 */

/** The viewer's own IANA zone (best-effort; empty string if the platform can't resolve it). */
export function viewerTimeZone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "";
  } catch {
    return "";
  }
}

/** Validate/normalize a session tz; returns undefined for blank or unknown zones. */
function safeZone(tz?: string | null): string | undefined {
  const z = (tz || "").trim();
  if (!z) return undefined;
  try {
    // Throws RangeError on an unknown IANA id.
    new Intl.DateTimeFormat("en-US", { timeZone: z });
    return z;
  } catch {
    return undefined;
  }
}

const DEFAULT_FORMAT: Intl.DateTimeFormatOptions = {
  year: "numeric",
  month: "short",
  day: "numeric",
  hour: "numeric",
  minute: "2-digit",
};

export interface SessionTimeOptions {
  /** Intl parts to render (date/time granularity). Defaults to "Mon D, YYYY, H:MM AM". */
  format?: Intl.DateTimeFormatOptions;
  /** Append "(H:MM AM your time)" when the viewer's zone differs. Default true. */
  dual?: boolean;
  /** Append the session zone's short label (e.g. GMT+4 / IST) to the primary. Default true. */
  showZone?: boolean;
}

/**
 * Format `iso` in the session's own timezone, appending the viewer's local time when it differs.
 * Falls back to the viewer's local zone (no dual, no misleading label) when the session has no tz.
 */
export function formatSessionTime(
  iso: string | null | undefined,
  sessionTz?: string | null,
  opts?: SessionTimeOptions
): string {
  if (!iso) return "-";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "-";

  const fmt = opts?.format ?? DEFAULT_FORMAT;
  const dual = opts?.dual ?? true;
  const showZone = opts?.showZone ?? true;

  const sTz = safeZone(sessionTz);
  const vTz = viewerTimeZone();

  // Primary: rendered in the session's own zone (or the viewer's when none is stored).
  const primaryOpts: Intl.DateTimeFormatOptions = { ...fmt };
  if (sTz) primaryOpts.timeZone = sTz;
  if (showZone) primaryOpts.timeZoneName = "short";
  const primary = new Intl.DateTimeFormat("en-US", primaryOpts).format(d);

  if (!dual || !sTz) return primary;

  // Only add "your time" when the session zone actually displays differently to the viewer's.
  const inSession = new Intl.DateTimeFormat("en-US", { ...fmt, timeZone: sTz }).format(d);
  const inViewer = new Intl.DateTimeFormat("en-US", { ...fmt, timeZone: vTz || undefined }).format(d);
  if (inSession === inViewer) return primary;

  const localTimeOnly = new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    timeZone: vTz || undefined,
  }).format(d);
  return `${primary} (${localTimeOnly} your time)`;
}

export interface SessionTimeParts {
  /** "Jul 27" in the session zone. */
  date: string;
  /** "6:00 PM" in the session zone. */
  time: string;
  /** Session zone short label ("GMT+4", "IST") — "" when the session has no stored zone. */
  zoneAbbr: string;
  /** Viewer's local "8:30 PM", only when it differs from the session time; else null. */
  viewerTime: string | null;
}

/** Split a session's time into pieces for compact strips (date / time / zone / viewer conversion). */
export function sessionTimeParts(iso: string | null | undefined, sessionTz?: string | null): SessionTimeParts {
  const empty: SessionTimeParts = { date: "-", time: "-", zoneAbbr: "", viewerTime: null };
  if (!iso) return empty;
  const d = new Date(iso);
  if (isNaN(d.getTime())) return empty;

  const sTz = safeZone(sessionTz);
  const vTz = viewerTimeZone();
  const date = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", timeZone: sTz }).format(d);
  const time = new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit", timeZone: sTz }).format(d);

  let zoneAbbr = "";
  if (sTz) {
    const parts = new Intl.DateTimeFormat("en-US", { hour: "numeric", timeZoneName: "short", timeZone: sTz }).formatToParts(d);
    zoneAbbr = parts.find((p) => p.type === "timeZoneName")?.value || "";
  }

  let viewerTime: string | null = null;
  if (sTz) {
    const inViewer = new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit", timeZone: vTz || undefined }).format(d);
    if (inViewer !== time) viewerTime = inViewer;
  }
  return { date, time, zoneAbbr, viewerTime };
}

/** Compact "H:MM AM" in the session zone + viewer suffix — for card chips where the date is elsewhere. */
export function formatSessionClock(iso: string | null | undefined, sessionTz?: string | null): string {
  return formatSessionTime(iso, sessionTz, {
    format: { hour: "numeric", minute: "2-digit" },
  });
}

/** A zone's offset from UTC (minutes) at a given instant — DST-correct for the instant supplied. */
function tzOffsetMinutes(date: Date, tz: string): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    hour12: false,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).formatToParts(date);
  const map: Record<string, number> = {};
  for (const p of parts) if (p.type !== "literal") map[p.type] = Number(p.value);
  const asUTC = Date.UTC(map.year, map.month - 1, map.day, map.hour % 24, map.minute, map.second);
  return (asUTC - date.getTime()) / 60000;
}

/** Render an absolute instant as a `datetime-local` wall-clock IN the given zone (not the browser's). */
export function toLocalInputInZone(iso: string | null | undefined, tz?: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  const parts = new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: safeZone(tz),
  }).formatToParts(d);
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
  const hour = get("hour") === "24" ? "00" : get("hour");
  return `${get("year")}-${get("month")}-${get("day")}T${hour}:${get("minute")}`;
}

/**
 * Convert a naive `datetime-local` wall-clock ("YYYY-MM-DDTHH:mm") interpreted in `tz` to the correct
 * absolute UTC ISO string. Self-contained (no server round-trip) — for edit paths that must send Zoom
 * an unambiguous instant. Falls back to browser-local interpretation when `tz` is blank/unknown.
 */
export function wallClockToUtcIso(local: string, tz?: string | null): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/.exec(local);
  const z = safeZone(tz);
  if (!m || !z) return new Date(local).toISOString();
  const [, y, mo, da, h, mi] = m.map(Number);
  const guess = Date.UTC(y, mo - 1, da, h, mi);
  const offset = tzOffsetMinutes(new Date(guess), z);
  return new Date(guess - offset * 60000).toISOString();
}

/**
 * Format a naive `datetime-local` value ("YYYY-MM-DDTHH:mm") as its literal wall-clock, with no zone
 * shift, optionally tagged with the chosen zone. For create/edit previews where the value hasn't yet
 * become an absolute instant.
 */
export function formatNaiveWallClock(local: string, tzLabel?: string | null): string {
  if (!local) return "-";
  const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/.exec(local);
  if (!m) return local;
  const [, y, mo, da, h, mi] = m;
  const d = new Date(Date.UTC(+y, +mo - 1, +da, +h, +mi));
  const base = new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: "UTC",
  }).format(d);
  return tzLabel ? `${base} (${tzLabel})` : base;
}

/** Curated IANA zones for the create/edit pickers — the platform's actual tenant regions first. */
export const COMMON_TIMEZONES: { value: string; label: string }[] = [
  { value: "Asia/Kolkata", label: "India (IST)" },
  { value: "Asia/Riyadh", label: "Saudi Arabia (AST)" },
  { value: "Asia/Dubai", label: "UAE / Gulf (GST)" },
  { value: "Asia/Qatar", label: "Qatar" },
  { value: "Asia/Kuwait", label: "Kuwait" },
  { value: "Asia/Bahrain", label: "Bahrain" },
  { value: "Asia/Karachi", label: "Pakistan (PKT)" },
  { value: "Asia/Dhaka", label: "Bangladesh (BST)" },
  { value: "Asia/Singapore", label: "Singapore (SGT)" },
  { value: "Asia/Manila", label: "Philippines (PHT)" },
  { value: "Europe/London", label: "UK (GMT/BST)" },
  { value: "Europe/Berlin", label: "Central Europe (CET)" },
  { value: "America/New_York", label: "US Eastern (ET)" },
  { value: "America/Chicago", label: "US Central (CT)" },
  { value: "America/Los_Angeles", label: "US Pacific (PT)" },
  { value: "Australia/Sydney", label: "Sydney (AEST)" },
  { value: "UTC", label: "UTC" },
];

/**
 * A picker-ready zone list guaranteed to include `current` (the resolved viewer/tenant zone) so the
 * default selection is always representable even for a zone not in the curated list.
 */
export function timezoneOptions(current?: string | null): { value: string; label: string }[] {
  const cur = safeZone(current);
  if (cur && !COMMON_TIMEZONES.some((z) => z.value === cur)) {
    return [{ value: cur, label: cur.replace(/_/g, " ") }, ...COMMON_TIMEZONES];
  }
  return COMMON_TIMEZONES;
}
