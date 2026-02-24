import type { ZoomAttendanceParticipant } from "@/lib/services/admin/admin-live-activities.service";

/**
 * Group participants into unique attendees (same email or same name = one person).
 * Re-joins are merged: first join, last leave, total duration.
 */
export function aggregateParticipants(participants: ZoomAttendanceParticipant[]) {
  const byKey = new Map<string, ZoomAttendanceParticipant[]>();
  for (const p of participants) {
    const emailKey = (p.email?.trim() || "").toLowerCase();
    const nameKey = (p.name?.trim() || "").toLowerCase();
    const key = emailKey ? `email:${emailKey}` : (nameKey ? `name:${nameKey}` : `id:${p.id}`);
    if (!byKey.has(key)) byKey.set(key, []);
    byKey.get(key)!.push(p);
  }
  return Array.from(byKey.entries()).map(([, rows]) => {
    const first = rows[0];
    const joinTimes = rows.map((r) => r.join_time).filter(Boolean) as string[];
    const leaveTimes = rows.map((r) => r.leave_time).filter(Boolean) as string[];
    const firstJoin = joinTimes.length ? joinTimes.reduce((a, b) => (a < b ? a : b)) : null;
    const lastLeave = leaveTimes.length ? leaveTimes.reduce((a, b) => (a > b ? a : b)) : null;
    const totalSeconds = rows.reduce((sum, r) => sum + (r.duration_seconds || 0), 0);
    return {
      id: first.id,
      name: first.name || "—",
      email: first.email || "—",
      join_time: firstJoin,
      leave_time: lastLeave,
      duration_seconds: totalSeconds,
    };
  });
}

/** Count of unique attendees (one per person, re-joins not counted again). */
export function getUniqueAttendanceCount(participants: ZoomAttendanceParticipant[]): number {
  return aggregateParticipants(participants).length;
}
