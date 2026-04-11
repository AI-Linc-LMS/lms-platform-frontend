import jsPDF from "jspdf";
import type {
  AssessmentAnalyticsReportContext,
  AssessmentAnalyticsResponse,
  AssessmentAnalyticsTimelineDay,
} from "@/lib/services/admin/admin-assessment.service";
import {
  flattenStudentSectionScores,
  hasQuestionLevelResults,
  questionLevelResultsSummary,
} from "@/lib/utils/assessment-analytics-bind.utils";

/** Fewer days than this: timeline chart is omitted (little insight). */
const MIN_TIMELINE_DAYS_FOR_CHART = 5;

/** Match assessment result PDF chrome */
const SKY = { r: 2, g: 132, b: 199 };
const SKY_DEEP = { r: 3, g: 105, b: 161 };
const SLATE_MUTED = { r: 71, g: 85, b: 105 };
const INK = { r: 15, g: 23, b: 42 };
const TRACK = { r: 226, g: 232, b: 240 };
const FOOTER_LINE = { r: 203, g: 213, b: 225 };
const PDF_FONT = "helvetica" as const;

function truncatePdfCell(s: string, maxLen: number): string {
  const t = String(s ?? "")
    .replace(/\r|\n/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (t.length <= maxLen) return t;
  return `${t.slice(0, Math.max(0, maxLen - 1))}…`;
}

function humanizeStatusPdf(raw: string | null | undefined): string {
  if (raw == null || !String(raw).trim()) return "—";
  return String(raw)
    .trim()
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

/**
 * True if a string looks like a calendar date (not a human section name).
 * Bare `M/D` is only treated as a date when `allowBareMonthDay` is set (e.g. same
 * row count as the submissions timeline) to avoid false positives like "3/4".
 */
function looksLikeCalendarDateLabel(
  raw: string | null | undefined,
  allowBareMonthDay: boolean,
): boolean {
  const t = String(raw ?? "").trim();
  if (!t) return false;
  if (/^\d{4}-\d{2}-\d{2}/.test(t)) return true;
  if (/^\d{1,2}\/\d{1,2}\/\d{2,4}$/.test(t)) return true;
  if (allowBareMonthDay && /^\d{1,2}\/\d{1,2}$/.test(t)) return true;
  return false;
}

function formatShortDate(iso: string | null | undefined): string {
  if (!iso?.trim()) return "—";
  try {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return truncatePdfCell(iso, 18);
    return d.toLocaleString(undefined, {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "—";
  }
}

/** Wedge from angle a0 to a1 (radians), clockwise from top (-pi/2). */
function drawPieSliceFilled(
  pdf: jsPDF,
  cx: number,
  cy: number,
  r: number,
  a0: number,
  a1: number,
  rgb: readonly [number, number, number],
): void {
  const span = a1 - a0;
  if (span < 1e-9 || r <= 0) return;
  const steps = Math.max(10, Math.min(56, Math.ceil((span / Math.PI) * 36)));
  pdf.setFillColor(rgb[0], rgb[1], rgb[2]);
  pdf.setDrawColor(rgb[0], rgb[1], rgb[2]);
  pdf.setLineWidth(0.06);
  for (let i = 0; i < steps; i++) {
    const t0 = a0 + (span * i) / steps;
    const t1 = a0 + (span * (i + 1)) / steps;
    pdf.triangle(
      cx,
      cy,
      cx + r * Math.cos(t0),
      cy + r * Math.sin(t0),
      cx + r * Math.cos(t1),
      cy + r * Math.sin(t1),
      "FD",
    );
  }
}

function drawTopAccentBar(pdf: jsPDF, pageW: number) {
  pdf.setFillColor(SKY.r, SKY.g, SKY.b);
  pdf.rect(0, 0, pageW, 1.1, "F");
}

function drawFootersOnAllPages(
  pdf: jsPDF,
  pageW: number,
  pageH: number,
  margin: number,
  year: number,
) {
  const total = pdf.getNumberOfPages();
  const lineY = pageH - 11;
  const textY = pageH - 5.5;

  for (let p = 1; p <= total; p++) {
    pdf.setPage(p);
    pdf.setDrawColor(FOOTER_LINE.r, FOOTER_LINE.g, FOOTER_LINE.b);
    pdf.setLineWidth(0.25);
    pdf.line(margin, lineY, pageW - margin, lineY);

    pdf.setFillColor(SKY.r, SKY.g, SKY.b);
    pdf.rect(margin, textY - 3.2, 12, 1.4, "F");

    pdf.setFont(PDF_FONT, "bold");
    pdf.setFontSize(8);
    pdf.setTextColor(INK.r, INK.g, INK.b);
    pdf.text(`Page ${p} of ${total}`, margin + 14.5, textY);

    pdf.setFontSize(7);
    pdf.setTextColor(148, 163, 184);
    pdf.text(`© Confidential assessment report`, pageW - margin, textY, {
      align: "right",
    });
  }
}

/**
 * Native vector PDF for admin assessment analytics (not a screen capture).
 * Header/footer styling aligned with `generateAssessmentResultPdfVector`.
 */
export function generateAssessmentAnalyticsPdfVector(
  data: AssessmentAnalyticsResponse,
  fileName: string,
  context?: AssessmentAnalyticsReportContext,
): void {
  const pdf = new jsPDF({
    unit: "mm",
    format: "a4",
    orientation: "portrait",
  });

  const pageW = 210;
  const pageH = 297;
  const margin = 16;
  const contentW = pageW - margin * 2;
  const footerReserve = 14;
  const contentBottom = pageH - margin - footerReserve;

  let y = margin + 1;
  drawTopAccentBar(pdf, pageW);

  const newPage = () => {
    pdf.addPage();
    y = margin + 1;
    drawTopAccentBar(pdf, pageW);
  };

  const ensureSpace = (mm: number) => {
    if (y + mm > contentBottom) newPage();
  };

  const setInk = () => {
    pdf.setTextColor(INK.r, INK.g, INK.b);
  };

  const setMuted = () => {
    pdf.setTextColor(SLATE_MUTED.r, SLATE_MUTED.g, SLATE_MUTED.b);
  };

  const drawCallout = (
    lines: string[],
    kind: "warn" | "info" | "success",
  ) => {
    const pad = 3.8;
    const lineH = 4;
    let textH = 0;
    for (const line of lines) {
      const wrapped = pdf.splitTextToSize(line, contentW - pad * 2 - 5);
      textH += wrapped.length * lineH;
    }
    const height = pad * 2 + textH + 1;
    ensureSpace(height + 6);
    const top = y;
    const border =
      kind === "warn"
        ? ([217, 119, 6] as const)
        : kind === "success"
          ? ([5, 150, 105] as const)
          : ([59, 130, 246] as const);
    const bg =
      kind === "warn"
        ? ([255, 251, 235] as const)
        : kind === "success"
          ? ([236, 253, 245] as const)
          : ([239, 246, 255] as const);
    pdf.setFillColor(bg[0], bg[1], bg[2]);
    pdf.setDrawColor(border[0], border[1], border[2]);
    pdf.setLineWidth(0.25);
    pdf.roundedRect(margin, top, contentW, height, 1.2, 1.2, "FD");
    pdf.setFillColor(border[0], border[1], border[2]);
    pdf.rect(margin, top, 1.35, height, "F");
    pdf.setFont(PDF_FONT, "normal");
    pdf.setFontSize(8);
    pdf.setTextColor(INK.r, INK.g, INK.b);
    let ty = top + pad + 3.2;
    for (const line of lines) {
      const wrapped = pdf.splitTextToSize(line, contentW - pad * 2 - 5);
      pdf.text(wrapped, margin + pad + 2.5, ty);
      ty += wrapped.length * lineH;
    }
    y = top + height + 5;
    setInk();
  };

  const drawSectionTitle = (title: string, subtitle?: string) => {
    ensureSpace(subtitle ? 16 : 11);
    pdf.setFont(PDF_FONT, "bold");
    pdf.setFontSize(10);
    setInk();
    pdf.text(title, margin, y);
    y += 5;
    if (subtitle) {
      pdf.setFont(PDF_FONT, "normal");
      pdf.setFontSize(8);
      setMuted();
      const lines = pdf.splitTextToSize(subtitle, contentW);
      pdf.text(lines, margin, y);
      y += lines.length * 3.6 + 2;
    } else {
      y += 3;
    }
    setInk();
  };

  const drawKpiRow = (pairs: { label: string; value: string }[]) => {
    const colW = contentW / Math.max(pairs.length, 1);
    const maxLabelLines = Math.max(
      1,
      ...pairs.map((p) => p.label.split("\n").length),
    );
    const rowH = Math.max(14, 6 + maxLabelLines * 3.4 + 6);
    ensureSpace(rowH + 4);
    const top = y;
    pdf.setDrawColor(226, 232, 240);
    pdf.setLineWidth(0.25);
    pdf.setFillColor(248, 250, 252);
    pdf.roundedRect(margin, top, contentW, rowH, 1.2, 1.2, "FD");
    const valueBaseline = top + rowH - 3.5;
    for (let i = 0; i < pairs.length; i++) {
      const x0 = margin + i * colW + 3;
      const labelLines = pairs[i]!.label.split("\n");
      pdf.setFont(PDF_FONT, "normal");
      pdf.setFontSize(7);
      setMuted();
      let ly = top + 4;
      for (const line of labelLines) {
        pdf.text(line, x0, ly);
        ly += 3.4;
      }
      pdf.setFont(PDF_FONT, "bold");
      pdf.setFontSize(10);
      setInk();
      pdf.text(pairs[i]!.value, x0, valueBaseline);
    }
    y = top + rowH + 5;
    setInk();
  };

  const drawVerticalBarChart = (
    title: string,
    rows: { label: string; value: number }[],
    emptyHint: string,
  ) => {
    drawSectionTitle(
      title,
      "Column height = count; scale is relative to the largest band.",
    );
    if (rows.length === 0) {
      ensureSpace(10);
      pdf.setFont(PDF_FONT, "italic");
      pdf.setFontSize(8.5);
      setMuted();
      pdf.text(emptyHint, margin, y);
      y += 8;
      setInk();
      return;
    }
    const maxV = Math.max(1, ...rows.map((r) => r.value));
    const chartInnerH = 30;
    const labelH = 10;
    const footPad = 3;
    const n = rows.length;
    const slotW = contentW / Math.max(n, 1);
    const barW = Math.min(8, slotW * 0.42);
    ensureSpace(chartInnerH + labelH + footPad + 8);
    const baseY = y + chartInnerH;
    pdf.setDrawColor(TRACK.r, TRACK.g, TRACK.b);
    pdf.setLineWidth(0.2);
    pdf.line(margin, baseY, margin + contentW, baseY);

    for (let i = 0; i < n; i++) {
      const row = rows[i]!;
      const cx = margin + slotW * i + slotW / 2;
      const fillH = (chartInnerH - 1) * (row.value / maxV);
      pdf.setFillColor(TRACK.r, TRACK.g, TRACK.b);
      pdf.rect(cx - barW / 2, y + 1, barW, chartInnerH - 1, "F");
      if (fillH > 0) {
        pdf.setFillColor(SKY.r, SKY.g, SKY.b);
        pdf.rect(cx - barW / 2, baseY - fillH, barW, fillH, "F");
        pdf.setFillColor(SKY_DEEP.r, SKY_DEEP.g, SKY_DEEP.b);
        const cap = Math.min(1.4, fillH);
        pdf.rect(cx - barW / 2, baseY - fillH, barW, cap, "F");
      }
      pdf.setFont(PDF_FONT, "bold");
      pdf.setFontSize(7);
      setInk();
      pdf.text(String(row.value), cx, y - 0.5, { align: "center" });
      pdf.setFont(PDF_FONT, "normal");
      pdf.setFontSize(5.8);
      setMuted();
      const short = truncatePdfCell(row.label, 11);
      pdf.text(short, cx, baseY + 3.8, { align: "center" });
    }
    y = baseY + labelH + footPad;
    setInk();
  };

  const drawSectionPercentColumns = (
    rows: { label: string; percent: number }[],
  ) => {
    if (rows.length === 0) return;
    drawSectionTitle(
      "Section average % (columns)",
      "Bar height is average percentage (0–100) per section.",
    );
    const chartInnerH = 26;
    const labelH = 9;
    const footPad = 3;
    const n = rows.length;
    const slotW = contentW / Math.max(n, 1);
    const barW = Math.min(7.5, slotW * 0.4);
    ensureSpace(chartInnerH + labelH + footPad + 8);
    const baseY = y + chartInnerH;
    pdf.setDrawColor(TRACK.r, TRACK.g, TRACK.b);
    pdf.setLineWidth(0.2);
    pdf.line(margin, baseY, margin + contentW, baseY);

    for (let i = 0; i < n; i++) {
      const row = rows[i]!;
      const pct = Math.min(100, Math.max(0, row.percent));
      const cx = margin + slotW * i + slotW / 2;
      const fillH = (chartInnerH - 1) * (pct / 100);
      pdf.setFillColor(TRACK.r, TRACK.g, TRACK.b);
      pdf.rect(cx - barW / 2, y + 1, barW, chartInnerH - 1, "F");
      if (fillH > 0) {
        const fillRgb =
          pct >= 70
            ? ([5, 150, 105] as const)
            : pct >= 40
              ? ([217, 119, 6] as const)
              : ([220, 38, 38] as const);
        pdf.setFillColor(fillRgb[0], fillRgb[1], fillRgb[2]);
        pdf.rect(cx - barW / 2, baseY - fillH, barW, fillH, "F");
      }
      pdf.setFont(PDF_FONT, "bold");
      pdf.setFontSize(7);
      setInk();
      pdf.text(`${pct.toFixed(0)}%`, cx, y - 0.5, { align: "center" });
      pdf.setFont(PDF_FONT, "normal");
      pdf.setFontSize(5.8);
      setMuted();
      pdf.text(truncatePdfCell(row.label, 10), cx, baseY + 3.6, {
        align: "center",
      });
    }
    y = baseY + labelH + footPad;
    setInk();
  };

  // --- Header (same rhythm as performance report) ---
  pdf.setFillColor(SKY.r, SKY.g, SKY.b);
  pdf.rect(margin, y, 22, 1.4, "F");
  y += 6;

  pdf.setFont(PDF_FONT, "bold");
  pdf.setFontSize(8);
  pdf.setTextColor(SKY_DEEP.r, SKY_DEEP.g, SKY_DEEP.b);
  pdf.text("ANALYTICS REPORT", margin, y);
  y += 5;
  pdf.setFontSize(14);
  setInk();
  pdf.text("Assessment analytics", margin, y);
  y += 9;

  pdf.setFont(PDF_FONT, "bold");
  pdf.setFontSize(18);
  const titleLines = pdf.splitTextToSize(
    truncatePdfCell(data.assessment.title || "Assessment", 120),
    contentW - 2,
  );
  pdf.text(titleLines, margin, y);
  y += titleLines.length * 6.5 + 2;

  pdf.setFont(PDF_FONT, "normal");
  pdf.setFontSize(9);
  setMuted();
  pdf.text(
    `Internal assessment ID: ${data.assessment.id} · Max marks ${data.assessment.maximum_marks} · Time allowed: ${data.assessment.duration_minutes} min`,
    margin,
    y,
  );
  y += 4.5;
  pdf.text(`Catalog slug: ${truncatePdfCell(data.assessment.slug, 78)}`, margin, y);
  y += 4.5;
  pdf.text(`Generated ${new Date().toLocaleString()}`, margin, y);
  y += 8;
  setInk();

  const audienceLines: string[] = [];
  if (data.assessment.batch_name)
    audienceLines.push(`Batch: ${data.assessment.batch_name}`);
  if (data.assessment.course_year)
    audienceLines.push(`Course year: ${data.assessment.course_year}`);
  if (data.assessment.department)
    audienceLines.push(`Department: ${data.assessment.department}`);
  if (context?.batch_label?.trim())
    audienceLines.push(`Cohort / batch: ${context.batch_label.trim()}`);
  if (context?.course_titles?.length)
    audienceLines.push(`Courses: ${context.course_titles.join(", ")}`);
  if (context?.colleges?.length)
    audienceLines.push(`Colleges / departments: ${context.colleges.join(", ")}`);
  if (context?.section_titles?.length)
    audienceLines.push(
      `Assessment sections: ${context.section_titles.join(" · ")}`,
    );
  if (audienceLines.length > 0) {
    ensureSpace(10 + audienceLines.length * 4);
    pdf.setFont(PDF_FONT, "bold");
    pdf.setFontSize(8.5);
    setInk();
    pdf.text("Audience / scope", margin, y);
    y += 4.8;
    pdf.setFont(PDF_FONT, "normal");
    pdf.setFontSize(8);
    setMuted();
    for (const p of audienceLines) {
      const lines = pdf.splitTextToSize(p, contentW);
      pdf.text(lines, margin, y);
      y += lines.length * 4 + 0.5;
    }
    y += 4;
    setInk();
  }
  if (context?.assessment_focus?.trim()) {
    const plain = context.assessment_focus.replace(/\s+/g, " ").trim();
    const paras = pdf.splitTextToSize(truncatePdfCell(plain, 480), contentW);
    ensureSpace(paras.length * 4 + 12);
    pdf.setFont(PDF_FONT, "bold");
    pdf.setFontSize(8.5);
    setInk();
    pdf.text("What this assessment tests", margin, y);
    y += 4.8;
    pdf.setFont(PDF_FONT, "normal");
    pdf.setFontSize(8);
    setMuted();
    pdf.text(paras, margin, y);
    y += paras.length * 4 + 6;
    setInk();
  }

  const s = data.summary;
  const passThresholdPct = Number(s.pass_threshold_percentage ?? 40);
  const passThresholdLabel = Number.isFinite(passThresholdPct)
    ? String(passThresholdPct)
    : "40";
  const sb = data.status_breakdown ?? {
    in_progress: 0,
    submitted: 0,
    finalized: 0,
  };

  drawSectionTitle("Overview", "Submission and score aggregates for this assessment.");
  drawKpiRow([
    { label: "Total submissions", value: String(s.total_submissions ?? 0) },
    { label: "Completed", value: String(s.completed_submissions ?? 0) },
    { label: "In progress", value: String(s.in_progress_submissions ?? 0) },
  ]);
  drawKpiRow([
    {
      label: "Avg score / max",
      value: `${(s.average_score ?? 0).toFixed(1)} / ${s.maximum_marks ?? data.assessment.maximum_marks}`,
    },
    {
      label: "Avg %",
      value: `${(s.average_percentage ?? 0).toFixed(1)}%`,
    },
    {
      label: `Pass rate\n(>=${passThresholdLabel}% threshold)`,
      value:
        s.pass_rate_percent != null
          ? `${Number(s.pass_rate_percent).toFixed(1)}%`
          : "—",
    },
  ]);
  drawKpiRow([
    {
      label: "Median score",
      value: `${(s.median_score ?? 0).toFixed(1)}`,
    },
    {
      label: "High / low",
      value: `${(s.highest_score ?? 0).toFixed(1)} / ${(s.lowest_score ?? 0).toFixed(1)}`,
    },
    {
      label: "Avg time (min)",
      value:
        s.average_time_taken_minutes != null
          ? String(Math.round(s.average_time_taken_minutes))
          : "—",
    },
  ]);

  const sections = data.section_averages ?? [];
  const completedScored = s.completed_with_score ?? 0;
  const passR = Number(s.pass_rate_percent ?? 0);
  if (completedScored > 0 && passR <= 0.0001) {
    drawCallout(
      [
        `No learner crossed the ${passThresholdLabel}% pass threshold among ${completedScored} scored attempt(s).`,
        "Review item difficulty, timing, instructions, or cohort readiness.",
      ],
      "warn",
    );
  }
  const avgMin = s.average_time_taken_minutes ?? 0;
  const dur = data.assessment.duration_minutes ?? 0;
  if (
    dur >= 15 &&
    avgMin > 0 &&
    avgMin < dur * 0.25 &&
    (s.completed_submissions ?? 0) >= 1
  ) {
    drawCallout(
      [
        `Average time (${Math.round(avgMin)} min) is far below the ${dur}-minute allowance.`,
        "Short durations can indicate disengagement, guessing, or misconfigured timers. Consider a spot-check of attempts.",
      ],
      "warn",
    );
  }
  const zeroSections = sections.filter(
    (sec) =>
      (sec.average_percentage ?? 0) <= 0 &&
      (sec.submissions_count ?? 0) > 0,
  );
  if (zeroSections.length > 0) {
    drawCallout(
      [
        `Section average 0%: ${zeroSections.map((z) => z.section_title).join(", ")}.`,
        "If every learner shows 0% here, confirm the section was visible, required, and not skipped by routing.",
      ],
      "warn",
    );
  }

  drawSectionTitle(
    "Status breakdown",
    "Pie and proportional bar (vector) — same counts as the analytics API.",
  );
  const ip = sb.in_progress ?? 0;
  const submitted = sb.submitted ?? 0;
  const finalized = sb.finalized ?? 0;
  const statusTotal = ip + submitted + finalized;
  const pieR = 19;
  const pieCx = margin + 24;
  const blockH = statusTotal > 0 ? 64 : 22;
  ensureSpace(blockH + 4);
  const blockTop = y;
  /** Pie center must be derived after ensureSpace/newPage so it stays inside the status card. */
  const pieCy = blockTop + 26;
  pdf.setFillColor(248, 250, 252);
  pdf.setDrawColor(226, 232, 240);
  pdf.setLineWidth(0.25);
  pdf.roundedRect(margin, blockTop, contentW, blockH, 1, 1, "FD");

  const STATUS_COLORS = {
    inProgress: [245, 158, 11] as const,
    submitted: [59, 130, 246] as const,
    finalized: [16, 185, 129] as const,
  };

  if (statusTotal > 0) {
    let ang = -Math.PI / 2;
    const sliceDefs: {
      n: number;
      rgb: readonly [number, number, number];
      leg: string;
    }[] = [
      { n: ip, rgb: STATUS_COLORS.inProgress, leg: "In progress" },
      { n: submitted, rgb: STATUS_COLORS.submitted, leg: "Submitted" },
      { n: finalized, rgb: STATUS_COLORS.finalized, leg: "Finalized" },
    ];
    const slices = sliceDefs.filter((sl) => sl.n > 0);
    const pieTotal = slices.reduce((a, sl) => a + sl.n, 0) || 1;
    for (const sl of slices) {
      const w = (sl.n / pieTotal) * 2 * Math.PI;
      drawPieSliceFilled(pdf, pieCx, pieCy, pieR, ang, ang + w, sl.rgb);
      ang += w;
    }
    pdf.setDrawColor(148, 163, 184);
    pdf.setLineWidth(0.35);
    pdf.circle(pieCx, pieCy, pieR, "S");

    const legX = margin + 52;
    let legY = blockTop + 10;
    pdf.setFont(PDF_FONT, "normal");
    pdf.setFontSize(8);
    for (const sl of slices) {
      pdf.setFillColor(sl.rgb[0], sl.rgb[1], sl.rgb[2]);
      pdf.rect(legX, legY - 2.5, 3.2, 3.2, "F");
      setInk();
      pdf.text(`${sl.leg}: ${sl.n}`, legX + 5, legY);
      legY += 5;
    }
    pdf.setFontSize(6.5);
    setMuted();
    pdf.text(
      "Finalized = attempts closed/locked in the LMS after grading (often unused if you only use Submitted).",
      legX,
      legY + 1,
    );

    const stackY = blockTop + blockH - 10;
    const stackX = margin + 4;
    const stackW = contentW - 8;
    const stackH = 4.5;
    pdf.setFillColor(TRACK.r, TRACK.g, TRACK.b);
    pdf.rect(stackX, stackY, stackW, stackH, "F");
    let sx = stackX;
    const parts: { w: number; rgb: readonly [number, number, number] }[] =
      slices.map((sl) => ({
        w: stackW * (sl.n / pieTotal),
        rgb: sl.rgb,
      }));
    for (const p of parts) {
      const w = Math.max(0, p.w);
      if (w < 1e-4) continue;
      pdf.setFillColor(p.rgb[0], p.rgb[1], p.rgb[2]);
      pdf.rect(sx, stackY, w, stackH, "F");
      sx += w;
    }
    pdf.setDrawColor(203, 213, 225);
    pdf.setLineWidth(0.2);
    pdf.rect(stackX, stackY, stackW, stackH, "S");
  } else {
    pdf.setFont(PDF_FONT, "italic");
    pdf.setFontSize(9);
    setMuted();
    pdf.text("No status counts in this export.", margin + 4, blockTop + 12);
    setInk();
  }

  y = blockTop + blockH + 6;

  const scoreBuckets = (data.charts?.score_distribution_percent ?? []).map(
    (b) => ({ label: b.label, value: b.count }),
  );
  if (scoreBuckets.length > 0) {
    drawVerticalBarChart(
      "Score distribution (count by % band)",
      scoreBuckets,
      "No score distribution data.",
    );
  } else {
    drawSectionTitle("Score distribution");
    ensureSpace(8);
    pdf.setFont(PDF_FONT, "italic");
    pdf.setFontSize(8.5);
    setMuted();
    pdf.text("No score distribution data.", margin, y);
    y += 8;
    setInk();
  }

  const timeBuckets = (data.charts?.time_taken_minutes ?? []).map((b) => ({
    label: b.label,
    value: b.count,
  }));
  if (timeBuckets.length > 0) {
    drawVerticalBarChart(
      "Time taken (minutes, column chart)",
      timeBuckets,
      "No time-bucket data.",
    );
  } else {
    drawSectionTitle("Time taken");
    ensureSpace(8);
    pdf.setFont(PDF_FONT, "italic");
    pdf.setFontSize(8.5);
    setMuted();
    pdf.text("No time-bucket data.", margin, y);
    y += 8;
    setInk();
  }

  const timeline: AssessmentAnalyticsTimelineDay[] =
    data.charts?.submissions_timeline ?? [];
  if (timeline.length >= MIN_TIMELINE_DAYS_FOR_CHART) {
    drawSectionTitle(
      "Submissions over time",
      "Daily submission counts (most recent periods).",
    );
    const maxT = Math.max(1, ...timeline.map((d) => d.count));
    const show = timeline.slice(-18);
    const tw = contentW / show.length;
    const chartH = 22;
    ensureSpace(chartH + 16);
    const baseY = y + chartH;
    pdf.setDrawColor(TRACK.r, TRACK.g, TRACK.b);
    pdf.setLineWidth(0.2);
    pdf.line(margin, baseY, margin + contentW, baseY);
    for (let i = 0; i < show.length; i++) {
      const d = show[i]!;
      const h = (chartH - 2) * (d.count / maxT);
      const x = margin + i * tw + tw * 0.12;
      const bw = tw * 0.76;
      pdf.setFillColor(SKY.r, SKY.g, SKY.b);
      pdf.rect(x, baseY - h, bw, h, "F");
    }
    pdf.setFont(PDF_FONT, "normal");
    pdf.setFontSize(6);
    setMuted();
    for (let i = 0; i < show.length; i++) {
      const d = show[i]!;
      let short = d.date;
      try {
        const dt = new Date(`${d.date}T12:00:00`);
        if (!isNaN(dt.getTime())) {
          short = dt.toLocaleDateString(undefined, {
            month: "numeric",
            day: "numeric",
          });
        }
      } catch {
        /* keep */
      }
      const x = margin + i * tw + tw / 2;
      pdf.text(truncatePdfCell(short, 8), x, baseY + 3.5, {
        align: "center",
      });
    }
    y = baseY + 8;
    setInk();
  } else if (timeline.length > 0) {
    drawSectionTitle(
      "Submissions over time",
      "Chart omitted when fewer than five days of data (little pattern to read).",
    );
    ensureSpace(10);
    pdf.setFont(PDF_FONT, "italic");
    pdf.setFontSize(8.5);
    setMuted();
    pdf.text(
      `Only ${timeline.length} day(s) in this export; timeline chart hidden.`,
      margin,
      y,
    );
    y += 10;
    setInk();
  }

  // --- Section averages table ---
  if (sections.length > 0) {
    const allowBareMonthDay =
      timeline.length >= 3 && sections.length === timeline.length;
    const dateLikeSectionCount = sections.filter((s) =>
      looksLikeCalendarDateLabel(s.section_title, allowBareMonthDay),
    ).length;
    const sectionTitlesProbablyTimeline =
      dateLikeSectionCount >= Math.ceil(sections.length * 0.5);
    if (!sectionTitlesProbablyTimeline) {
      drawSectionPercentColumns(
        sections.map((sec) => ({
          label: sec.section_title,
          percent: sec.average_percentage ?? 0,
        })),
      );
    } else {
      drawSectionTitle(
        "Section average % (columns)",
        "Column chart omitted: section names look like calendar dates. Use the table below or fix section_averages in the API so section_title is each quiz/coding section name.",
      );
      ensureSpace(10);
      pdf.setFont(PDF_FONT, "italic");
      pdf.setFontSize(8.5);
      setMuted();
      pdf.text(
        "If dates appear as section names, the analytics payload may be mapping the wrong field into section_averages.",
        margin,
        y,
      );
      y += 12;
      setInk();
    }
    drawSectionTitle(
      `Section averages (${sections.length})`,
      "Per-section mean score, cap, average %, and count of submissions included in that average.",
    );
    const col = {
      sec: 52,
      avg: 22,
      max: 18,
      pct: 22,
      n: 16,
    };
    const drawTableHeader = () => {
      ensureSpace(8);
      pdf.setFillColor(249, 250, 251);
      pdf.rect(margin, y - 1, contentW, 7, "F");
      pdf.setFont(PDF_FONT, "bold");
      pdf.setFontSize(7.5);
      setInk();
      let x = margin + 2;
      pdf.text("Section", x, y + 4);
      x += col.sec;
      pdf.text("Avg", x, y + 4, { align: "right" });
      x += col.avg;
      pdf.text("Max", x, y + 4, { align: "right" });
      x += col.max;
      pdf.text("Avg %", x, y + 4, { align: "right" });
      x += col.pct;
      pdf.text("n", x, y + 4, { align: "right" });
      y += 9;
    };
    drawTableHeader();
    pdf.setFont(PDF_FONT, "normal");
    pdf.setFontSize(8);
    for (const sec of sections) {
      ensureSpace(6);
      let x = margin + 2;
      pdf.text(truncatePdfCell(sec.section_title, 30), x, y);
      x += col.sec;
      pdf.text(
        sec.average_score != null ? sec.average_score.toFixed(1) : "—",
        x,
        y,
        { align: "right" },
      );
      x += col.avg;
      pdf.text(
        sec.max_score != null ? sec.max_score.toFixed(1) : "—",
        x,
        y,
        { align: "right" },
      );
      x += col.max;
      pdf.text(
        sec.average_percentage != null
          ? `${sec.average_percentage.toFixed(1)}%`
          : "—",
        x,
        y,
        { align: "right" },
      );
      x += col.pct;
      pdf.text(String(sec.submissions_count ?? "—"), x, y, {
        align: "right",
      });
      y += 5.2;
    }
    y += 6;
  }

  // --- Top performers ---
  const top = data.top_performers ?? [];
  if (top.length > 0) {
    drawSectionTitle(`Top performers (${top.length})`);
    const cw = {
      r: 10,
      name: 40,
      email: 44,
      sc: 16,
      pct: 14,
      tm: 14,
      dt: 40,
    };
    const drawTpHead = () => {
      ensureSpace(8);
      pdf.setFillColor(249, 250, 251);
      pdf.rect(margin, y - 1, contentW, 7, "F");
      pdf.setFont(PDF_FONT, "bold");
      pdf.setFontSize(7.5);
      setInk();
      let x = margin + 2;
      pdf.text("#", x, y + 4);
      x += cw.r;
      pdf.text("Name", x, y + 4);
      x += cw.name;
      pdf.text("Email", x, y + 4);
      x += cw.email;
      pdf.text("Score", x, y + 4, { align: "right" });
      x += cw.sc;
      pdf.text("%", x, y + 4, { align: "right" });
      x += cw.pct;
      pdf.text("Min", x, y + 4, { align: "right" });
      x += cw.tm;
      pdf.text("Submitted", x, y + 4);
      y += 9;
    };
    drawTpHead();
    pdf.setFont(PDF_FONT, "normal");
    pdf.setFontSize(7.5);
    for (const row of top) {
      ensureSpace(6);
      let x = margin + 2;
      pdf.text(String(row.rank), x, y);
      x += cw.r;
      pdf.text(truncatePdfCell(row.name, 22), x, y);
      x += cw.name;
      pdf.text(truncatePdfCell(row.email, 28), x, y);
      x += cw.email;
      pdf.text(
        row.score != null ? row.score.toFixed(1) : "—",
        x,
        y,
        { align: "right" },
      );
      x += cw.sc;
      pdf.text(
        row.percentage != null ? row.percentage.toFixed(1) : "—",
        x,
        y,
        { align: "right" },
      );
      x += cw.pct;
      pdf.text(
        row.time_taken_minutes != null ? String(row.time_taken_minutes) : "—",
        x,
        y,
        { align: "right" },
      );
      x += cw.tm;
      pdf.text(truncatePdfCell(formatShortDate(row.submitted_at), 16), x, y);
      y += 5;
    }
    y += 6;
  }

  // --- All submissions ---
  const students = data.students ?? [];
  drawSectionTitle(`All submissions (${students.length})`);
  if (students.length === 0) {
    ensureSpace(8);
    pdf.setFont(PDF_FONT, "italic");
    pdf.setFontSize(9);
    setMuted();
    pdf.text("No student rows in this export.", margin, y);
    y += 10;
    setInk();
  } else {
    const c = {
      name: 36,
      em: 50,
      st: 26,
      sc: 14,
      pc: 12,
      tm: 14,
      sub: 26,
    };
    const drawSubHead = () => {
      ensureSpace(8);
      pdf.setFillColor(249, 250, 251);
      pdf.rect(margin, y - 1, contentW, 7, "F");
      pdf.setFont(PDF_FONT, "bold");
      pdf.setFontSize(7);
      setInk();
      let x = margin + 1.5;
      pdf.text("Name", x, y + 4);
      x += c.name;
      pdf.text("Email", x, y + 4);
      x += c.em;
      pdf.text("Status", x, y + 4);
      x += c.st;
      pdf.text("Scr", x, y + 4, { align: "right" });
      x += c.sc;
      pdf.text("%", x, y + 4, { align: "right" });
      x += c.pc;
      pdf.text("Min", x, y + 4, { align: "right" });
      x += c.tm;
      pdf.text("Submitted", x, y + 4);
      y += 9;
    };
    drawSubHead();
    pdf.setFont(PDF_FONT, "normal");
    pdf.setFontSize(7);
    for (const row of students) {
      if (y + 5.5 > contentBottom) {
        newPage();
        drawSubHead();
        pdf.setFont(PDF_FONT, "normal");
        pdf.setFontSize(7);
      }
      let x = margin + 1.5;
      pdf.text(truncatePdfCell(row.name, 18), x, y);
      x += c.name;
      pdf.text(truncatePdfCell(row.email, 26), x, y);
      x += c.em;
      pdf.text(truncatePdfCell(humanizeStatusPdf(row.status), 14), x, y);
      x += c.st;
      pdf.text(
        row.score != null ? row.score.toFixed(1) : "—",
        x,
        y,
        { align: "right" },
      );
      x += c.sc;
      pdf.text(
        row.percentage != null ? row.percentage.toFixed(0) : "—",
        x,
        y,
        { align: "right" },
      );
      x += c.pc;
      pdf.text(
        row.time_taken_minutes != null ? String(row.time_taken_minutes) : "—",
        x,
        y,
        { align: "right" },
      );
      x += c.tm;
      pdf.text(truncatePdfCell(formatShortDate(row.submitted_at), 14), x, y);
      y += 4.8;
    }
    y += 4;
  }

  const ql = data.question_level_results;
  if (ql && hasQuestionLevelResults(data)) {
    drawSectionTitle("Question-level results", questionLevelResultsSummary(ql));

    const rowH = 5.2;
    const numW = 13;
    const right0 = margin + contentW - 2;
    const mcqX = {
      seen: right0,
      skip: right0 - numW,
      wrong: right0 - 2 * numW,
      ok: right0 - 3 * numW,
      topicLeft: margin + 2,
    };

    const drawMcqHeader = () => {
      ensureSpace(9);
      pdf.setFillColor(249, 250, 251);
      pdf.rect(margin, y - 1, contentW, 7, "F");
      pdf.setFont(PDF_FONT, "bold");
      pdf.setFontSize(6.8);
      setInk();
      pdf.text("Topic / difficulty", mcqX.topicLeft, y + 4);
      pdf.text("OK", mcqX.ok, y + 4, { align: "right" });
      pdf.text("Wrong", mcqX.wrong, y + 4, { align: "right" });
      pdf.text("Skip", mcqX.skip, y + 4, { align: "right" });
      pdf.text("Seen", mcqX.seen, y + 4, { align: "right" });
      y += 9;
      pdf.setFont(PDF_FONT, "normal");
      pdf.setFontSize(6.8);
    };

    const mcq = ql.mcq ?? [];
    if (mcq.length > 0) {
      drawSectionTitle("MCQ items", "Correct, incorrect, skipped, and appearances.");
      drawMcqHeader();
      for (let i = 0; i < Math.min(mcq.length, 28); i++) {
        const r = mcq[i]!;
        ensureSpace(rowH);
        const topic =
          [r.topic, r.difficulty_level].filter(Boolean).join(" · ") ||
          `Q${r.question_id}`;
        const topicChars = Math.max(
          12,
          Math.floor((mcqX.ok - mcqX.topicLeft - 3) / 1.85),
        );
        pdf.text(truncatePdfCell(topic, topicChars), mcqX.topicLeft, y);
        pdf.text(String(r.correct_count ?? 0), mcqX.ok, y, { align: "right" });
        pdf.text(String(r.incorrect_count ?? 0), mcqX.wrong, y, {
          align: "right",
        });
        pdf.text(String(r.skipped_count ?? 0), mcqX.skip, y, { align: "right" });
        pdf.text(String(r.appeared_count ?? 0), mcqX.seen, y, {
          align: "right",
        });
        y += rowH;
      }
      if (mcq.length > 28) {
        setMuted();
        pdf.text(`… and ${mcq.length - 28} more MCQ rows (truncated).`, margin, y);
        y += 5;
        setInk();
      }
      y += 3;
    }

    const codingX = {
      seen: right0,
      skip: right0 - numW,
      fail: right0 - 2 * numW,
      part: right0 - 3 * numW,
      pass: right0 - 4 * numW,
      titleLeft: margin + 2,
    };

    const coding = ql.coding ?? [];
    if (coding.length > 0) {
      drawSectionTitle(
        "Coding problems",
        "Full pass, partial, failed, skipped, appearances.",
      );
      ensureSpace(9);
      pdf.setFillColor(249, 250, 251);
      pdf.rect(margin, y - 1, contentW, 7, "F");
      pdf.setFont(PDF_FONT, "bold");
      pdf.setFontSize(6.8);
      setInk();
      pdf.text("Title", codingX.titleLeft, y + 4);
      pdf.text("Pass", codingX.pass, y + 4, { align: "right" });
      pdf.text("Part", codingX.part, y + 4, { align: "right" });
      pdf.text("Fail", codingX.fail, y + 4, { align: "right" });
      pdf.text("Skip", codingX.skip, y + 4, { align: "right" });
      pdf.text("Seen", codingX.seen, y + 4, { align: "right" });
      y += 9;
      pdf.setFont(PDF_FONT, "normal");
      pdf.setFontSize(6.8);
      for (let i = 0; i < Math.min(coding.length, 20); i++) {
        const r = coding[i]!;
        ensureSpace(rowH);
        const titleChars = Math.max(
          10,
          Math.floor((codingX.pass - codingX.titleLeft - 3) / 1.85),
        );
        pdf.text(
          truncatePdfCell(r.title || `P${r.problem_id}`, titleChars),
          codingX.titleLeft,
          y,
        );
        pdf.text(String(r.full_pass_count ?? 0), codingX.pass, y, {
          align: "right",
        });
        pdf.text(String(r.partial_count ?? 0), codingX.part, y, {
          align: "right",
        });
        pdf.text(String(r.failed_count ?? 0), codingX.fail, y, {
          align: "right",
        });
        pdf.text(String(r.skipped_count ?? 0), codingX.skip, y, {
          align: "right",
        });
        pdf.text(String(r.appeared_count ?? 0), codingX.seen, y, {
          align: "right",
        });
        y += rowH;
      }
      if (coding.length > 20) {
        setMuted();
        pdf.text(`… and ${coding.length - 20} more coding rows (truncated).`, margin, y);
        y += 5;
        setInk();
      }
      y += 3;
    }

    const subjX = {
      max: right0,
      seen: right0 - numW,
      skip: right0 - 2 * numW,
      part: right0 - 3 * numW,
      full: right0 - 4 * numW,
      labLeft: margin + 2,
    };

    const subj = ql.subjective ?? [];
    if (subj.length > 0) {
      drawSectionTitle(
        "Subjective items",
        "Full marks, partial, skipped, appearances.",
      );
      ensureSpace(9);
      pdf.setFillColor(249, 250, 251);
      pdf.rect(margin, y - 1, contentW, 7, "F");
      pdf.setFont(PDF_FONT, "bold");
      pdf.setFontSize(6.8);
      setInk();
      pdf.text("Section / question", subjX.labLeft, y + 4);
      pdf.text("Full", subjX.full, y + 4, { align: "right" });
      pdf.text("Part", subjX.part, y + 4, { align: "right" });
      pdf.text("Skip", subjX.skip, y + 4, { align: "right" });
      pdf.text("Seen", subjX.seen, y + 4, { align: "right" });
      pdf.text("Max", subjX.max, y + 4, { align: "right" });
      y += 9;
      pdf.setFont(PDF_FONT, "normal");
      pdf.setFontSize(6.8);
      for (let i = 0; i < Math.min(subj.length, 20); i++) {
        const r = subj[i]!;
        ensureSpace(rowH);
        const lab = r.section_title
          ? `${r.section_title} (#${r.question_id})`
          : `Q${r.question_id}`;
        const labChars = Math.max(
          10,
          Math.floor((subjX.full - subjX.labLeft - 3) / 1.85),
        );
        pdf.text(truncatePdfCell(lab, labChars), subjX.labLeft, y);
        pdf.text(String(r.full_marks_count ?? 0), subjX.full, y, {
          align: "right",
        });
        pdf.text(String(r.partial_count ?? 0), subjX.part, y, {
          align: "right",
        });
        pdf.text(String(r.skipped_count ?? 0), subjX.skip, y, {
          align: "right",
        });
        pdf.text(String(r.appeared_count ?? 0), subjX.seen, y, {
          align: "right",
        });
        pdf.text(String(r.max_marks ?? 0), subjX.max, y, { align: "right" });
        y += rowH;
      }
      if (subj.length > 20) {
        setMuted();
        pdf.text(`… and ${subj.length - 20} more subjective rows (truncated).`, margin, y);
        y += 5;
        setInk();
      }
      y += 3;
    }
  } else {
    const qItems = data.question_item_summary ?? [];
    if (qItems.length > 0) {
      drawSectionTitle(
        "Question highlights (incorrect / skipped)",
        "Legacy flat `question_item_summary` from the analytics API.",
      );
      const qh = 7;
      ensureSpace(10 + Math.min(qItems.length, 20) * qh);
      pdf.setFillColor(249, 250, 251);
      pdf.rect(margin, y - 1, contentW, 7, "F");
      pdf.setFont(PDF_FONT, "bold");
      pdf.setFontSize(7.5);
      setInk();
      pdf.text("Question", margin + 2, y + 4);
      pdf.text("Wrong", margin + contentW - 28, y + 4, { align: "right" });
      pdf.text("Skip", margin + contentW - 2, y + 4, { align: "right" });
      y += 9;
      pdf.setFont(PDF_FONT, "normal");
      pdf.setFontSize(7.5);
      for (let qi = 0; qi < Math.min(qItems.length, 22); qi++) {
        const q = qItems[qi]!;
        ensureSpace(qh);
        pdf.text(truncatePdfCell(q.question_label, 52), margin + 2, y);
        pdf.text(String(q.incorrect_count ?? 0), margin + contentW - 28, y, {
          align: "right",
        });
        pdf.text(String(q.skipped_count ?? 0), margin + contentW - 2, y, {
          align: "right",
        });
        y += qh;
      }
      if (qItems.length > 22) {
        setMuted();
        pdf.text(`… and ${qItems.length - 22} more (truncated for PDF).`, margin, y);
        y += 5;
        setInk();
      }
      y += 4;
    } else {
      drawSectionTitle(
        "Question-level results",
        "Skipped or incorrect counts per item.",
      );
      ensureSpace(10);
      pdf.setFont(PDF_FONT, "italic");
      pdf.setFontSize(8.5);
      setMuted();
      pdf.text(
        "No question_level_results or question_item_summary in this export.",
        margin,
        y,
      );
      y += 12;
      setInk();
    }
  }

  const secScores = flattenStudentSectionScores(data);
  if (secScores.length > 0) {
    drawSectionTitle(
      "Per-learner section scores",
      "When the API includes section-level marks per attempt.",
    );
    const head = ["Learner", "Section", "Score", "Max", "%"];
    const cw = [44, 48, 18, 14, 14];
    const drawSecHead = () => {
      ensureSpace(8);
      pdf.setFillColor(249, 250, 251);
      pdf.rect(margin, y - 1, contentW, 7, "F");
      pdf.setFont(PDF_FONT, "bold");
      pdf.setFontSize(7);
      setInk();
      let hx = margin + 2;
      for (let i = 0; i < head.length; i++) {
        pdf.text(head[i]!, hx, y + 4);
        hx += cw[i]!;
      }
      y += 9;
    };
    drawSecHead();
    pdf.setFont(PDF_FONT, "normal");
    pdf.setFontSize(7);
    for (const row of secScores) {
      if (y + 6 > contentBottom) {
        newPage();
        drawSecHead();
        pdf.setFont(PDF_FONT, "normal");
        pdf.setFontSize(7);
      }
      let rx = margin + 2;
      pdf.text(truncatePdfCell(row.name, 22), rx, y);
      rx += cw[0]!;
      pdf.text(truncatePdfCell(row.section_title, 22), rx, y);
      rx += cw[1]!;
      pdf.text(
        row.score != null ? row.score.toFixed(1) : "—",
        rx,
        y,
        { align: "right" },
      );
      rx += cw[2]!;
      pdf.text(
        row.max_score != null ? row.max_score.toFixed(1) : "—",
        rx,
        y,
        { align: "right" },
      );
      rx += cw[3]!;
      pdf.text(
        row.percentage != null ? `${row.percentage.toFixed(0)}%` : "—",
        rx,
        y,
        { align: "right" },
      );
      y += 5;
    }
    y += 4;
  } else {
    drawSectionTitle(
      "Per-learner section scores",
      "Compare performance across quiz sections for each learner.",
    );
    ensureSpace(10);
    pdf.setFont(PDF_FONT, "italic");
    pdf.setFontSize(8.5);
    setMuted();
    pdf.text(
      "No per-section marks: add section_scores on each student (or legacy student_section_scores) in the analytics API.",
      margin,
      y,
    );
    y += 14;
    setInk();
  }

  const actionLines: string[] = [];
  actionLines.push("Suggested next steps (based on this export):");
  if (completedScored > 0 && passR <= 0.0001) {
    actionLines.push(
      "- Review rubric and pass threshold; consider a revision workshop for low scores.",
    );
  }
  if (dur >= 15 && avgMin > 0 && avgMin < dur * 0.25) {
    actionLines.push(
      "- Spot-check short attempts for academic integrity and item exposure.",
    );
  }
  if (zeroSections.length > 0) {
    actionLines.push(
      "- Validate section visibility and ordering for sections at 0% average.",
    );
  }
  if (actionLines.length === 1) {
    actionLines.push(
      "- Continue monitoring cohort progress; no automated red flags beyond standard stats.",
    );
  }
  drawCallout(actionLines, "info");

  const year = new Date().getFullYear();
  drawFootersOnAllPages(pdf, pageW, pageH, margin, year);
  pdf.save(fileName);
}
