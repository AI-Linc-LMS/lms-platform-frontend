/**
 * Client-side expansion of the friendly recurrence rule (mirrors the backend's
 * live_class/recurrence.py) - used for the wizard's "next dates" preview and to plot a recurring
 * series' occurrences on the calendar before the backend has minted them. Weekday numbering is
 * JS `Date.getDay()` (0=Sunday..6=Saturday), matching the backend contract.
 */
import type { LiveSessionRecurrence } from "@/lib/services/admin/admin-live-activities.service";

const DAY_ABBR = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const DAY_FULL = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const ORDINAL: Record<number, string> = { 1: "first", 2: "second", 3: "third", 4: "fourth", [-1]: "last" };

// Hard cap so a malformed rule can never loop unbounded (backend caps a series at 50).
const HARD_CAP = 60;

function endBound(rule: LiveSessionRecurrence): { count: number; until: Date | null } {
  if (rule.end.type === "count") return { count: Math.min(rule.end.count, HARD_CAP), until: null };
  const until = new Date(`${rule.end.date}T23:59:59`);
  return { count: HARD_CAP, until: isNaN(until.getTime()) ? null : until };
}

function nthWeekdayOfMonth(year: number, month: number, weekday: number, nth: number): Date | null {
  if (nth === -1) {
    const last = new Date(year, month + 1, 0);
    const offset = (last.getDay() - weekday + 7) % 7;
    return new Date(year, month, last.getDate() - offset);
  }
  const first = new Date(year, month, 1);
  const offset = (weekday - first.getDay() + 7) % 7;
  const day = 1 + offset + (nth - 1) * 7;
  const d = new Date(year, month, day);
  return d.getMonth() === month ? d : null;
}

/** Generate the occurrence start Dates for a recurrence rule, given the first session's Date. */
export function expandRecurrence(rule: LiveSessionRecurrence | null, start: Date): Date[] {
  if (!rule || isNaN(start.getTime())) return [];
  const { count, until } = endBound(rule);
  const out: Date[] = [];
  const push = (d: Date) => {
    if (out.length >= count) return false;
    if (until && d > until) return false;
    out.push(d);
    return true;
  };
  const hms = [start.getHours(), start.getMinutes(), start.getSeconds()] as const;
  const at = (y: number, m: number, day: number) => new Date(y, m, day, hms[0], hms[1], hms[2]);

  if (rule.frequency === "daily") {
    const step = Math.max(1, rule.interval);
    for (let i = 0; out.length < count; i += step) {
      const d = at(start.getFullYear(), start.getMonth(), start.getDate() + i);
      if (!push(d)) break;
      if (i > HARD_CAP * step) break;
    }
  } else if (rule.frequency === "weekly") {
    const days = (rule.weekly_days && rule.weekly_days.length ? rule.weekly_days : [start.getDay()])
      .slice().sort((a, b) => a - b);
    const stepWeeks = Math.max(1, rule.interval);
    // Anchor to the Sunday of the start week, then walk blocks of `interval` weeks.
    const weekStart = at(start.getFullYear(), start.getMonth(), start.getDate() - start.getDay());
    for (let w = 0; out.length < count; w += stepWeeks) {
      let overflow = false;
      for (const dow of days) {
        const d = at(weekStart.getFullYear(), weekStart.getMonth(), weekStart.getDate() + w * 7 + dow);
        if (d < start) continue;
        if (!push(d)) { overflow = true; break; }
      }
      if (overflow) break;
      if (w > HARD_CAP * 7 * stepWeeks) break;
    }
  } else {
    // monthly
    const stepMonths = Math.max(1, rule.interval);
    for (let i = 0; out.length < count; i += stepMonths) {
      const y = start.getFullYear();
      const m = start.getMonth() + i;
      let d: Date | null;
      if (rule.monthly_week != null && rule.monthly_week_day != null) {
        d = nthWeekdayOfMonth(y, m, rule.monthly_week_day, rule.monthly_week);
        if (d) d = at(d.getFullYear(), d.getMonth(), d.getDate());
      } else {
        const dom = rule.monthly_day ?? start.getDate();
        const lastDay = new Date(y, m + 1, 0).getDate();
        d = at(y, m, Math.min(dom, lastDay));
      }
      if (d && d >= start && !push(d)) break;
      if (i > HARD_CAP * stepMonths) break;
    }
  }
  return out;
}

/** A short human sentence for the rule (parity with the backend's humanize_recurrence). */
export function summarizeRecurrence(rule: LiveSessionRecurrence | null): string {
  if (!rule) return "Does not repeat";
  const n = rule.interval || 1;
  let base: string;
  if (rule.frequency === "daily") base = n === 1 ? "Every day" : `Every ${n} days`;
  else if (rule.frequency === "weekly") {
    const days = (rule.weekly_days ?? []).slice().sort((a, b) => a - b).map((d) => DAY_ABBR[d]).join(", ");
    base = `${n === 1 ? "Weekly" : `Every ${n} weeks`}${days ? ` on ${days}` : ""}`;
  } else {
    const every = n === 1 ? "Monthly" : `Every ${n} months`;
    base = rule.monthly_week != null && rule.monthly_week_day != null
      ? `${every} on the ${ORDINAL[rule.monthly_week] ?? ""} ${DAY_FULL[rule.monthly_week_day]}`
      : `${every} on day ${rule.monthly_day ?? ""}`;
  }
  if (rule.end.type === "count") return `${base}, ${rule.end.count} time${rule.end.count === 1 ? "" : "s"}`;
  return `${base}, until ${rule.end.date}`;
}
