import { describe, expect, it } from "vitest";

import { getAxiosErrorDetail } from "@/lib/utils/api-error";

/**
 * Every coding error a learner sees is the server's sentence, never Axios's status line.
 *
 * Ticket #626: a learner pressed "Begin" on a coding problem and was shown
 * "Request failed with status code 403". The server had already answered with a full
 * explanation in `detail`; the page read `e.message` instead, which is Axios's own string, and
 * threw the real reason away. Five of the six catches in AdaptiveCodingSolve did this; the
 * sixth had been fixed and the others missed, which is exactly the shape that comes back.
 *
 * These assert the SOURCE, by reading the component, because the alternative (rendering the
 * whole solve page per catch) tests the harness more than the rule. The rule is one line long
 * and the regression is textual: somebody writes `e.message` again.
 */

// Vitest runs from the repo root, so this resolves against the worktree under test.
const SOURCE = (() => {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { readFileSync } = require("node:fs") as typeof import("node:fs");
  return readFileSync("components/coding/AdaptiveCodingSolve.tsx", "utf8");
})();

describe("the coding page never shows an Axios status line", () => {
  it("has no catch that falls back to e.message", () => {
    // The exact pattern that caused #626, in any of its spacings.
    const leaks = SOURCE.match(/e\s+instanceof\s+Error\s*\?\s*e\.message/g) ?? [];
    expect(leaks, `found ${leaks.length} catch(es) still reading e.message`).toEqual([]);
  });

  it("routes every catch through getAxiosErrorDetail", () => {
    const catches = (SOURCE.match(/\}\s*catch\s*\(/g) ?? []).length;
    const routed = (SOURCE.match(/getAxiosErrorDetail\(/g) ?? []).length;
    // Six request paths today. If a catch is added without the helper this drops below and fails.
    expect(catches).toBeGreaterThanOrEqual(6);
    expect(routed, `${routed} getAxiosErrorDetail calls for ${catches} catches`).toBeGreaterThanOrEqual(6);
  });
});

describe("getAxiosErrorDetail, on the payloads these endpoints really send", () => {
  it("prefers the server's refusal over the Axios message", () => {
    const refusal =
      "This problem uses Hash Tables, Sliding Window and Two Pointers, which this course teaches later. Finish that topic and it will open.";
    const err = {
      message: "Request failed with status code 403",
      response: { status: 403, data: { detail: refusal } },
    };
    expect(getAxiosErrorDetail(err, "Couldn't start the session.")).toBe(refusal);
  });

  it("falls back to our own words when the server said nothing useful", () => {
    const err = { message: "Request failed with status code 500", response: { status: 500, data: {} } };
    expect(getAxiosErrorDetail(err, "Couldn't start the session.")).toBe("Couldn't start the session.");
  });

  it("never returns the Axios status line, even with no response at all", () => {
    const err = { message: "Request failed with status code 403" };
    expect(getAxiosErrorDetail(err, "Couldn't run your code against the tests.")).not.toContain(
      "Request failed with status code",
    );
  });
});
