import jsPDF from "jspdf";
import type { AssessmentResult } from "@/lib/services/assessment.service";
import { buildAssessmentFeedbackPoints } from "@/lib/utils/assessment-feedback.utils";
import {
  getWeakSkillDisplayRows,
  normalizeTopSkillDisplayNames,
  type WeakSkillDisplayRow,
} from "@/lib/utils/assessment-skill-labels.utils";
import {
  formatAccuracyReportPercent,
  formatPercentileReport,
  formatPlacementReportPercent,
  formatScoreAttainmentPercent,
  formatScoreVersusMax,
  getPerformanceTier,
  getSubmissionBadgeKind,
  humanizeAssessmentStatus,
  PERFORMANCE_TONE_PDF,
  SUBMISSION_BADGE_PDF,
} from "@/lib/utils/assessment-performance-summary.utils";

/** Design tokens */
const SKY = { r: 2, g: 132, b: 199 };
const SKY_LIGHT = { r: 224, g: 242, b: 254 };
const SKY_DEEP = { r: 3, g: 105, b: 161 };
const SLATE = { r: 15, g: 23, b: 42 };
const SLATE_MUTED = { r: 71, g: 85, b: 105 };
const INK = { r: 15, g: 23, b: 42 };
const TRACK = { r: 226, g: 232, b: 240 };
const FOOTER_LINE = { r: 203, g: 213, b: 225 };
const FEEDBACK_BG = { r: 239, g: 246, b: 255 };

function pct(n: number, total: number): number {
  if (!total || !Number.isFinite(n)) return 0;
  return Math.min(100, Math.max(0, Math.round((n / total) * 100)));
}

function clampPct(v: number): number {
  if (!Number.isFinite(v)) return 0;
  return Math.min(100, Math.max(0, Math.round(v)));
}

function capitalizeFirstPdf(s: string): string {
  if (!s || s === "—") return s;
  return s.charAt(0).toUpperCase() + s.slice(1);
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
  year: number
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

    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(8);
    pdf.setTextColor(INK.r, INK.g, INK.b);
    pdf.text(`Page ${p} of ${total}`, margin + 14.5, textY);

    pdf.setFontSize(7);
    pdf.setTextColor(148, 163, 184);
    pdf.text(
      `© Confidential assessment report`,
      pageW - margin,
      textY,
      { align: "right" }
    );
  }
}

/**
 * Vector PDF (text + rectangles only) — no HTML/canvas rasterization.
 */
