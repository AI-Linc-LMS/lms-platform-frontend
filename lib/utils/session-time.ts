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

/**
 * Formatter cache, keyed locale|zone|style.
 *
 * `new Intl.DateTimeFormat(...)` is the expensive part, and zoneLabel probes several locales per
 * call - uncached that is ~300us, so a 50-row list pays ~15ms for nothing. Caching the FORMATTER
 * rather than the result keeps DST correctness intact: each call still formats the real instant.
 * A null entry memoises "this zone is invalid" so a bad id is not re-thrown on every render.
 */
const FORMATTER_CACHE = new Map<string, Intl.DateTimeFormat | null>();

function formatter(locale: string, tz: string | undefined, style?: Intl.DateTimeFormatOptions["timeZoneName"]): Intl.DateTimeFormat | null {
  const key = `${locale}|${tz ?? ""}|${style ?? ""}`;
  const hit = FORMATTER_CACHE.get(key);
  if (hit !== undefined) return hit;
  let made: Intl.DateTimeFormat | null = null;
  try {
    // Throws RangeError on an unknown IANA id.
    made = new Intl.DateTimeFormat(locale, {
      hour: "numeric",
      ...(tz ? { timeZone: tz } : {}),
      ...(style ? { timeZoneName: style } : {}),
    });
  } catch {
    made = null;
  }
  FORMATTER_CACHE.set(key, made);
  return made;
}

/** Validate/normalize a session tz; returns undefined for blank or unknown zones. */
function safeZone(tz?: string | null): string | undefined {
  const z = (tz || "").trim();
  if (!z) return undefined;
  return formatter("en-US", z) ? z : undefined;
}

/**
 * Zones that no English locale abbreviates, so CLDR gives a bare offset. Keyed on the ZONE, never
 * on the shape of the offset string: Asia/Manila's own abbreviation is "PST" (Philippine Standard
 * Time), which every reader parses as US Pacific, so it must be mapped explicitly rather than
 * passed through because it "looks like" a real abbreviation.
 *
 * Asia/Dhaka's BST knowingly collides with Europe/London's; that ambiguity is in the abbreviations
 * themselves, not in this table.
 */
const ZONE_ABBR_FALLBACK: Record<string, string> = {
  "Asia/Riyadh": "AST",
  "Asia/Qatar": "AST",
  "Asia/Kuwait": "AST",
  "Asia/Bahrain": "AST",
  "Asia/Dubai": "GST",
  "Asia/Karachi": "PKT",
  "Asia/Dhaka": "BST",
  "Asia/Singapore": "SGT",
  "Asia/Manila": "PHT",
};

/**
 * Locales probed for a real abbreviation, in order. Whether you get "IST" or "GMT+5:30" is a
 * property of the LOCALE's CLDR data, not of the timeZoneName style: en-US says "GMT+5:30" for
 * Asia/Kolkata while en-IN says "IST". Probing several beats switching to any single one, which
 * would just move the problem (en-IN renders America/New_York as "GMT-4" instead of "EDT").
 */
const ABBR_LOCALES = ["en-US", "en-GB", "en-IN", "en-AU", "en-SG"];
const REAL_ABBR = /^[A-Za-z]{2,5}$/;

function abbrFrom(locale: string, d: Date, tz: string, style: Intl.DateTimeFormatOptions["timeZoneName"]): string {
  const f = formatter(locale, tz, style);
  if (!f) return "";
  return f.formatToParts(d).find((p) => p.type === "timeZoneName")?.value || "";
}

/**
 * The session zone as a human label at this instant: "IST", "EDT", "AST", or a compact offset for
 * the ~half of IANA zones that have no abbreviation in any English locale. Returns "" for a blank
 * or unknown zone, so callers can append it unconditionally.
 *
 * DST-correct by construction - the label is derived from the instant, so August gives EDT/BST and
 * January gives EST/GMT.
 */
