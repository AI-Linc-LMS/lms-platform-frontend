import { describe, expect, it } from "vitest";
import { nextSitting } from "./next-sitting";
import type { StudentLiveSession, StudentLiveOccurrence } from "./types";

/** The wall clock the reported dashboard screenshot was taken at (16:16 IST, 21 Aug 2026). */
const NOW = new Date("2026-08-21T10:46:00Z").getTime();

function occ(id: number, iso: string, extra: Partial<StudentLiveOccurrence> = {}): StudentLiveOccurrence {
  return { id, occurrence_datetime: iso, duration_minutes: 20, ...extra };
}

function series(occurrences: StudentLiveOccurrence[], extra: Partial<StudentLiveSession> = {}): StudentLiveSession {
  return {
    id: 1,
    time_remaining_minutes: 0,
    zoom_is_recurring: true,
    duration_minutes: 20,
    // Frozen at occurrence #1 by the backend's contract - deliberately stale here.
    class_datetime: "2026-08-13T14:30:00Z",
    occurrences,
    ...extra,
  };
}

describe("nextSitting", () => {
  it("ignores the stale series class_datetime and picks the next occurrence", () => {
    // Series 197 in prod: class_datetime 7.9 days past, real next sitting today 20:00 IST.
    const s = series([occ(373, "2026-08-21T14:30:00Z", { duration_minutes: 60 })]);
    const n = nextSitting(s, NOW);
    expect(n?.id).toBe(373);
    expect(n?.startIso).toBe("2026-08-21T14:30:00Z");
    expect(n?.live).toBe(false);
  });

  it("skips cancelled sittings", () => {
    // Series 203: 11:46 already ended, 22 Aug 11:45 cancelled, so 22 Aug 14:50 is next.
    const s = series([
      occ(472, "2026-08-21T06:16:00Z"),
      occ(473, "2026-08-22T06:15:00Z", { status: "cancelled" }),
      occ(478, "2026-08-22T09:20:00Z"),
    ]);
    expect(nextSitting(s, NOW)?.id).toBe(478);
  });

  it("prefers a sitting in progress and marks it live", () => {
    const s = series([
      occ(479, "2026-08-21T10:40:00Z", { duration_minutes: 30 }), // started 6 min ago
      occ(478, "2026-08-22T09:20:00Z"),
    ]);
    const n = nextSitting(s, NOW);
    expect(n?.id).toBe(479);
    expect(n?.live).toBe(true);
  });

  it("returns null when every sitting is in the past", () => {
    expect(nextSitting(series([occ(472, "2026-08-20T06:16:00Z")]), NOW)).toBeNull();
  });

  it("returns null for a session cancelled by notice", () => {
    const s = series([occ(373, "2026-08-21T14:30:00Z")], { notice_type: "cancelled" });
    expect(nextSitting(s, NOW)).toBeNull();
  });

  it("uses a single session's own datetime", () => {
    const s: StudentLiveSession = {
      id: 2,
      time_remaining_minutes: 0,
      class_datetime: "2026-08-21T14:30:00Z",
      duration_minutes: 45,
    };
    const n = nextSitting(s, NOW);
    expect(n).toMatchObject({ id: null, durationMin: 45, live: false });
  });

  it("orders series by their next sitting, not by when they started", () => {
    // The reported bug: the soonest session rendered last, below one three days out.
    const soon = series([occ(479, "2026-08-21T11:45:00Z")], { id: 203 });
    const later = series([occ(222, "2026-08-24T14:30:00Z")], { id: 194 });
    const order = [later, soon]
      .map((s) => ({ id: s.id, at: nextSitting(s, NOW)!.startMs }))
      .sort((a, b) => a.at - b.at)
      .map((r) => r.id);
    expect(order).toEqual([203, 194]);
  });
});
