/**
 * Jobs v2 — "can I actually apply to this?", computed and explained.
 *
 * This is the one question every Indian student asks first, and none of the five boards we
 * benchmarked answers it. We own the rule and its inputs, so we can print both.
 *
 * **The enforcement caveat is load-bearing.** `get_eligible_to_apply` in
 * `jobs_v2/serializers.py` checks **courses and college mappings only**. The passout year and
 * the three percentage gates are collected by the admin form, shown to the student, and *not
 * enforced at apply time*. So every check carries `enforced`, and:
 *
 *   - the card's headline verdict and the Apply button's disabled state come from **enforced
 *     checks only** — behaviour is preserved exactly;
 *   - non-enforced rows render under "Stated by the employer", with the honest framing that the
 *     employer says they check this and we do not block the application on it.
 *
 * Telling a student "you are not eligible" when the button in fact works — or the reverse — is
 * worse than showing no card at all.
 *
 * `buildEligibility` consumes the backend `eligibility` payload the moment it exists (§6.4) and
 * otherwise falls back to a client-side build over the fields we already hold, so the frontend
 * ships before the backend without ever printing a judgement it cannot substantiate.
 */

import i18n from "@/lib/i18n";
import type { JobV2 } from "@/lib/services/jobs-v2.service";

function t(key: string, options?: Record<string, unknown>): string {
  return i18n.t(key, options) as unknown as string;
}

/* =========================================================================
 * Types
 * ======================================================================= */

export type CheckStatus = "pass" | "fail" | "unknown";

export interface EligibilityCheck {
  /** "passout_year" | "graduation_percentage" | "percentage_12" | "course" | "college" | … */
  key: string;
  label: string;
  /** What the role asks for: "60%" | "2025–2026" | "Python Full-Stack". */
  requirement: string;
  /** The student's own value. `null` = not on their profile. */
  yours: string | null;
  status: CheckStatus;
  /** Whether failing this actually blocks apply. Courses + college: true. The rest: false. */
  enforced: boolean;
  /** Deep link to the profile field that fixes it, when there is one. */
  fixHref?: string;
}

export interface EligibilitySummary {
  /** `null` = unknown (signed out / no profile). The card renders nothing. */
  eligible: boolean | null;
  /** The named blocking criterion, when `eligible === false`. */
  reason?: string;
  /** "Open to your Python Full-Stack cohort" — why this role is visible to this student. */
  visibilityReason?: string;
  checks: EligibilityCheck[];
}

/**
 * Whatever the caller holds of the student's profile. Every field is optional: a value we do
 * not have renders as "not on your profile", never as a failure.
 */
export interface EligibilityProfile {
  passoutYear?: string | number | null;
  graduationPercentage?: number | string | null;
  percentage12?: number | string | null;
  percentage10?: number | string | null;
}

/** The `eligibility` object the detail serializer gains in §6.4. */
export interface EligibilityPayload {
  eligible?: boolean | null;
  reason?: string | null;
  checks?: Array<{
    key?: string;
    label?: string;
    requirement?: string | null;
    yours?: string | null;
    status?: string | null;
    enforced?: boolean | null;
    fixHref?: string | null;
    fix_href?: string | null;
  }> | null;
}

/* =========================================================================
 * Visibility reason — every string backed by the actual rule
 * ======================================================================= */

export type VisibilityReason =
  | "assigned"
  | "course"
  | "adaptive_course"
  | "cohort"
  | "college"
  | "open";

const VISIBILITY_COPY: Record<VisibilityReason, { key: string; fallback: string }> = {
  assigned: { key: "jobsV2.why.assigned", fallback: "Assigned to you by your mentor" },
  course: { key: "jobsV2.why.course", fallback: "Open to a course you are enrolled in" },
  adaptive_course: {
    key: "jobsV2.why.adaptiveCourse",
    fallback: "Open to a course you are enrolled in",
  },
  cohort: { key: "jobsV2.why.cohort", fallback: "Open to your cohort" },
  college: { key: "jobsV2.why.college", fallback: "Open to your college" },
  open: { key: "jobsV2.why.open", fallback: "Open to everyone at your institution" },
};

/**
 * One sentence naming why this role is in this student's list. Returns `null` for `"open"` and
 * for an unrecognised value — a badge whose justification we cannot state does not render.
 */
export function visibilityReasonLabel(reason: string | null | undefined): string | null {
  const key = String(reason ?? "").trim() as VisibilityReason;
  if (!key || key === "open") return null;
  const copy = VISIBILITY_COPY[key];
  if (!copy) return null;
  return t(copy.key, { defaultValue: copy.fallback });
}

/* =========================================================================
 * Parsing the gates
 * ======================================================================= */

function asPercent(value: number | string | null | undefined): number | null {
  if (value === null || value === undefined || value === "") return null;
  const n = typeof value === "number" ? value : Number(String(value).replace(/[%\s]/g, ""));
  return Number.isFinite(n) ? n : null;
}

