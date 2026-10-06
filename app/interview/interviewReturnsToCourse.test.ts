/**
 * An interview launched from a course must return to that course.
 *
 * The room is a shared runtime. It is reached from the standalone hub at `/interview`, and -
 * since the journey's interview rounds moved onto the rebuilt stack - from a course's spine.
 * Every exit in it was a literal `/interview`:
 *
 *   preflight cancel         -> /interview        a hub the learner never visited
 *   "could not connect"      -> /interview        same
 *   finished -> result page  -> /interview        same, one hop later
 *
 * A learner seven weeks into a course, sitting round 4, who declines the camera check is
 * dropped into a list of practice interviews with no way back to the week they were on. So
 * the launch carries `?from=<course path>` and each exit resolves it.
 *
 * Asserted against the source rather than by rendering: the room is a WebRTC transport behind
 * a realtime model, and the property that matters is that NO exit is left hard-coded. A render
 * test of any one exit passes while the other two are still wrong - which is how this shipped.
 * `safeFrom` has its own tests; this asserts the room goes through it.
 */

import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const read = (rel: string) => readFileSync(join(process.cwd(), rel), "utf8");
const ROOM = "app/interview/room/page.tsx";
const RESULT = "app/interview/result/[sessionId]/page.tsx";
const LAUNCH = "components/adaptive-journey/useInterviewLaunch.ts";

describe("an interview launched from a course", () => {
  it("is launched with the course as its return target", () => {
    const src = read(LAUNCH);
    expect(src).toMatch(/withFrom\(`\/interview\/room\?template=\$\{templateId\}`, `\/adaptive-courses\/\$\{courseId\}`\)/);
  });

  it("does not mint a legacy sitting on a tenant that has the rebuilt stack", () => {
    // Completion of a journey interview step reads a v2 session. A v1 sitting minted here
    // grades fine and still leaves the step forever incomplete.
    const src = read(LAUNCH);
    const v2 = src.match(/if \(v2\) \{[\s\S]*?\n      \}/)?.[0];
    expect(v2, "the v2 branch").toBeTruthy();
    expect(v2).not.toMatch(/startTemplateInterview/);
    expect(v2).toMatch(/return;/);
  });

  it("resolves the return target through the open-redirect guard", () => {
    // `from` arrives in the URL bar. Navigating to it unchecked is an open redirect.
    const src = read(ROOM);
    expect(src).toMatch(/const backHref = safeFrom\(params\.get\("from"\)\) \|\| "\/interview";/);
  });

  it("leaves no exit in the room hard-coded to the hub", () => {
    const src = read(ROOM);
    expect(src, "every exit resolves the return target").not.toMatch(
      /router\.push\("\/interview"\)/,
    );
    // Preflight cancel and the could-not-connect exit.
    expect(src.match(/router\.push\(backHref\)/g)?.length).toBe(2);
  });

  it("carries the return target into the result page, which is the exit actually taken", () => {
    const src = read(ROOM);
    expect(src).toMatch(
      /router\.push\(withFrom\(`\/interview\/result\/\$\{finishedSessionRef\.current\}`, backHref\)\)/,
    );
    const result = read(RESULT);
    expect(result).toMatch(/useReturnTo\(\{ href: "\/interview", label: "All interviews" \}\)/);
    expect(result, "the result page's exit").not.toMatch(/router\.push\("\/interview"\)/);
  });
});
