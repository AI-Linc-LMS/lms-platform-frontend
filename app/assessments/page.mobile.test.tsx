import type { ReactNode } from "react";
import { render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * The learner's assessment catalogue at phone width, rendered rather than grepped.
 *
 * jsdom's getComputedStyle skips every `@media` block, and MUI emits even the `xs` half of a
 * responsive value inside `@media (min-width:0px)`, so a plain computed style shows neither the
 * phone nor the desktop. `atWidth` resolves the width queries emotion generated for a given
 * viewport (keeping the ones that match, dropping the rest), lets jsdom's own cascade do the
 * selector matching, and then puts the sheets back. What a test reads is what that width gets.
 */

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), prefetch: vi.fn(), back: vi.fn() }),
  usePathname: () => "/assessments",
  useSearchParams: () => new URLSearchParams(),
}));
vi.mock("@/components/common/PageShell", () => ({
  PageShell: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));
vi.mock("@/components/common/ModulePageHeader", () => ({ ModulePageHeader: () => null }));
vi.mock("@/components/common/Toast", () => ({ useToast: () => ({ showToast: vi.fn() }) }));
vi.mock("@/lib/hooks/useB2CAllowance", () => ({
  useB2CAllowance: () => ({ isB2C: false, freeAssessmentsLeft: 0, refresh: vi.fn() }),
}));
vi.mock("@/hooks/useAssessmentPurchase", () => ({
  useAssessmentPurchase: () => ({ buy: vi.fn(), buyingSlug: null }),
}));
vi.mock("@/hooks/useB2CClaim", () => ({
  useB2CClaim: () => ({ claim: vi.fn(), claimingKey: null }),
}));
vi.mock("@/hooks/usePrefetchOnHover", () => ({ usePrefetchOnHover: () => ({}) }));

const getActiveAssessments = vi.fn();
vi.mock("@/lib/services/assessment.service", () => ({
  assessmentService: { getActiveAssessments: () => getActiveAssessments() },
}));

import AssessmentsPage from "./page";

const PHONE = 390;
const TABLET = 768;

/** Splits a stylesheet into top-level blocks (`sel{...}` or `@media ...{...}`), brace-aware. */
function topLevelBlocks(css: string): string[] {
  const blocks: string[] = [];
  let depth = 0;
  let start = 0;
  for (let i = 0; i < css.length; i++) {
    if (css[i] === "{") depth++;
    else if (css[i] === "}" && --depth === 0) {
      blocks.push(css.slice(start, i + 1).trim());
      start = i + 1;
    }
  }
  return blocks.filter(Boolean);
}

function mediaMatches(query: string, width: number): boolean {
  const min = query.match(/^\(min-width:\s*([\d.]+)px\)$/);
  if (min) return width >= Number(min[1]);
  const max = query.match(/^\(max-width:\s*([\d.]+)px\)$/);
  if (max) return width <= Number(max[1]);
  return false; // print, hover, anything not about width
}

function resolveForWidth(css: string, width: number): string {
  return topLevelBlocks(css)
    .map((block) => {
      if (!block.startsWith("@media")) return block;
      const open = block.indexOf("{");
      const query = block.slice("@media".length, open).trim();
      return mediaMatches(query, width) ? block.slice(open + 1, -1) : "";
    })
    .join("\n");
}

/** Runs `read` with the page's styles resolved as a viewport `width` px wide would see them. */
function atWidth<T>(width: number, read: () => T): T {
  const tags = Array.from(document.querySelectorAll("style"));
  const original = tags.map((t) => t.textContent || "");
  tags.forEach((t, i) => {
    t.textContent = resolveForWidth(original[i], width);
  });
  try {
    return read();
  } finally {
    tags.forEach((t, i) => {
      t.textContent = original[i];
    });
  }
}

const px = (value: string) => parseFloat(value) * (value.endsWith("rem") ? 16 : 1);

function assessment(id: number, extra: Record<string, unknown> = {}) {
  return {
    id,
    title: `Assessment ${id}`,
    description: "",
    slug: `assessment-${id}`,
    duration_minutes: 30,
    is_paid: false,
    price: null,
    is_active: true,
    number_of_questions: 10,
    created_at: new Date(2026, 0, id).toISOString(),
    is_attempted: false,
    status: "not_started",
    end_time: new Date(Date.now() + 10 * 86400000).toISOString(),
    ...extra,
  };
}

async function renderPage() {
  render(<AssessmentsPage />);
  // The grid replaces its skeletons once the (mocked) list resolves.
  await screen.findAllByTestId("assessment-card-pills");
}

/** Every status and attribute pill on every rendered card. */
function pills(): HTMLElement[] {
  return screen
    .getAllByTestId("assessment-card-pills")
    .flatMap((row) =>
      Array.from(row.querySelectorAll<HTMLElement>(":scope > span, :scope > div > span")),
    );
}

beforeEach(() => {
  // Thirteen, so there is a second page and the pagination renders. The newest (first under the
  // default "Most recent" sort) is proctored, so a card carries an attribute pill as well.
  getActiveAssessments.mockResolvedValue([
    ...Array.from({ length: 12 }, (_, i) => assessment(i + 1)),
    assessment(13, { proctoring_enabled: true }),
  ]);
});

describe("an assessment card", () => {
  it("renders every status and attribute pill at 12px or more on a phone", async () => {
    await renderPage();
    const all = pills();
    expect(all.map((p) => p.textContent)).toEqual(expect.arrayContaining(["Proctored", "Available"]));
    for (const pill of all) {
      expect(atWidth(PHONE, () => px(getComputedStyle(pill).fontSize))).toBeGreaterThanOrEqual(12);
    }
  });

  it("leaves the pills at the shared chip's own 0.72rem from sm up", async () => {
    await renderPage();
    for (const pill of pills()) {
      expect(atWidth(TABLET, () => px(getComputedStyle(pill).fontSize))).toBeCloseTo(0.72 * 16);
    }
  });
});

describe("the catalogue controls", () => {
  it("gives the search box (the shared bar's field) and the sort field a 44px target on a phone", async () => {
    await renderPage();
    const bar = screen.getByTestId("assessments-search");
    const search = within(bar).getByPlaceholderText(/search assessments/i);
    const roots = Array.from(bar.querySelectorAll<HTMLElement>(".MuiOutlinedInput-root"));
    expect(roots).toHaveLength(2);
    expect(roots.some((r) => r.contains(search))).toBe(true);
    for (const root of roots) {
      expect(atWidth(PHONE, () => getComputedStyle(root).minHeight)).toBe("44px");
      // MUI's own small field again from sm up (`unset` computes to the initial `auto`).
      expect(atWidth(TABLET, () => getComputedStyle(root).minHeight)).toBe("auto");
    }
  });

  it("makes the next-up action the width of a phone, and the same pill as desktop from sm up", async () => {
    await renderPage();
    const button = screen.getByRole("button", { name: /take it now/i });
    atWidth(PHONE, () => {
      expect(getComputedStyle(button).width).toBe("100%");
      expect(getComputedStyle(button).minHeight).toBe("48px");
    });
    // A tablet (600-899px) matches a desktop, not the phone.
    atWidth(TABLET, () => {
      expect(getComputedStyle(button).width).toBe("auto");
      expect(getComputedStyle(button).minHeight).toBe("auto");
    });
  });

  it("gives both pagination buttons a 44px target on a phone", async () => {
    await renderPage();
    for (const name of [/previous/i, /^next$/i]) {
      const button = screen.getByRole("button", { name });
      expect(atWidth(PHONE, () => getComputedStyle(button).minHeight)).toBe("44px");
    }
  });
});

describe("the status filter on the catalogue", () => {
  it("is the scrolling chip row, so every status is reachable on a phone", async () => {
    await renderPage();
    // The raw segmented track rendered a 664px row with no way to reach the last two statuses.
    const row = screen.getByRole("group", { name: /filter assessments by status/i });
    expect(within(row).getAllByRole("button")).toHaveLength(5);
  });
});

/** The first element under the grid slot that lays out as a grid at phone width. */
function phoneGridTrack(): HTMLElement | undefined {
  const slot = document.querySelector<HTMLElement>("[data-tour-id='assessments-grid']")!;
  return atWidth(PHONE, () =>
    Array.from(slot.querySelectorAll<HTMLElement>("*")).find(
      (el) => getComputedStyle(el).display === "grid",
    ),
  );
}

describe("the catalogue grid", () => {
  // A bare `1fr` track floors at min-content, so one long word widens the only column past 390px.
  it("is one column that can shrink below its longest word on a phone", async () => {
    await renderPage();
    const track = phoneGridTrack();
    expect(track).toBeTruthy();
    expect(atWidth(PHONE, () => getComputedStyle(track!).gridTemplateColumns)).toBe(
      "minmax(0, 1fr)",
    );
  });

  it("uses the same shrinkable column for the loading skeletons", () => {
    getActiveAssessments.mockReturnValue(new Promise(() => {}));
    render(<AssessmentsPage />);
    const track = phoneGridTrack();
    expect(track).toBeTruthy();
    expect(atWidth(PHONE, () => getComputedStyle(track!).gridTemplateColumns)).toBe(
      "minmax(0, 1fr)",
    );
  });
});
