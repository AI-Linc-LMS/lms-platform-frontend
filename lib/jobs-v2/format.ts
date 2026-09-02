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

/* -------------------------------------------------------------------------
 * Employment type vs job type — what a learner can actually read.
 *
 * `job_type` is the FEED's coarse bucket and on this tenant almost every row carries the
 * literal string `"job"`. Rendering it put a chip reading "job" on every card, which tells a
 * learner nothing they did not already know from standing on the job board. The readable fact
 * is `employment_type` ("Full-time", "Internship"), so that is what the meta row shows, and
 * `job_type` only surfaces where it ADDS something — `jobTypeBadge` below.
 * ---------------------------------------------------------------------- */

/**
 * Feed spellings we canonicalise. The key is the value with separators removed and folded, so
 * "FULL_TIME", "full time" and "Full-Time" all land on the same row.
 */
const EMPLOYMENT_CANON: Record<string, string> = {
  fulltime: "Full-time",
  full: "Full-time",
  permanent: "Full-time",
  regular: "Full-time",
  parttime: "Part-time",
  part: "Part-time",
  contract: "Contract",
  contractual: "Contract",
  contracttohire: "Contract",
  temporary: "Temporary",
  temp: "Temporary",
  freelance: "Freelance",
  internship: "Internship",
  intern: "Internship",
  trainee: "Trainee",
  apprenticeship: "Apprenticeship",
  volunteer: "Volunteer",
};

/** Strip separators and case so "Full-Time" and "full_time" compare equal. */
function employmentKey(value: string): string {
  return value.toLowerCase().replace(/[\s._\-–—/]+/g, "");
}

/**
 * The employment type, canonicalised and translatable. Returns `null` for a missing or
 * undisclosed value so the caller OMITS the chip rather than rendering an empty slot.
 * An unrecognised spelling is passed through trimmed — we never drop information we merely
 * failed to recognise.
 */
export function formatEmploymentType(value: string | null | undefined): string | null {
  if (value === null || value === undefined) return null;
  const raw = String(value).trim();
  if (!raw || NOT_DISCLOSED.test(raw)) return null;
  const canon = EMPLOYMENT_CANON[employmentKey(raw)];
  if (!canon) return raw;
  return t(`jobsV2.employment.${employmentKey(raw)}`, { defaultValue: canon });
}

export interface JobTypeInput {
  job_type?: string | null;
  employment_type?: string | null;
}

/**
 * `job_type` rendered ONLY when it adds information.
 *
 * "job" is the default bucket and says nothing; "internship" is a genuinely different
 * proposition for a learner and earns a badge — unless `employment_type` already says
 * "Internship", in which case saying it twice is noise.
 */
export function jobTypeBadge(job: JobTypeInput): string | null {
  const raw = String(job.job_type ?? "").trim();
  if (!raw) return null;
  const key = employmentKey(raw);
  if (key !== "internship" && key !== "intern") return null;
  if (employmentKey(String(job.employment_type ?? "")) === "internship") return null;
  return t("jobsV2.employment.internship", { defaultValue: "Internship" });
}

/* -------------------------------------------------------------------------
 * Description preview — a card must lead with the ROLE.
 *
 * Jobs that arrived through the scraper carry the employer's raw page: an "About the Team"
 * banner, or a paragraph of company marketing ("GitLab is the intelligent orchestration
 * platform for DevSecOps..."), before a word about the job. Clamped to two lines, every such
 * card reads as an advert for a company the learner did not search for.
 *
 * This is a client-side SAFETY NET, not a data migration: already-published rows cannot be
 * re-ingested, so the board cleans what it was given. It is deliberately CONSERVATIVE — losing
 * the role description is far worse than leaving one boilerplate line in place — so it removes
 * only leading blocks it can positively identify, never more than three, and never all of them.
 * ---------------------------------------------------------------------- */

/** Non-breaking and thin spaces that feed dumps are full of. */
const ODD_SPACE = /[\u00a0\u1680\u2000-\u200a\u202f\u205f\u3000]/g;
/** Zero-width junk that survives a copy-paste out of a rich text editor. */
const ZERO_WIDTH = /[\u200b\u200c\u200d\ufeff]/g;

