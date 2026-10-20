// @vitest-environment jsdom
/**
 * Each kind of card has to be a different colour from the others and from the page.
 *
 * Reported from the live rail: a checkpoint, a mock interview, a resume nudge and a jobs card
 * all rendered as white boxes on a near-white page. Each kind DID carry a colour, but only as a
 * 4px stripe down the left edge, which disappears once a card is one of ten in a column.
 *
 * These assert the property rather than the hex: every kind differs from every other, and none
 * of them is plain white. A future palette change is free; collapsing two kinds onto one colour,
 * or going back to white, is not.
 */

import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { NODE_STYLE } from "./nodeVisuals";

vi.mock("@/components/common/IconWrapper", () => ({ IconWrapper: () => null }));
vi.mock("next/link", () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

const KINDS = ["topic", "checkpoint", "week_final", "interview", "resume", "jobs"] as const;

describe("the card palette", () => {
  it("gives every kind a surface and a border, not just an icon tint", () => {
    for (const k of KINDS) {
      expect(NODE_STYLE[k], k).toBeTruthy();
      expect(NODE_STYLE[k].surface, `${k}.surface`).toMatch(/^#[0-9a-f]{6}$/i);
      expect(NODE_STYLE[k].border, `${k}.border`).toMatch(/^#[0-9a-f]{6}$/i);
    }
  });

  it("never paints a card plain white — that was the bug", () => {
    for (const k of KINDS) {
      expect(NODE_STYLE[k].surface.toLowerCase(), k).not.toBe("#ffffff");
      expect(NODE_STYLE[k].surface.toLowerCase(), k).not.toBe("#fff");
    }
  });

  it("gives no two kinds the same surface", () => {
    const seen = new Map<string, string>();
    for (const k of KINDS) {
      const s = NODE_STYLE[k].surface.toLowerCase();
      expect(seen.has(s), `${k} shares a surface with ${seen.get(s)}`).toBe(false);
      seen.set(s, k);
    }
  });

  it("gives no two kinds the same accent", () => {
    const seen = new Map<string, string>();
    for (const k of KINDS) {
      const c = NODE_STYLE[k].color.toLowerCase();
      expect(seen.has(c), `${k} shares an accent with ${seen.get(c)}`).toBe(false);
      seen.set(c, k);
    }
  });

  it("keeps every surface light enough to carry dark body text", () => {
    // Relative luminance, sRGB. A wash, not a fill: anything below this and the text on it
    // starts needing its own colour decision.
    for (const k of KINDS) {
      const hex = NODE_STYLE[k].surface.replace("#", "");
      const [r, g, b] = [0, 2, 4].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
      const lin = (c: number) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
      const L = 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
      expect(L, `${k} surface luminance`).toBeGreaterThan(0.85);
    }
  });
});

describe("the career station on the page", () => {
  const milestone = {
    kind: "career" as const,
    atPercent: 66,
    weekNo: 19,
    locked: false,
    reachedAt: 66,
    resume: {
      title: "Refresh your resume", body: "Two thirds done.", hasResume: true,
      resumeCount: 1, lastSavedAt: null, cta: "Update resume", href: "/resume",
    },
    jobs: {
      title: "Start shortlisting", body: "Shortlist a few now.",
      label: "Roles this course leads to", openCount: 188, related: [],
      open: [{ id: 1, title: "AI Engineer", company: "GitLab", companyLogo: null,
               location: "Bengaluru", workMode: "Hybrid", employmentType: "Full time", salary: "" }],
      cta: "See roles", href: "/jobs",
    },
  };

  it("paints its two halves in different colours", async () => {
    const { CareerStation } = await import("./CareerStation");
    render(<CareerStation milestone={milestone} />);
    const station = screen.getByTestId("career-station");
    const halves = Array.from(station.children) as HTMLElement[];
    expect(halves).toHaveLength(2);
    const bgs = halves.map((h) => h.style.backgroundColor || getComputedStyle(h).backgroundColor);
    expect(bgs[0]).not.toBe(bgs[1]);
  });

  it("is one full-width half when the tenant has no jobs", async () => {
    const { CareerStation } = await import("./CareerStation");
    render(<CareerStation milestone={{ ...milestone, jobs: undefined }} />);
    expect(screen.getByTestId("career-station").children).toHaveLength(1);
  });
});
