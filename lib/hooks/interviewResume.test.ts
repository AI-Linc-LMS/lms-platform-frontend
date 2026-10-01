/**
 * Reloading an interview must rejoin it, not try to start another.
 *
 * Reported: "I refreshed the page and the same problem came again" - "Could not connect".
 *
 * The room is `/interview/room?template=...`, so the sitting id lives only in the page's memory and
 * a reload destroys it. The room then tried to START, and `StartInterviewView` refuses while the
 * candidate still holds one. Worse after the keepalive end shipped: the reload's `pagehide` moved
 * the sitting to `finalising`, which is deliberately NOT reclaimable - a sitting being marked is
 * real work - so the refusal became reliable AND it graded a half-finished interview.
 *
 * Rejoining creates no new paper, takes no new quota and does not extend the deadline. That is what
 * makes it safe for an assessment: a reconnect is not a way to re-roll a paper somebody disliked.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { afterEach, describe, expect, it, vi } from "vitest";

import {
  forgetLiveInterview,
  recallLiveInterview,
  rememberLiveInterview,
} from "./useRealtimeInterview";

const read = (rel: string) => readFileSync(join(process.cwd(), rel), "utf8");

afterEach(() => {
  forgetLiveInterview();
  vi.restoreAllMocks();
});

describe("remembering a sitting across a reload", () => {
  it("round-trips the sitting id", () => {
    rememberLiveInterview("s-1");
    expect(recallLiveInterview()).toBe("s-1");
  });

  it("forgets it once the interview ends", () => {
    rememberLiveInterview("s-1");
    forgetLiveInterview();
    expect(recallLiveInterview()).toBeNull();
  });

  it("degrades instead of throwing when storage is blocked", () => {
    const set = vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("blocked");
    });
    expect(() => rememberLiveInterview("s-1")).not.toThrow();
    set.mockRestore();
  });
});

describe("the room's start path", () => {
  const src = read("lib/hooks/useRealtimeInterview.ts");

  it("tries to rejoin before it tries to start", () => {
    expect(src.indexOf("interviewService.reconnect(")).toBeGreaterThan(-1);
    expect(src.indexOf("interviewService.reconnect(")).toBeLessThan(
      src.indexOf("interviewService.start(target)"),
    );
  });

  it("falls through to ONE connection path, rather than duplicating it", () => {
    // A resumed sitting and a new one need identical WebRTC setup; two copies is how they drift.
    expect(src).toMatch(/started = await interviewService\.reconnect\(existing\)/);
    expect(src).toMatch(/if \(!started\) \{/);
  });

  it("starts a fresh interview when there is nothing to rejoin", () => {
    const block = src.match(/const existing = recallLiveInterview\(\)[\s\S]*?\n      \}/)?.[0];
    expect(block).toMatch(/forgetLiveInterview\(\)/);
  });

  it("forgets the id on both ways of ending", () => {
    const keepalive = src.match(/const keepaliveEnd = useCallback\([\s\S]*?\n  \}, \[\]\);/)?.[0];
    expect(keepalive).toMatch(/forgetLiveInterview\(\)/);
    const end = src.match(/const end = useCallback\(async \(\) => \{[\s\S]{0,260}/)?.[0];
    expect(end).toMatch(/forgetLiveInterview\(\)/);
  });
});