export function generateAssessmentResultPdfVector(
  data: AssessmentResult,
  fileName: string
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

  const stats = data.stats;
  const totalQ = stats.total_questions || 1;
  const correct = stats.correct_answers;
  const incorrect = stats.incorrect_answers;
  const unattempted = totalQ - stats.attempted_questions;

  const topThree = normalizeTopSkillDisplayNames(stats.top_skills, 3);

  const topicBars = Object.entries(stats.topic_wise_stats ?? {})
    .sort((a, b) => b[1].total - a[1].total)
    .slice(0, 4)
    .map(([name, v]) => ({ name, accuracy: v.accuracy_percent }));

  const drawFlowingIntro = (x0: number, y0: number, xMax: number): number => {
    const accDisp = formatAccuracyReportPercent(stats.accuracy_percent ?? 0);
    const prDisp = formatPlacementReportPercent(stats.placement_readiness ?? 0);
    const segments: { text: string; bold: boolean }[] = [
      { text: 'This report summarizes outcomes for "', bold: false },
      { text: data.assessment_name, bold: true },
      { text: '". Overall accuracy is ', bold: false },
      { text: accDisp, bold: true },
      { text: " with placement readiness at ", bold: false },
      { text: prDisp, bold: true },
      {
        text: ", based on attempted items and topic-level performance.",
        bold: false,
      },
    ];
    const fontSize = 9.2;
    const lineHeight = 4.35;
    pdf.setFontSize(fontSize);
    let yy = y0;
    let xx = x0;
    const baseRgb: [number, number, number] = [51, 65, 85];
    const boldRgb: [number, number, number] = [15, 23, 42];
    for (const seg of segments) {
      pdf.setFont("helvetica", seg.bold ? "bold" : "normal");
      const c = seg.bold ? boldRgb : baseRgb;
      pdf.setTextColor(c[0], c[1], c[2]);
      const tokens = seg.text.split(/(\s+)/);
      for (const tok of tokens) {
        if (tok === "") continue;
        const w = pdf.getTextWidth(tok);
        if (xx + w > xMax + 0.02 && xx > x0) {
          yy += lineHeight;
          xx = x0;
        }
        pdf.text(tok, xx, yy);
        xx += w;
      }
    }
    return yy + lineHeight + 2;
  };

  const drawScoreSummaryPanel = (leftX: number, topY: number, width: number): number => {
    const tier = getPerformanceTier(stats);
    const tone = PERFORMANCE_TONE_PDF[tier.tone];
    const pad = 3.5;
    const panelH = 58;
    pdf.setDrawColor(226, 232, 240);
    pdf.setLineWidth(0.35);
    pdf.setFillColor(248, 250, 252);
    pdf.roundedRect(leftX, topY, width, panelH, 1.5, 1.5, "FD");

    let py = topY + pad + 4;
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(7.5);
    pdf.setTextColor(SLATE_MUTED.r, SLATE_MUTED.g, SLATE_MUTED.b);
    pdf.text("YOUR SCORE", leftX + pad, py);
    py += 5.5;

    pdf.setFontSize(17);
    pdf.setTextColor(INK.r, INK.g, INK.b);
    pdf.text(
      formatScoreVersusMax(stats.score ?? 0, stats.maximum_marks ?? 0),
      leftX + pad,
      py
    );
    py += 7.5;

    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(8);
    const pillText = tier.label;
    pdf.setTextColor(tone.text[0], tone.text[1], tone.text[2]);
    const tw = pdf.getTextWidth(pillText);
    const pillW = tw + 5.5;
    pdf.setFillColor(tone.bg[0], tone.bg[1], tone.bg[2]);
    pdf.setDrawColor(tone.border[0], tone.border[1], tone.border[2]);
    pdf.roundedRect(leftX + pad, py - 3.2, pillW, 5.2, 1, 1, "FD");
    pdf.text(pillText, leftX + pad + 2.75, py);
    py += 8;

    const row = (label: string, value: string) => {
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(8);
      pdf.setTextColor(SLATE_MUTED.r, SLATE_MUTED.g, SLATE_MUTED.b);
      pdf.text(label, leftX + pad, py);
      pdf.setFont("helvetica", "bold");
      pdf.setTextColor(INK.r, INK.g, INK.b);
      pdf.text(value, leftX + width - pad, py, { align: "right" });
      py += 4.9;
    };

    row("Score attainment", formatScoreAttainmentPercent(stats));
    row("Accuracy", `${(stats.accuracy_percent ?? 0).toFixed(1)}%`);
    row("Percentile", formatPercentileReport(stats.percentile));

    py += 0.5;
    const stLabel = humanizeAssessmentStatus(data.status);
    const stKind = getSubmissionBadgeKind(data.status);
    const stCol = SUBMISSION_BADGE_PDF[stKind];
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(7.5);
    pdf.setTextColor(SLATE_MUTED.r, SLATE_MUTED.g, SLATE_MUTED.b);
    pdf.text("Status", leftX + pad, py);
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(7.5);
    const stw = pdf.getTextWidth(stLabel);
    const sw = stw + 5;
    pdf.setFillColor(stCol.bg[0], stCol.bg[1], stCol.bg[2]);
    pdf.setDrawColor(stCol.border[0], stCol.border[1], stCol.border[2]);
    pdf.roundedRect(leftX + width - pad - sw, py - 3.2, sw, 5, 0.8, 0.8, "FD");
    pdf.setTextColor(stCol.text[0], stCol.text[1], stCol.text[2]);
    pdf.text(stLabel, leftX + width - pad - sw + 2.5, py);

    return topY + panelH;
  };

  // --- Header: left column (titles + ID) + YOUR SCORE panel top-aligned on the right ---
  const panelW = 58;
  const headerGap = 5;
  const headerLeftW = contentW - panelW - headerGap;
  const panelX = margin + headerLeftW + headerGap;

  ensureSpace(72);
  pdf.setFillColor(SKY.r, SKY.g, SKY.b);
  pdf.rect(margin, y, 22, 1.4, "F");
  y += 6;

  const panelTop = y - 1;
  const panelBottom = drawScoreSummaryPanel(panelX, panelTop, panelW);

  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(8);
  pdf.setTextColor(SKY_DEEP.r, SKY_DEEP.g, SKY_DEEP.b);
  pdf.text("PERFORMANCE REPORT", margin, y);
  y += 5;
  pdf.setFontSize(14);
  setInk();
  pdf.text("Assessment performance", margin, y);
  y += 9;

  pdf.setFontSize(20);
  pdf.setFont("helvetica", "bold");
  const titleLines = pdf.splitTextToSize(data.assessment_name, headerLeftW - 2);
  pdf.text(titleLines, margin, y);
  y += titleLines.length * 7 + 3;

  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(9);
  pdf.setTextColor(SLATE_MUTED.r, SLATE_MUTED.g, SLATE_MUTED.b);
  const idStr = String(data.assessment_id);
  pdf.text(idStr.length > 42 ? `${idStr.slice(0, 40)}…` : `ID ${idStr}`, margin, y);
  y += 7;
  setInk();

  y = Math.max(y, panelBottom) + 8;

  ensureSpace(28);
  const introEndY = drawFlowingIntro(margin, y, margin + contentW);
  y = introEndY + 10;
  setInk();

  // --- Hero ---
  const heroH = 46;
  const heroGap = 3.5;
  const boxW = (contentW - heroGap) / 2;
  ensureSpace(heroH + 12);

  const heroY = y;
  pdf.setFillColor(SKY.r, SKY.g, SKY.b);
  pdf.rect(margin, heroY, boxW, heroH, "F");
  pdf.setFillColor(SKY_DEEP.r, SKY_DEEP.g, SKY_DEEP.b);
  pdf.rect(margin, heroY + heroH - 5, boxW, 5, "F");

  pdf.setFillColor(SLATE.r, SLATE.g, SLATE.b);
  pdf.rect(margin + boxW + heroGap, heroY, boxW, heroH, "F");
  pdf.setFillColor(30, 41, 59);
  pdf.rect(margin + boxW + heroGap, heroY + heroH - 5, boxW, 5, "F");

  pdf.setTextColor(255, 255, 255);
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(9);
  pdf.text("Questions attempted", margin + 4, heroY + 9);
  pdf.setFontSize(32);
  pdf.text(String(stats.attempted_questions), margin + 4, heroY + 26);
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(7.8);
  pdf.setTextColor(224, 242, 254);
  const subL = pdf.splitTextToSize(
    `Out of ${stats.total_questions} total items · ${data.status}`,
    boxW - 8
  );
  pdf.text(subL, margin + 4, heroY + heroH - 2.2 - (subL.length - 1) * 3.3);

  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(9);
  pdf.setTextColor(255, 255, 255);
  pdf.text("Top three focus areas", margin + boxW + heroGap + 4, heroY + 9);
  pdf.setFontSize(11);
  let hy = heroY + 19;
  for (const name of topThree) {
    const lines = pdf.splitTextToSize(capitalizeFirstPdf(name), boxW - 8);
    pdf.text(lines, margin + boxW + heroGap + 4, hy);
    hy += lines.length * 4.6 + 1;
  }
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(7.8);
  pdf.setTextColor(203, 213, 225);
  const subR = pdf.splitTextToSize(
    "Strongest skills in this attempt (when provided by the assessment).",
    boxW - 8
  );
  pdf.text(subR, margin + boxW + heroGap + 4, heroY + heroH - 2.2 - (subR.length - 1) * 3.3);

  y = heroY + heroH + 14;
  setInk();

  // --- Metrics grid ---
  const colGap = 5;
  const colW = (contentW - colGap * 2) / 3;
  const x1 = margin;
  const x2 = margin + colW + colGap;
  const x3 = margin + 2 * (colW + colGap);

  const barH = 3.4;

  const drawColBar = (x: number, colTop: number, label: string, value: number): number => {
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(7.8);
    setInk();
    const v = clampPct(value);
    const labLines = pdf.splitTextToSize(label, colW - 18);
    const firstLine = labLines[0] ?? "";
    const firstBaseline = colTop + 3.2;
    pdf.text(firstLine, x, firstBaseline);
    pdf.setTextColor(SKY_DEEP.r, SKY_DEEP.g, SKY_DEEP.b);
    pdf.text(`${v}%`, x + colW, firstBaseline, { align: "right" });
    setInk();
    let cy = firstBaseline + 3.5;
    for (let i = 1; i < labLines.length; i++) {
      pdf.text(labLines[i], x, cy);
      cy += 3.5;
    }
    const barY = cy + 1.2;
    pdf.setFillColor(TRACK.r, TRACK.g, TRACK.b);
    pdf.rect(x, barY, colW, barH, "F");
    pdf.setFillColor(SKY.r, SKY.g, SKY.b);
    pdf.rect(x, barY, (colW * v) / 100, barH, "F");
    pdf.setFillColor(SKY_DEEP.r, SKY_DEEP.g, SKY_DEEP.b);
    const capW = Math.min(1.8, (colW * v) / 100);
    if (v > 2) {
      pdf.rect(x + (colW * v) / 100 - capW, barY, capW, barH, "F");
    }
    return barY + barH + 5;
  };

  ensureSpace(92);
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(8.5);
  setInk();
  pdf.text("Answer breakdown", x1, y);
  pdf.text("Score & readiness", x2, y);
  pdf.text("Topic accuracy", x3, y);
  pdf.setDrawColor(SKY.r, SKY.g, SKY.b);
  pdf.setLineWidth(0.35);
  pdf.line(x1, y + 1.5, x1 + colW, y + 1.5);
  pdf.line(x2, y + 1.5, x2 + colW, y + 1.5);
  pdf.line(x3, y + 1.5, x3 + colW, y + 1.5);
  y += 8;

  let c1 = y;
  let c2 = y;
  let c3 = y;

  c1 = drawColBar(x1, c1, "Correct", pct(correct, totalQ));
  c1 = drawColBar(x1, c1, "Incorrect", pct(incorrect, totalQ));
  c1 = drawColBar(x1, c1, "Unattempted", pct(unattempted, totalQ));

  c2 = drawColBar(x2, c2, "Score / max", pct(stats.score, stats.maximum_marks || 1));
  c2 = drawColBar(x2, c2, "Accuracy", stats.accuracy_percent);
  c2 = drawColBar(x2, c2, "Placement readiness", stats.placement_readiness);
  c2 = drawColBar(
    x2,
    c2,
    "Percentile",
    Math.min(100, Number.isFinite(stats.percentile) ? stats.percentile : 0)
  );

  if (topicBars.length > 0) {
    for (const t of topicBars) {
      c3 = drawColBar(x3, c3, t.name, t.accuracy);
    }
  } else {
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(8);
    pdf.setTextColor(SLATE_MUTED.r, SLATE_MUTED.g, SLATE_MUTED.b);
    pdf.text("No topic breakdown.", x3, c3 + 4);
    c3 += 10;
  }

  y = Math.max(c1, c2, c3) + 12;
  setInk();

  // --- Time (full width) ---
  const drawWideBar = (label: string, value: number): number => {
    const v = clampPct(value);
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(8.5);
    setInk();
    pdf.text("Time usage", margin, y);
    y += 6;
    const labLines = pdf.splitTextToSize(label, contentW - 22);
    const bl = y + 3;
    pdf.text(labLines[0] ?? "", margin, bl);
    pdf.setTextColor(SKY_DEEP.r, SKY_DEEP.g, SKY_DEEP.b);
    pdf.text(`${v}%`, margin + contentW, bl, { align: "right" });
    setInk();
    let cy = bl + 3.6;
    for (let i = 1; i < labLines.length; i++) {
      pdf.text(labLines[i], margin, cy);
      cy += 3.6;
    }
    const barY = cy + 1.2;
    pdf.setFillColor(TRACK.r, TRACK.g, TRACK.b);
    pdf.rect(margin, barY, contentW, barH + 0.5, "F");
    pdf.setFillColor(SKY.r, SKY.g, SKY.b);
    pdf.rect(margin, barY, (contentW * v) / 100, barH + 0.5, "F");
    pdf.setFillColor(SKY_DEEP.r, SKY_DEEP.g, SKY_DEEP.b);
    const cw = Math.min(2, (contentW * v) / 100);
    if (v > 1) {
      pdf.rect(margin + (contentW * v) / 100 - cw, barY, cw, barH + 0.5, "F");
    }
    return barY + barH + 0.5 + 6;
  };

  ensureSpace(28);
  y = drawWideBar("Time used (vs allotted)", Math.min(100, stats.percentage_time_taken));
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(8.5);
  pdf.setTextColor(SLATE_MUTED.r, SLATE_MUTED.g, SLATE_MUTED.b);
  pdf.text(
    `${stats.time_taken_minutes} / ${stats.total_time_minutes} minutes`,
    margin,
    y
  );
  y += 12;
  setInk();

  const feedbackPoints = buildAssessmentFeedbackPoints(data);
  const weakSkillRows = getWeakSkillDisplayRows(stats.low_skills, 6);

  const drawWeakSkillsSection = () => {
    const cardH = 20;
    const cardGap = 4.5;
    const innerW = contentW - 10;
    const cardX = margin + 5;

    const drawOneCard = (row: WeakSkillDisplayRow, cardTop: number) => {
      pdf.setFillColor(255, 255, 255);
      pdf.setDrawColor(253, 186, 116);
      pdf.setLineWidth(0.25);
      pdf.roundedRect(cardX, cardTop, innerW, cardH, 1.3, 1.3, "FD");

      const acc = row.accuracyPercent ?? 0;
      const hasAcc = row.accuracyPercent != null;
      const hasCounts =
        row.correct != null &&
        row.total != null &&
        (row.total as number) > 0;

      const label = capitalizeFirstPdf(row.label);
      const labelMaxW = hasAcc ? innerW - 32 : innerW - 6;
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(9);
      setInk();
      const nameLines = pdf.splitTextToSize(label, labelMaxW);
      pdf.text(nameLines, cardX + 3, cardTop + 5);

      if (hasAcc) {
        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(8);
        const badgeText = `${acc}%`;
        const accTone =
          acc < 25
            ? { bg: [254, 226, 226] as const, fg: [185, 28, 28] as const }
            : acc < 50
              ? { bg: [255, 237, 213] as const, fg: [194, 65, 12] as const }
              : { bg: [254, 243, 199] as const, fg: [180, 83, 9] as const };
        const bw = pdf.getTextWidth(badgeText) + 5;
        pdf.setFillColor(accTone.bg[0], accTone.bg[1], accTone.bg[2]);
        pdf.roundedRect(
          cardX + innerW - bw - 3,
          cardTop + 2,
          bw,
          5.2,
          1.5,
          1.5,
          "F"
        );
        pdf.setTextColor(accTone.fg[0], accTone.fg[1], accTone.fg[2]);
        pdf.text(badgeText, cardX + innerW - 3, cardTop + 5.5, { align: "right" });
      }

      const barY = cardTop + 11;
      const barW = innerW - 6;
      pdf.setFillColor(255, 237, 213);
      pdf.rect(cardX + 3, barY, barW, 2.8, "F");
      if (hasAcc) {
        const barFill = Math.min(100, acc);
        const fillRgb =
          acc < 25
            ? [220, 38, 38]
            : acc < 50
              ? [234, 88, 12]
              : [245, 158, 11];
        pdf.setFillColor(fillRgb[0], fillRgb[1], fillRgb[2]);
        pdf.rect(cardX + 3, barY, (barW * barFill) / 100, 2.8, "F");
      }

      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(7.5);
      pdf.setTextColor(SLATE_MUTED.r, SLATE_MUTED.g, SLATE_MUTED.b);
      if (hasCounts) {
        pdf.text(
          `${row.correct}/${row.total} correct · practice priority`,
          cardX + 3,
          cardTop + 17.5
        );
      } else if (!hasAcc) {
        pdf.text("No numeric breakdown in report data.", cardX + 3, cardTop + 17.5);
      } else {
        pdf.text("Practice priority", cardX + innerW - 3, cardTop + 17.5, { align: "right" });
      }
      setInk();
    };

    if (weakSkillRows.length === 0) {
      ensureSpace(22);
      const h = 18;
      pdf.setFillColor(255, 251, 235);
      pdf.rect(margin, y, contentW, h, "F");
      pdf.setFillColor(245, 158, 11);
      pdf.rect(margin, y, 1.5, h, "F");
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(10.5);
      setInk();
      pdf.text("Skills needing attention", margin + 5, y + 6);
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(8.5);
      pdf.setTextColor(SLATE_MUTED.r, SLATE_MUTED.g, SLATE_MUTED.b);
      pdf.text("None flagged for this attempt.", margin + 5, y + 12);
      y += h + 6;
      setInk();
      return;
    }

    ensureSpace(24);
    const headerTop = y;
    const subLines = pdf.splitTextToSize(
      "Focus your next study blocks on these areas — accuracy reflects this attempt only.",
      contentW - 12
    );
    const headerH = 7 + subLines.length * 3.8 + 5;
    pdf.setFillColor(255, 251, 235);
    pdf.rect(margin, headerTop, contentW, headerH, "F");
    pdf.setFillColor(245, 158, 11);
    pdf.rect(margin, headerTop, 1.5, headerH, "F");
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(10.5);
    setInk();
    pdf.text("Skills needing attention", margin + 5, headerTop + 6);
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(8);
    pdf.setTextColor(SLATE_MUTED.r, SLATE_MUTED.g, SLATE_MUTED.b);
    pdf.text(subLines, margin + 5, headerTop + 11);
    y = headerTop + headerH + 4;

    for (const row of weakSkillRows) {
      ensureSpace(cardH + cardGap + 2);
      drawOneCard(row, y);
      y += cardH + cardGap;
    }
    y += 4;
    setInk();
  };

  const drawTintedBulletBlock = (
    title: string,
    lines: string[],
    mutedFallback: string | undefined,
    bg: { r: number; g: number; b: number },
    accent: { r: number; g: number; b: number }
  ) => {
    const useMuted = lines.length === 0 && !!mutedFallback;
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(9);

    let innerH = 15;
    if (useMuted) {
      innerH += 10;
    } else {
      for (const bullet of lines) {
        const wrapped = pdf.splitTextToSize(`\u2022 ${bullet}`, contentW - 14);
        innerH += wrapped.length * 4.3 + 2;
      }
    }
    innerH += 9;

    ensureSpace(innerH);

    const blockTop = y;
    pdf.setFillColor(bg.r, bg.g, bg.b);
    pdf.rect(margin, blockTop, contentW, innerH, "F");
    pdf.setFillColor(accent.r, accent.g, accent.b);
    pdf.rect(margin, blockTop, 1.4, innerH, "F");

    let ty = blockTop + 7;
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(10);
    setInk();
    pdf.text(title, margin + 5, ty);
    ty += 8;
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(9);

    if (useMuted) {
      pdf.setTextColor(SLATE_MUTED.r, SLATE_MUTED.g, SLATE_MUTED.b);
      pdf.text(mutedFallback!, margin + 5, ty);
    } else {
      pdf.setTextColor(51, 65, 85);
      for (const bullet of lines) {
        const wrapped = pdf.splitTextToSize(`\u2022 ${bullet}`, contentW - 14);
        pdf.text(wrapped, margin + 5, ty);
        ty += wrapped.length * 4.3 + 2;
      }
    }

    y = blockTop + innerH + 5;
    setInk();
  };

  drawWeakSkillsSection();

  if (feedbackPoints.length > 0) {
    drawTintedBulletBlock(
      "Feedback",
      feedbackPoints,
      undefined,
      FEEDBACK_BG,
      SKY
    );
  }

  const year = new Date().getFullYear();
  drawFootersOnAllPages(pdf, pageW, pageH, margin, year);

  pdf.save(fileName);
}
