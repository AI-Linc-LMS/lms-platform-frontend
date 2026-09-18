import { describe, expect, it } from "vitest";

import { mapStudentLiveSessions } from "./student-live-sessions.service";

/**
 * A personal Zoom link must never be the reason a student cannot get into their class.
 *
 * The backend issues one only for sessions whose roster an admin pre-registered, which is what
 * makes attendance match on the address this platform knows rather than on the display name
 * somebody typed into Zoom. Every other session returns null, and null has to keep meaning
 * "use the shared link" - including on the tenant sites that are several releases behind and
 * have never heard of the field.
 */

const base = {
  id: 1,
  topic_name: "Week 1",
  class_datetime: "2026-10-01T10:00:00Z",
  duration_minutes: 60,
  is_zoom: true,
  zoom_join_url: "https://zoom.us/j/shared",
  meeting_status: "scheduled" as const,
  time_remaining_minutes: 30,
};

describe("the student's join link", () => {
  it("carries the personal link through when the backend issues one", () => {
    const [session] = mapStudentLiveSessions([
      { ...base, my_join_link: "https://zoom.us/w/mine" },
    ]);
    expect(session.my_join_link).toBe("https://zoom.us/w/mine");
    expect(session.zoom_join_url).toBe("https://zoom.us/j/shared");
  });

  it("is null when the roster was never registered", () => {
    const [session] = mapStudentLiveSessions([{ ...base, my_join_link: null }]);
    expect(session.my_join_link).toBeNull();
  });

  it("is null, not undefined, when the field is absent entirely", () => {
    // A backend that predates the field, which is most of the fleet on any given day. The card
    // reads `my_join_link?.trim() || sharedUrl`, and both null and undefined fall through - but
    // normalising here means one shape reaches every consumer.
    const [session] = mapStudentLiveSessions([{ ...base }]);
    expect(session.my_join_link).toBeNull();
    expect(session.zoom_join_url).toBe("https://zoom.us/j/shared");
  });

  it("still counts the session as joinable without one", () => {
    const sessions = mapStudentLiveSessions([{ ...base }]);
    expect(sessions).toHaveLength(1);
  });
});
