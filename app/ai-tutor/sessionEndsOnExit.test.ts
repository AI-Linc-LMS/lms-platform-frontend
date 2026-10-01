/**
 * Leaving a lesson must end it, however the learner leaves.
 *
 * Reported: "If we do not end the session and close the window and then again in a new window we
 * open AI Tutor then this error is coming" — "You already have a tutor session open. Close it
 * first." — on a screen whose only control was "Back to AI Tutor", which closed nothing.
 *
 * There were three ways out of the room and only two were covered:
 *
 *   header arrow      → `leave()` → `end()`                     covered
 *   tab close / reload → `beforeunload` / `pagehide`            covered
 *   browser Back, sidebar, any in-app link → unmount            NOT covered
 *
 * An in-app route change fires neither unload event, and the hook's own cleanup — `teardown()` —
 * is local: it drops the transport and the timers and never tells the server. So the learner
 * walked out of a lesson the server still considered open.
 *
 * Asserted against the source rather than by rendering the room: the room is a 750-line component
 * over a WebRTC transport, and the property that matters is that the cleanup still ends the
 * session. A render test of any single exit would have passed throughout the bug.
 */

import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const read = (rel: string) => readFileSync(join(process.cwd(), rel), "utf8");
const ROOM = "app/ai-tutor/session/[id]/page.tsx";
const HOOK = "lib/hooks/useRealtimeTutor.ts";

describe("the tutor room", () => {
  it("ends the session when it unmounts, not only on a page unload", () => {
    const src = read(ROOM);
    const cleanup = src.match(
      /return \(\) => \{\s*window\.removeEventListener[\s\S]*?\};/,
    )?.[0];
    expect(cleanup, "the unload effect's cleanup").toBeTruthy();
    expect(
      cleanup,
      "the cleanup removes its listeners but never ends the session, so an in-app navigation " +
        "leaves the row open and the next start is refused",
    ).toMatch(/endOnExit\(\)/);
  });

  it("still ends the session on a real page unload", () => {
    const src = read(ROOM);
    expect(src).toMatch(/addEventListener\("beforeunload", endOnExit\)/);
    expect(src).toMatch(/addEventListener\("pagehide", endOnExit\)/);
  });

  it("leaves via the header arrow through the awaited end, not the keepalive one", () => {
    // `leave` can await, so it gets the full teardown and the recap redirect.
    const src = read(ROOM);
    expect(src).toMatch(/const leave = useCallback\(async \(\) => \{[\s\S]*?await end\("learner"\)/);
  });

  it("keeps the ender idempotent, so leaving normally does not double-end", () => {
    const src = read(HOOK);
    const fn = src.match(/const keepaliveEnd = useCallback\([\s\S]*?\n  \}, \[\]\);/)?.[0];
    expect(fn, "keepaliveEnd").toBeTruthy();
    // Both guards matter: no id means nothing to end, and closedRef means it is already ended.
    expect(fn).toMatch(/if \(!sid \|\| closedRef\.current\) return;/);
    expect(fn).toMatch(/closedRef\.current = true;/);
  });

  it("sets the session id only where a session has actually been obtained", () => {
    // What makes the unmount ender safe under reactStrictMode: at the simulated cleanup there is
    // no session id yet, so it no-ops.
    //
    // There are two such places now - `start` mints a new lesson and `resumeIfPossible` rejoins
    // one after a refresh - and the property is NOT "there is exactly one" (this test used to say
    // that, and the resume work rightly broke it). It is that every assignment happens AFTER a
    // server round-trip, so none of them can run during a mount.
    const src = read(HOOK);
    const sites = src.match(/sessionIdRef\.current = (?!null)[^;]+;/g) ?? [];
    expect(sites.length).toBeGreaterThan(0);
    expect([...sites].sort()).toEqual([
      "sessionIdRef.current = sid;",
      "sessionIdRef.current = started.session.id;",
    ]);
    // Each one sits directly after the call that produced its id.
    expect(src).toMatch(/await aiTutorService\.startSession\(input\);\s*\n\s*sessionIdRef\.current = started\.session\.id;/);
    expect(src).toMatch(/await aiTutorService\.reconnect\(sid\);\s*\n\s*sessionIdRef\.current = sid;/);
  });
});
