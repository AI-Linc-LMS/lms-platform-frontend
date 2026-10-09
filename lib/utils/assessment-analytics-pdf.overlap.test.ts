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

// `page` matters: a table long enough to spill carries on at the TOP of the next page, so
// grouping by y alone makes a page-2 row look like it sits on page 1's heading.
type Draw = { text: string; x: number; y: number; align: string; size: number; page: number };

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
    private page = 1;
    setFontSize(n: number) { this.size = n; }
    getTextWidth(t: string) { return emWidth(t) * this.size * PT_TO_MM; }
    text(t: string | string[], x: number, y: number, opts?: { align?: string }) {
      const one = Array.isArray(t) ? t.join(" ") : t;
      draws.push({ text: one, x, y, align: opts?.align ?? "left", size: this.size, page: this.page });
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
    addPage() { this.page += 1; }
    setPage(n: number) { this.page = n; }
    getNumberOfPages() { return this.page; }
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

/**
 * The exact rows from the report that was sent in again on 2026-10-09, emails and all. The fix
 * in #1736 right-anchored the numeric columns; this pins the real data it was reported with, so
 * "it still overlaps" can be answered by running it rather than by reading the screenshot.
 */
const REPORTED = {
  ...(data as Record<string, unknown>),
  top_performers: [
    ["ANDHARI YUVAKISHOR", "yuvakishorea633@gmail.com", 402, 100.0, 47],
    ["Suganth B", "bsuganth6@gmail.com", 402, 100.0, 83],
    ["Moneesh Kumar T", "moneeshthirumalai1408@gmail.com", 388, 96.5, 24],
    ["Jesin Milesh", "jesinmilesh61@gmail.com", 388, 96.5, 16],
    ["Hemasri Hemasri", "hemasrisanthu@gmail.com", 378, 94.0, 11],
    ["Rahul Raghul J", "jraghul134@gmail.com", 378, 94.0, 29],
    ["Priya G", "priyag25072007@gmail.com", 377, 93.8, 11],
    ["Riyas R", "riyas.r9894679295@gmail.com", 372, 92.5, 42],
    ["Meghana Reddy .D", "dantlameghanareddy@gmail.com", 369, 91.8, 29],
    ["Nidish Aadithya", "nidishaadithya6@gmail.com", 352, 87.6, 21],
  ].map(([name, email, score, percentage, mins], i) => ({
    rank: i + 1, name, email, score, percentage,
    time_taken_minutes: mins, submitted_at: "2026-09-26T13:51:56Z",
  })),
} as never;

describe("the reported report", () => {
  it("draws no two cells over each other, with the real emails", async () => {
    const { generateAssessmentAnalyticsPdfVector } = await import(
      "./assessment-analytics-pdf.utils"
    );
    draws.length = 0;
    await generateAssessmentAnalyticsPdfVector(REPORTED, "report.pdf");

    const byLine = new Map<string, Draw[]>();
    for (const d of draws) {
      const key = `${d.page}:${Math.round(d.y * 10) / 10}`;
      byLine.set(key, [...(byLine.get(key) ?? []), d]);
    }
    const collisions: string[] = [];
    for (const [line, row] of byLine) {
      const spans = row.map((d) => ({ d, span: extent(d) })).sort((a, b) => a.span[0] - b.span[0]);
      for (let i = 1; i < spans.length; i += 1) {
        if (spans[i].span[0] < spans[i - 1].span[1] - 0.01) {
          collisions.push(
            `y=${line}: "${spans[i - 1].d.text}" ends ${spans[i - 1].span[1].toFixed(1)}mm, ` +
            `"${spans[i].d.text}" starts ${spans[i].span[0].toFixed(1)}mm`);
        }
      }
    }
    expect(collisions).toEqual([]);
  });
});

describe("the assessment analytics report", () => {
  it("never draws two pieces of text over each other", async () => {
    const { generateAssessmentAnalyticsPdfVector } = await import(
      "./assessment-analytics-pdf.utils"
    );
    draws.length = 0;
    await generateAssessmentAnalyticsPdfVector(data, "report.pdf");

    expect(draws.length).toBeGreaterThan(0);

    const byLine = new Map<string, Draw[]>();
    for (const d of draws) {
      const key = `${d.page}:${Math.round(d.y * 10) / 10}`;
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
