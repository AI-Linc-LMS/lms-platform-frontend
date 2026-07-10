import type { StudentAnalytics } from "@/lib/services/admin/admin-adaptive-course.service";

/**
 * Pure logic behind the page's prose: the verdict, the recommended next actions, and the
 * one-line insight above each chart.
 *
 * The hard rule here: NEVER assert a finding the data doesn't support. When a metric is null
 * or absent we emit a neutral, factual sentence or nothing at all. A dashboard that invents
 * confident conclusions from empty data is worse than one that says nothing.
 */

export type VerdictTone = "ok" | "watch" | "at_risk" | "not_started";

export interface Verdict {
  tone: VerdictTone;
  call: string;
  sentence: string;
  counts: { critical: number; serious: number; warning: number };
}

/** A freshly-enrolled student with nothing to assess. This is the COMMON case, not an edge case. */
export function isNeverActive(d: StudentAnalytics): boolean {
  return d.kpis.activities_logged === 0 && !d.student.last_active;
}

export function buildVerdict(d: StudentAnalytics): Verdict {
  const counts = { critical: 0, serious: 0, warning: 0 };
  d.risk_signals.forEach((s) => { counts[s.severity] += 1; });

  if (isNeverActive(d)) {
    const days = d.student.enrolled_at
      ? Math.max(0, Math.round((Date.now() - new Date(d.student.enrolled_at).getTime()) / 86400000))
      : null;
    return {
      tone: "not_started",
      call: "Not started",
      // Neutral, not a green "On track" — they haven't earned a verdict either way.
      sentence: days === null
        ? "No activity to assess yet."
        : `Enrolled ${days} ${days === 1 ? "day" : "days"} ago — no activity to assess yet.`,
      counts,
    };
  }

  const n = d.risk_signals.length;
  const gap = Math.round(d.mastery_vs_completion.completion_pct - d.mastery_vs_completion.mastery_pct);

  const parts: string[] = [];
  if (n === 0) {
    parts.push("No risk signals.");
  } else {
    const crit = counts.critical ? `, ${counts.critical} critical` : "";
    parts.push(`${n} ${n === 1 ? "signal" : "signals"}${crit}.`);
  }
  // Only claim a mastery gap when we actually measured mastery.
  if (d.mastery_vs_completion.mastery_pct > 0 && gap > 5) {
    parts.push(`Mastery trails completion by ${gap} points.`);
  }

  const call = d.kpis.risk_level === "at_risk" ? "At risk" : d.kpis.risk_level === "watch" ? "Watch" : "On track";
  return { tone: d.kpis.risk_level, call, sentence: parts.join(" "), counts };
}

/* --------------------------------------------------------------- next actions */

export interface NextAction {
  id: string;
  label: string;
  icon: string;
  /** Element id to scroll to, when the action points at evidence on this page. */
  target?: string;
}

const SEVERITY_ORDER = 4;

/**
 * Concrete things the admin can do, derived from the data. Never empty for an active student —
 * an analytics page that ends in "…and now what?" has failed at its job.
 */
export function buildNextActions(d: StudentAnalytics): NextAction[] {
  if (isNeverActive(d)) {
    return [{ id: "nudge", label: "Nudge to begin", icon: "mdi:bell-outline" }];
  }

  const out: NextAction[] = [];

  if (d.struggle_items.length) {
    out.push({
      id: "stuck",
      label: `Unblock ${d.struggle_items.length} stuck item${d.struggle_items.length === 1 ? "" : "s"}`,
      icon: "mdi:lifebuoy",
      target: "struggle",
    });
  }

  const overconfident = d.quiz.confidence_calibration.find((r) => r.confidence >= 3 && r.accuracy < 60);
  if (overconfident) {
    out.push({ id: "overconfidence", label: "Address overconfidence", icon: "mdi:scale-unbalanced", target: "calibration" });
  }

  const decaying = d.skill_mastery.find(
    (s) => s.retention_pct !== null && s.retention_pct < 50 && (s.days_since ?? 0) >= 14,
  );
  if (decaying) {
    out.push({ id: "revise", label: `Assign revision: ${decaying.skill}`, icon: "mdi:refresh", target: "skills" });
  }

  const gap = d.coding.top_misconceptions[0];
  if (gap) {
    out.push({ id: "misconception", label: `Address: ${gap.gap.replace(/_/g, " ")}`, icon: "mdi:code-braces", target: "coding" });
  }

  // Always give the admin at least one lever, even for a healthy mid-range student.
  if (!out.length) {
    const weakest = [...d.difficulty].filter((t) => t.attempted > 0).sort((a, b) => a.accuracy - b.accuracy)[0];
    if (weakest) {
      out.push({ id: "weakest", label: `Review weakest tier: ${weakest.difficulty}`, icon: "mdi:target", target: "difficulty" });
    } else {
      out.push({ id: "encourage", label: "Keep them going", icon: "mdi:thumb-up-outline" });
    }
  }

  return out.slice(0, SEVERITY_ORDER);
}

