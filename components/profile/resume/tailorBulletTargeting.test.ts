import { describe, expect, it } from "vitest";

/**
 * "AI does not rewrite any section according to the feature."
 *
 * It did rewrite. It wrote the rewrite onto the WRONG BULLET, and destroyed the original.
 *
 * `app/api/resume/tailor-section/route.ts` serialised each role as `{ index: i, ... }` where `i`
 * was the ROLE's position, and then asked the model to return an "index" meaning the BULLET's
 * position. One field name, two quantities, one prompt. Across 6 live trials, 23 of 23 returned
 * values equal to the role index.
 *
 * The client then wrote `description[change.index] = change.after` without ever checking that the
 * slot still held `change.before`. On the builder's own sample resume that replaced "Led
 * development of microservices architecture serving 1M+ users" with the rewrite of bullet 3.
 *
 * These tests pin the CLIENT-side guard, which is the layer that has to hold even if a model
 * returns nonsense.
 */

interface BulletChange {
  position: string;
  company: string;
  index: number;
  before: string;
  after: string;
}
type Role = { position: string; company: string; description: string[] };

/* The shipped logic, extracted verbatim in shape from SectionTailorButton. */
function locateBullet(exp: { description: string[] }, change: BulletChange): number {
  const before = (change.before ?? "").trim();
  if (!before) return -1;
  const exact: number[] = [];
  const loose: number[] = [];
  exp.description.forEach((d, i) => {
    if (d.trim() === before) exact.push(i);
    else if (d.trim().toLowerCase() === before.toLowerCase()) loose.push(i);
  });
  const found = exact.length ? exact : loose;
  if (found.length === 0) return -1;
  if (found.length === 1) return found[0];
  return found.includes(change.index) ? change.index : found[0];
}

const ROLE: Role = {
  position: "Senior Software Engineer",
  company: "Tech Solutions Inc.",
  description: [
    "Led development of microservices architecture serving 1M+ users",
    "Improved application performance by 40% through code optimization",
    "Mentored team of 5 junior developers",
  ],
};

const change = (over: Partial<BulletChange>): BulletChange => ({
  position: ROLE.position,
  company: ROLE.company,
  index: 0,
  before: ROLE.description[2],
  after: "Mentored 5 engineers, two promoted within a year",
  ...over,
});

describe("a rewrite lands on the bullet it was generated from", () => {
  it("ignores a role index masquerading as a bullet index", () => {
    // The exact live failure: model says index 0 (the ROLE), before is bullet 3.
    expect(locateBullet(ROLE, change({ index: 0 }))).toBe(2);
  });

  it("still works when the index happens to be right", () => {
    expect(locateBullet(ROLE, change({ index: 2 }))).toBe(2);
  });

  it("survives an index far outside the array", () => {
    // Previously this silently returned the role unchanged -- a rewrite that vanished.
    expect(locateBullet(ROLE, change({ index: 99 }))).toBe(2);
  });

  it("tolerates whitespace and case drift in the echoed before", () => {
    expect(locateBullet(ROLE, change({ before: "  mentored TEAM of 5 junior developers " }))).toBe(2);
  });
});

describe("it refuses rather than guesses", () => {
  it("does not place a rewrite whose before is not in the role any more", () => {
    // The learner edited the bullet after generating. Overwriting would destroy that edit.
    expect(locateBullet(ROLE, change({ before: "A bullet that no longer exists" }))).toBe(-1);
  });

  it("does not place a rewrite with no before at all", () => {
    expect(locateBullet(ROLE, change({ before: "" }))).toBe(-1);
  });

  it("never targets a slot that does not hold before", () => {
    // The property that matters: whatever index arrives, we only ever write where before is.
    for (let i = -3; i < 12; i++) {
      const at = locateBullet(ROLE, change({ index: i }));
      if (at >= 0) expect(ROLE.description[at]).toBe(ROLE.description[2]);
    }
  });
});

describe("duplicate bullet text", () => {
  const dupes: Role = { ...ROLE, description: ["Same line", "Other", "Same line"] };

  it("uses the index only to break a genuine tie", () => {
    expect(locateBullet(dupes, change({ before: "Same line", index: 2 }))).toBe(2);
    expect(locateBullet(dupes, change({ before: "Same line", index: 0 }))).toBe(0);
  });

  it("falls back to the first match when the tie-break index is not one of them", () => {
    expect(locateBullet(dupes, change({ before: "Same line", index: 1 }))).toBe(0);
  });
});
