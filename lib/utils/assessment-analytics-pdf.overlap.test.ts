/**
 * "The report generated for the assessment in the Top performers section: email id is
 *  overlapping with the score."
 *
 * The table's right-aligned columns anchored at the LEFT edge of their own column:
 *
 *     x += cw.email;
 *     pdf.text("Score", x, y, { align: "right" });   // right edge == email's right edge
 *
 * so every number was drawn backwards across the column before it. A long email ran to
 * the end of its 40mm and the score was sitting on top of the last few characters.
 *
 * What is pinned here is the property, not the arithmetic: on any one baseline, no two
 * pieces of text may occupy the same millimetre.
 */

import { describe, expect, it, vi } from "vitest";

type Draw = { text: string; x: number; y: number; align: string; size: number };

const draws: Draw[] = [];

/** Rough Helvetica advance widths, in ems. Enough to tell a "W" from an "i". */
const WIDE = new Set("MW@%".split(""));
const NARROW = new Set("ilj.,'`:;|".split(""));
function emWidth(text: string): number {
  let w = 0;
  for (const ch of text) w += WIDE.has(ch) ? 0.85 : NARROW.has(ch) ? 0.28 : 0.55;
  return w;
}
const PT_TO_MM = 0.3528;

vi.mock("jspdf", () => {
  class FakePdf {
    private size = 10;
    setFontSize(n: number) { this.size = n; }
    getTextWidth(t: string) { return emWidth(t) * this.size * PT_TO_MM; }
    text(t: string | string[], x: number, y: number, opts?: { align?: string }) {
      const one = Array.isArray(t) ? t.join(" ") : t;
      draws.push({ text: one, x, y, align: opts?.align ?? "left", size: this.size });
    }
    splitTextToSize(t: string) { return [t]; }
    setFont() {}
    setTextColor() {}
    setFillColor() {}
    setDrawColor() {}
    setLineWidth() {}
    rect() {}
    roundedRect() {}
    circle() {}
    triangle() {}
    line() {}
    addPage() {}
    setPage() {}
    getNumberOfPages() { return 1; }
    save() {}
  }
  return { jsPDF: FakePdf };
});

const LONG_EMAIL = "mahak.kushwaha.2026@studentmail.impacteers-university.example.com";

const data = {
  assessment: {
    id: 913,
    slug: "java-fundamentals-week-2",
    title: "Java Fundamentals — Week 2",
    maximum_marks: 100,
    duration_minutes: 120,
  },
  summary: {
    total_submissions: 42,
    completed_submissions: 40,
    in_progress_submissions: 2,
    average_score: 61.25,
    average_percentage: 61.25,
    median_score: 63,
    highest_score: 100,
    lowest_score: 12,
    maximum_marks: 100,
    average_time_taken_minutes: 74,
    pass_rate_percent: 55,
    pass_threshold_percentage: 40,
  },
  status_breakdown: [],
  section_averages: [],
  charts: {},
  top_performers: [
    {
      rank: 1,
      name: "Mahak Kushwaha Wadhwani",
      email: LONG_EMAIL,
      score: 100,
      percentage: 100,
      time_taken_minutes: 118,
      submitted_at: "2026-09-24T18:42:07Z",
    },
  ],
  students: [
    {
      name: "Mahak Kushwaha Wadhwani",
      email: LONG_EMAIL,
      status: "completed",
      score: 100,
      percentage: 100,
      time_taken_minutes: 118,
      submitted_at: "2026-09-24T18:42:07Z",
    },
  ],
} as never;

function extent(d: Draw): [number, number] {
  const w = emWidth(d.text) * d.size * PT_TO_MM;
  if (d.align === "right") return [d.x - w, d.x];
  if (d.align === "center") return [d.x - w / 2, d.x + w / 2];
  return [d.x, d.x + w];
}

describe("the assessment analytics report", () => {
  it("never draws two pieces of text over each other", async () => {
    const { generateAssessmentAnalyticsPdfVector } = await import(
      "./assessment-analytics-pdf.utils"
    );
    draws.length = 0;
    await generateAssessmentAnalyticsPdfVector(data, "report.pdf");

    expect(draws.length).toBeGreaterThan(0);

    const byLine = new Map<number, Draw[]>();
    for (const d of draws) {
      const key = Math.round(d.y * 10) / 10;
      byLine.set(key, [...(byLine.get(key) ?? []), d]);
    }

    const collisions: string[] = [];
    for (const [line, row] of byLine) {
      const spans = row
        .map((d) => ({ d, span: extent(d) }))
        .sort((a, b) => a.span[0] - b.span[0]);
      for (let i = 1; i < spans.length; i += 1) {
        const prev = spans[i - 1];
        const here = spans[i];
        if (here.span[0] < prev.span[1] - 0.01) {
          collisions.push(
            `y=${line}: "${prev.d.text}" ends at ${prev.span[1].toFixed(1)}mm ` +
              `but "${here.d.text}" starts at ${here.span[0].toFixed(1)}mm`,
          );
        }
      }
    }

    expect(collisions).toEqual([]);
  });

  it("keeps every cell inside the page", async () => {
    const { generateAssessmentAnalyticsPdfVector } = await import(
      "./assessment-analytics-pdf.utils"
    );
    draws.length = 0;
    await generateAssessmentAnalyticsPdfVector(data, "report.pdf");

    const overrun = draws
      .map((d) => ({ d, span: extent(d) }))
      .filter(({ span }) => span[1] > 210 - 16 + 0.01)
      .map(({ d, span }) => `"${d.text}" reaches ${span[1].toFixed(1)}mm`);

    expect(overrun).toEqual([]);
  });
});