/* ------------------------------------------------------------- insight lines */

export interface Insight {
  text: string;
  /** The load-bearing number, bolded in the metric's accent. */
  emphasis?: string;
  icon: string;
}

const daysAgo = (n: number) => Date.now() - n * 86400000;

/** One-sentence finding above a chart. Returns null when the data can't support a claim. */
export function buildInsight(kind: string, d: StudentAnalytics): Insight | null {
  switch (kind) {
    case "progress": {
      if (!d.progress_over_time.length) return null;
      const cutoff = daysAgo(7);
      const recent = d.progress_over_time
        .filter((r) => new Date(`${r.date}T00:00:00`).getTime() >= cutoff)
        .reduce((n, r) => n + r.items, 0);
      return recent === 0
        ? { text: "No items completed in the last 7 days.", icon: "mdi:trending-neutral" }
        : { text: `Completed ${recent} item${recent === 1 ? "" : "s"} in the last 7 days.`, emphasis: String(recent), icon: "mdi:trending-up" };
    }
    case "cohort": {
      if (d.cohort.cohort_size < 2) return null;
      return {
        text: `Completion sits in the ${d.cohort.completion_percentile}th percentile of ${d.cohort.cohort_size} students.`,
        emphasis: `${d.cohort.completion_percentile}th`,
        icon: "mdi:account-group-outline",
      };
    }
    case "skills": {
      const measured = d.skill_mastery.filter((s) => s.retention_pct !== null);
      if (!measured.length) {
        return d.skill_mastery.length
          ? { text: "No skill has been practised in this course yet — decay can't be measured.", icon: "mdi:help-circle-outline" }
          : null;
      }
      const fading = measured.filter((s) => (s.retention_pct as number) < 50 && (s.days_since ?? 0) >= 14);
      if (!fading.length) return { text: "No skill has decayed below 50% retention.", icon: "mdi:check-circle-outline" };
      return {
        text: `${fading.length} skill${fading.length === 1 ? "" : "s"} unpractised for 14+ days — retention is decaying.`,
        emphasis: String(fading.length),
        icon: "mdi:trending-down",
      };
    }
    case "difficulty": {
      const easy = d.difficulty.find((t) => t.difficulty === "Easy" && t.attempted > 0);
      const hard = d.difficulty.find((t) => t.difficulty === "Hard" && t.attempted > 0);
      if (!easy || !hard) return null;
      return {
        text: `Accuracy holds at ${easy.accuracy}% on Easy but falls to ${hard.accuracy}% on Hard.`,
        emphasis: `${hard.accuracy}%`,
        icon: "mdi:stairs-down",
      };
    }
    case "coding": {
      if (!d.coding.submissions) return null;
      return {
        text: `${d.coding.acceptance_rate}% acceptance, averaging ${d.coding.avg_attempts_to_solve} attempts to solve.`,
        emphasis: `${d.coding.acceptance_rate}%`,
        icon: "mdi:code-braces",
      };
    }
    case "mock": {
      const rows = d.mock_interviews.filter((m) => m.date);
      if (!rows.length) return null;
      const last = rows[rows.length - 1];
      if (rows.length === 1) {
        return { text: `Latest mock interview scored ${last.score}%.`, emphasis: `${last.score}%`, icon: "mdi:account-voice" };
      }
      const prev = rows[rows.length - 2];
      const delta = Math.round(last.score - prev.score);
      const dir = delta > 0 ? `up ${delta}` : delta < 0 ? `down ${Math.abs(delta)}` : "flat";
      return {
        text: `Latest mock interview scored ${last.score}% (${dir} vs previous).`,
        emphasis: `${last.score}%`,
        icon: delta >= 0 ? "mdi:trending-up" : "mdi:trending-down",
      };
    }
    default:
      return null;
  }
}
