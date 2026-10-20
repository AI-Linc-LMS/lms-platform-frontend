// @vitest-environment jsdom
/**
 * Each kind of card has to be a different COLOUR from the others, and legible.
 *
 * Reported from the live rail: a checkpoint, a mock interview, a resume nudge and a jobs card
 * all rendered as white boxes on a near-white page. Each kind DID carry a colour, but only as a
 * 4px stripe down the left edge, which disappears once a card is one of ten in a column.
 *
 * The first fix gave each kind its own surface hex and this file asserted exactly that - that
 * the six strings differ. They did, and three of the cards still looked identical: topic,
 * checkpoint and jobs are all blue-violet, and at a 4% wash topic-vs-jobs measured dE 1.06 and
 * topic-vs-checkpoint dE 1.49 in CIE Lab, both under the just-noticeable difference. A test
 * comparing strings cannot fail for the reason the bug exists, so it was not a test of the bug.
 *
 * The cards are now two families: course content as a pale wash, and the mock interview, resume
 * and jobs cards painted dark like the calibration card. So legibility is asserted on the ink
 * each card ACTUALLY uses - white on the dark ones, black on the pale ones - rather than on a
 * luminance threshold that only describes one of the two.
 */

import { readFileSync } from "node:fs";
import { join } from "node:path";

import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { NODE_STYLE, nodeInk } from "./nodeVisuals";

vi.mock("@/components/common/IconWrapper", () => ({ IconWrapper: () => null }));
vi.mock("next/link", () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

const read = (p: string) => readFileSync(join(__dirname, "..", "..", "..", p), "utf8");

const KINDS = ["topic", "checkpoint", "week_final", "interview", "resume", "jobs"] as const;
/** The three the reporter named: they must read as a different kind of thing from a lesson. */
const DARK_KINDS = ["interview", "resume", "jobs"] as const;
const LIGHT_KINDS = ["topic", "checkpoint", "week_final"] as const;

/** The page the cards sit on: `--background` in globals.css and the MUI theme default. */
const PAGE = "#ffffff";

/** dE 1 is the textbook just-noticeable difference; on a large flat area, 3 is honest. */
const MIN_PAIR_DE = 3;
/** topic is the course-content card; every other kind must be clearly off it. */
const MIN_VS_TOPIC_DE = 4;
/** The non-content kinds also have to stand off the page; topic itself may stay quiet. */
const MIN_VS_PAGE_DE = 5;
const MIN_TOPIC_VS_PAGE_DE = 2.5;
/** WCAG AA for normal text. */
const MIN_TEXT_RATIO = 4.5;

function channels(color: string): [number, number, number] {
  const rgba = color.match(/rgba?\(([^)]+)\)/);
  if (rgba) {
    const [r, g, b] = rgba[1].split(",").map((n) => parseFloat(n.trim()));
    return [r / 255, g / 255, b / 255];
  }
  const h = color.replace("#", "");
  return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16) / 255) as [number, number, number];
}

/** The alpha of an `rgba(...)`, or 1 for an opaque colour. */
function alphaOf(color: string): number {
  const rgba = color.match(/rgba\(([^)]+)\)/);
  if (!rgba) return 1;
  const parts = rgba[1].split(",");
  return parts.length > 3 ? parseFloat(parts[3]) : 1;
}

const toLinear = (c: number) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);

