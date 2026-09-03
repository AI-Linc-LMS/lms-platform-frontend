import { describe, expect, it } from "vitest";
import { statusOf } from "./sessionStatus";
import type { InstructorLiveSession } from "@/lib/services/instructor.service";

/**
 * Reported: "Sessions cancelled from the Admin side are still appearing as active sessions
 * in the instructor's Live Sessions list."
 *
 * The backend has always sent status "cancelled" (live_class/serializers.py get_meeting_status
 * and live_class/views_zoom.py _occurrence_status), and instructor.service.ts has always typed
 * it. This page's own SessionStatus narrowed it away, so "cancelled" matched none of the
 * accepted values and statusOf() fell through to deriving status from the clock - which turned
 * a cancelled upcoming class back into "Scheduled".
 *
 * At the time of the fix prod held 31 cancelled occurrences, 15 of them in the future.
 */

const HOUR = 3_600_000;
const NOW = Date.parse("2026-09-03T12:00:00Z");

function session(over: Partial<InstructorLiveSession>): InstructorLiveSession {
  return {
    class_datetime: new Date(NOW + HOUR).toISOString(),
    duration_minutes: 30,
    ...over,
  } as InstructorLiveSession;
}

describe("a cancelled session is never shown as active", () => {
  it("stays cancelled when its slot is still in the future", () => {
    // The reported case: this used to read "Scheduled".
    const s = session({ status: "cancelled", class_datetime: new Date(NOW + 48 * HOUR).toISOString() });
    expect(statusOf(s, NOW)).toBe("cancelled");
  });

  it("stays cancelled when its slot has passed", () => {
    // This used to read "Ended", quietly hiding that it was called off.
    const s = session({ status: "cancelled", class_datetime: new Date(NOW - 48 * HOUR).toISOString() });
    expect(statusOf(s, NOW)).toBe("cancelled");
  });

  it("stays cancelled even during its own scheduled window", () => {
    const s = session({ status: "cancelled", class_datetime: new Date(NOW - 5 * 60_000).toISOString() });
    expect(statusOf(s, NOW)).toBe("cancelled");
  });
});

describe("the server's verdict still wins for every other status", () => {
  it("passes through live, scheduled and ended", () => {
    for (const st of ["live", "scheduled", "ended"] as const) {
      expect(statusOf(session({ status: st }), NOW)).toBe(st);
    }
  });

  it("maps the server's 'expired' onto ended", () => {
    const s = session({ status: "expired" as InstructorLiveSession["status"] });
    expect(statusOf(s, NOW)).toBe("ended");
  });
});

describe("the clock is still the fallback for a payload with no status", () => {
  const noStatus = { status: undefined as unknown as InstructorLiveSession["status"] };

  it("reads scheduled before the start", () => {
    expect(statusOf(session({ ...noStatus, class_datetime: new Date(NOW + HOUR).toISOString() }), NOW))
      .toBe("scheduled");
  });

  it("reads live inside the window", () => {
    expect(statusOf(session({ ...noStatus, class_datetime: new Date(NOW - 5 * 60_000).toISOString() }), NOW))
      .toBe("live");
  });

  it("reads ended after the window", () => {
    expect(statusOf(session({ ...noStatus, class_datetime: new Date(NOW - 5 * HOUR).toISOString() }), NOW))
      .toBe("ended");
  });
});
