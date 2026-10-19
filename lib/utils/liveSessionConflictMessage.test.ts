/**
 * A 409 from the live-session API is not one thing, and treating it as one silenced five
 * messages.
 *
 * views_zoom.py returns a distinct 409 for: a Zoom host already booked (naming the clashing
 * session AND the free host), a series with no dates left on Zoom, a date with no occurrence
 * id, history that deleting would destroy, and attendance Zoom has not published yet. The
 * handler matched on the STATUS, so every one of them reached the admin as "Meeting has not
 * ended in Zoom yet. Please try again after ending the meeting."
 *
 * The double-booking guard was built to tell an admin which other licensed host is free. In
 * production that sentence has never been seen by anyone.
 */

import { describe, expect, it } from "vitest";

import {
  MEETING_NOT_FINALIZED_MESSAGE,
  getLiveSessionErrorMessage,
  getZoomApiErrorMessage,
} from "./live-session-errors";

const HOST_CONFLICT =
  'support@agileologyedu.com is already hosting "Live session" (session 232) ' +
  "Thu 22 Oct 20:00-22:00 UTC. A Zoom user can only host one live session at a time. " +
  "Choose a different host for this session: admin@agileologyedu.com.";

function reject(status: number, message: string, code?: string) {
  return { response: { status, data: { message, code } } };
}

describe("a 409 from the live-session API", () => {
  it("tells the admin which host is busy and which one is free", () => {
    const out = getLiveSessionErrorMessage(
      reject(409, HOST_CONFLICT, "host_conflict"),
      "zoom_create"
    );
    expect(out).toContain("support@agileologyedu.com");
    expect(out).toContain("admin@agileologyedu.com");
    expect(out).not.toBe(MEETING_NOT_FINALIZED_MESSAGE);
  });

  it("keeps the canned line for the case it was actually written for", () => {
    const out = getLiveSessionErrorMessage(
      reject(409, "Meeting is not finalized yet."),
      "sync_attendance"
    );
    expect(out).toBe(MEETING_NOT_FINALIZED_MESSAGE);
  });

  it("passes through the other four distinct 409s instead of flattening them", () => {
    const messages = [
      "This session's Zoom webinar has no dates left on Zoom's side, so a date added here would have no working join link.",
      "This date has no Zoom occurrence id, so its time can't be edited safely.",
      "This class has history attached — 12 attendance rows. Deleting the date deletes that too.",
      "Zoom hasn't published this session's attendance report yet — it can take a few minutes.",
    ];
    for (const m of messages) {
      expect(getLiveSessionErrorMessage(reject(409, m), "zoom_create")).toBe(m);
    }
  });

  it("still says something when the server sends a 409 with no message", () => {
    expect(getLiveSessionErrorMessage(reject(409, ""), "zoom_create")).toBe(
      MEETING_NOT_FINALIZED_MESSAGE
    );
  });
});

describe("a 200 carrying status:error", () => {
  it("does not rewrite a message merely because it contains the digits 409", () => {
    // A session id, a room number, a time - any of them can be "409". Matching the substring
    // replaced the whole sentence.
    const msg = 'support@acme.test is already hosting "Live session" (session 409).';
    expect(getZoomApiErrorMessage(msg, "zoom_create")).toBe(msg);
  });

  it("keeps mapping the genuine not-finalized message", () => {
    expect(
      getZoomApiErrorMessage("Meeting is not finalized", "sync_attendance")
    ).toBe(MEETING_NOT_FINALIZED_MESSAGE);
  });
});
