/**
 * Jobs v2 — the skills vocabulary, and the one honest match signal on the board.
 *
 * A job carries its skills under four different keys (`mandatory_skills`, `key_skills`,
 * `tech_stack`, `tags`) and the module had already grown two private readers of them: the skills FILTER
 * folded them one way and the card's chip list folded them another, which is how the same job
 * could match a filter chip it did not display. There is one reader here now.
 *
 * **The match signal is deliberately not a score.** This is an edtech platform, so we know the
 * learner's own skills; what a learner can act on is *which* skills they already have, named.
 * A "87% match" would be a number we invented from two unweighted string lists, and a learner
 * cannot check it, argue with it, or do anything about it. So the board shows the intersection
 * and nothing else: real skills, spelled the way the employer spelled them, or no chip at all.
 */

import { foldToken } from "./format";

/** Anything carrying the four skill keys — `JobV2` structurally satisfies this. */
export interface SkillBearing {
  mandatory_skills?: string[] | null;
  key_skills?: string[] | null;
  /**
   * The literal tool names the enrichment model extracted ("PostgreSQL", "Airflow"). Absent on
   * every row until the backend ships it, and folded into the same vocabulary when it arrives —
   * otherwise a job could match a `tech_stack` filter chip it does not display, which is exactly
   * the drift this one reader exists to prevent.
   */
  tech_stack?: string[] | null;
  tags?: string[] | null;
}

export interface SkillEntry {
  /** The employer's own spelling, for display. */
  label: string;
  /** The case-folded comparison token. */
  token: string;
}

/**
 * Every skill on a job, de-duplicated by folded token, in a fixed order: what the employer
 * marked mandatory, then the key skills, then the free tags. The order is the point — a card
 * showing five of twenty chips should show the five that matter most.
 */
export function jobSkillEntries(job: SkillBearing): SkillEntry[] {
  const raw = [
    ...(job.mandatory_skills ?? []),
    ...(job.key_skills ?? []),
    // Before the free tags: `tech_stack` is a name the model was only permitted to extract when
    // it literally appears in the posting, so it is more trustworthy than a scraped tag.
    ...(job.tech_stack ?? []),
    ...(job.tags ?? []),
  ];
  const seen = new Set<string>();
  const out: SkillEntry[] = [];
  for (const value of raw) {
    const label = String(value ?? "").trim();
    const token = foldToken(label);
    if (!token || seen.has(token)) continue;
    seen.add(token);
    out.push({ label, token });
  }
  return out;
}

/** Every token a job can be matched on. The skills filter's vocabulary. */
export function jobSkillTokens(job: SkillBearing): string[] {
  return jobSkillEntries(job).map((entry) => entry.token);
}

/**
 * The skills on this job that the learner already has, in the job's own order and the
 * employer's own spelling. Empty when we do not know the learner's skills — which is the
 * honest answer, and the reason the caller renders nothing rather than a zero.
 */
export function matchedSkills(job: SkillBearing, learnerTokens: ReadonlySet<string>): string[] {
  if (learnerTokens.size === 0) return [];
  return jobSkillEntries(job)
    .filter((entry) => learnerTokens.has(entry.token))
    .map((entry) => entry.label);
}

/** How many of the job's skills the learner has. The "Most relevant" sort key. */
export function matchCount(job: SkillBearing, learnerTokens: ReadonlySet<string>): number {
  return matchedSkills(job, learnerTokens).length;
}

/**
 * Up to `max` skills for a card, with the ones the learner already has hoisted to the front so
 * a clamped chip row shows the reason the card is worth reading.
 */
export function jobSkillLabels(
  job: SkillBearing,
  max = 5,
  learnerTokens: ReadonlySet<string> = new Set(),
): string[] {
  const entries = jobSkillEntries(job);
  const matched = entries.filter((entry) => learnerTokens.has(entry.token));
  const rest = entries.filter((entry) => !learnerTokens.has(entry.token));
  return [...matched, ...rest].slice(0, max).map((entry) => entry.label);
}

/** Fold a learner's profile skills into the comparison vocabulary the jobs use. */
export function learnerSkillTokens(
  skills:
    | ReadonlyArray<string | { name?: string | null } | null | undefined>
    | null
    | undefined,
): Set<string> {
  const out = new Set<string>();
  for (const skill of skills ?? []) {
    const label = typeof skill === "string" ? skill : (skill?.name ?? "");
    const token = foldToken(String(label ?? ""));
    if (token) out.add(token);
  }
  return out;
}
