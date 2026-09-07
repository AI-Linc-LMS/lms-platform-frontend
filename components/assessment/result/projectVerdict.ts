import type { ProjectResponseItem } from "@/lib/services/assessment.service";

/**
 * How a project brief's outcome should read on the learner's result.
 *
 * Two shapes come back on the same field set. A "rubric" brief is marked by a person and
 * carries `criteria` + `summary`, but only once confirmed -- an unconfirmed draft is not a
 * mark and must never be shown as one. Everything else is graded by an automated run and
 * carries `passed`/`total`.
 *
 * `awaiting_review` is the backend's own signal for "no verdict yet" in both cases, so it
 * is trusted ahead of the numbers rather than re-derived from them.
 */
export interface ProjectVerdict {
  label: string;
  bg: string;
  color: string;
  awaiting: boolean;
}

const AWAITING: ProjectVerdict = {
  label: "Awaiting review",
  bg: "color-mix(in srgb, var(--warning-500, #f59e0b) 16%, transparent)",
  color: "var(--warning-500, #b45309)",
  awaiting: true,
};

const NOT_STARTED: ProjectVerdict = {
  label: "Not attempted",
  bg: "var(--surface)",
  color: "var(--font-secondary)",
  awaiting: false,
};

export function projectVerdict(item: ProjectResponseItem): ProjectVerdict {
  // Never started beats every other reading: there is nothing to review or wait for.
  const hasFiles = Object.keys(item.files ?? {}).length > 0;
  if (!item.submitted && !hasFiles) return NOT_STARTED;

  if (item.awaiting_review) return AWAITING;

  if (item.tier === "rubric") {
    const criteria = item.criteria ?? [];
    if (criteria.length === 0) return AWAITING;
    const awarded = criteria.reduce((n, c) => n + (Number(c.awarded) || 0), 0);
    const max = criteria.reduce((n, c) => n + (Number(c.max_marks) || 0), 0);
    return {
      label: max > 0 ? `${awarded} of ${max} marks` : `${awarded} marks`,
      bg: "color-mix(in srgb, var(--accent-indigo) 14%, transparent)",
      color: "var(--accent-indigo)",
      awaiting: false,
    };
  }

  const { passed, total } = item;
  if (typeof passed !== "number" || typeof total !== "number") return AWAITING;

  // A zero-check run cannot be called a pass; say so rather than printing "0 of 0 checks".
  if (total === 0) return AWAITING;

  const allPassed = passed >= total;
  return {
    label: `${passed} of ${total} checks passed`,
    bg: allPassed
      ? "color-mix(in srgb, var(--success-500) 16%, transparent)"
      : "color-mix(in srgb, var(--error-500, #ef4444) 14%, transparent)",
    color: allPassed ? "var(--success-500)" : "var(--error-500, #b91c1c)",
    awaiting: false,
  };
}
