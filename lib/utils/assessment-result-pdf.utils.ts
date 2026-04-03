import jsPDF from "jspdf";
import type {
  AssessmentResult,
  CodingProblemResponseItem,
  QuizResponseItem,
} from "@/lib/services/assessment.service";
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

/**
 * Built-in PDF fonts (no TTF embedding): only "helvetica", "times", "courier".
 * Use `times` for a classic report look; switch to `"helvetica"` for a neutral sans UI.
 */
const PDF_FONT = "helvetica" as const;

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

function stripHtmlForPdf(s: string): string {
  if (!s) return "";
  return s
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();
}

function decodeHtmlEntitiesForPdf(s: string): string {
  if (!s) return "";
  if (typeof document !== "undefined") {
    const textarea = document.createElement("textarea");
    textarea.innerHTML = s;
    return textarea.value;
  }
  return s
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

function hasProctoringForPdf(
  p: AssessmentResult["proctoring"] | undefined,
): p is NonNullable<AssessmentResult["proctoring"]> {
  if (!p || typeof p !== "object") return false;
  if (
    Array.isArray(p.eye_movement_violations) &&
    p.eye_movement_violations.length > 0
  )
    return true;
  const counts = [
    p.tab_switches_count,
    p.face_violations_count,
    p.fullscreen_exits_count,
    p.eye_movement_count,
    p.face_validation_failures_count,
    p.multiple_face_detections_count,
    p.total_violation_count,
  ];
  return counts.some((v) => typeof v === "number");
}

function drawProctoringSummaryPdf(
  pdf: jsPDF,
  margin: number,
  contentW: number,
  yStart: number,
  ensureSpace: (mm: number) => void,
  proctoring: NonNullable<AssessmentResult["proctoring"]>,
  setInk: () => void,
): number {
  const rows: { label: string; value: number }[] = [];
  const add = (label: string, v: unknown) => {
    if (typeof v === "number" && Number.isFinite(v)) {
      rows.push({ label, value: v });
    }
  };
  add("Tab switches", proctoring.tab_switches_count);
  add("Face violations", proctoring.face_violations_count);
  add("Fullscreen exits", proctoring.fullscreen_exits_count);
  add("Eye movement (count)", proctoring.eye_movement_count);
  add("Face validation failures", proctoring.face_validation_failures_count);
  add("Multiple face detections", proctoring.multiple_face_detections_count);
  add("Total violations", proctoring.total_violation_count);

  const eyeEvents = proctoring.eye_movement_violations?.length ?? 0;
  if (
    eyeEvents > 0 &&
    !rows.some((r) => r.label === "Eye movement (count)")
  ) {
    rows.push({ label: "Eye movement events (logged)", value: eyeEvents });
  }

  if (rows.length === 0) return yStart;

  const innerPad = 5;
  const topPad = 5;
  const bottomPad = 5;
  const titleFirstBaselineOffset = 4;
  const valueColW = 14;
  const textInnerW = contentW - innerPad * 2;
  const labelMaxW = Math.max(28, textInnerW - valueColW - 2);

  const titleLineH = 4.6;
  const subLineH = 3.9;
  const rowLineH = 4.15;
  const gapAfterTitle = 3;
  const gapAfterSubtitle = 4;
  const dividerGap = 3.5;
  const gapBetweenRows = 2.8;

  pdf.setFont(PDF_FONT, "bold");
  pdf.setFontSize(10);
  const titleLines = pdf.splitTextToSize("Proctoring summary", textInnerW);

  pdf.setFont(PDF_FONT, "normal");
  pdf.setFontSize(8);
  const subLines = pdf.splitTextToSize(
    "Aggregated signals for this attempt (admin report).",
    textInnerW,
  );

  pdf.setFont(PDF_FONT, "normal");
  pdf.setFontSize(8.5);
  const rowLayouts = rows.map((r) => ({
    labelLines: pdf.splitTextToSize(r.label, labelMaxW),
    value: String(r.value),
  }));

  const headerBlockH =
    topPad +
    titleFirstBaselineOffset +
    titleLines.length * titleLineH +
    gapAfterTitle +
    subLines.length * subLineH +
    gapAfterSubtitle +
    dividerGap;

  const rowsBlockH =
    rowLayouts.reduce((sum, rl) => {
      const lines = Math.max(rl.labelLines.length, 1);
      return sum + lines * rowLineH + gapBetweenRows;
    }, 0) - gapBetweenRows;

  const blockH = headerBlockH + rowsBlockH + bottomPad;

  ensureSpace(blockH + 8);
  const y = yStart;

  pdf.setFillColor(254, 250, 250);
  pdf.setDrawColor(252, 165, 165);
  pdf.setLineWidth(0.3);
  pdf.roundedRect(margin, y, contentW, blockH, 1.2, 1.2, "FD");
  pdf.setFillColor(220, 38, 38);
  pdf.rect(margin, y, 1.5, blockH, "F");

  const valueRightX = margin + contentW - innerPad;

  let baseline = y + topPad + titleFirstBaselineOffset;

  pdf.setFont(PDF_FONT, "bold");
  pdf.setFontSize(10);
  setInk();
  for (const line of titleLines) {
    pdf.text(line, margin + innerPad, baseline);
    baseline += titleLineH;
  }

  baseline += gapAfterTitle;
  pdf.setFont(PDF_FONT, "normal");
  pdf.setFontSize(8);
  pdf.setTextColor(SLATE_MUTED.r, SLATE_MUTED.g, SLATE_MUTED.b);
  for (const line of subLines) {
    pdf.text(line, margin + innerPad, baseline);
    baseline += subLineH;
  }

  baseline += gapAfterSubtitle;

  pdf.setDrawColor(252, 165, 165);
  pdf.setLineWidth(0.25);
  pdf.line(margin + innerPad, baseline, valueRightX, baseline);
  baseline += dividerGap;

  for (let ri = 0; ri < rowLayouts.length; ri++) {
    const rl = rowLayouts[ri]!;
    const rowStart = baseline;
    pdf.setFont(PDF_FONT, "normal");
    pdf.setFontSize(8.5);
    setInk();

    for (let li = 0; li < rl.labelLines.length; li++) {
      const lineBaseline = rowStart + li * rowLineH;
      pdf.text(rl.labelLines[li]!, margin + innerPad, lineBaseline);
      if (li === 0) {
        pdf.setFont(PDF_FONT, "bold");
        pdf.setFontSize(9);
        pdf.setTextColor(SKY_DEEP.r, SKY_DEEP.g, SKY_DEEP.b);
        pdf.text(rl.value, valueRightX, lineBaseline, { align: "right" });
        pdf.setFont(PDF_FONT, "normal");
        pdf.setFontSize(8.5);
        setInk();
      }
    }

    const rowH = Math.max(rl.labelLines.length, 1) * rowLineH;
    const isLast = ri === rowLayouts.length - 1;
    baseline = rowStart + rowH + (isLast ? 0 : gapBetweenRows);
  }

  return y + blockH + 6;
}

function extractCodeTextForPdf(s: string): string {
  if (!s) return "";
  if (typeof DOMParser !== "undefined") {
    try {
      const doc = new DOMParser().parseFromString(s, "text/html");
      const pre = doc.querySelector("pre");
      const source = pre?.textContent ?? doc.body.textContent ?? "";
      return decodeHtmlEntitiesForPdf(source).replace(/\r\n/g, "\n").trim();
    } catch {
      // Fallback below
    }
  }
  const preMatch = s.match(/<pre[^>]*>([\s\S]*?)<\/pre>/i);
  const source = preMatch?.[1] ?? s.replace(/<[^>]*>/g, " ");
  return decodeHtmlEntitiesForPdf(source).replace(/\r\n/g, "\n").trim();
}

export type AssessmentPdfStudentOverrides = {
  name?: string;
  email?: string;
  username?: string;
  phone?: string;
};

/** Collect student identity from result payload (supports several API shapes). */
function getStudentDetailsForPdf(
  data: AssessmentResult,
  overrides?: AssessmentPdfStudentOverrides,
): {
  name: string | null;
  email: string | null;
  phone: string | null;
  username: string | null;
} {
  const u = data.user;
  const fromUser =
    (u?.name && String(u.name).trim()) ||
    [u?.first_name, u?.last_name].filter(Boolean).join(" ").trim() ||
    null;

  const name =
    (data.student_name && String(data.student_name).trim()) ||
    (data.full_name && String(data.full_name).trim()) ||
    (data.user_name && String(data.user_name).trim()) ||
    fromUser ||
    null;

  const email =
    (data.student_email && String(data.student_email).trim()) ||
    (data.email && String(data.email).trim()) ||
    (u?.email && String(u.email).trim()) ||
    null;

  const phoneRaw =
    (data.student_phone && String(data.student_phone).trim()) ||
    (data.phone && String(data.phone).trim()) ||
    (u?.phone && String(u.phone).trim()) ||
    "";
  const phone = phoneRaw || null;

  const rawUsername =
    (data.user_name && String(data.user_name).trim()) ||
    (u?.user_name && String(u.user_name).trim()) ||
    "";
  const username =
    rawUsername && rawUsername !== name ? rawUsername : null;

  /** Prefer API payload; use overrides only as fallback (e.g. learner downloading own result). */
  const finalName = name || overrides?.name?.trim() || null;
  const finalEmail = email || overrides?.email?.trim() || null;
  const overridePhone = overrides?.phone?.trim();
  const finalPhone = phone || (overridePhone ? overridePhone : null);
  let finalUsername = username || overrides?.username?.trim() || null;
  if (finalUsername && finalUsername === finalName) finalUsername = null;

  return {
    name: finalName,
    email: finalEmail,
    phone: finalPhone,
    username: finalUsername,
  };
}

function getQuizOptionsForPdf(options: Record<string, string>) {
  const keys =
    Object.keys(options).length > 0
      ? Object.keys(options).sort()
      : ["A", "B", "C", "D"];
  return keys.map((key) => ({
    id: String(key).toUpperCase(),
    label: options[key] || "",
  }));
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
 * Vector PDF (text + rectangles only) — no HTML/canvas rasterization.
 */
export function generateAssessmentResultPdfVector(
  data: AssessmentResult,
  fileName: string,
  studentOverrides?: AssessmentPdfStudentOverrides,
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
  const correct = stats.correct_answers || 0;
  const incorrect = stats.incorrect_answers || 0;
  const unattempted = totalQ - (stats?.attempted_questions || 0);

  const topThree = normalizeTopSkillDisplayNames(stats.top_skills || [], 3);

  const topicBars = Object.entries(stats.topic_wise_stats || {})
    .sort((a, b) => b[1].total - a[1].total)
    .slice(0, 4)
    .map(([name, v]) => ({ name, accuracy: v.accuracy_percent || 0 }));

  const drawFlowingIntro = (x0: number, y0: number, xMax: number): number => {
    const accDisp = formatAccuracyReportPercent(stats?.accuracy_percent ?? 0);
    const prDisp = formatPlacementReportPercent(
      stats?.placement_readiness || 0,
    );
    const segments: { text: string; bold: boolean }[] = [
      { text: 'This report summarizes outcomes for "', bold: false },
      { text: data.assessment_name, bold: true },
      { text: '". Overall accuracy is ', bold: false },
      { text: accDisp, bold: true },
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
      pdf.setFont(PDF_FONT, seg.bold ? "bold" : "normal");
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

  const drawScoreSummaryPanel = (
    leftX: number,
    topY: number,
    width: number,
  ): number => {
    const tier = getPerformanceTier(stats);
    const tone = PERFORMANCE_TONE_PDF[tier.tone];
    const pad = 3.5;
    const panelH = 58;
    pdf.setDrawColor(226, 232, 240);
    pdf.setLineWidth(0.35);
    pdf.setFillColor(248, 250, 252);
    pdf.roundedRect(leftX, topY, width, panelH, 1.5, 1.5, "FD");

    let py = topY + pad + 4;
    pdf.setFont(PDF_FONT, "bold");
    pdf.setFontSize(7.5);
    pdf.setTextColor(SLATE_MUTED.r, SLATE_MUTED.g, SLATE_MUTED.b);
    pdf.text("YOUR SCORE", leftX + pad, py);
    py += 5.5;

    pdf.setFontSize(17);
    pdf.setTextColor(INK.r, INK.g, INK.b);
    pdf.text(
      formatScoreVersusMax(stats.score ?? 0, stats.maximum_marks ?? 0),
      leftX + pad,
      py,
    );
    py += 7.5;

    pdf.setFont(PDF_FONT, "bold");
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
      pdf.setFont(PDF_FONT, "normal");
      pdf.setFontSize(8);
      pdf.setTextColor(SLATE_MUTED.r, SLATE_MUTED.g, SLATE_MUTED.b);
      pdf.text(label, leftX + pad, py);
      pdf.setFont(PDF_FONT, "bold");
      pdf.setTextColor(INK.r, INK.g, INK.b);
      pdf.text(value, leftX + width - pad, py, { align: "right" });
      py += 4.9;
    };

    row("Score attainment", formatScoreAttainmentPercent(stats));
    row("Accuracy", `${(stats?.accuracy_percent ?? 0)?.toFixed(1)}%`);
    row("Percentile", formatPercentileReport(stats?.percentile ?? 0));

    py += 0.5;
    const stLabel = humanizeAssessmentStatus(data.status);
    const stKind = getSubmissionBadgeKind(data.status);
    const stCol = SUBMISSION_BADGE_PDF[stKind];
    pdf.setFont(PDF_FONT, "normal");
    pdf.setFontSize(7.5);
    pdf.setTextColor(SLATE_MUTED.r, SLATE_MUTED.g, SLATE_MUTED.b);
    pdf.text("Status", leftX + pad, py);
    pdf.setFont(PDF_FONT, "bold");
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

  pdf.setFont(PDF_FONT, "bold");
  pdf.setFontSize(8);
  pdf.setTextColor(SKY_DEEP.r, SKY_DEEP.g, SKY_DEEP.b);
  pdf.text("PERFORMANCE REPORT", margin, y);
  y += 5;
  pdf.setFontSize(14);
  setInk();
  pdf.text("Assessment performance", margin, y);
  y += 9;

  pdf.setFontSize(20);
  pdf.setFont(PDF_FONT, "bold");
  const titleLines = pdf.splitTextToSize(data.assessment_name, headerLeftW - 2);
  pdf.text(titleLines, margin, y);
  y += titleLines.length * 7 + 3;

  pdf.setFont(PDF_FONT, "normal");
  pdf.setFontSize(9);
  pdf.setTextColor(SLATE_MUTED.r, SLATE_MUTED.g, SLATE_MUTED.b);
  const idStr = String(data.assessment_id);
  pdf.text(
    idStr.length > 42 ? `${idStr.slice(0, 40)}…` : `ID ${idStr}`,
    margin,
    y,
  );
  y += 7;

  const student = getStudentDetailsForPdf(data, studentOverrides);
  if (student.name || student.email || student.phone || student.username) {
    const nameLineCount = student.name
      ? pdf.splitTextToSize(student.name, headerLeftW - 2).length
      : 0;
    const emailLineCount = student.email
      ? pdf.splitTextToSize(`Email: ${student.email}`, headerLeftW - 2).length
      : 0;
    const phoneLineCount = student.phone
      ? pdf.splitTextToSize(`Phone: ${student.phone}`, headerLeftW - 2).length
      : 0;
    const userLineCount = student.username
      ? pdf.splitTextToSize(
          `Username: ${student.username}`,
          headerLeftW - 2,
        ).length
      : 0;
    ensureSpace(
      6 +
        nameLineCount * 4.4 +
        emailLineCount * 4.2 +
        phoneLineCount * 4.2 +
        userLineCount * 4.2 +
        8,
    );

    pdf.setFont(PDF_FONT, "bold");
    pdf.setFontSize(8);
    pdf.setTextColor(SKY_DEEP.r, SKY_DEEP.g, SKY_DEEP.b);
    pdf.text("STUDENT", margin, y);
    y += 5;

    pdf.setFont(PDF_FONT, "normal");
    pdf.setFontSize(9.5);
    setInk();
    if (student.name) {
      const nameLines = pdf.splitTextToSize(student.name, headerLeftW - 2);
      pdf.text(nameLines, margin, y);
      y += nameLines.length * 4.4 + 1;
    }

    pdf.setFontSize(8.5);
    pdf.setTextColor(SLATE_MUTED.r, SLATE_MUTED.g, SLATE_MUTED.b);
    if (student.email) {
      const emailLines = pdf.splitTextToSize(
        `Email: ${student.email}`,
        headerLeftW - 2,
      );
      pdf.text(emailLines, margin, y);
      y += emailLines.length * 4.2 + 0.5;
    }
    if (student.phone) {
      const phoneLines = pdf.splitTextToSize(
        `Phone: ${student.phone}`,
        headerLeftW - 2,
      );
      pdf.text(phoneLines, margin, y);
      y += phoneLines.length * 4.2 + 0.5;
    }
    if (student.username) {
      const unLines = pdf.splitTextToSize(
        `Username: ${student.username}`,
        headerLeftW - 2,
      );
      pdf.text(unLines, margin, y);
      y += unLines.length * 4.2 + 0.5;
    }
    y += 3;
    setInk();
  } else {
    setInk();
  }

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
  pdf.setFont(PDF_FONT, "bold");
  pdf.setFontSize(9);
  pdf.text("Questions attempted", margin + 4, heroY + 9);
  pdf.setFontSize(32);
  pdf.text(String(stats?.attempted_questions ?? 0), margin + 4, heroY + 26);
  pdf.setFont(PDF_FONT, "normal");
  pdf.setFontSize(7.8);
  pdf.setTextColor(224, 242, 254);
  const subL = pdf.splitTextToSize(
    `Out of ${stats?.total_questions ?? 0} total items · ${data?.status ?? ""}`,
    boxW - 8,
  );
  pdf.text(subL, margin + 4, heroY + heroH - 2.2 - (subL.length - 1) * 3.3);

  pdf.setFont(PDF_FONT, "bold");
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
  pdf.setFont(PDF_FONT, "normal");
  pdf.setFontSize(7.8);
  pdf.setTextColor(203, 213, 225);
  const subR = pdf.splitTextToSize(
    "Strongest skills in this attempt (when provided by the assessment).",
    boxW - 8,
  );
  pdf.text(
    subR,
    margin + boxW + heroGap + 4,
    heroY + heroH - 2.2 - (subR.length - 1) * 3.3,
  );

  y = heroY + heroH + 14;
  setInk();

  // --- Metrics grid ---
  const colGap = 5;
  const colW = (contentW - colGap * 2) / 3;
  const x1 = margin;
  const x2 = margin + colW + colGap;
  const x3 = margin + 2 * (colW + colGap);

  const barH = 3.4;

  const drawColBar = (
    x: number,
    colTop: number,
    label: string,
    value: number,
  ): number => {
    pdf.setFont(PDF_FONT, "bold");
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
  pdf.setFont(PDF_FONT, "bold");
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

  c2 = drawColBar(
    x2,
    c2,
    "Score / max",
    pct(stats.score, stats.maximum_marks || 1),
  );
  c2 = drawColBar(x2, c2, "Accuracy", stats.accuracy_percent);
  c2 = drawColBar(x2, c2, "Placement readiness", stats.placement_readiness);
  c2 = drawColBar(
    x2,
    c2,
    "Percentile",
    Math.min(100, Number.isFinite(stats.percentile) ? stats.percentile : 0),
  );

  if (topicBars.length > 0) {
    for (const t of topicBars) {
      c3 = drawColBar(x3, c3, t.name, t.accuracy);
    }
  } else {
    pdf.setFont(PDF_FONT, "normal");
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
    pdf.setFont(PDF_FONT, "bold");
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
  y = drawWideBar(
    "Time used (vs allotted)",
    Math.min(100, stats.percentage_time_taken),
  );
  pdf.setFont(PDF_FONT, "normal");
  pdf.setFontSize(8.5);
  pdf.setTextColor(SLATE_MUTED.r, SLATE_MUTED.g, SLATE_MUTED.b);
  pdf.text(
    `${stats.time_taken_minutes} / ${stats.total_time_minutes} minutes`,
    margin,
    y,
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
        row.correct != null && row.total != null && (row.total as number) > 0;

      const label = capitalizeFirstPdf(row.label);
      const labelMaxW = hasAcc ? innerW - 32 : innerW - 6;
      pdf.setFont(PDF_FONT, "bold");
      pdf.setFontSize(9);
      setInk();
      const nameLines = pdf.splitTextToSize(label, labelMaxW);
      pdf.text(nameLines, cardX + 3, cardTop + 5);

      if (hasAcc) {
        pdf.setFont(PDF_FONT, "bold");
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
          "F",
        );
        pdf.setTextColor(accTone.fg[0], accTone.fg[1], accTone.fg[2]);
        pdf.text(badgeText, cardX + innerW - 3, cardTop + 5.5, {
          align: "right",
        });
      }

      const barY = cardTop + 11;
      const barW = innerW - 6;
      pdf.setFillColor(255, 237, 213);
      pdf.rect(cardX + 3, barY, barW, 2.8, "F");
      if (hasAcc) {
        const barFill = Math.min(100, acc);
        const fillRgb =
          acc < 25 ? [220, 38, 38] : acc < 50 ? [234, 88, 12] : [245, 158, 11];
        pdf.setFillColor(fillRgb[0], fillRgb[1], fillRgb[2]);
        pdf.rect(cardX + 3, barY, (barW * barFill) / 100, 2.8, "F");
      }

      pdf.setFont(PDF_FONT, "normal");
      pdf.setFontSize(7.5);
      pdf.setTextColor(SLATE_MUTED.r, SLATE_MUTED.g, SLATE_MUTED.b);
      if (hasCounts) {
        pdf.text(
          `${row.correct}/${row.total} correct · practice priority`,
          cardX + 3,
          cardTop + 17.5,
        );
      } else if (!hasAcc) {
        pdf.text(
          "No numeric breakdown in report data.",
          cardX + 3,
          cardTop + 17.5,
        );
      } else {
        pdf.text("Practice priority", cardX + innerW - 3, cardTop + 17.5, {
          align: "right",
        });
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
      pdf.setFont(PDF_FONT, "bold");
      pdf.setFontSize(10.5);
      setInk();
      pdf.text("Skills needing attention", margin + 5, y + 6);
      pdf.setFont(PDF_FONT, "normal");
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
      contentW - 12,
    );
    const headerH = 7 + subLines.length * 3.8 + 5;
    pdf.setFillColor(255, 251, 235);
    pdf.rect(margin, headerTop, contentW, headerH, "F");
    pdf.setFillColor(245, 158, 11);
    pdf.rect(margin, headerTop, 1.5, headerH, "F");
    pdf.setFont(PDF_FONT, "bold");
    pdf.setFontSize(10.5);
    setInk();
    pdf.text("Skills needing attention", margin + 5, headerTop + 6);
    pdf.setFont(PDF_FONT, "normal");
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
    accent: { r: number; g: number; b: number },
  ) => {
    const useMuted = lines.length === 0 && !!mutedFallback;
    pdf.setFont(PDF_FONT, "normal");
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
    pdf.setFont(PDF_FONT, "bold");
    pdf.setFontSize(10);
    setInk();
    pdf.text(title, margin + 5, ty);
    ty += 8;
    pdf.setFont(PDF_FONT, "normal");
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
      SKY,
    );
  }

  // --- User responses (quiz + coding) from API `user_responses` ---
  const quizResponses: QuizResponseItem[] =
    data.user_responses?.quiz_responses ?? [];
  const codingResponses: CodingProblemResponseItem[] =
    data.user_responses?.coding_problem_responses ?? [];

  const CODE_LINE_MM = 3.45;
  const CODE_FONT_PT = 6.5;
  const MAX_CODE_LINES_PER_PROBLEM = 120;

  if (quizResponses.length > 0) {
    ensureSpace(22);
    pdf.setFillColor(248, 250, 252);
    pdf.setDrawColor(226, 232, 240);
    pdf.setLineWidth(0.25);
    pdf.roundedRect(margin, y, contentW, 12, 1, 1, "FD");
    pdf.setFillColor(SKY.r, SKY.g, SKY.b);
    pdf.rect(margin, y, 1.4, 12, "F");
    pdf.setFont(PDF_FONT, "bold");
    pdf.setFontSize(10.5);
    setInk();
    pdf.text(`Quiz responses (${quizResponses.length})`, margin + 5, y + 7.5);
    y += 18;

    for (let qi = 0; qi < quizResponses.length; qi++) {
      const q = quizResponses[qi]!;
      const selectedRaw = q.selected_answer;
      const selectedU =
        selectedRaw != null ? String(selectedRaw).toUpperCase() : "";
      const correctU = String(q.correct_option ?? "").toUpperCase();
      const options = getQuizOptionsForPdf(q.options ?? {});

      const statusLabel = q.is_correct ? "Correct" : "Incorrect";
      const statusRgb = q.is_correct
        ? ([5, 150, 105] as const)
        : ([220, 38, 38] as const);

      const metaParts = [
        `Q${qi + 1} of ${quizResponses.length}`,
        statusLabel,
        q.difficulty_level || null,
        q.topic ? capitalizeFirstPdf(q.topic) : null,
      ].filter(Boolean) as string[];
      const metaLine = metaParts.join(" · ");

      const qText = stripHtmlForPdf(q.question_text || "");
      pdf.setFont(PDF_FONT, "normal");
      pdf.setFontSize(8);
      const qLines = pdf.splitTextToSize(qText, contentW - 10);
      const optLinesEstimate = options.length * 6 + 14;
      const explExtra = q.explanation
        ? pdf.splitTextToSize(stripHtmlForPdf(q.explanation), contentW - 14)
            .length *
            4.3 +
          18
        : 0;
      ensureSpace(14 + qLines.length * 4.2 + optLinesEstimate + explExtra + 10);

      let cy = y + 6;
      pdf.setFont(PDF_FONT, "bold");
      pdf.setFontSize(8.5);
      pdf.setTextColor(statusRgb[0], statusRgb[1], statusRgb[2]);
      pdf.text(metaLine, margin + 5, cy);
      cy += 6;
      setInk();
      pdf.setFont(PDF_FONT, "normal");
      pdf.setFontSize(9);
      pdf.text(qLines, margin + 5, cy);
      cy += qLines.length * 4.2 + 4;

      for (const opt of options) {
        const isCorrectOpt = opt.id === correctU;
        const isSelected = opt.id === selectedU;
        let tag = "";
        if (isCorrectOpt && isSelected) tag = " (correct · your answer)";
        else if (isCorrectOpt) tag = " (correct)";
        else if (isSelected) tag = " (your answer)";
        const line = `${opt.id}. ${stripHtmlForPdf(opt.label)}${tag}`;
        const wrapped = pdf.splitTextToSize(line, contentW - 12);
        pdf.setFontSize(8);
        if (isCorrectOpt) {
          pdf.setTextColor(5, 120, 85);
        } else if (isSelected) {
          pdf.setTextColor(185, 28, 28);
        } else {
          setInk();
        }
        pdf.text(wrapped, margin + 7, cy);
        cy += wrapped.length * 4 + 1.2;
      }

      if (!selectedU) {
        pdf.setFont(PDF_FONT, "italic");
        pdf.setFontSize(7.5);
        pdf.setTextColor(SLATE_MUTED.r, SLATE_MUTED.g, SLATE_MUTED.b);
        pdf.text("Unattempted", margin + 7, cy);
        cy += 5;
        setInk();
        pdf.setFont(PDF_FONT, "normal");
      }

      if (q.explanation) {
        cy += 2;
        pdf.setFillColor(239, 246, 255);
        pdf.setDrawColor(SKY.r, SKY.g, SKY.b);
        const expl = stripHtmlForPdf(q.explanation);
        const explWrapped = pdf.splitTextToSize(expl, contentW - 14);
        const explH = 8 + explWrapped.length * 4.1;
        ensureSpace(explH + 4);
        pdf.roundedRect(margin + 4, cy - 2, contentW - 8, explH, 1, 1, "FD");
        pdf.setFont(PDF_FONT, "bold");
        pdf.setFontSize(7.5);
        pdf.setTextColor(SKY_DEEP.r, SKY_DEEP.g, SKY_DEEP.b);
        pdf.text("Explanation", margin + 7, cy + 4);
        pdf.setFont(PDF_FONT, "normal");
        pdf.setFontSize(8);
        pdf.setTextColor(51, 65, 85);
        pdf.text(explWrapped, margin + 7, cy + 9);
        cy += explH + 4;
      }

      y = cy + 6;
      setInk();
    }
    y += 4;
  }

  if (codingResponses.length > 0) {
    ensureSpace(22);
    pdf.setFillColor(248, 250, 252);
    pdf.setDrawColor(226, 232, 240);
    pdf.setLineWidth(0.25);
    pdf.roundedRect(margin, y, contentW, 12, 1, 1, "FD");
    pdf.setFillColor(SKY_DEEP.r, SKY_DEEP.g, SKY_DEEP.b);
    pdf.rect(margin, y, 1.4, 12, "F");
    pdf.setFont(PDF_FONT, "bold");
    pdf.setFontSize(10.5);
    setInk();
    pdf.text(
      `Coding problem responses (${codingResponses.length})`,
      margin + 5,
      y + 7.5,
    );
    y += 18;

    for (let ci = 0; ci < codingResponses.length; ci++) {
      const c = codingResponses[ci]!;
      const codingMeta = c as {
        problem_statement?: string;
        input_format?: string;
        output_format?: string;
        constraints?: string;
        sample_input?: string;
        sample_output?: string;
      };
      const title = stripHtmlForPdf(c.title || `Problem ${c.problem_id}`);
      const passed = c.passed_test_cases ?? 0;
      const totalTc = c.total_test_cases ?? 0;
      const summary = `${passed}/${totalTc} tests passed${
        c.all_test_cases_passed ? " · all passed" : ""
      }`;
      const detailRows = [
        {
          label: "Problem",
          value: stripHtmlForPdf(codingMeta.problem_statement ?? ""),
        },
        { label: "Input", value: stripHtmlForPdf(codingMeta.input_format ?? "") },
        {
          label: "Output",
          value: stripHtmlForPdf(codingMeta.output_format ?? ""),
        },
        {
          label: "Constraints",
          value: stripHtmlForPdf(codingMeta.constraints ?? ""),
        },
        {
          label: "Sample input",
          value: stripHtmlForPdf(codingMeta.sample_input ?? ""),
        },
        {
          label: "Sample output",
          value: stripHtmlForPdf(codingMeta.sample_output ?? ""),
        },
      ].filter((row) => row.value);

      
      const code = extractCodeTextForPdf(c.submitted_code ?? "");
      const codeLines = code ? code.split("\n") : [];
      let codeLineCount = 0;
      pdf.setFont("courier", "normal");
      pdf.setFontSize(CODE_FONT_PT);
      for (const raw of codeLines) {
        const wrapped = pdf.splitTextToSize(raw || " ", contentW - 14);
        codeLineCount += wrapped.length;
      }
      pdf.setFont(PDF_FONT, "normal");
      const titleLines = pdf.splitTextToSize(title, contentW - 10).length;
      const detailLineCount = detailRows.reduce((sum, row) => {
        const wrapped = pdf.splitTextToSize(`${row.label}: ${row.value}`, contentW - 12);
        return sum + wrapped.length;
      }, 0);
      ensureSpace(
        20 +
          titleLines * 4.5 +
          detailLineCount * 4.2 +
          (detailRows.length > 0 ? 6 : 0) +
          12 +
          Math.min(codeLineCount, MAX_CODE_LINES_PER_PROBLEM) * CODE_LINE_MM +
          20,
      );

      let cy = y + 6;
      pdf.setFont(PDF_FONT, "bold");
      pdf.setFontSize(9.5);
      setInk();
      const titleWrapped = pdf.splitTextToSize(title, contentW - 10);
      pdf.text(titleWrapped, margin + 5, cy);
      cy += titleWrapped.length * 4.8 + 2;

      pdf.setFont(PDF_FONT, "normal");
      pdf.setFontSize(8);
      pdf.setTextColor(SLATE_MUTED.r, SLATE_MUTED.g, SLATE_MUTED.b);
      pdf.text(
        `Problem ${ci + 1} of ${codingResponses.length}`,
        margin + 5,
        cy,
      );
      cy += 4.5;
      pdf.setFont(PDF_FONT, "bold");
      pdf.setTextColor(
        c.all_test_cases_passed ? 5 : 180,
        c.all_test_cases_passed ? 120 : 83,
        c.all_test_cases_passed ? 85 : 9,
      );
      pdf.text(summary, margin + 5, cy);
      cy += 6;
      if (c.difficulty_level) {
        pdf.setFont(PDF_FONT, "normal");
        pdf.setFontSize(7.5);
        pdf.setTextColor(SLATE_MUTED.r, SLATE_MUTED.g, SLATE_MUTED.b);
        pdf.text(`Difficulty: ${c.difficulty_level}`, margin + 5, cy);
        cy += 5;
      }
      if (detailRows.length > 0) {
        pdf.setFont(PDF_FONT, "normal");
        pdf.setFontSize(8);
        setInk();
        for (const row of detailRows) {
          const wrapped = pdf.splitTextToSize(
            `${row.label}: ${row.value}`,
            contentW - 12,
          );
          ensureSpace(wrapped.length * 4.2 + 1.5);
          pdf.text(wrapped, margin + 5, cy);
          cy += wrapped.length * 4.2 + 1.5;
        }
        cy += 2;
      }

      setInk();
      pdf.setFillColor(248, 250, 252);
      pdf.setDrawColor(203, 213, 225);
      const codeBoxTop = cy;
      pdf.setFont("courier", "normal");
      pdf.setFontSize(CODE_FONT_PT);
      pdf.setTextColor(INK.r, INK.g, INK.b);

      if (!code.trim()) {
        ensureSpace(CODE_LINE_MM + 4);
        pdf.setFont(PDF_FONT, "italic");
        pdf.setFontSize(8);
        pdf.setTextColor(SLATE_MUTED.r, SLATE_MUTED.g, SLATE_MUTED.b);
        pdf.text("No code submitted", margin + 6, codeBoxTop + 5);
        cy = codeBoxTop + CODE_LINE_MM + 8;
        pdf.setFont(PDF_FONT, "normal");
      } else {
        cy += 2;
        let lineNum = 0;
        outer: for (const rawLine of codeLines) {
          const wrapped = pdf.splitTextToSize(rawLine || " ", contentW - 14);
          for (const wline of wrapped) {
            if (lineNum >= MAX_CODE_LINES_PER_PROBLEM) {
              ensureSpace(CODE_LINE_MM);
              pdf.setFont(PDF_FONT, "italic");
              pdf.setFontSize(7.5);
              pdf.setTextColor(SLATE_MUTED.r, SLATE_MUTED.g, SLATE_MUTED.b);
              pdf.text("… (code truncated for PDF)", margin + 6, cy);
              cy += CODE_LINE_MM;
              break outer;
            }
            ensureSpace(CODE_LINE_MM);
            pdf.setFont("courier", "normal");
            pdf.setFontSize(CODE_FONT_PT);
            setInk();
            pdf.text(wline, margin + 6, cy);
            cy += CODE_LINE_MM;
            lineNum++;
          }
        }
        pdf.setFont(PDF_FONT, "normal");
      }

      y = cy + 10;
      setInk();
    }
    y += 4;
  }

  if (hasProctoringForPdf(data.proctoring)) {
    y = drawProctoringSummaryPdf(
      pdf,
      margin,
      contentW,
      y,
      ensureSpace,
      data.proctoring,
      setInk,
    );
  }

  const year = new Date().getFullYear();
  drawFootersOnAllPages(pdf, pageW, pageH, margin, year);

  pdf.save(fileName);
}
