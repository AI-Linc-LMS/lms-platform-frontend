/**
 * Two chips that can never match anything.
 *
 * The instructor queue's cohort arm is `Q(cohort_id__in=...) & Q(category__in=TEACHING_CATEGORIES)`
 * and TEACHING_CATEGORIES is ('content','video','quiz'). Technical Support and Navigation Help are
 * therefore excluded by CONSTRUCTION, not by preference, and prod confirms it: no ticket in either
 * category has ever been routed to a teaching profile. Offering them gave every instructor two
 * filters that only ever return an empty list.
 *
 * PR #1480 diagnosed exactly this, added INSTRUCTOR_TICKET_CATEGORIES, and wired it into
 * app/admin/tickets only. This page, the one the nav labels "Cohort Tickets" and the one the
 * report is actually about, was missed.
 *
 * These assert the shared constants rather than rendering the page, because the page is the thing
 * that keeps drifting away from them and the constants are what both surfaces must agree on.
 */
import { describe, expect, it } from "vitest";

import {
  TICKET_CATEGORY_OPTIONS,
  INSTRUCTOR_TICKET_CATEGORIES,
} from "@/lib/services/ticket.service";

const instructorOptions = TICKET_CATEGORY_OPTIONS.filter((c) =>
  INSTRUCTOR_TICKET_CATEGORIES.includes(c.value),
);

describe("instructor ticket category filters", () => {
  it("offers exactly the categories a teacher can be routed", () => {
    expect(instructorOptions.map((c) => c.value)).toEqual(["content", "video", "quiz"]);
  });

  it("does not offer Technical Support", () => {
    expect(instructorOptions.some((c) => c.value === "technical")).toBe(false);
  });

  it("does not offer Navigation Help", () => {
    expect(instructorOptions.some((c) => c.value === "navigation")).toBe(false);
  });

  it("leaves the full admin list untouched", () => {
    // The admin queue genuinely handles all six; narrowing the shared constant would break it.
    expect(TICKET_CATEGORY_OPTIONS.map((c) => c.value)).toEqual(
      expect.arrayContaining(["technical", "navigation", "content", "video", "quiz"]),
    );
    expect(TICKET_CATEGORY_OPTIONS.length).toBeGreaterThan(instructorOptions.length);
  });

  it("every offered category is a real category, not an invented one", () => {
    const known = new Set(TICKET_CATEGORY_OPTIONS.map((c) => c.value));
    for (const value of INSTRUCTOR_TICKET_CATEGORIES) {
      expect(known.has(value)).toBe(true);
    }
  });
});
