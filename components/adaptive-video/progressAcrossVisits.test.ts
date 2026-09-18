import { describe, expect, it } from "vitest";
import { resumePoint, watchedPercent } from "./progressAcrossVisits";

describe("resuming a video", () => {
  it("picks up an unfinished visit where it stopped", () => {
    expect(resumePoint({ status: "active", current_timestamp: 212.5 }, 358)).toBe(212.5);
  });

  it("starts over when there is nothing worth resuming", () => {
    expect(resumePoint({ status: "active", current_timestamp: 4 }, 358)).toBeNull(); // barely started
    expect(resumePoint({ status: "active", current_timestamp: 352 }, 358)).toBeNull(); // at the end
    expect(resumePoint({ status: "completed", current_timestamp: 200 }, 358)).toBeNull(); // a rewatch
    expect(resumePoint(null, 358)).toBeNull();
  });

  it("does not wait for the duration to resume mid-video", () => {
    expect(resumePoint({ status: "active", current_timestamp: 120 }, 0)).toBe(120);
  });
});

describe("the watched part of the bar", () => {
  it("keeps what an earlier visit covered", () => {
    expect(watchedPercent(96.4, 3)).toBe(96.4);
  });

  it("grows past it as this visit covers more", () => {
    expect(watchedPercent(20, 35)).toBe(35);
  });

  it("stays within 0-100", () => {
    expect(watchedPercent(undefined, 0)).toBe(0);
    expect(watchedPercent(140, 0)).toBe(100);
  });
});
