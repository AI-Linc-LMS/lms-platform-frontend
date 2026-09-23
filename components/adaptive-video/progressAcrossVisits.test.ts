import { describe, expect, it } from "vitest";
import { finishedBefore, restoredAnswers, resumePoint, watchedPercent } from "./progressAcrossVisits";

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

describe("whether the video is already done", () => {
  it("reads the completion record", () => {
    expect(finishedBefore({ my_completed: true })).toBe(true);
    expect(finishedBefore({ my_completed: false })).toBe(false);
  });

  it("does not let the rewatch rule override it", () => {
    // Completed but not eligible for a question-free rewatch: the badge still says done.
    expect(finishedBefore({ my_completed: true, rewatch_available: false })).toBe(true);
    // ...and eligibility alone never invents a completion.
    expect(finishedBefore({ my_completed: false, rewatch_available: true })).toBe(false);
  });

  it("falls back to the rewatch flag only when the field is absent", () => {
    expect(finishedBefore({ rewatch_available: true })).toBe(true);
    expect(finishedBefore({})).toBe(false);
    expect(finishedBefore(null)).toBe(false);
  });
});

describe("the check-ins already passed", () => {
  it("comes back as a set the player can mark off", () => {
    expect(restoredAnswers([4, 9])).toEqual(new Set([4, 9]));
  });

  it("is empty for a first visit, or a server that sent nothing", () => {
    expect(restoredAnswers([])).toEqual(new Set());
    expect(restoredAnswers(undefined)).toEqual(new Set());
    expect(restoredAnswers(null)).toEqual(new Set());
  });
});
