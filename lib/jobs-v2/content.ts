/**
 * Jobs v2 — the job description, resolved.
 *
 * The "very plain" complaint has one root cause: `job_scraper/services/enrichment.py` already
 * asks the model for a summary, a Responsibilities block and a Requirements block, and then
 * glues them into one `job_description` string that the detail page renders as `pre-wrap` in a
 * single card. **We generate structure and destroy it at the boundary.**
 *
 * This module is the single decision point for reading it back (spec D4 + D7). It renders BOTH
 * shapes, and it must keep doing so permanently:
 *
 *   1. **structured** — the new `role_summary` / `responsibilities` / `requirements_*` /
 *      `tech_stack` / `perks` columns, once the backend writes them.
 *   2. **parsed** — a legacy flat `job_description` split at render time on the markers our own
 *      composer and the employers' own postings use. ~486 published jobs and ~1800 staging rows
 *      carry the flat shape today; they must look structured before a single backend phase
 *      lands, and they must not go blank while it rolls forward. **A parse is not a
 *      generation** — every word rendered is a word we were already storing.
 *   3. **flat** — the raw string, rendered exactly as today. Manual admin-authored jobs will
 *      always exist, so this fallback is not a shim.
 *   4. **empty** — the sparse state.
 *
 * Everything here is pure and unit-tested in `jobsLogic.test.ts` against a structured row, a
 * legacy flat row with markers, a hand-written row without them, and an empty row.
 */

import type { JobV2 } from "@/lib/services/jobs-v2.service";
import i18n from "@/lib/i18n";
import {
  formatEmploymentType,
  formatExperience,
  formatSalary,
  formatWorkMode,
  normaliseDescription,
} from "./format";

/* =========================================================================
 * Types
 * ======================================================================= */

export interface ParsedContent {
  roleSummary: string;
  responsibilities: string[];
  requirementsMust: string[];
  requirementsGood: string[];
  perks: string[];
}

export type JobContentOrigin = "structured" | "parsed" | "flat" | "empty";

export interface JobContent {
  roleSummary: string;
  responsibilities: string[];
  requirementsMust: string[];
  requirementsGood: string[];
  techStack: string[];
  perks: string[];
  /** "structured" = new columns; "parsed" = parsed from the flat blob; "flat" = raw fallback. */
  origin: JobContentOrigin;
  /** Set ONLY for `origin: "flat"`, so a caller can never render the blob twice. */
  flat?: string;
}

/** A computed fact chip. Never model output — see `jobHighlights`. */
export interface Highlight {
  key: string;
  icon: string;
  label: string;
  /** The rule or the full value, for the chip's own `title`. */
  title?: string;
}

/** The narrow shape of `t` this module needs. `useTranslation("common").t` satisfies it. */
export type Translate = (key: string, options?: Record<string, unknown>) => string;

const localT: Translate = (key, options) => i18n.t(key, options) as unknown as string;

/* =========================================================================
 * List hygiene
 *
 * The same three rules the backend applier will enforce, applied again at the boundary —
 * because the FE ships before the BE and because a UI that renders `requirements_must` and
 * `requirements_good` side by side must never show one item twice, whichever side deduped it.
 * ======================================================================= */

/** Leading bullet glyphs and list numbering the model, the employer or a paste left behind. */
const LEADING_BULLET = /^\s*(?:[-–—*•·▪◦‣o]\s+|\d{1,2}[.)]\s+|\(\d{1,2}\)\s+)/;

function cleanItem(value: unknown): string {
  return String(value ?? "")
    .replace(LEADING_BULLET, "")
    .replace(/\s+/g, " ")
    .trim();
}

/** Trim, de-bullet, drop empties, dedupe case-insensitively, preserve order. */
export function cleanList(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of value) {
    const item = cleanItem(raw);
    if (!item) continue;
    const token = item.toLowerCase();
    if (seen.has(token)) continue;
    seen.add(token);
    out.push(item);
  }
  return out;
}

