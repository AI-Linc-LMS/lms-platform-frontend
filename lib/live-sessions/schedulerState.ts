import type { SchedulerState } from "@/lib/services/admin/admin-live-activities.service";

/**
 * The banner for a scheduler that has stopped. Every backstop behind live sessions - roster
 * registration, attendance sync, reminders - is a background task, and a dead scheduler
 * silences them all with nothing turning red anywhere. The admin opens this page before a
 * class; this is where they find out. Null when the scheduler is fine or its state is unknown
 * (an older server, or a deploy that has not ticked yet), so the page never cries wolf.
 */
export function schedulerBanner(state: SchedulerState | null | undefined): { title: string; body: string } | null {
  if (!state || !state.stale) return null;
  const age = state.age_minutes ?? state.stale_after_minutes;
  const paused = state.paused.length ? state.paused.join(", ") : "background work";
  return {
    title: `The background scheduler has not run for ${age} minutes`,
    body: `Until it is back, ${paused} are paused. Classes still run and students can still join; attendance for a class held meanwhile is synced once it returns. Tell engineering.`,
  };
}
