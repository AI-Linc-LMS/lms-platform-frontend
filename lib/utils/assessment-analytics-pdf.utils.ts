import jsPDF from "jspdf";
import type { AssessmentAnalyticsResponse } from "@/lib/services/admin/admin-assessment.service";

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

  const drawHorizontalBarBlock = (
    title: string,
    rows: { label: string; value: number }[],
    emptyHint: string,
  ) => {
    drawSectionTitle(title, "Counts scaled to the largest bucket in this assessment.");
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
    const labelW = 48;
    const barLeft = margin + labelW;
    const barW = contentW - labelW;
    const barH = 3.8;
    const gap = 3.2;

    for (const r of rows) {
      ensureSpace(barH + gap + 6);
      pdf.setFont(PDF_FONT, "normal");
      pdf.setFontSize(7.5);
      setInk();
      const lab = truncatePdfCell(r.label, 28);
      pdf.text(lab, margin, y + 2.6);
      const frac = r.value / maxV;
      pdf.setFillColor(TRACK.r, TRACK.g, TRACK.b);
      pdf.rect(barLeft, y, barW, barH, "F");
      if (frac > 0) {
        pdf.setFillColor(SKY.r, SKY.g, SKY.b);
        pdf.rect(barLeft, y, Math.max(0.4, barW * frac), barH, "F");
        pdf.setFillColor(SKY_DEEP.r, SKY_DEEP.g, SKY_DEEP.b);
        const cap = Math.min(1.6, barW * frac);
        if (frac > 0.02) {
          pdf.rect(barLeft + barW * frac - cap, y, cap, barH, "F");
        }
      }
      pdf.setFont(PDF_FONT, "bold");
      pdf.setFontSize(7.5);
      pdf.setTextColor(SKY_DEEP.r, SKY_DEEP.g, SKY_DEEP.b);
      pdf.text(String(r.value), margin + contentW, y + 2.6, { align: "right" });
      setInk();
      y += barH + gap;
    }
    y += 4;
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
    `ID ${data.assessment.id} · ${truncatePdfCell(data.assessment.slug, 40)} · Max marks ${data.assessment.maximum_marks} · ${data.assessment.duration_minutes} min`,
    margin,
    y,
  );
  y += 5;
  pdf.text(`Generated ${new Date().toLocaleString()}`, margin, y);
  y += 12;
  setInk();

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
  const pieCy = y + 26;
  const blockH = statusTotal > 0 ? 58 : 22;
  ensureSpace(blockH + 4);
  const blockTop = y;
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
    const slices: {
      n: number;
      rgb: readonly [number, number, number];
      leg: string;
    }[] = [
      { n: ip, rgb: STATUS_COLORS.inProgress, leg: "In progress" },
      { n: submitted, rgb: STATUS_COLORS.submitted, leg: "Submitted" },
      { n: finalized, rgb: STATUS_COLORS.finalized, leg: "Finalized" },
    ];
    for (const sl of slices) {
      const w = (sl.n / statusTotal) * 2 * Math.PI;
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

    const stackY = blockTop + blockH - 10;
    const stackX = margin + 4;
    const stackW = contentW - 8;
    const stackH = 4.5;
    pdf.setFillColor(TRACK.r, TRACK.g, TRACK.b);
    pdf.rect(stackX, stackY, stackW, stackH, "F");
    let sx = stackX;
    const parts: { w: number; rgb: readonly [number, number, number] }[] = [
      { w: stackW * (ip / statusTotal), rgb: STATUS_COLORS.inProgress },
      { w: stackW * (submitted / statusTotal), rgb: STATUS_COLORS.submitted },
      { w: stackW * (finalized / statusTotal), rgb: STATUS_COLORS.finalized },
    ];
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
  drawHorizontalBarBlock(
    "Score distribution (% bands)",
    scoreBuckets,
    "No score distribution data.",
  );
  if (scoreBuckets.length > 0) {
    drawVerticalBarChart(
      "Score distribution (column chart)",
      scoreBuckets,
      "No score distribution data.",
    );
  }

  const timeBuckets = (data.charts?.time_taken_minutes ?? []).map((b) => ({
    label: b.label,
    value: b.count,
  }));
  drawHorizontalBarBlock(
    "Time taken (minutes)",
    timeBuckets,
    "No time-bucket data.",
  );
  if (timeBuckets.length > 0) {
    drawVerticalBarChart(
      "Time taken (column chart)",
      timeBuckets,
      "No time-bucket data.",
    );
  }

  const timeline = data.charts?.submissions_timeline ?? [];
  if (timeline.length > 0) {
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
  }

  // --- Section averages table ---
  const sections = data.section_averages ?? [];
  if (sections.length > 0) {
    drawSectionPercentColumns(
      sections.map((sec) => ({
        label: sec.section_title,
        percent: sec.average_percentage ?? 0,
      })),
    );
    drawSectionTitle(`Section averages (${sections.length})`, "Table detail.");
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

  const year = new Date().getFullYear();
  drawFootersOnAllPages(pdf, pageW, pageH, margin, year);
  pdf.save(fileName);
}
