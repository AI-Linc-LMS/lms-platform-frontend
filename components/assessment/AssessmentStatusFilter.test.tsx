import { readFileSync } from "node:fs";
import path from "node:path";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { AssessmentStatusFilter } from "./AssessmentStatusFilter";

/**
 * The learner's assessment list on a phone.
 *
 * Measured on an iPhone 14 (390px) against the demo tenant: the five status filters sat in a
 * single `overflow: auto` pill track that measured 664px. The row ran off the right edge with no
 * scrollbar, no fade and no snap, so "Completed" and "Expired" were invisible AND unreachable
 * unless a learner happened to try dragging a row that gave no sign it could be dragged. Each pill
 * was also ~34px tall against the 44px a thumb needs.
 *
 * These tests pin the contract, not the pixels: a named scroll container, real buttons that report
 * their own state, and the untouched segmented track still there for a desktop.
 */

const TABS = [
  { value: "all" as const, label: "All", count: 12 },
  { value: "available" as const, label: "Available", count: 4 },
  { value: "under_review" as const, label: "Under review", count: 1 },
  { value: "completed" as const, label: "Completed", count: 6 },
  { value: "expired" as const, label: "Expired", count: 1 },
];

const LABEL = "Filter assessments by status";

function renderFilter(value: (typeof TABS)[number]["value"] = "all", onChange = vi.fn()) {
  const utils = render(
    <AssessmentStatusFilter tabs={TABS} value={value} onChange={onChange} ariaLabel={LABEL} />,
  );
  return { ...utils, onChange };
}

describe("the status filter on a phone", () => {
  it("puts the chips in a named scroll container instead of letting them run off the screen", () => {
    renderFilter();
    // ScrollRow's group role is the affordance: a row that scrolls on purpose and says so.
    const row = screen.getByRole("group", { name: LABEL });
    expect(row).toBeTruthy();
    expect(within(row).getAllByRole("button")).toHaveLength(TABS.length);
  });

  it("offers every status, including the two that used to sit past the right edge", () => {
    renderFilter();
    const chips = within(screen.getByRole("group", { name: LABEL })).getAllByRole("button");
    expect(chips.map((c) => c.textContent)).toEqual([
      "All12",
      "Available4",
      "Under review1",
      "Completed6",
      "Expired1",
    ]);
  });

  it("gives each chip a 44px target rather than the 34px pill it replaced", () => {
    renderFilter();
    const chip = within(screen.getByRole("group", { name: LABEL })).getAllByRole("button")[0];
    expect(getComputedStyle(chip).minHeight).toBe("44px");
  });

  it("reports which status is showing, so the chip is not just a coloured pill", () => {
    renderFilter("completed");
    const chips = within(screen.getByRole("group", { name: LABEL })).getAllByRole("button");
    const pressed = chips.filter((c) => c.getAttribute("aria-pressed") === "true");
    expect(pressed).toHaveLength(1);
    expect(pressed[0].textContent).toContain("Completed");
  });

  it("changes the filter when a chip is tapped", () => {
    const { onChange } = renderFilter();
    const chips = within(screen.getByRole("group", { name: LABEL })).getAllByRole("button");
    fireEvent.click(chips[4]);
    expect(onChange).toHaveBeenCalledWith("expired");
  });
});

describe("the status filter on a desktop", () => {
  it("is still the shared segmented track, so nine admin pages and this one keep one control", () => {
    const { container } = renderFilter();
    const desktop = container.querySelector('[data-testid="assessment-filter-tabs"]');
    expect(desktop).toBeTruthy();
    expect(within(desktop as HTMLElement).getByRole("tablist")).toBeTruthy();
  });

  it("shows the same tabs in both layouts, so the two can never disagree", () => {
    const { container } = renderFilter();
    const phone = container.querySelector('[data-testid="assessment-filter-chips"]') as HTMLElement;
    const desktop = container.querySelector('[data-testid="assessment-filter-tabs"]') as HTMLElement;
    for (const tab of TABS) {
      expect(within(phone).getByText(tab.label)).toBeTruthy();
      expect(within(desktop).getByText(tab.label)).toBeTruthy();
    }
  });
});

/* ==========================================================================
 * A source scan, for the one rule that is about every file rather than one rendered element.
 *
 * How the catalogue page and the card actually render at 390px (pill sizes, tap targets, the
 * next-up button, the grid column) is asserted by rendering them, in
 * `app/assessments/page.mobile.test.tsx`. The detail and result pages have no such harness yet,
 * so the 12px floor is held here as a lint over all six files.
 * ======================================================================== */

const ROOT = path.join(__dirname, "..", "..");
const read = (rel: string) => readFileSync(path.join(ROOT, rel), "utf8");

describe("no learner-facing assessment text drops below 12px on a phone", () => {
  // 12px is the floor. Every one of these files used a bare sub-12px size; a bare size applies at
  // every width, so the only safe form is a breakpoint object that steps up on `xs`.
  const FILES = [
    "app/assessments/page.tsx",
    "app/assessments/[slug]/page.tsx",
    "app/assessments/result/[slug]/page.tsx",
    "components/assessment/AssessmentCard.tsx",
    "components/assessment/result/EnhancedStatsBar.tsx",
    "components/assessment/result/EnhancedSkillsTags.tsx",
  ];
  /** Every `fontSize: "<n>rem"` / `"<n>px"` written as a plain string, with its pixel value. */
  function bareFontSizes(source: string): string[] {
    const found: string[] = [];
    for (const m of source.matchAll(/fontSize:\s*"([\d.]+)(rem|px)"/g)) {
      const px = m[2] === "rem" ? Number(m[1]) * 16 : Number(m[1]);
      if (px < 12) found.push(m[0]);
    }
    return found;
  }

  for (const file of FILES) {
    it(`${file} sets no bare sub-12px font size`, () => {
      expect(bareFontSizes(read(file))).toEqual([]);
    });
  }

  it("catches a bare tiny size if one is reintroduced", () => {
    expect(bareFontSizes('fontSize: "0.7rem",')).toEqual(['fontSize: "0.7rem"']);
    expect(bareFontSizes('fontSize: "0.75rem",')).toEqual([]);
  });
});
