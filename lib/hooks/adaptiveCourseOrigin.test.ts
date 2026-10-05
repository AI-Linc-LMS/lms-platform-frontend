/**
 * The adaptive course list has always been two lists in a trench coat: the tenant's published
 * catalog and the learner's own roadmap-built courses, merged by the same endpoint and sorted
 * together by date. These pin the rule that separates them.
 */

import { describe, expect, it } from "vitest";
import {
  countByOrigin,
  filterByOrigin,
  isBuiltByLearner,
  shouldOfferOriginFilter,
  type HasOrigin,
} from "./adaptiveCourseOrigin";

type Course = HasOrigin & { id: number };

const forge: Course = { id: 1, origin: "forge" };
const authored: Course = { id: 2, origin: "authored" };
/** A server that predates the field. The whole point of the default. */
const legacy: Course = { id: 3 };

describe("telling the learner's own courses from the tenant's", () => {
  it("counts a forge course as the learner's", () => {
    expect(isBuiltByLearner(forge)).toBe(true);
  });

  it("counts an authored course as the tenant's", () => {
    expect(isBuiltByLearner(authored)).toBe(false);
  });

  it("treats a course with no origin as the TENANT's, not the learner's", () => {
    // A server that predates the field omits it. Claiming the institution's course was built
    // by the learner is a lie about provenance; the reverse is only a missing badge.
    expect(isBuiltByLearner(legacy)).toBe(false);
  });

  it("filters to each side, and 'all' keeps everything", () => {
    const list = [forge, authored, legacy];
    expect(filterByOrigin(list, "all")).toHaveLength(3);
    expect(filterByOrigin(list, "mine")).toEqual([forge]);
    expect(filterByOrigin(list, "client")).toEqual([authored, legacy]);
  });

  it("counts both sides, so the tabs can say how many", () => {
    expect(countByOrigin([forge, forge, authored, legacy])).toEqual({ mine: 2, client: 2 });
  });

  it("offers the switcher only when the list really holds both kinds", () => {
    // Most tenants have no forge courses at all. A filter with nothing on one side of it is
    // chrome that explains nothing.
    expect(shouldOfferOriginFilter([forge, authored])).toBe(true);
    expect(shouldOfferOriginFilter([authored, legacy])).toBe(false);
    expect(shouldOfferOriginFilter([forge, forge])).toBe(false);
    expect(shouldOfferOriginFilter([])).toBe(false);
  });
});
