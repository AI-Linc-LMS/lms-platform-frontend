/**
 * When the AI provider is out of credit, the room must not look broken.
 *
 * Reported: "when open ai credits is not available - it should gracefully handle those issue
 * like server could not be reached at the moment - wait for sometime - not connect error or
 * something - it should not sound like its platform error - as it might lead to esclation or
 * bad experience."
 *
 * The room had ONE failure chrome for every failure: a red-bordered panel headed "Could not
 * connect", with a "Try again" button. For a provider at capacity all three are wrong - the
 * red says defect, the heading blames the connection, and the retry cannot succeed until
 * somebody tops the account up. A candidate who retries three times and fails three times
 * raises a ticket.
 *
 * Asserted against the source rather than by rendering, for the same reason as the room's other
 * guards: it is a WebRTC transport behind a realtime model, and the property that matters is
 * that the capacity case is branched on at all three places. A render test of one branch passes
 * while the other two are still wrong.
 */

import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const read = (rel: string) => readFileSync(join(process.cwd(), rel), "utf8");
const ROOM = "app/interview/room/page.tsx";
const HOOK = "lib/hooks/useRealtimeInterview.ts";

describe("the interview room, when the provider is at capacity", () => {
  it("reads the server's verdict instead of guessing from the status", () => {
    const src = read(HOOK);
    expect(src).toMatch(/readProviderOutage\(err\)/);
    expect(src).toMatch(/retryLater: outage\.retryLater/);
  });

  it("does not head it 'Could not connect'", () => {
    const src = read(ROOM);
    // Anchored on the heading's own ternary. A looser match picked up the BORDER ternary two
    // lines above, which also starts `{unavailable ?` - and then asserted nothing.
    const heading = src.match(/\{unavailable\s*\n?\s*\?\s*"[^"]+"[\s\S]{0,160}?Could not connect"\}/)?.[0];
    expect(heading, "the heading branch").toBeTruthy();
    expect(heading).toMatch(/busy right now/i);
    // "Could not connect" survives, but only as the else.
    expect(heading!.indexOf("busy right now")).toBeLessThan(heading!.indexOf("Could not connect"));
  });

  it("drops the red border, because a busy provider is not an error state", () => {
    const src = read(ROOM);
    expect(src).toMatch(/border: `1px solid \$\{unavailable \? ROOM_BORDER : ROOM_RED\}`/);
  });

  it("offers NO retry, because a retry cannot succeed", () => {
    // The whole point. A button that always fails is what turns a wait into an escalation.
    const src = read(ROOM);
    expect(src).toMatch(/\{!dropped && !unavailable \? \(/);
  });

  it("still offers the ordinary retry for an ordinary failure", () => {
    // The fix must not take the retry away from people whose network blipped.
    const src = read(ROOM);
    expect(src).toMatch(/Try again/);
    expect(src).toMatch(/ROOM_RED/);
  });

  it("clears the flag when a fresh attempt starts", () => {
    // Otherwise one capacity refusal makes every later failure in that room look calm, retry
    // button and all, for the rest of the session.
    const src = read(HOOK);
    const reset = src.match(/setError\(""\);\s*\n\s*setDropped\(false\);\s*\n\s*setUnavailable\(false\);/);
    expect(reset).toBeTruthy();
  });
});