function percentLabel(value: number | null): string | null {
  if (value === null) return null;
  // Trim a trailing ".0" without rounding a real fraction away.
  const shown = Number.isInteger(value) ? String(value) : String(Number(value.toFixed(2)));
  return `${shown}%`;
}

/** Every four-digit year the requirement names. "2025-2026" and "2025, 2026" both work. */
function passoutYears(requirement: string): number[] {
  const found = requirement.match(/\d{4}/g);
  if (!found) return [];
  const years = found.map(Number).filter((y) => y >= 1900 && y <= 2200);
  // "2025-2026" is a range; two comma-separated years are a set. Expanding a two-year range and
  // a two-year set produce the same answer, so only 3+ years or an explicit dash needs care.
  if (years.length === 2 && /\d{4}\s*[-–—]\s*\d{4}/.test(requirement)) {
    const [from, to] = years[0] <= years[1] ? years : [years[1], years[0]];
    const out: number[] = [];
    for (let y = from; y <= to; y += 1) out.push(y);
    return out;
  }
  return years;
}

/* =========================================================================
 * buildEligibility
 * ======================================================================= */

interface BuildOptions {
  /** Overrides `job.visibility_reason`, for a related-jobs row that carries its own. */
  visibilityReason?: string | null;
}

/**
 * The summary the `EligibilityCard` and `EligibilityChecklist` render.
 *
 * Order of authority:
 *   1. `job.eligibility` from the backend, when it is there — it is the same computation,
 *      re-serialised with its reasons, so we never recompute a verdict the server owns.
 *   2. A client-side build from `eligible_to_apply` plus the gate fields already on the payload.
 *
 * In both paths `eligible` is the ENFORCED verdict and nothing else, and it always equals
 * `eligible_to_apply` — which is what the Apply button keeps reading.
 */
export function buildEligibility(
  job: JobV2,
  profile?: EligibilityProfile | null,
  options: BuildOptions = {},
): EligibilitySummary {
  const visibilityReason = visibilityReasonLabel(
    options.visibilityReason ?? job.visibility_reason,
  ) ?? undefined;

  const payload = job.eligibility;
  if (payload && typeof payload === "object") {
    return fromPayload(payload, visibilityReason);
  }

  const eligible =
    typeof job.eligible_to_apply === "boolean" ? job.eligible_to_apply : null;

  // We never print a judgement of a student whose data we do not have.
  if (eligible === null) return { eligible: null, visibilityReason, checks: [] };

  const checks = [
    ...enforcedChecks(job, eligible),
    ...statedChecks(job, profile ?? null),
  ];

  return {
    eligible,
    reason: eligible === false ? blockingReason(job) : undefined,
    visibilityReason,
    checks,
  };
}

/** The backend's own answer, normalised. Unknown status strings degrade to `"unknown"`. */
function fromPayload(
  payload: EligibilityPayload,
  visibilityReason: string | undefined,
): EligibilitySummary {
  const checks: EligibilityCheck[] = (payload.checks ?? [])
    .filter((raw): raw is NonNullable<typeof raw> => Boolean(raw))
    .map((raw) => {
      const status: CheckStatus =
        raw.status === "pass" || raw.status === "fail" ? raw.status : "unknown";
      const yours = raw.yours === undefined || raw.yours === "" ? null : raw.yours;
      return {
        key: String(raw.key ?? ""),
        label: String(raw.label ?? ""),
        requirement: String(raw.requirement ?? ""),
        yours,
        status,
        // Absent means NOT enforced. A gate we cannot prove is enforced must never disable a
        // button or headline a verdict.
        enforced: raw.enforced === true,
        fixHref: raw.fixHref ?? raw.fix_href ?? undefined,
      };
    })
    .filter((check) => check.key && check.label);

  return {
    eligible: typeof payload.eligible === "boolean" ? payload.eligible : null,
    reason: payload.reason ?? undefined,
    visibilityReason,
    checks,
  };
}

/**
 * The two gates the server actually enforces.
 *
 * Client-side we know the VERDICT but not, when it is false, which of the two caused it. So a
 * failing check is only attributed when the role targets exactly one of them; with both in play
 * each row reads `"unknown"` and the headline carries the verdict. Naming the wrong blocking
 * criterion is the one failure mode this whole section exists to prevent.
 */
