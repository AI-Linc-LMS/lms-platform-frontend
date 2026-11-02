import { describe, expect, it } from "vitest";

import { schedulerBanner } from "./schedulerState";

const stale = {
  last_seen: "2026-11-02T06:00:00Z", age_minutes: 42, stale: true, stale_after_minutes: 15,
  paused: ["roster registration with Zoom", "attendance sync after a class"],
};

describe("schedulerBanner", () => {
  it("names the outage in minutes and says what is paused", () => {
    const b = schedulerBanner(stale);
    expect(b?.title).toBe("The background scheduler has not run for 42 minutes");
    expect(b?.body).toContain("roster registration with Zoom, attendance sync after a class are paused");
    expect(b?.body).toContain("Tell engineering");
  });

  it("stays quiet when the scheduler is alive", () => {
    expect(schedulerBanner({ ...stale, stale: false, age_minutes: 1, paused: [] })).toBeNull();
  });

  it("stays quiet when the state is unknown - an older server, or a deploy that has not ticked", () => {
    expect(schedulerBanner(null)).toBeNull();
    expect(schedulerBanner(undefined)).toBeNull();
  });

  it("falls back to the window when the age is unknown", () => {
    expect(schedulerBanner({ ...stale, age_minutes: null })?.title).toContain("15 minutes");
  });
});