/** `good - must`, so the two lists the detail page renders together are disjoint. */
function subtract(good: string[], must: string[]): string[] {
  if (!good.length || !must.length) return good;
  const blocked = new Set(must.map((item) => item.toLowerCase()));
  return good.filter((item) => !blocked.has(item.toLowerCase()));
}

/* =========================================================================
 * parseFlatDescription — D7, and the reason nothing goes blank
 * ======================================================================= */

/**
 * Section markers. Each is anchored to the START of a line, so a marker word occurring inside a
 * sentence ("we take our responsibilities seriously") can never open a section. A heading counts
 * only when the line is the heading alone, or the heading followed by a colon.
 */
const SECTION_PATTERNS: Array<{ section: keyof ParsedContent; pattern: RegExp }> = [
  {
    section: "responsibilities",
    pattern:
      /^(?:key\s+|core\s+|main\s+|primary\s+|your\s+|the\s+)?(?:roles?\s*(?:and|&|\/)\s*)?responsibilities|^what\s+you(?:'|’)?ll\s+(?:do|be\s+doing)|^what\s+you\s+will\s+(?:do|be\s+doing)|^(?:key\s+|day[-\s]?to[-\s]?day\s+)?(?:duties|the\s+role|job\s+duties)|^in\s+this\s+role(?:,)?\s+you(?:'|’)?ll/i,
  },
  {
    section: "requirementsGood",
    pattern:
      /^(?:preferred|desirable|nice[-\s]to[-\s]have|good[-\s]to[-\s]have|bonus|plus\s+points|it(?:'|’)?s\s+a\s+plus|added\s+advantage)(?:\s+(?:qualifications?|skills?|requirements?|experience))?|^(?:qualifications?|skills?|requirements?)\s+(?:that\s+are\s+)?(?:preferred|desirable|a\s+plus)/i,
  },
  {
    section: "perks",
    pattern:
      /^(?:perks?|benefits?|perks?\s*(?:and|&)\s*benefits?|what\s+(?:we|you(?:'|’)?ll)\s+(?:offer|get))/i,
  },
  {
    section: "requirementsMust",
    pattern:
      /^(?:requirements?|qualifications?|minimum\s+qualifications?|basic\s+qualifications?|required\s+(?:skills?|qualifications?|experience)|(?:key\s+)?skills?\s+(?:required|and\s+experience)|eligibility(?:\s+criteria)?|who\s+(?:we(?:'|’)?re\s+looking\s+for|you\s+are)|what\s+(?:we(?:'|’)?re|they(?:'|’)?re)\s+looking\s+for|must[-\s]have(?:s)?|you\s+(?:should\s+)?have)/i,
  },
];

/**
 * A heading line: one of the markers above, alone on its line or introducing the block with a
 * colon. `rest` carries whatever the employer ran into the same line, which is common
 * ("Responsibilities: Own the billing service. Ship the migration.").
 */
function matchHeading(line: string): { section: keyof ParsedContent; rest: string } | null {
  const trimmed = line.trim().replace(/^[*#\s]+/, "");
  if (!trimmed || trimmed.length > 120) return null;
  for (const { section, pattern } of SECTION_PATTERNS) {
    const hit = pattern.exec(trimmed);
    if (!hit || hit.index !== 0) continue;
    const after = trimmed.slice(hit[0].length);
    // The heading must END there, or be followed by punctuation that introduces its block.
    const punctuated = /^\s*[:：\-–—]\s*(.*)$/.exec(after);
    if (punctuated) return { section, rest: punctuated[1].trim() };
    if (/^\s*$/.test(after)) return { section, rest: "" };
    return null;
  }
  return null;
}

/** A line the employer marked as a list item. */
function isBulletLine(line: string): boolean {
  return LEADING_BULLET.test(line);
}

/**
 * Split a section body into items. Bulleted lines are the items when there are any; otherwise
 * every non-empty line is one item. We never split a sentence — inventing a boundary the
 * employer did not write is exactly the kind of guess this module exists to avoid.
 */
function toItems(lines: string[]): string[] {
  const nonEmpty = lines.map((line) => line.trim()).filter(Boolean);
  if (!nonEmpty.length) return [];
  const bulleted = nonEmpty.filter(isBulletLine);
  const source = bulleted.length >= 2 ? bulleted : nonEmpty;
  return cleanList(source);
}

/**
 * Split our own stored text into the same section shapes the structured columns hold.
 *
 * **Returns `null` unless the markers are present and the resulting blocks are non-trivial**, so
 * a genuinely hand-written description is never chopped into a list that misrepresents it — it
 * falls through to `<Prose>` instead. This is a parse, not a generation: no network, no model,
 * and no word that was not already in the string.
 */
export function parseFlatDescription(text: string | null | undefined): ParsedContent | null {
  if (!text) return null;
  const normalised = normaliseDescription(String(text));
  if (!normalised) return null;

  const lines = normalised.split("\n");
  const buckets: Record<keyof ParsedContent, string[]> = {
    roleSummary: [],
    responsibilities: [],
    requirementsMust: [],
    requirementsGood: [],
    perks: [],
  };

  let current: keyof ParsedContent = "roleSummary";
  let headings = 0;

  for (const line of lines) {
    const heading = matchHeading(line);
    if (heading) {
      headings += 1;
      current = heading.section;
      if (heading.rest) buckets[current].push(heading.rest);
      continue;
    }
    buckets[current].push(line);
  }

  if (headings === 0) return null;

  const responsibilities = toItems(buckets.responsibilities);
  const requirementsMust = toItems(buckets.requirementsMust);
  const requirementsGood = subtract(toItems(buckets.requirementsGood), requirementsMust);
  const perks = toItems(buckets.perks);

  // Non-trivial, or we are worse than the string we started from.
  if (responsibilities.length + requirementsMust.length + requirementsGood.length < 2) {
    return null;
  }

  const roleSummary = buckets.roleSummary
    .join("\n")
    .replace(/\n{2,}/g, "\n\n")
    .trim();

  return { roleSummary, responsibilities, requirementsMust, requirementsGood, perks };
}

/* =========================================================================
 * resolveJobContent — the one decision point
 * ======================================================================= */

/** The structured fields, all optional, all additive. Absent everywhere today. */
interface StructuredFields {
  role_summary?: string | null;
  responsibilities?: string[] | null;
  requirements_must?: string[] | null;
  requirements_good?: string[] | null;
  tech_stack?: string[] | null;
  perks?: string[] | null;
  job_description?: string | null;
}

const EMPTY: JobContent = {
  roleSummary: "",
  responsibilities: [],
  requirementsMust: [],
  requirementsGood: [],
  techStack: [],
  perks: [],
  origin: "empty",
};

/**
 * Structured columns first; a marker-bearing legacy blob second; the raw blob third; the sparse
 * state last. `role_summary` and `responsibilities` are the pair that decides — those are the
 * two the composer always writes, so if both are empty there is nothing structured to render.
 */
export function resolveJobContent(job: JobV2 | (StructuredFields & Partial<JobV2>)): JobContent {
  const source = job as StructuredFields;
  const techStack = cleanList(source.tech_stack);
  const flat = String(source.job_description ?? "").trim();

  const roleSummary = String(source.role_summary ?? "").trim();
  const responsibilities = cleanList(source.responsibilities);

  if (roleSummary || responsibilities.length) {
    const requirementsMust = cleanList(source.requirements_must);
    return {
      roleSummary,
      responsibilities,
      requirementsMust,
      requirementsGood: subtract(cleanList(source.requirements_good), requirementsMust),
      techStack,
      perks: cleanList(source.perks),
      origin: "structured",
    };
  }

  const parsed = parseFlatDescription(flat);
  if (parsed) {
    return {
      roleSummary: parsed.roleSummary,
      responsibilities: parsed.responsibilities,
      requirementsMust: parsed.requirementsMust,
      requirementsGood: parsed.requirementsGood,
      techStack,
      // A structured `perks` column, when it exists, outranks whatever the blob happened to say.
      perks: cleanList(source.perks).length ? cleanList(source.perks) : parsed.perks,
      origin: "parsed",
    };
  }

  if (flat) {
    return { ...EMPTY, techStack, perks: cleanList(source.perks), origin: "flat", flat };
  }

  return { ...EMPTY, techStack, perks: cleanList(source.perks) };
}

/** True when there is nothing at all to render, so the caller shows its sparse state. */
export function isContentEmpty(content: JobContent): boolean {
  return (
    content.origin === "empty" &&
    !content.roleSummary &&
    content.responsibilities.length === 0 &&
    content.requirementsMust.length === 0 &&
    content.requirementsGood.length === 0 &&
    content.perks.length === 0 &&
    content.techStack.length === 0
  );
}

/**
 * `tech_stack` and the skill lists frequently say the same thing. When they overlap by more than
 * this, the detail page renders ONE merged "Skills and stack" section instead of two lists that
 * turn out identical — a mistake this page has already been burned by once.
 */
export const STACK_MERGE_THRESHOLD = 0.8;

/** The overlap of `techStack` with a set of already-rendered skill tokens, 0..1. */
export function stackOverlap(
  techStack: string[],
  skillTokens: ReadonlySet<string>,
): number {
  if (!techStack.length) return 0;
  let hits = 0;
  for (const item of techStack) {
    if (skillTokens.has(item.trim().toLowerCase().replace(/\s+/g, " "))) hits += 1;
  }
  return hits / techStack.length;
}

/* =========================================================================
 * jobHighlights — computed in code, never asked of a model
 *
 * A model asked for "highlights" writes marketing copy; a function cannot. Every chip here is a
 * field the employer or an admin stated, restated verbatim, and a fact we do not hold produces
 * no chip at all — no dash, no empty slot, no "Not specified".
 * ======================================================================= */

export function jobHighlights(job: JobV2, t: Translate = localT): Highlight[] {
  const out: Highlight[] = [];

  const mode = formatWorkMode(job.work_mode);
  if (mode) {
    out.push({ key: "workMode", icon: "mdi:home-city-outline", label: mode, title: mode });
  }

  const experience = formatExperience(job.years_of_experience);
  if (experience) {
    out.push({
      key: "experience",
      icon: "mdi:chart-timeline-variant",
      label: experience,
      title: experience,
    });
  }

  // Verbatim, exactly as the admin or the posting typed it. We never invent a currency.
  const salary = formatSalary(job.salary);
  if (salary) {
    out.push({ key: "salary", icon: "mdi:cash-multiple", label: salary, title: salary });
  }

  const openings = job.number_of_openings;
  if (typeof openings === "number" && Number.isFinite(openings) && openings > 0) {
    const label = t("jobsV2.highlights.openings", {
      count: openings,
      defaultValue_one: "{{count}} opening",
      defaultValue_other: "{{count}} openings",
      defaultValue: "{{count}} openings",
    });
    out.push({ key: "openings", icon: "mdi:account-multiple-outline", label, title: label });
  }

  const stack = cleanList(job.tech_stack);
  if (stack.length) {
    const label = t("jobsV2.highlights.technologies", {
      count: stack.length,
      defaultValue_one: "{{count}} technology",
      defaultValue_other: "{{count}} technologies",
      defaultValue: "{{count}} technologies",
    });
    out.push({ key: "techStack", icon: "mdi:layers-triple-outline", label, title: stack.join(", ") });
  }

  const employment = formatEmploymentType(job.employment_type);
  if (employment) {
    out.push({
      key: "employment",
      icon: "mdi:briefcase-outline",
      label: employment,
      title: employment,
    });
  }

  return out;
}
