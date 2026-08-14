import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { RoadmapIndex } from "./RoadmapIndex";
import type { RoadmapCard } from "@/lib/services/roadmaps.service";

/**
 * The catalogue is a LIST, and a list has to read as one.
 *
 * Both assertions here are regressions caught by looking at the shipped page rather than by
 * reading the code, which is why they are pinned:
 *
 * 1. A New/Updated badge sat at the end of most rows. It fired on 14 of 20 entries, so it told a
 *    learner nothing and gave every row a second ragged edge. The flags still exist on the API
 *    card; the rule is that this surface does not render them.
 *
 * 2. The rows had no delimiter, so a four-column grid of bare text read as a wall. Each row now
 *    carries a bottom hairline. The rowGap must stay 0 or the hairlines break into floating
 *    dashes instead of forming one rule down the column.
 */

function card(slug: string, over: Partial<RoadmapCard> = {}): RoadmapCard {
  return {
    slug,
    cardTitle: slug,
    pageTitle: slug.toUpperCase(),
    kind: "skill",
    isNew: true,
    isRevamped: true,
    ...over,
  } as RoadmapCard;
}

describe("RoadmapIndex", () => {
  it("renders no New/Updated badge, even when the API sets both flags", () => {
    render(
      <RoadmapIndex
        title="Skill based"
        icon="solar:layers-minimalistic-linear"
        roadmaps={[card("java"), card("sql"), card("dsa")]}
        onOpen={vi.fn()}
      />
    );

    expect(screen.getByText("JAVA")).toBeInTheDocument();
    expect(screen.queryByText("Updated")).not.toBeInTheDocument();
    expect(screen.queryByText("New")).not.toBeInTheDocument();
  });

  it("gives every entry a separating hairline", () => {
    render(
      <RoadmapIndex
        title="Skill based"
        icon="solar:layers-minimalistic-linear"
        roadmaps={[card("java"), card("sql")]}
        onOpen={vi.fn()}
      />
    );

    const rows = screen.getAllByRole("button");
    expect(rows).toHaveLength(2);
    for (const row of rows) {
      // `border: none` is declared earlier in the same sx block; this asserts the later
      // borderBottom is the one that wins, which is the whole separation treatment.
      expect(getComputedStyle(row).borderBottomStyle).toBe("solid");
    }
  });

  it("prefers a company display name over the page title", () => {
    render(
      <RoadmapIndex
        title="Company based"
        icon="solar:buildings-2-linear"
        roadmaps={[
          card("tcs", {
            kind: "company",
            company: {
              companySlug: "tcs",
              displayName: "TCS",
              logoUrl: "https://example.test/tcs.svg",
              badge: "Mass Recruiter",
              difficulty: "Medium",
              packageRange: "3.5 - 7 LPA",
              rounds: 3,
            },
          }),
        ]}
        onOpen={vi.fn()}
      />
    );

    expect(screen.getByText("TCS")).toBeInTheDocument();
    expect(screen.queryByText("TCS".toUpperCase() + " ")).not.toBeInTheDocument();
  });
});