function luminance(color: string): number {
  const [r, g, b] = channels(color).map(toLinear);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** CIE Lab, D65. */
function lab(color: string): [number, number, number] {
  const [r, g, b] = channels(color).map(toLinear);
  const X = (0.4124 * r + 0.3576 * g + 0.1805 * b) / 0.95047;
  const Y = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  const Z = (0.0193 * r + 0.1192 * g + 0.9505 * b) / 1.08883;
  const f = (t: number) => (t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116);
  const [fx, fy, fz] = [f(X), f(Y), f(Z)];
  return [116 * fy - 16, 500 * (fx - fy), 200 * (fy - fz)];
}

function deltaE(a: string, b: string): number {
  const [la, lb] = [lab(a), lab(b)];
  return Math.hypot(la[0] - lb[0], la[1] - lb[1], la[2] - lb[2]);
}

/** A possibly-translucent ink composited over the opaque card behind it. */
function composite(ink: string, over: string): string {
  const a = alphaOf(ink);
  const [fr, fg, fb] = channels(ink);
  const [br, bg, bb] = channels(over);
  const mix = [fr * a + br * (1 - a), fg * a + bg * (1 - a), fb * a + bb * (1 - a)];
  return `#${mix.map((c) => Math.round(c * 255).toString(16).padStart(2, "0")).join("")}`;
}

function contrastRatio(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

/** What the card is actually painted: the flat colour under any gradient. */
const baseOf = (kind: string) => nodeInk(kind).baseColor;

describe("the card palette", () => {
  it("gives every kind a surface and a border, not just an icon tint", () => {
    for (const k of KINDS) {
      expect(NODE_STYLE[k], k).toBeTruthy();
      expect(NODE_STYLE[k].surface, `${k}.surface`).toMatch(/^#[0-9a-f]{6}$/i);
      expect(NODE_STYLE[k].border, `${k}.border`).toBeTruthy();
    }
  });

  it("paints the interview, resume and jobs cards dark, like the calibration card", () => {
    for (const k of DARK_KINDS) {
      expect(nodeInk(k).dark, `${k} should be dark`).toBe(true);
      // The calibration card's hatching, not a lookalike.
      expect(nodeInk(k).background, `${k} background`).toContain("repeating-linear-gradient");
      expect(luminance(baseOf(k)), `${k} base luminance`).toBeLessThan(0.1);
    }
    for (const k of LIGHT_KINDS) {
      expect(nodeInk(k).dark, `${k} should stay a pale wash`).toBe(false);
      expect(luminance(baseOf(k)), `${k} base luminance`).toBeGreaterThan(0.85);
    }
  });

  it("never paints a card plain white — that was the original bug", () => {
    for (const k of KINDS) {
      expect(baseOf(k).toLowerCase(), k).not.toBe("#ffffff");
    }
  });

  it("makes no two kinds the same colour — not merely a different hex", () => {
    for (let i = 0; i < KINDS.length; i += 1) {
      for (let j = i + 1; j < KINDS.length; j += 1) {
        const [a, b] = [KINDS[i], KINDS[j]];
        expect(
          deltaE(baseOf(a), baseOf(b)),
          `${a} vs ${b} are indistinguishable`,
        ).toBeGreaterThanOrEqual(MIN_PAIR_DE);
      }
    }
  });

  it("keeps the assessment, interview, resume and jobs cards clearly off the content card", () => {
    // The ask, in the reporter's words: those "should look different in color bg" from the
    // course content cards. topic IS the course content card.
    for (const k of KINDS) {
      if (k === "topic") continue;
      expect(deltaE(baseOf(k), baseOf("topic")), `${k} vs topic`).toBeGreaterThanOrEqual(
        MIN_VS_TOPIC_DE,
      );
    }
  });

  it("makes the other five stand off the page, and lets a column of topics stay quiet", () => {
    for (const k of KINDS) {
      const d = deltaE(baseOf(k), PAGE);
      if (k === "topic") {
        expect(d, "topic vs page").toBeGreaterThanOrEqual(MIN_TOPIC_VS_PAGE_DE);
      } else {
        expect(d, `${k} vs page`).toBeGreaterThanOrEqual(MIN_VS_PAGE_DE);
      }
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

  it("keeps the ink on every card legible, measured rather than inferred", () => {
    // The old proxy was the surface's luminance, which says nothing once half the cards are
    // dark. This composites the ink each card actually uses onto the colour behind it.
    for (const k of KINDS) {
      const { ink } = nodeInk(k);
      const bg = baseOf(k);
      expect(contrastRatio(composite(ink.title, bg), bg), `${k} title`).toBeGreaterThanOrEqual(
        MIN_TEXT_RATIO,
      );
      expect(contrastRatio(composite(ink.body, bg), bg), `${k} body`).toBeGreaterThanOrEqual(
        MIN_TEXT_RATIO,
      );
    }
  });

  it("keeps each card's accent readable on that card", () => {
    // A dark card cannot wear the accent picked for white: #db2777 on #3b0f2e is unreadable,
    // which is what `onDark` exists for.
    for (const k of KINDS) {
      const { accent } = nodeInk(k);
      expect(contrastRatio(accent, baseOf(k)), `${k} accent`).toBeGreaterThanOrEqual(
        MIN_TEXT_RATIO,
      );
    }
  });
});

/**
 * Locked is the state almost every learner is in.
 *
 * The stations sit at 33%, 66% and 100%, so until a learner is a third of the way through the
 * course all three are locked - locked IS the default appearance of this feature, not an edge
 * case. The first cut drew it with `opacity: 0.72`, which does not dim a dark card: over a
 * white page it composites it toward white. `#0b3330` rendered as `#4f6c6a` and `#13295a` as
 * `#556588` - two muddy greys, barely distinguishable from each other, with the hue gone.
 * Every assertion here exists because looking at the unlocked state alone missed all of it.
 */
describe("a locked station still looks like itself", () => {
  it("stays dark instead of fading toward the page", () => {
    for (const k of DARK_KINDS) {
      const locked = nodeInk(k, true);
      expect(locked.dark, k).toBe(true);
      expect(luminance(locked.baseColor), `${k} locked base`).toBeLessThan(0.1);
    }
  });

  it("never expresses locked as transparency on a dark card", () => {
    // The mechanism, not the symptom: an opacity on a dark card over a white page is the bug.
    const station = read("components/adaptive-journey/spine/CareerStation.tsx");
    expect(station).not.toMatch(/opacity:\s*locked/);
    const row = read("components/adaptive-journey/spine/NodeRow.tsx");
    // NodeRow still fades the PALE cards, which is correct - but only those.
    expect(row).toMatch(/opacity:\s*locked\s*&&\s*!dark/);
  });

  it("keeps each kind its own colour when locked", () => {
    for (let i = 0; i < DARK_KINDS.length; i += 1) {
      for (let j = i + 1; j < DARK_KINDS.length; j += 1) {
        const [a, b] = [DARK_KINDS[i], DARK_KINDS[j]];
        expect(
          deltaE(nodeInk(a, true).baseColor, nodeInk(b, true).baseColor),
          `locked ${a} vs locked ${b}`,
        ).toBeGreaterThanOrEqual(MIN_PAIR_DE);
      }
    }
  });

  it("still reads as locked — different from the same card unlocked", () => {
    for (const k of DARK_KINDS) {
      expect(
        deltaE(nodeInk(k, true).baseColor, nodeInk(k, false).baseColor),
        `${k} locked vs unlocked`,
      ).toBeGreaterThanOrEqual(5);
    }
  });

  it("keeps its ink legible in both states", () => {
    for (const k of DARK_KINDS) {
      for (const lock of [false, true]) {
        const { ink, accent, baseColor } = nodeInk(k, lock);
        const label = `${k}${lock ? " locked" : ""}`;
        expect(
          contrastRatio(composite(ink.body, baseColor), baseColor),
          `${label} body`,
        ).toBeGreaterThanOrEqual(MIN_TEXT_RATIO);
        expect(contrastRatio(accent, baseColor), `${label} accent`).toBeGreaterThanOrEqual(
          MIN_TEXT_RATIO,
        );
      }
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
    // And both are dark, so the station reads as one object rather than two unrelated cards.
    for (const h of halves) {
      const bg = h.style.backgroundColor || getComputedStyle(h).backgroundColor;
      expect(luminance(bg), `half ${bg}`).toBeLessThan(0.1);
    }
  });

  it("is one full-width half when the tenant has no jobs", async () => {
    const { CareerStation } = await import("./CareerStation");
    render(<CareerStation milestone={{ ...milestone, jobs: undefined }} />);
    expect(screen.getByTestId("career-station").children).toHaveLength(1);
  });
});