function enforcedChecks(job: JobV2, eligible: boolean): EligibilityCheck[] {
  const courses = (job.courses ?? []).map((c) => c?.title).filter(Boolean) as string[];
  const colleges = (job.college_mappings ?? [])
    .map((c) => c?.college_name)
    .filter(Boolean) as string[];

  const dimensions: EligibilityCheck[] = [];
  if (courses.length) {
    dimensions.push({
      key: "course",
      label: t("jobsV2.eligibility.course", { defaultValue: "Enrolled course" }),
      requirement: courses.join(", "),
      yours: null,
      status: "unknown",
      enforced: true,
    });
  }
  if (colleges.length) {
    dimensions.push({
      key: "college",
      label: t("jobsV2.eligibility.college", { defaultValue: "College" }),
      requirement: colleges.join(", "),
      yours: null,
      status: "unknown",
      enforced: true,
    });
  }

  if (!dimensions.length) return [];

  if (eligible) {
    // True means every enforced gate passed, so each row can be attributed with certainty.
    return dimensions.map((check) => ({
      ...check,
      status: "pass" as const,
      yours: t("jobsV2.eligibility.youMatch", { defaultValue: "You match this" }),
    }));
  }

  if (dimensions.length === 1) {
    return [{ ...dimensions[0], status: "fail" }];
  }
  return dimensions;
}

/** When the enforced verdict is false, the criterion we can honestly name. */
function blockingReason(job: JobV2): string {
  const hasCourses = Boolean(job.courses?.length);
  const hasColleges = Boolean(job.college_mappings?.length);
  if (hasCourses && !hasColleges) {
    return t("jobsV2.eligibility.blockedCourse", {
      defaultValue: "This role is open to specific courses you are not enrolled in.",
    });
  }
  if (hasColleges && !hasCourses) {
    return t("jobsV2.eligibility.blockedCollege", {
      defaultValue: "This role is open to specific colleges.",
    });
  }
  return t("jobsV2.eligibility.blockedTargeting", {
    defaultValue: "This role is open to specific courses and colleges.",
  });
}

/**
 * The gates the admin form collects and the employer states — and which apply does NOT enforce.
 * Each renders only when the role states the requirement, and each prints both inputs: what the
 * role asks for, and what is on the student's own profile.
 */
function statedChecks(job: JobV2, profile: EligibilityProfile | null): EligibilityCheck[] {
  const out: EligibilityCheck[] = [];

  const passoutRequirement = String(job.applicable_passout_year ?? "").trim();
  if (passoutRequirement) {
    const yours = String(profile?.passoutYear ?? "").trim() || null;
    const allowed = passoutYears(passoutRequirement);
    const mine = yours ? Number(yours.match(/\d{4}/)?.[0] ?? NaN) : NaN;
    const status: CheckStatus =
      !yours || !allowed.length || !Number.isFinite(mine)
        ? "unknown"
        : allowed.includes(mine)
          ? "pass"
          : "fail";
    out.push({
      key: "passout_year",
      label: t("jobsV2.eligibility.passoutYear", { defaultValue: "Passout year" }),
      requirement: passoutRequirement,
      yours,
      status,
      enforced: false,
      fixHref: "/profile#education",
    });
  }

  const gates: Array<{ key: string; label: string; fallback: string; need: unknown; mine: unknown }> = [
    {
      key: "graduation_percentage",
      label: "jobsV2.eligibility.graduation",
      fallback: "Graduation",
      need: job.min_graduation_percentage,
      mine: profile?.graduationPercentage,
    },
    {
      key: "percentage_12",
      label: "jobsV2.eligibility.class12",
      fallback: "Class 12",
      need: job.min_12th_percentage,
      mine: profile?.percentage12,
    },
    {
      key: "percentage_10",
      label: "jobsV2.eligibility.class10",
      fallback: "Class 10",
      need: job.min_10th_percentage,
      mine: profile?.percentage10,
    },
  ];

  for (const gate of gates) {
    const need = asPercent(gate.need as number | string | null | undefined);
    if (need === null) continue;
    const mine = asPercent(gate.mine as number | string | null | undefined);
    out.push({
      key: gate.key,
      label: t(gate.label, { defaultValue: gate.fallback }),
      requirement: percentLabel(need) ?? "",
      yours: percentLabel(mine),
      status: mine === null ? "unknown" : mine >= need ? "pass" : "fail",
      enforced: false,
      fixHref: "/profile#education",
    });
  }

  return out;
}

/* =========================================================================
 * Readers
 * ======================================================================= */

/** The checks that actually gate the Apply button. */
export function enforcedOnly(checks: EligibilityCheck[]): EligibilityCheck[] {
  return checks.filter((check) => check.enforced);
}

/** The checks the employer states and we do not block on. */
export function statedOnly(checks: EligibilityCheck[]): EligibilityCheck[] {
  return checks.filter((check) => !check.enforced);
}

/**
 * The verdict, from ENFORCED checks only.
 *
 * This never overrides the server: `summary.eligible` is `eligible_to_apply`, and a stated gate
 * the student fails can never flip it to `false`, because apply does not enforce it.
 */
export function enforcedVerdict(summary: EligibilitySummary): boolean | null {
  return summary.eligible;
}