export function zoneLabel(d: Date, tz?: string | null): string {
  const z = safeZone(tz);
  if (!z) return "";

  for (const locale of ABBR_LOCALES) {
    const v = abbrFrom(locale, d, z, "short");
    if (REAL_ABBR.test(v)) return v;
  }

  const curated = ZONE_ABBR_FALLBACK[z];
  if (curated) return curated;

  // shortGeneric is the last resort, and it is only useful when it stays compact: for a zone with
  // no abbreviation it returns a LONG name ("Japan Time", "São Paulo Time"), and zoneAbbr is
  // rendered as a column header in the card's compact strip, where that overflows. A short offset
  // is what ships today, so falling back to it is not a regression.
  const generic = abbrFrom("en-US", d, z, "shortGeneric");
  if (generic && generic.length <= 6 && !/^(GMT|UTC)/.test(generic)) return generic;

  return abbrFrom("en-US", d, z, "short");
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
  // The label comes from zoneLabel, not from timeZoneName:"short" — en-US's CLDR short name for
  // Asia/Kolkata is literally "GMT+5:30", which is what put that string in the session header.
  // A session with no stored zone gets NO label: it is being drawn in the viewer's zone, and
  // stamping it with one would assert the class is scheduled in a zone nobody chose.
  const primaryOpts: Intl.DateTimeFormatOptions = { ...fmt };
  if (sTz) primaryOpts.timeZone = sTz;
  const base = new Intl.DateTimeFormat("en-US", primaryOpts).format(d);
  const sLabel = showZone ? zoneLabel(d, sTz) : "";
  const primary = sLabel ? `${base} ${sLabel}` : base;

  if (!dual || !sTz) return primary;

  // Only add "your time" when the session zone actually displays differently to the viewer's.
  const inSession = new Intl.DateTimeFormat("en-US", { ...fmt, timeZone: sTz }).format(d);
  const inViewer = new Intl.DateTimeFormat("en-US", { ...fmt, timeZone: vTz || undefined }).format(d);
  if (inSession === inViewer) return primary;

  // Include the viewer's DATE when their calendar day differs: an 8:00 AM Kolkata class read
  // "(7:30 PM your time)" to a Los Angeles student under an Aug 21 header, when their instant is
  // Aug 20 — the right clock on the wrong day.
  const localOpts: Intl.DateTimeFormatOptions = sameCalendarDay(d, sTz, vTz)
    ? { hour: "numeric", minute: "2-digit", timeZone: vTz || undefined }
    : { month: "short", day: "numeric", hour: "numeric", minute: "2-digit", timeZone: vTz || undefined };
  const localTime = new Intl.DateTimeFormat("en-US", localOpts).format(d);
  const vLabel = zoneLabel(d, vTz);
  return `${primary} (${localTime}${vLabel ? ` ${vLabel}` : ""}, your time)`;
}

/** Whether an instant falls on the same calendar date in both zones. */
function sameCalendarDay(d: Date, aTz?: string, bTz?: string): boolean {
  const key = (tz?: string) =>
    new Intl.DateTimeFormat("en-CA", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      timeZone: tz || undefined,
    }).format(d);
  return key(aTz) === key(bTz);
}

export interface SessionTimeParts {
  /** "Jul 27" in the session zone. */
  date: string;
  /** "6:00 PM" in the session zone. */
  time: string;
  /** Session zone short label ("IST", "EDT", "GMT+9") — "" when the session has no stored zone. */
  zoneAbbr: string;
  /** Viewer's local "8:30 PM", only when it differs from the session time; else null. */
  viewerTime: string | null;
  /** Label for the VIEWER's own zone, so their half of the clock is stamped too; "" when there is
   *  no viewer time to label. */
  viewerZoneAbbr: string;
}

/** Split a session's time into pieces for compact strips (date / time / zone / viewer conversion). */
export function sessionTimeParts(iso: string | null | undefined, sessionTz?: string | null): SessionTimeParts {
  const empty: SessionTimeParts = { date: "-", time: "-", zoneAbbr: "", viewerTime: null, viewerZoneAbbr: "" };
  if (!iso) return empty;
  const d = new Date(iso);
  if (isNaN(d.getTime())) return empty;

  const sTz = safeZone(sessionTz);
  const vTz = viewerTimeZone();
  const date = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", timeZone: sTz }).format(d);
  const time = new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit", timeZone: sTz }).format(d);

  // zoneLabel returns "" for a blank/unknown zone, so it subsumes the old `if (sTz)` guard.
  const zoneAbbr = zoneLabel(d, sTz);

  let viewerTime: string | null = null;
  if (sTz) {
    const inViewer = new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit", timeZone: vTz || undefined }).format(d);
    if (inViewer !== time) viewerTime = inViewer;
  }
  return { date, time, zoneAbbr, viewerTime, viewerZoneAbbr: viewerTime ? zoneLabel(d, vTz) : "" };
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
