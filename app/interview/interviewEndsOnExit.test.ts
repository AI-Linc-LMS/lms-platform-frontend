/**
 * Leaving an interview must end it, or the candidate cannot start another.
 *
 * Reported: "Closing an ongoing interview window without ending the session leaves the previous
 * interview active, preventing the user from starting a new interview and showing a 'Could not
 * connect' error."
 *
 * `StartInterviewView` refuses while the candidate holds a sitting in `pending`, `live` or
 * `finalising`. The interview room had NO exit handling at all - worse than the tutor, which at
 * least covered a real page unload:
 *
 *   header / End interview        -> end()                           covered
 *   tab close, reload             -> nothing                         NOT covered
 *   browser Back, any in-app link -> unmount                         NOT covered
 *
 * The unmount cleanup closed the RTCPeerConnection and the timers, which ends the call LOCALLY and
 * tells the server nothing - its own comment said "must not leave a live call running and billing",
 * and that is exactly what it left. So the candidate waited out the sweep: 8 minutes of heartbeat
 * grace, 15 if it never connected, 20 mid-coding-question.
 *
 * Asserted against the source rather than by rendering the room: it is a WebRTC transport behind a
 * realtime model, and the property that matters is that each exit reaches the server. A render test
 * of any single exit would have passed throughout the bug.
 */

import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const read = (rel: string) => readFileSync(join(process.cwd(), rel), "utf8");
const HOOK = "lib/hooks/useRealtimeInterview.ts";

describe("the interview room", () => {
  it("tells the SERVER the sitting is over, not just the peer connection", () => {
    const src = read(HOOK);
    expect(src, "a keepalive ender the unload paths can use").toMatch(
      /const keepaliveEnd = useCallback/,
    );
    expect(src).toMatch(/\/interview\/api\/sessions\/\$\{sid\}\/end\//);
    expect(src).toMatch(/keepalive: true/);
  });

  it("ends on a real page unload", () => {
    const src = read(HOOK);
    expect(src).toMatch(/addEventListener\("beforeunload", endOnExit\)/);
    expect(src).toMatch(/addEventListener\("pagehide", endOnExit\)/);
  });

  it("ends on an in-app navigation too, which fires neither unload event", () => {
    const src = read(HOOK);
    const cleanup = src.match(
      /return \(\) => \{\s*window\.removeEventListener\("beforeunload"[\s\S]*?\n    \};/,
    )?.[0];
    expect(cleanup, "the exit effect's cleanup").toBeTruthy();
    expect(
      cleanup,
      "local teardown is not an ending: without this the server never learns the candidate left",
    ).toMatch(/endOnExit\(\)/);
  });

  it("is idempotent, so ending normally does not double-end", () => {
    const src = read(HOOK);
    const fn = src.match(/const keepaliveEnd = useCallback\([\s\S]*?\n  \}, \[\]\);/)?.[0];
    expect(fn).toMatch(/if \(!sid \|\| closedRef\.current\) return;/);
    expect(fn).toMatch(/closedRef\.current = true;/);
  });

  it("shows the server's reason for refusing a start, not a generic retry", () => {
    // A bare catch turned a specific 409 - "You already have an interview open" - into
    // "Please try again", and Try again could not succeed while that sitting was open.
    const src = read(HOOK);
    expect(src).toMatch(/response\?\.data\?\.error/);
    expect(src).toMatch(/fail\(detail \|\| "Could not start the interview/);
  });
});
