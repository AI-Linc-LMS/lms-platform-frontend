// @vitest-environment jsdom
/**
 * "Add a batch filter in Live Sessions and make the batch tags more prominent (students have
 *  this filter, you can check)."
 *
 * `cohort_id` and `adaptive_course_id` have been on the instructor payload all along - the
 * serializer comment calls them "Exact target ids" - but this page only ever read `cohort_name`,
 * which is not unique and is empty on a course-mapped series. So an instructor teaching several
 * batches had no way to look at one.
 *
 * The facet keys are namespaced because a cohort id and an adaptive-course id are different id
 * spaces: without the prefix, cohort 7 and course 7 would filter each other's sessions.
 */

import { describe, expect, it } from "vitest";

/** Mirror of the page-local helper. Kept in step with app/instructor/live-sessions/page.tsx. */
function facetsOf(s: {
  cohort_id?: number | null;
  adaptive_course_id?: number | null;
  cohort_name: string;
}): { key: string; label: string }[] {
  if (s.cohort_id != null) return [{ key: `c:${s.cohort_id}`, label: s.cohort_name || "Batch" }];
  if (s.adaptive_course_id != null) {
    return [{ key: `a:${s.adaptive_course_id}`, label: s.cohort_name || "Course" }];
  }
  return s.cohort_name ? [{ key: `n:${s.cohort_name}`, label: s.cohort_name }] : [];
}

const cohort = (id: number, name = "Batch A") => ({ cohort_id: id, adaptive_course_id: null, cohort_name: name });
const course = (id: number, name = "Python") => ({ cohort_id: null, adaptive_course_id: id, cohort_name: name });

describe("grouping instructor sessions by batch", () => {
  it("keys a cohort session on its cohort id", () => {
    expect(facetsOf(cohort(7, "Morning batch"))).toEqual([{ key: "c:7", label: "Morning batch" }]);
  });

  it("keys a course-mapped session on its course id", () => {
    expect(facetsOf(course(7, "Python"))).toEqual([{ key: "a:7", label: "Python" }]);
  });

  it("does not confuse cohort 7 with course 7", () => {
    // The whole reason the keys are namespaced: these are separate id spaces.
    expect(facetsOf(cohort(7))[0].key).not.toBe(facetsOf(course(7))[0].key);
  });

  it("prefers the cohort when a session somehow carries both", () => {
    const both = { cohort_id: 3, adaptive_course_id: 9, cohort_name: "Batch A" };
    expect(facetsOf(both)).toEqual([{ key: "c:3", label: "Batch A" }]);
  });

  it("falls back to the name only when there is no id at all", () => {
    // Legacy course rows carry neither id. Names are not unique, so this is a last resort.
    expect(facetsOf({ cohort_id: null, adaptive_course_id: null, cohort_name: "Old course" }))
      .toEqual([{ key: "n:Old course", label: "Old course" }]);
  });

  it("produces no facet for an untargeted session, so it never invents a batch", () => {
    expect(facetsOf({ cohort_id: null, adaptive_course_id: null, cohort_name: "" })).toEqual([]);
  });

  it("labels a nameless cohort rather than rendering an empty chip", () => {
    expect(facetsOf(cohort(4, ""))[0].label).toBe("Batch");
    expect(facetsOf(course(4, ""))[0].label).toBe("Course");
  });

  it("collapses many sessions to one option per batch, in first-seen order", () => {
    const rows = [cohort(2, "Evening"), cohort(1, "Morning"), cohort(2, "Evening"), course(5, "Python")];
    const seen = new Map<string, string>();
    rows.forEach((r) => facetsOf(r).forEach((f) => { if (!seen.has(f.key)) seen.set(f.key, f.label); }));
    expect([...seen.keys()]).toEqual(["c:2", "c:1", "a:5"]);
  });

  it("filters to exactly the selected batch", () => {
    const rows = [cohort(1, "Morning"), cohort(2, "Evening"), cohort(1, "Morning")];
    const picked = rows.filter((r) => facetsOf(r).some((f) => f.key === "c:1"));
    expect(picked).toHaveLength(2);
  });
});
