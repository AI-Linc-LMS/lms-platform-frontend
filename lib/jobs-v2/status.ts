/**
 * Jobs v2 — status resolution.
 *
 * Re-exports the single source of truth from `jobsTokens.ts` and adds the resolvers. Every
 * resolver **falls back to a neutral tone** rather than crashing or rendering an uncoloured
 * chip: the API is free to introduce a sixth job status tomorrow, and a jobs list must not go
 * blank when it does.
 */

import {
  APP_STATUS,
  APP_STATUS_ORDER,
  JOB_STATUS,
  JOB_STATUS_ORDER,
  NEUTRAL_TONE,
  SCRAPED_STATE,
  SCRAPED_STATE_ORDER,
  VISIBILITY,
  VISIBILITY_ORDER,
  type AppStatus,
  type JobStatus,
  type ScrapedState,
  type Tone,
  type Visibility,
} from "@/components/jobs-v2/ui/jobsTokens";

export {
  APP_STATUS,
  APP_STATUS_ORDER,
  JOB_STATUS,
  JOB_STATUS_ORDER,
  NEUTRAL_TONE,
  SCRAPED_STATE,
  SCRAPED_STATE_ORDER,
  VISIBILITY,
  VISIBILITY_ORDER,
};
export type { AppStatus, JobStatus, ScrapedState, Tone, Visibility };

function normalize(value: unknown): string {
  return String(value ?? "").trim().toLowerCase().replace(/[\s-]+/g, "_");
}

export function isJobStatus(value: unknown): value is JobStatus {
  return normalize(value) in JOB_STATUS;
}

export function isAppStatus(value: unknown): value is AppStatus {
  return normalize(value) in APP_STATUS;
}

/** The tone for a job status. Unknown strings get the neutral tone, never a crash. */
export function resolveJobStatus(value: unknown): Tone {
  const key = normalize(value);
  return (JOB_STATUS as Record<string, Tone>)[key] ?? NEUTRAL_TONE;
}

/** The tone for an application status. Unknown strings get the neutral tone. */
export function resolveAppStatus(value: unknown): Tone {
  const key = normalize(value);
  return (APP_STATUS as Record<string, Tone>)[key] ?? NEUTRAL_TONE;
}

/**
 * Visibility accepts the boolean the API actually sends (`is_published`) as well as the
 * string, because every admin surface has one of the two and neither should special-case it.
 */
export function resolveVisibility(value: unknown): Tone {
  if (typeof value === "boolean") return value ? VISIBILITY.published : VISIBILITY.draft;
  const key = normalize(value);
  if (key === "true" || key === "1") return VISIBILITY.published;
  if (key === "false" || key === "0") return VISIBILITY.draft;
  return (VISIBILITY as Record<string, Tone>)[key] ?? NEUTRAL_TONE;
}

/**
 * The scraper's raw decision values (`new`, `ready`, `expired`, ...) collapse onto the four
 * states the queue's tabs actually present. Written once here so the table, the tab counts and
 * the preview sheet cannot disagree about what "ready" means.
 */
export function normalizeScrapedState(value: unknown): ScrapedState | null {
  const key = normalize(value);
  switch (key) {
    case "new":
    case "ready":
    case "review":
      return "review";
    case "imported":
      return "imported";
    case "dismissed":
      return "dismissed";
    case "irrelevant":
    case "expired":
      return "irrelevant";
    default:
      return null;
  }
}

export function resolveScrapedState(value: unknown): Tone {
  const key = normalizeScrapedState(value);
  return key ? SCRAPED_STATE[key] : NEUTRAL_TONE;
}

/** The i18n key for a status, whichever family it belongs to. */
export function statusLabelKey(kind: StatusKind, value: unknown): string {
  return resolveTone(kind, value).labelKey;
}

export type StatusKind = "job" | "application" | "visibility" | "scraped";

export function resolveTone(kind: StatusKind, value: unknown): Tone {
  switch (kind) {
    case "job":
      return resolveJobStatus(value);
    case "application":
      return resolveAppStatus(value);
    case "visibility":
      return resolveVisibility(value);
    case "scraped":
      return resolveScrapedState(value);
    default:
      return NEUTRAL_TONE;
  }
}

/** The ordered option list a Select for `kind` must render. Exhaustive by construction. */
export function statusOptions(kind: StatusKind): Array<{ value: string; tone: Tone }> {
  switch (kind) {
    case "job":
      return JOB_STATUS_ORDER.map((v) => ({ value: v, tone: JOB_STATUS[v] }));
    case "application":
      return APP_STATUS_ORDER.map((v) => ({ value: v, tone: APP_STATUS[v] }));
    case "visibility":
      return VISIBILITY_ORDER.map((v) => ({ value: v, tone: VISIBILITY[v] }));
    case "scraped":
      return SCRAPED_STATE_ORDER.map((v) => ({ value: v, tone: SCRAPED_STATE[v] }));
    default:
      return [];
  }
}

/**
 * The employer's own pipeline values (`round_1`, `shortlisted_by_hr`, …) are stored lowercase:
 * `"hr selected"`, `"gd round reject"`. The admin table renders them through a hand-written
 * label list; the learner's timeline was rendering the raw string, so the same field read
 * "HR Selected" on one surface and "hr selected" on the other.
 *
 * One formatter, used by both. A value that already carries its own capitalisation (anything an
 * employer typed by hand, e.g. a drive name) is returned untouched.
 */
const PIPELINE_ACRONYMS = new Set(["hr", "gd", "cv", "hr1", "hr2"]);

export function humanizePipelineValue(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed || /[A-Z]/.test(trimmed)) return trimmed;
  return trimmed
    .split(/(\s+)/)
    .map((part) =>
      /^\s+$/.test(part) || part === ""
        ? part
        : PIPELINE_ACRONYMS.has(part)
          ? part.toUpperCase()
          : part.charAt(0).toUpperCase() + part.slice(1),
    )
    .join("");
}
