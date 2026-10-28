import { describe, expect, it } from "vitest";

import { learnerJoinUrl } from "./learner-join-url";

/**
 * Attendance is exact only when the student arrives on the link we registered for them. The
 * learner page's hero "Join now" and its calendar exports read `zoom_join_url` directly, so a
 * registered student who used either arrived as an anonymous registrant and was matched on their
 * display name - the very thing registration exists to end.
 */
const zoom = { zoom_join_url: "https://zoom.us/j/shared" };

describe("the link a student opens", () => {
  it("is the personal one when the roster was registered", () => {
    expect(learnerJoinUrl({ ...zoom, my_join_link: "https://zoom.us/w/mine?tk=abc" })).toBe(
      "https://zoom.us/w/mine?tk=abc"
    );
  });

  it("is the shared one when there is no personal link - null, absent or blank", () => {
    // Null is the normal answer from the backend; absent is a tenant site a release behind;
    // blank is a registrant row whose join_url Zoom never filled. None may lock a student out.
    expect(learnerJoinUrl({ ...zoom, my_join_link: null })).toBe("https://zoom.us/j/shared");
    expect(learnerJoinUrl({ ...zoom })).toBe("https://zoom.us/j/shared");
    expect(learnerJoinUrl({ ...zoom, my_join_link: "   " })).toBe("https://zoom.us/j/shared");
  });

  it("falls back to a manual join link for a Zoom session without a Zoom URL", () => {
    expect(learnerJoinUrl({ join_link: "https://example.test/room" })).toBe(
      "https://example.test/room"
    );
  });

  it("a Google Meet session uses its Meet link and nothing else", () => {
    expect(
      learnerJoinUrl({
        is_google_meet: true,
        join_link: "https://meet.google.com/abc-defg-hij",
        zoom_join_url: "https://zoom.us/j/stale",
        my_join_link: "https://zoom.us/w/stale",
      })
    ).toBe("https://meet.google.com/abc-defg-hij");
  });

  it("is empty, never undefined, when there is nothing to open", () => {
    expect(learnerJoinUrl({})).toBe("");
  });
});