const NAMED_ENTITIES: Array<[RegExp, string]> = [
  [/&nbsp;?/gi, " "],
  [/&amp;/gi, "&"],
  [/&lt;/gi, "<"],
  [/&gt;/gi, ">"],
  [/&quot;/gi, '"'],
  [/&(?:apos|#0*39);/gi, "'"],
  [/&(?:mdash|ndash);/gi, "-"],
  [/&(?:bull|middot);/gi, "-"],
];

/** Feed dumps arrive as HTML about half the time. Turn block ends into breaks, drop the rest. */
function decodeEntities(value: string): string {
  if (!value.includes("&")) return value;
  return NAMED_ENTITIES.reduce((acc, [pattern, replacement]) => acc.replace(pattern, replacement), value);
}

function stripHtml(value: string): string {
  if (!/<[a-z!/]/i.test(value)) return value;
  return value
    .replace(/<\s*(?:script|style)[^>]*>[\s\S]*?<\s*\/\s*(?:script|style)\s*>/gi, " ")
    .replace(/<\s*(?:br|hr)\s*\/?\s*>/gi, "\n")
    .replace(/<\s*\/\s*(?:p|div|li|ul|ol|h[1-6]|tr|section)\s*>/gi, "\n\n")
    .replace(/<[^>]*>/g, " ");
}

/** Whitespace normalisation: nbsp, tabs, runs of spaces, and 3+ blank lines. */
export function normaliseDescription(value: string): string {
  return decodeEntities(stripHtml(decodeEntities(value)))
    .replace(ZERO_WIDTH, "")
    .replace(ODD_SPACE, " ")
    .replace(/\r\n?/g, "\n")
    .split("\n")
    .map((line) => line.replace(/[ \t]+/g, " ").trim())
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/**
 * A block that is nothing but a section label. "About the Team", "Company overview",
 * "Job Description" — a heading, with no role in it.
 */
const BOILERPLATE_HEADING =
  /^(?:about\s+(?:the\s+)?(?:us|team|company|role|job|position|opportunity|organisation|organization)|who\s+we\s+are|what\s+we\s+do|company\s+(?:overview|profile|description|introduction)|our\s+(?:story|mission|culture|company)|overview|introduction|summary|job\s+description|description)\s*[:–—.\-]*$/i;

/** The same labels when the employer ran them into the paragraph that follows. */
const LEADING_LABEL =
  /^(?:about\s+(?:the\s+)?(?:us|team|company|organisation|organization)|who\s+we\s+are|company\s+(?:overview|profile|description))\s*[:–—.\-]+\s*/i;

/** Words that mean the block is talking about the JOB, so it must survive whatever else it says. */
const ROLE_WORDS =
  /\b(?:role|position|you\s+will|you'?ll|responsib|we\s+are\s+looking|we're\s+looking|hiring|the\s+opportunity|requirements|qualifications|as\s+an?\s|join\s+us\s+as|this\s+job)\b/i;

/** Escape a company name for use inside a RegExp. */
function escapeRe(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * "GitLab is the intelligent orchestration platform for DevSecOps." — the company, not the job.
 * Recognised by the block OPENING with the employer's own name and then describing itself.
 */
function isCompanyBlurb(block: string, company?: string | null): boolean {
  const name = String(company ?? "").trim();
  if (name.length < 2) return false;
  if (ROLE_WORDS.test(block)) return false;
  // Only the first sentence matters: it is what decides whether the block is about the company.
  const firstSentence = block.match(/^[^.!?\n]{0,400}(?:[.!?]|$)/)?.[0] ?? block;
  const opener = new RegExp(
    `^\\s*(?:at\\s+)?${escapeRe(name)}\\b[^.!?]{0,60}?\\b(?:is|was|are|were|has|have|had|provides?|builds?|offers?|operates?|serves?|powers?|helps?|makes?|creates?|delivers?)\\b`,
    "i",
  );
  return opener.test(firstSentence);
}

/**
 * The card's clamped preview: the description with a leading company-boilerplate block removed
 * and its whitespace normalised. Returns `null` when there is nothing usable to show, so the
 * caller omits the paragraph instead of rendering an empty line.
 */
export function descriptionPreview(
  value: string | null | undefined,
  company?: string | null,
): string | null {
  if (value === null || value === undefined) return null;
  const normalised = normaliseDescription(String(value));
  if (!normalised) return null;

  // Blocks are paragraphs where the employer used blank lines, and single lines where they did
  // not — a feed dump is frequently one line per section with no blank line anywhere.
  const separator = normalised.includes("\n\n") ? "\n\n" : "\n";
  const blocks = normalised.split(separator);

  let start = 0;
  // At most three leading blocks, and never the whole description: a preview that removed
  // everything would be a worse lie than the boilerplate it replaced.
  while (start < blocks.length - 1 && start < 3) {
    const block = blocks[start].trim();
    if (!block) {
      start += 1;
      continue;
    }
    // A block that ANNOUNCES itself as being about the company ("About Us: ...") is boilerplate
    // whatever it goes on to say. "About the role:" is deliberately not in that vocabulary.
    if (
      BOILERPLATE_HEADING.test(block) ||
      LEADING_LABEL.test(block) ||
      isCompanyBlurb(block, company)
    ) {
      start += 1;
      continue;
    }
    break;
  }

  const kept = blocks.slice(start).join(separator).trim();
  const body = (kept || normalised).replace(LEADING_LABEL, "").trim();
  return body || null;
}

/* -------------------------------------------------------------------------
 * Work mode, and where an apply actually goes.
 *
 * Both exist because the job-site spec's honesty rules need them:
 *   - `formatWorkMode` validates against the four-value whitelist rather than guessing. A
 *     posting that says "Bengaluru" is NOT evidence of on-site — a large share of those are
 *     hybrid — so an unrecognised value returns `null` and the caller omits the chip.
 *   - `applyDomain` is what lets the apply button SAY where it goes ("greenhouse.io"), which is
 *     the one question a student actually asks before clicking an outbound hand-off.
 * ---------------------------------------------------------------------- */

/** The only four values `work_mode` may render as. `""` and anything else mean "not stated". */
export const WORK_MODES = ["On-site", "Hybrid", "Remote"] as const;
export type WorkMode = (typeof WORK_MODES)[number];

/**
 * Spellings that mean the same mode. The key is the value with separators and case removed.
 * **Nothing here infers a mode from a location** — every entry is a restatement of a value the
 * posting itself carried.
 */
const WORK_MODE_CANON: Record<string, WorkMode> = {
  onsite: "On-site",
  onsight: "On-site",
  inoffice: "On-site",
  office: "On-site",
  workfromoffice: "On-site",
  wfo: "On-site",
  hybrid: "Hybrid",
  parthybrid: "Hybrid",
  remote: "Remote",
  fullyremote: "Remote",
  remotefirst: "Remote",
  workfromhome: "Remote",
  wfh: "Remote",
};

/** The canonical mode, or `null` when the value is absent or not one we recognise. */
export function workMode(value: string | null | undefined): WorkMode | null {
  if (value === null || value === undefined) return null;
  const raw = String(value).trim();
  if (!raw || NOT_DISCLOSED.test(raw)) return null;
  return WORK_MODE_CANON[raw.toLowerCase().replace(/[\s._\-–—/]+/g, "")] ?? null;
}

/**
 * The work mode as a learner reads it, translated. `null` means the chip is omitted — an
 * unstated location is not evidence of on-site, and empty is the correct answer.
 */
export function formatWorkMode(value: string | null | undefined): string | null {
  const mode = workMode(value);
  if (!mode) return null;
  const key = mode.toLowerCase().replace(/-/g, "");
  return t(`jobsV2.workMode.${key}`, { defaultValue: mode });
}

/**
 * The host an external apply link hands the student to, `www.` stripped: "greenhouse.io".
 * Returns `null` for a missing, relative or unparseable link, and for anything that is not
 * http(s) — we never print a scheme a click cannot follow.
 */
export function applyDomain(url: string | null | undefined): string | null {
  if (!url) return null;
  const raw = String(url).trim();
  if (!raw) return null;
  try {
    const parsed = new URL(raw);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return null;
    const host = parsed.hostname.replace(/^www\./i, "");
    return host || null;
  } catch {
    return null;
  }
}
