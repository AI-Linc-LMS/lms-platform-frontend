import { describe, expect, it } from "vitest";
import type { InstructorRow } from "@/lib/services/admin/admin-instructors.service";
import {
  EMPTY_FILTERS,
  activeFilterCount,
  facetsForTab,
  matchesFilters,
  scopeFiltersToTab,
  type MatchContext,
} from "./instructorFilters";

const NOW = Date.parse("2026-11-05T12:00:00Z");

function row(over: Partial<InstructorRow> = {}): InstructorRow {
  return {
    id: 1,
    email: "a@x.com",
    full_name: "A",
    phone_number: "",
    created_at: "2026-01-01T00:00:00Z",
    pending_status: "approved",
    ...over,
  };
}

function ctx(over: Partial<MatchContext> = {}): MatchContext {
  return {
    codeById: {},
    now: NOW,
    assignedKeys: () => [],
    ...over,
  };
}

describe("course and code facets", () => {
  it("separates instructors with courses from those without", () => {
    const assigned = row({ id: 1 });
    const bare = row({ id: 2 });
    const c = ctx({ assignedKeys: (r) => (r.id === 1 ? ["classic:7"] : []) });

    const f = { ...EMPTY_FILTERS, courses: "yes" as const };
    expect(matchesFilters(assigned, f, c)).toBe(true);
    expect(matchesFilters(bare, f, c)).toBe(false);

    const g = { ...EMPTY_FILTERS, courses: "no" as const };
    expect(matchesFilters(assigned, g, c)).toBe(false);
    expect(matchesFilters(bare, g, c)).toBe(true);
  });

  it("reads the instructor code from the context, not the row", () => {
    // Codes come from a separate endpoint and are not a field on InstructorRow, so a filter
    // that looked at the row alone would report every instructor as having no code.
    const c = ctx({ codeById: { 1: "KISH01" } });
    expect(matchesFilters(row({ id: 1 }), { ...EMPTY_FILTERS, code: "yes" }, c)).toBe(true);
    expect(matchesFilters(row({ id: 2 }), { ...EMPTY_FILTERS, code: "yes" }, c)).toBe(false);
  });

  it("matches a specific course by its kind-qualified key", () => {
    // id 7 exists in BOTH the classic and adaptive tables as different courses, so a filter
    // keyed on the bare id would show adaptive instructors under a classic course.
    const c = ctx({ assignedKeys: () => ["adaptive:7"] });
    expect(matchesFilters(row(), { ...EMPTY_FILTERS, course: "adaptive:7" }, c)).toBe(true);
    expect(matchesFilters(row(), { ...EMPTY_FILTERS, course: "classic:7" }, c)).toBe(false);
  });

  it("filters on an uploaded CV", () => {
    const withCv = row({ instructor_cv_url: "https://s3/x.pdf" });
    expect(matchesFilters(withCv, { ...EMPTY_FILTERS, cv: "yes" }, ctx())).toBe(true);
    expect(matchesFilters(row(), { ...EMPTY_FILTERS, cv: "yes" }, ctx())).toBe(false);
    expect(matchesFilters(row(), { ...EMPTY_FILTERS, cv: "no" }, ctx())).toBe(true);
  });
});

describe("the joined window", () => {
  it("keeps rows inside the window and drops older ones", () => {
    const recent = row({ created_at: "2026-11-01T00:00:00Z" });
    const old = row({ created_at: "2026-08-01T00:00:00Z" });
    const f = { ...EMPTY_FILTERS, joined: "7" as const };
    expect(matchesFilters(recent, f, ctx())).toBe(true);
    expect(matchesFilters(old, f, ctx())).toBe(false);
  });

  it("drops a row whose created_at cannot be parsed", () => {
    // NaN comparisons are false either way, so this would "work" by accident. It is asserted
    // because an unparseable date silently passing a "last 7 days" filter is a wrong answer
    // that looks like a right one.
    const broken = row({ created_at: "" });
    expect(matchesFilters(broken, { ...EMPTY_FILTERS, joined: "7" }, ctx())).toBe(false);
    // ...and still passes when no window is set.
    expect(matchesFilters(broken, EMPTY_FILTERS, ctx())).toBe(true);
  });
});

describe("facets per tab", () => {
  it("offers course and code facets only where they can mean anything", () => {
    expect(facetsForTab("approved")).toContain("courses");
    expect(facetsForTab("approved")).toContain("code");
    expect(facetsForTab("pending")).not.toContain("courses");
    expect(facetsForTab("rejected")).not.toContain("code");
    // CV is the thing an admin reviews before approving, so it belongs on the queue.
    expect(facetsForTab("pending")).toContain("cv");
  });

  it("drops a facet the new tab does not offer", () => {
    // Otherwise a filter set on the approved tab keeps narrowing the pending queue from a
    // control that is no longer on screen: an empty table with no visible cause.
    const set = { ...EMPTY_FILTERS, courses: "no" as const, code: "yes" as const };
    expect(scopeFiltersToTab(set, "pending")).toEqual(EMPTY_FILTERS);
    expect(scopeFiltersToTab(set, "approved")).toEqual(set);
  });

  it("counts only the facets the current tab shows", () => {
    const set = { ...EMPTY_FILTERS, courses: "no" as const, cv: "yes" as const };
    expect(activeFilterCount(set, "approved")).toBe(1);
    expect(activeFilterCount(set, "pending")).toBe(1);
    expect(activeFilterCount(EMPTY_FILTERS, "approved")).toBe(0);
  });
});

describe("no filters", () => {
  it("passes everything", () => {
    expect(matchesFilters(row(), EMPTY_FILTERS, ctx())).toBe(true);
  });
});
