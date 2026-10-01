/**
 * Refreshing a lesson must rejoin it, not buy another one.
 *
 * Reported: "if we refresh the page while talking to the AI tutor the timer starts again from the
 * start and the concepts are again taught."
 *
 * The room's URL is `/ai-tutor/session/new?topic=...` for the WHOLE lesson - deliberately, because
 * the global camera route guard tears media down on a pathname change, so rewriting it to the real
 * session id mid-call would kill the microphone and the tutor's voice. The consequence is that the
 * session id lived only in a ref, and a refresh destroyed it: the page remounted, saw a topic, and
 * started a brand new lesson.
 *
 * Production, one topic in four minutes: five sessions - 73s, 19s, 21s, 59s, 43s - each billed
 * separately, each teaching from the beginning.
 *
 * `SessionReconnectView` already did the right thing (same session, no new reservation, no extended
 * deadline, model primed with where the lesson had reached). Nothing could reach it after a refresh.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { afterEach, describe, expect, it, vi } from "vitest";

import {
  forgetLiveSession,
  recallLiveSession,
  rememberLiveSession,
} from "./useRealtimeTutor";

const read = (rel: string) => readFileSync(join(process.cwd(), rel), "utf8");

afterEach(() => {
  forgetLiveSession();
  vi.restoreAllMocks();
});

describe("remembering a lesson across a refresh", () => {
  it("round-trips the session id", () => {
    rememberLiveSession("abc-123");
    expect(recallLiveSession()).toBe("abc-123");
  });

  it("forgets it once the lesson ends", () => {
    rememberLiveSession("abc-123");
    forgetLiveSession();
    expect(recallLiveSession()).toBeNull();
  });

  it("reports nothing when this tab never had a lesson", () => {
    expect(recallLiveSession()).toBeNull();
  });

  it("survives storage being unavailable rather than throwing", () => {
    // Private mode and blocked site data both throw on access. Resume is a convenience; a lesson
    // must still start when it is impossible.
    const spy = vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("blocked");
    });
    expect(() => rememberLiveSession("x")).not.toThrow();
    spy.mockRestore();
    const get = vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("blocked");
    });
    expect(recallLiveSession()).toBeNull();
    get.mockRestore();
  });
});

describe("the room", () => {
  it("rejoins before it starts anything", () => {
    const src = read("app/ai-tutor/session/[id]/page.tsx");
    const launch = src.match(/if \(launchedRef\.current \|\| !topic\) return;[\s\S]*?\}, \[level/)?.[0];
    expect(launch, "the launch effect").toBeTruthy();
    expect(launch!.indexOf("resumeIfPossible")).toBeLessThan(launch!.indexOf("await start("));
  });

  it("remembers the lesson as soon as one exists", () => {
    const src = read("lib/hooks/useRealtimeTutor.ts");
    expect(src).toMatch(/setSessionId\(started\.session\.id\);\s*\n\s*\/\/[\s\S]*?rememberLiveSession\(started\.session\.id\)/);
  });

  it("forgets it on BOTH ways of ending, so a stale id cannot be rejoined", () => {
    const src = read("lib/hooks/useRealtimeTutor.ts");
    const keepalive = src.match(/const keepaliveEnd = useCallback\([\s\S]*?\n  \}, \[\]\);/)?.[0];
    const end = src.match(/const end = useCallback\([\s\S]*?closedRef\.current = true;[\s\S]{0,80}/)?.[0];
    expect(keepalive).toMatch(/forgetLiveSession\(\)/);
    expect(end).toMatch(/forgetLiveSession\(\)/);
  });

  it("falls back to a new lesson when the server says there is nothing to rejoin", () => {
    const src = read("lib/hooks/useRealtimeTutor.ts");
    const fn = src.match(/const resumeIfPossible = useCallback[\s\S]*?\n  \}, \[\]\);/)?.[0];
    expect(fn).toMatch(/forgetLiveSession\(\)/);
    expect(fn).toMatch(/return false;/);
  });
});
