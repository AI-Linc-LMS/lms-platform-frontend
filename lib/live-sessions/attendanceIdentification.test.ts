import { describe, expect, it } from "vitest";

import type { LiveActivity } from "@/lib/services/admin/admin-live-activities.service";

import { sessionsNeedingAttendanceAttention } from "./attendanceIdentification";

function session(over: Partial<LiveActivity>): LiveActivity {
  return {
    id: 1,
    topic_name: "Live session",
    class_datetime: "2026-11-03T01:30:00Z",
    duration_minutes: 60,
    is_zoom: true,
    zoom_meeting_type: "webinar",
    meeting_status: "scheduled",
    attendance_identification: { mode: "pending", reason: "not registered" },
    ...over,
  } as LiveActivity;
}

describe("sessionsNeedingAttendanceAttention", () => {
  it("lists a batch webinar nobody has registered - the 8027-M shape", () => {
    expect(sessionsNeedingAttendanceAttention([session({})]).map((s) => s.id)).toEqual([1]);
  });

  it("lists a Zoom meeting, which can only ever be matched by name", () => {
    const s = session({
      zoom_meeting_type: "meeting",
      attendance_identification: { mode: "name_only", reason: "a meeting cannot disclose addresses" },
    });
    expect(sessionsNeedingAttendanceAttention([s])).toHaveLength(1);
  });

  it("does not list a registered roster", () => {
    const s = session({ attendance_identification: { mode: "exact", reason: "registered" } });
    expect(sessionsNeedingAttendanceAttention([s])).toHaveLength(0);
  });

  it("does not list a session with nobody to identify", () => {
    const s = session({ attendance_identification: { mode: "not_applicable", reason: "no batch" } });
    expect(sessionsNeedingAttendanceAttention([s])).toHaveLength(0);
  });

  it("does not list a class that has already run - that is the roster's job now", () => {
    expect(sessionsNeedingAttendanceAttention([session({ meeting_status: "ended" })])).toHaveLength(0);
    expect(sessionsNeedingAttendanceAttention([session({ meeting_status: "expired" })])).toHaveLength(0);
  });

  it("still lists a class that is live right now", () => {
    expect(sessionsNeedingAttendanceAttention([session({ meeting_status: "live" })])).toHaveLength(1);
  });

  it("does not list a cancelled session", () => {
    expect(sessionsNeedingAttendanceAttention([session({ zoom_status: "cancelled" })])).toHaveLength(0);
    expect(sessionsNeedingAttendanceAttention([session({ google_status: "cancelled" })])).toHaveLength(0);
  });

  it("survives a payload from a server that does not send the field yet", () => {
    expect(sessionsNeedingAttendanceAttention([session({ attendance_identification: undefined })])).toHaveLength(0);
    expect(sessionsNeedingAttendanceAttention([session({ attendance_identification: null })])).toHaveLength(0);
  });
});
