import jsPDF from "jspdf";

/** Plain rows built the same way as CSV export (values may include HTML strings). */
export type AssessmentQuestionExportRow = Record<string, unknown>;

export interface AssessmentQuestionsPdfMeta {
  assessmentTitle: string;
  baseSlug: string;
}

const INDIGO: [number, number, number] = [79, 70, 229];
const INDIGO_DARK: [number, number, number] = [55, 48, 163];
const TEAL: [number, number, number] = [13, 148, 136];
const TEAL_DARK: [number, number, number] = [15, 118, 110];
const VIOLET: [number, number, number] = [124, 58, 237];
const VIOLET_DARK: [number, number, number] = [91, 33, 182];
const LAVENDER_MIST: [number, number, number] = [237, 233, 254];
const SLATE900: [number, number, number] = [15, 23, 42];
const SLATE600: [number, number, number] = [71, 85, 105];
const SLATE400: [number, number, number] = [148, 163, 184];
const SLATE200: [number, number, number] = [226, 232, 240];
const SLATE100: [number, number, number] = [241, 245, 249];
const SLATE50: [number, number, number] = [248, 250, 252];
const WHITE: [number, number, number] = [255, 255, 255];
const VIOLET_MIST: [number, number, number] = [224, 231, 255];
const EMERALD700: [number, number, number] = [4, 120, 87];
const EMERALD50: [number, number, number] = [236, 253, 245];
const MINT_STROKE: [number, number, number] = [167, 243, 208];

/** Default line-height factor (leading) for body text — higher = airier PDF. */
const LINE_HEIGHT_FACTOR = 1.48;
/** Extra mm after each wrapped text line so paragraphs do not feel cramped. */
const BETWEEN_WRAPPED_LINES_MM = 0.55;
/** Space after a label block, option row, or similar section (mm). */
const BLOCK_TAIL_MM = 3.6;
const STEM_TAIL_MM = 3;

function setFillRgb(pdf: InstanceType<typeof jsPDF>, [r, g, b]: [number, number, number]) {
  pdf.setFillColor(r, g, b);
}

function setDrawRgb(pdf: InstanceType<typeof jsPDF>, [r, g, b]: [number, number, number]) {
  pdf.setDrawColor(r, g, b);
}

function setTextRgb(pdf: InstanceType<typeof jsPDF>, [r, g, b]: [number, number, number]) {
  pdf.setTextColor(r, g, b);
}

function cellStr(v: unknown): string {
  if (v == null) return "";
  return String(typeof v === "object" ? JSON.stringify(v) : v);
}

function htmlToPlainText(html: string): string {
  if (!html || typeof html !== "string") return "";
  let s = html;
  s = s.replace(/<\/p>\s*<p>/gi, "\n");
  s = s.replace(/<br\s*\/?>/gi, "\n");
  s = s.replace(/<sup>(\d+)<\/sup>/gi, "^$1");
  s = s.replace(/<sub>(\d+)<\/sub>/gi, "_$1");
  s = s.replace(/&le;/g, "≤").replace(/&ge;/g, "≥");
  s = s.replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&").replace(/&nbsp;/g, " ");
  s = s.replace(/<[^>]*>/g, " ");
  s = s.replace(/[ \t]+/g, " ");
  s = s.replace(/^\s+|\s+$/gm, "");
  s = s.replace(/\n\s*\n/g, "\n").trim();
  return s;
}

const PDF_UNICODE_SPACE_SEPARATORS =
  /[\u00A0\u1680\u180E\u2000-\u200A\u202F\u205F\u3000]/g;
const PDF_ZW_AND_FORMAT_MARKS =
  /[\u00AD\u034F\u061C\u115F\u1160\u17B4\u17B5\u200B-\u200F\u202A-\u202E\u2060-\u2064\u2066-\u2069\uFEFF]/g;
const PDF_CONTROLS_EXCEPT_NEWLINE =
  /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F]/g;

function sanitizeForJsPdfText(s: string): string {
  if (!s) return "";
  let t = s
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .replace(/\u2028/g, "\n")
    .replace(/\u2029/g, "\n\n");
  t = t.replace(PDF_ZW_AND_FORMAT_MARKS, "");
  t = t
    .split("\n")
    .map((line) =>
      line
        .replace(PDF_UNICODE_SPACE_SEPARATORS, " ")
        .replace(PDF_CONTROLS_EXCEPT_NEWLINE, "")
        .replace(/\t/g, " ")
        .replace(/ +/g, " ")
        .trim(),
    )
    .join("\n");
  return t.replace(/\n{3,}/g, "\n\n").trim();
}

function lineHeightMm(fontPt: number, factor = LINE_HEIGHT_FACTOR): number {
  return ((fontPt * 25.4) / 72) * factor;
}

/** One baseline step for wrapped paragraphs (line height + small gap). */
function wrappedLineStepMm(fontPt: number): number {
  return lineHeightMm(fontPt) + BETWEEN_WRAPPED_LINES_MM;
}

function pdfSplit(pdf: InstanceType<typeof jsPDF>, text: string, maxW: number): string[] {
  return pdf.splitTextToSize(text, maxW) as string[];
}

type PdfContext = {
  pdf: InstanceType<typeof jsPDF>;
  margin: number;
  maxW: number;
  pageW: number;
  pageH: number;
  y: number;
  footerReserve: number;
  continuationTitle: string;
  accent: [number, number, number];
};

function drawContinuationHeader(ctx: PdfContext): void {
  const { pdf, margin, pageW, maxW } = ctx;
  const barH = 10;
  setFillRgb(pdf, SLATE100);
  pdf.rect(0, 0, pageW, margin + barH, "F");
  setDrawRgb(pdf, SLATE200);
  pdf.setLineWidth(0.25);
  pdf.line(0, margin + barH, pageW, margin + barH);
  setFillRgb(pdf, ctx.accent);
  pdf.rect(0, 0, 2.2, margin + barH, "F");

  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(8.5);
  setTextRgb(pdf, SLATE600);
  const lines = pdfSplit(pdf, ctx.continuationTitle, maxW - 5);
  const lh = wrappedLineStepMm(8.5);
  let yy = margin + 2;
  for (const line of lines.slice(0, 2)) {
    pdf.text(line, margin + 3.5, yy);
    yy += lh;
  }
  ctx.y = margin + barH + 8;
}

function ensureSpace(ctx: PdfContext, needMm: number): void {
  if (ctx.y + needMm > ctx.pageH - ctx.footerReserve) {
    ctx.pdf.addPage();
    drawContinuationHeader(ctx);
  }
}

function writeLines(
  ctx: PdfContext,
  lines: string[],
  x: number,
  fontPt: number,
  style: "normal" | "bold" | "italic",
  textRgb: [number, number, number] = SLATE900,
): void {
  const step = wrappedLineStepMm(fontPt);
  ctx.pdf.setFont("helvetica", style);
  ctx.pdf.setFontSize(fontPt);
  setTextRgb(ctx.pdf, textRgb);
  for (const line of lines) {
    ensureSpace(ctx, step);
    ctx.pdf.text(line, x, ctx.y);
    ctx.y += step;
  }
}

function writeWrapped(
  ctx: PdfContext,
  text: string,
  x: number,
  fontPt: number,
  style: "normal" | "bold" | "italic",
  textRgb: [number, number, number] = SLATE900,
  trailingGapMm = 1.2,
): void {
  const plain = sanitizeForJsPdfText(htmlToPlainText(text));
  const body = plain.length ? plain : " ";
  ctx.pdf.setFont("helvetica", style);
  ctx.pdf.setFontSize(fontPt);
  setTextRgb(ctx.pdf, textRgb);
  const lines = pdfSplit(ctx.pdf, body, ctx.maxW);
  writeLines(ctx, lines, x, fontPt, style, textRgb);
  ctx.y += trailingGapMm;
}

function writeLabelBlock(ctx: PdfContext, label: string, value: string, valueFontPt = 9): void {
  const indent = 3.5;
  const innerW = ctx.maxW - indent;
  const plain = sanitizeForJsPdfText(htmlToPlainText(value));
  const body = plain.length ? plain : " ";

  ctx.pdf.setFont("helvetica", "bold");
  ctx.pdf.setFontSize(7);
  const labelStep = wrappedLineStepMm(7);
  ensureSpace(ctx, labelStep);
  setTextRgb(ctx.pdf, SLATE400);
  ctx.pdf.text(label.toUpperCase(), ctx.margin + indent, ctx.y);
  ctx.y += labelStep * 1.05;

  ctx.pdf.setFont("helvetica", "normal");
  ctx.pdf.setFontSize(valueFontPt);
  setTextRgb(ctx.pdf, SLATE900);
  const lines = pdfSplit(ctx.pdf, body, innerW);
  const step = wrappedLineStepMm(valueFontPt);
  for (const line of lines) {
    ensureSpace(ctx, step);
    ctx.pdf.text(line, ctx.margin + indent, ctx.y);
    ctx.y += step;
  }
  ctx.y += BLOCK_TAIL_MM;
}

function writeOptionRow(
  ctx: PdfContext,
  letter: string,
  text: string,
  accent: [number, number, number],
): void {
  const badgeR = 2.45;
  const fontPt = 9;
  const step = wrappedLineStepMm(fontPt);
  const plain = sanitizeForJsPdfText(htmlToPlainText(text));
  const lines = pdfSplit(ctx.pdf, plain.length ? plain : " ", ctx.maxW - 15);
  ensureSpace(ctx, Math.max(8, lines.length * step + 4));

  const cx = ctx.margin + 3.8 + badgeR;
  const cy = ctx.y + badgeR * 0.55;
  setFillRgb(ctx.pdf, accent);
  ctx.pdf.circle(cx, cy, badgeR, "F");
  ctx.pdf.setFont("helvetica", "bold");
  ctx.pdf.setFontSize(7.2);
  setTextRgb(ctx.pdf, WHITE);
  const lw = ctx.pdf.getTextWidth(letter);
  ctx.pdf.text(letter, cx - lw / 2, cy + 0.9);

  ctx.pdf.setFont("helvetica", "normal");
  ctx.pdf.setFontSize(fontPt);
  setTextRgb(ctx.pdf, SLATE900);
  let yy = ctx.y;
  const textX = ctx.margin + 12;
  for (const line of lines) {
    ensureSpace(ctx, step);
    ctx.pdf.text(line, textX, yy);
    yy += step;
  }
  ctx.y = yy + 2.8;
}

function writeCorrectHighlight(ctx: PdfContext, correct: string): void {
  const fontPt = 9.5;
  const plain = sanitizeForJsPdfText(htmlToPlainText(correct));
  const lines = pdfSplit(ctx.pdf, plain.length ? plain : "—", ctx.maxW - 10);
  const answerStep = wrappedLineStepMm(fontPt);
  const pad = 4.2;
  const labelBand = 6.5;
  const h = labelBand + lines.length * answerStep + pad * 2;
  const w = ctx.maxW;
  ensureSpace(ctx, h + 6);

  const x0 = ctx.margin;
  const y0 = ctx.y - 0.3;
  setFillRgb(ctx.pdf, EMERALD50);
  setDrawRgb(ctx.pdf, MINT_STROKE);
  ctx.pdf.setLineWidth(0.28);
  ctx.pdf.roundedRect(x0, y0, w, h, 1.6, 1.6, "FD");
  setFillRgb(ctx.pdf, EMERALD700);
  ctx.pdf.rect(x0, y0, 1.6, h, "F");

  ctx.pdf.setFont("helvetica", "bold");
  ctx.pdf.setFontSize(6.6);
  setTextRgb(ctx.pdf, EMERALD700);
  ctx.pdf.text("CORRECT ANSWER", x0 + 4.2, y0 + 4.2);

  ctx.pdf.setFont("helvetica", "bold");
  ctx.pdf.setFontSize(fontPt);
  setTextRgb(ctx.pdf, SLATE900);
  let yy = y0 + labelBand + pad;
  const textX = x0 + 4.2;
  for (const line of lines) {
    ctx.pdf.text(line, textX, yy);
    yy += answerStep;
  }
  ctx.y = y0 + h + 5;
}

/**
 * Monospace block with background. Uses Courier for both measuring and drawing so
 * splitTextToSize width matches rendered glyphs (Helvetica would underestimate width).
 * Long rubrics are split across pages with a new bordered chunk per page.
 */
function writeMonoBlock(ctx: PdfContext, label: string, value: string): void {
  const plain = sanitizeForJsPdfText(htmlToPlainText(value));
  if (!plain.trim()) return;
  const fontPt = 8;
  const textInsetX = 4.5;
  /** Text must stay inside roundedRect — keep inset symmetric vs ctx.maxW */
  const innerW = Math.max(24, ctx.maxW - textInsetX * 2 - 1);
  const step = wrappedLineStepMm(fontPt);
  const padY = 4;

  ctx.pdf.setFont("courier", "normal");
  ctx.pdf.setFontSize(fontPt);
  const lines = pdfSplit(ctx.pdf, plain, innerW) as string[];

  let lineIdx = 0;
  let firstChunk = true;
  while (lineIdx < lines.length) {
    const headerLabel = firstChunk ? label.toUpperCase() : `${label.toUpperCase()} (continued)`;
    const headerH = firstChunk ? 7.5 : 6.2;
    const topPad = firstChunk ? 5.2 : 4;

    const bodyTop = ctx.y + headerH + topPad;
    const maxY = ctx.pageH - ctx.footerReserve - padY;
    const maxBodyLines = Math.max(1, Math.floor((maxY - bodyTop) / step));
    const chunk = lines.slice(lineIdx, lineIdx + maxBodyLines);

    if (chunk.length === 0) {
      ctx.pdf.addPage();
      drawContinuationHeader(ctx);
      continue;
    }

    const bodyH = chunk.length * step + padY * 2;
    const boxH = headerH + topPad + bodyH + 1.5;
    ensureSpace(ctx, boxH + 3);

    const x0 = ctx.margin;
    const y0 = ctx.y;
    setFillRgb(ctx.pdf, SLATE100);
    setDrawRgb(ctx.pdf, SLATE200);
    ctx.pdf.setLineWidth(0.25);
    ctx.pdf.roundedRect(x0, y0, ctx.maxW, boxH, 1.4, 1.4, "FD");

    ctx.pdf.setFont("helvetica", "bold");
    ctx.pdf.setFontSize(7);
    setTextRgb(ctx.pdf, SLATE400);
    ctx.pdf.text(headerLabel, x0 + textInsetX, y0 + 4.2);

    ctx.pdf.setFont("courier", "normal");
    ctx.pdf.setFontSize(fontPt);
    setTextRgb(ctx.pdf, SLATE900);
    let yy = y0 + headerH + topPad;
    const tx = x0 + textInsetX;
    for (const line of chunk) {
      ctx.pdf.text(line, tx, yy);
      yy += step;
    }

    ctx.y = y0 + boxH + 3.5;
    lineIdx += chunk.length;
    firstChunk = false;
  }
}

function drawCoverBand(
  pdf: InstanceType<typeof jsPDF>,
  pageW: number,
  margin: number,
  meta: AssessmentQuestionsPdfMeta,
  kindTitle: string,
  kindSubtitle: string,
  accent: [number, number, number],
  accentDark: [number, number, number],
  questionCount: number,
  kindTitleRgb: [number, number, number] = VIOLET_MIST,
): number {
  const coverH = 38;
  setFillRgb(pdf, accentDark);
  pdf.rect(0, 0, pageW, coverH * 0.42, "F");
  setFillRgb(pdf, accent);
  pdf.rect(0, coverH * 0.38, pageW, coverH * 0.62, "F");

  const titleRaw =
    meta.assessmentTitle.length > 80
      ? `${meta.assessmentTitle.slice(0, 78)}…`
      : meta.assessmentTitle;
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(17);
  setTextRgb(pdf, WHITE);
  const titleLines = pdfSplit(pdf, titleRaw, pageW - 2 * margin);
  let ty = 12;
  for (const tl of titleLines.slice(0, 2)) {
    pdf.text(tl, margin, ty);
    ty += 9;
  }

  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(10);
  setTextRgb(pdf, kindTitleRgb);
  pdf.text(kindTitle, margin, ty + 1.5);

  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(8.3);
  setTextRgb(pdf, [226, 232, 240]);
  const metaLine = `${kindSubtitle}  ·  ${questionCount} item${questionCount !== 1 ? "s" : ""}  ·  ${new Date().toLocaleString()}`;
  const metaLines = pdfSplit(pdf, metaLine, pageW - 2 * margin);
  let my = ty + 7;
  for (const ml of metaLines.slice(0, 2)) {
    pdf.text(ml, margin, my);
    my += 5;
  }

  pdf.setFontSize(7.5);
  setTextRgb(pdf, [199, 210, 254]);
  const slugLine = `Slug: ${meta.baseSlug}`;
  pdf.text(slugLine.length > 90 ? `${slugLine.slice(0, 88)}…` : slugLine, margin, my + 1);

  setDrawRgb(pdf, WHITE);
  pdf.setLineWidth(0.2);
  pdf.line(margin, coverH - 2.2, pageW - margin, coverH - 2.2);

  return coverH + margin + 9;
}

function applyFootersToAllPages(
  pdf: InstanceType<typeof jsPDF>,
  margin: number,
  pageW: number,
  pageH: number,
  slug: string,
): void {
  const n = pdf.getNumberOfPages();
  for (let i = 1; i <= n; i++) {
    pdf.setPage(i);
    setDrawRgb(pdf, SLATE200);
    pdf.setLineWidth(0.22);
    pdf.line(margin, pageH - 10, pageW - margin, pageH - 10);
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(7);
    setTextRgb(pdf, SLATE400);
    const slugLine = slug.length > 62 ? `${slug.slice(0, 60)}…` : slug;
    pdf.text(`AI-Linc · question export · ${slugLine}`, margin, pageH - 5.8);
    pdf.text(`Page ${i} of ${n}`, pageW - margin, pageH - 5.8, { align: "right" });
  }
}

function drawQuestionDivider(ctx: PdfContext): void {
  ensureSpace(ctx, 10);
  setDrawRgb(ctx.pdf, SLATE200);
  ctx.pdf.setLineWidth(0.35);
  ctx.pdf.line(ctx.margin, ctx.y, ctx.margin + ctx.maxW, ctx.y);
  ctx.y += 9;
}

function drawQuestionHeaderBar(
  ctx: PdfContext,
  n: number,
  id: string,
  section: string,
  order: string,
): void {
  const barH = 8.5;
  ensureSpace(ctx, barH + 6);
  const x0 = ctx.margin;
  const y0 = ctx.y;
  setFillRgb(ctx.pdf, SLATE50);
  setDrawRgb(ctx.pdf, SLATE200);
  ctx.pdf.setLineWidth(0.28);
  ctx.pdf.roundedRect(x0, y0, ctx.maxW, barH, 1.3, 1.3, "FD");
  setFillRgb(ctx.pdf, ctx.accent);
  ctx.pdf.rect(x0, y0, 2, barH, "F");

  ctx.pdf.setFont("helvetica", "bold");
  ctx.pdf.setFontSize(9.2);
  setTextRgb(ctx.pdf, SLATE900);
  ctx.pdf.text(`Question ${n}`, x0 + 4.5, y0 + 5.6);
  ctx.pdf.setFont("helvetica", "normal");
  ctx.pdf.setFontSize(7.4);
  setTextRgb(ctx.pdf, SLATE600);
  const meta = `ID ${id}  ·  ${section}  ·  order ${order}`;
  const metaShort = meta.length > 95 ? `${meta.slice(0, 93)}…` : meta;
  ctx.pdf.text(metaShort, x0 + 34, y0 + 5.6);
  ctx.y = y0 + barH + 7;
}

function drawCodingHeaderBar(
  ctx: PdfContext,
  n: number,
  id: string,
  section: string,
  order: string,
): void {
  const barH = 8.5;
  ensureSpace(ctx, barH + 6);
  const x0 = ctx.margin;
  const y0 = ctx.y;
  setFillRgb(ctx.pdf, SLATE50);
  setDrawRgb(ctx.pdf, SLATE200);
  ctx.pdf.setLineWidth(0.28);
  ctx.pdf.roundedRect(x0, y0, ctx.maxW, barH, 1.3, 1.3, "FD");
  setFillRgb(ctx.pdf, ctx.accent);
  ctx.pdf.rect(x0, y0, 2, barH, "F");

  ctx.pdf.setFont("helvetica", "bold");
  ctx.pdf.setFontSize(9.2);
  setTextRgb(ctx.pdf, SLATE900);
  ctx.pdf.text(`Problem ${n}`, x0 + 4.5, y0 + 5.6);
  ctx.pdf.setFont("helvetica", "normal");
  ctx.pdf.setFontSize(7.4);
  setTextRgb(ctx.pdf, SLATE600);
  const meta = `ID ${id}  ·  ${section}  ·  order ${order}`;
  const metaShort = meta.length > 95 ? `${meta.slice(0, 93)}…` : meta;
  ctx.pdf.text(metaShort, x0 + 36, y0 + 5.6);
  ctx.y = y0 + barH + 7;
}

function drawSubjectiveHeaderBar(
  ctx: PdfContext,
  n: number,
  id: string,
  section: string,
  order: string,
): void {
  const barH = 8.5;
  ensureSpace(ctx, barH + 6);
  const x0 = ctx.margin;
  const y0 = ctx.y;
  setFillRgb(ctx.pdf, SLATE50);
  setDrawRgb(ctx.pdf, SLATE200);
  ctx.pdf.setLineWidth(0.28);
  ctx.pdf.roundedRect(x0, y0, ctx.maxW, barH, 1.3, 1.3, "FD");
  setFillRgb(ctx.pdf, ctx.accent);
  ctx.pdf.rect(x0, y0, 2, barH, "F");

  ctx.pdf.setFont("helvetica", "bold");
  ctx.pdf.setFontSize(9.2);
  setTextRgb(ctx.pdf, SLATE900);
  ctx.pdf.text(`Subjective ${n}`, x0 + 4.5, y0 + 5.6);
  ctx.pdf.setFont("helvetica", "normal");
  ctx.pdf.setFontSize(7.4);
  setTextRgb(ctx.pdf, SLATE600);
  const meta = `ID ${id}  ·  ${section}  ·  order ${order}`;
  const metaShort = meta.length > 95 ? `${meta.slice(0, 93)}…` : meta;
  ctx.pdf.text(metaShort, x0 + 40, y0 + 5.6);
  ctx.y = y0 + barH + 7;
}

/** Build subjective questions PDF (one file). Caller should only call when `rows.length > 0`. */
export function saveAssessmentSubjectiveQuestionsPdf(
  meta: AssessmentQuestionsPdfMeta,
  rows: AssessmentQuestionExportRow[],
): void {
  const pdf = new jsPDF({ orientation: "p", unit: "mm", format: "a4" });
  const pageW = pdf.internal.pageSize.getWidth();
  const pageH = pdf.internal.pageSize.getHeight();
  const margin = 16;
  const footerReserve = 12;
  const maxW = pageW - 2 * margin;
  const accent = VIOLET;
  const continuationTitle = `Subjective bank (continued) — ${meta.assessmentTitle.length > 52 ? `${meta.assessmentTitle.slice(0, 50)}…` : meta.assessmentTitle}`;

  const y0 = drawCoverBand(
    pdf,
    pageW,
    margin,
    meta,
    "Subjective · question bank",
    "Admin export (includes evaluation rubric)",
    VIOLET,
    VIOLET_DARK,
    rows.length,
    LAVENDER_MIST,
  );

  const ctx: PdfContext = {
    pdf,
    margin,
    maxW,
    pageW,
    pageH,
    y: y0,
    footerReserve,
    continuationTitle,
    accent,
  };

  let n = 0;
  for (const row of rows) {
    n += 1;
    drawSubjectiveHeaderBar(
      ctx,
      n,
      cellStr(row.id),
      cellStr(row.section_title),
      cellStr(row.section_order),
    );
    writeLabelBlock(ctx, "Question", cellStr(row.question_text), 10);
    writeMonoBlock(ctx, "Evaluation rubric (AI)", cellStr(row.evaluation_prompt));
    writeLabelBlock(ctx, "Max marks", cellStr(row.max_marks));
    if (cellStr(row.question_type)) {
      writeLabelBlock(ctx, "Question type", cellStr(row.question_type));
    }
    drawQuestionDivider(ctx);
  }

  applyFootersToAllPages(pdf, margin, pageW, pageH, meta.baseSlug);
  pdf.save(`assessment-${meta.baseSlug}-subjective-questions.pdf`);
}

/** Build MCQ questions PDF (one file). Caller should only call when `rows.length > 0`. */
export function saveAssessmentMcqQuestionsPdf(
  meta: AssessmentQuestionsPdfMeta,
  rows: AssessmentQuestionExportRow[],
): void {
  const pdf = new jsPDF({ orientation: "p", unit: "mm", format: "a4" });
  const pageW = pdf.internal.pageSize.getWidth();
  const pageH = pdf.internal.pageSize.getHeight();
  const margin = 16;
  const footerReserve = 12;
  const maxW = pageW - 2 * margin;
  const accent = INDIGO;
  const continuationTitle = `MCQ bank (continued) — ${meta.assessmentTitle.length > 52 ? `${meta.assessmentTitle.slice(0, 50)}…` : meta.assessmentTitle}`;

  const y0 = drawCoverBand(
    pdf,
    pageW,
    margin,
    meta,
    "Multiple choice · question bank",
    "Admin export",
    INDIGO,
    INDIGO_DARK,
    rows.length,
    VIOLET_MIST,
  );

  const ctx: PdfContext = {
    pdf,
    margin,
    maxW,
    pageW,
    pageH,
    y: y0,
    footerReserve,
    continuationTitle,
    accent,
  };

  let n = 0;
  for (const row of rows) {
    n += 1;
    drawQuestionHeaderBar(
      ctx,
      n,
      cellStr(row.id),
      cellStr(row.section_title),
      cellStr(row.section_order),
    );
    writeWrapped(ctx, cellStr(row.question_text), margin, 10.5, "bold", SLATE900, STEM_TAIL_MM);
    writeOptionRow(ctx, "A", cellStr(row.option_a), INDIGO);
    writeOptionRow(ctx, "B", cellStr(row.option_b), INDIGO);
    writeOptionRow(ctx, "C", cellStr(row.option_c), INDIGO);
    writeOptionRow(ctx, "D", cellStr(row.option_d), INDIGO);
    writeCorrectHighlight(ctx, cellStr(row.correct_option));
    if (cellStr(row.difficulty_level)) {
      writeLabelBlock(ctx, "Difficulty", cellStr(row.difficulty_level));
    }
    if (cellStr(row.topic)) {
      writeLabelBlock(ctx, "Topic", cellStr(row.topic));
    }
    if (cellStr(row.skills)) {
      writeLabelBlock(ctx, "Skills", cellStr(row.skills));
    }
    if (cellStr(row.explanation)) {
      writeLabelBlock(ctx, "Explanation", cellStr(row.explanation));
    }
    drawQuestionDivider(ctx);
  }

  applyFootersToAllPages(pdf, margin, pageW, pageH, meta.baseSlug);
  pdf.save(`assessment-${meta.baseSlug}-mcq-questions.pdf`);
}

/** Build coding questions PDF (one file). Caller should only call when `rows.length > 0`. */
export function saveAssessmentCodingQuestionsPdf(
  meta: AssessmentQuestionsPdfMeta,
  rows: AssessmentQuestionExportRow[],
): void {
  const pdf = new jsPDF({ orientation: "p", unit: "mm", format: "a4" });
  const pageW = pdf.internal.pageSize.getWidth();
  const pageH = pdf.internal.pageSize.getHeight();
  const margin = 16;
  const footerReserve = 12;
  const maxW = pageW - 2 * margin;
  const accent = TEAL;
  const continuationTitle = `Coding bank (continued) — ${meta.assessmentTitle.length > 52 ? `${meta.assessmentTitle.slice(0, 50)}…` : meta.assessmentTitle}`;

  const mintTitle: [number, number, number] = [204, 251, 241];
  const y0 = drawCoverBand(
    pdf,
    pageW,
    margin,
    meta,
    "Coding · question bank",
    "Admin export",
    TEAL,
    TEAL_DARK,
    rows.length,
    mintTitle,
  );

  const ctx: PdfContext = {
    pdf,
    margin,
    maxW,
    pageW,
    pageH,
    y: y0,
    footerReserve,
    continuationTitle,
    accent,
  };

  let n = 0;
  for (const row of rows) {
    n += 1;
    drawCodingHeaderBar(
      ctx,
      n,
      cellStr(row.id),
      cellStr(row.section_title),
      cellStr(row.section_order),
    );
    writeLabelBlock(ctx, "Title", cellStr(row.title), 10);
    writeLabelBlock(ctx, "Problem statement", cellStr(row.problem_statement), 9.5);
    writeLabelBlock(ctx, "Input format", cellStr(row.input_format));
    writeLabelBlock(ctx, "Output format", cellStr(row.output_format));
    writeMonoBlock(ctx, "Sample input", cellStr(row.sample_input));
    writeMonoBlock(ctx, "Sample output", cellStr(row.sample_output));
    writeLabelBlock(ctx, "Constraints", cellStr(row.constraints));
    if (cellStr(row.difficulty_level)) {
      writeLabelBlock(ctx, "Difficulty", cellStr(row.difficulty_level));
    }
    if (cellStr(row.tags)) {
      writeLabelBlock(ctx, "Tags", cellStr(row.tags));
    }
    writeLabelBlock(ctx, "Time limit (sec)", cellStr(row.time_limit));
    writeLabelBlock(ctx, "Memory limit (MB)", cellStr(row.memory_limit));
    drawQuestionDivider(ctx);
  }

  applyFootersToAllPages(pdf, margin, pageW, pageH, meta.baseSlug);
  pdf.save(`assessment-${meta.baseSlug}-coding-questions.pdf`);
}

/** Download MCQ, coding, and/or subjective PDFs (staggered saves), mirroring CSV export behavior. */
export function saveAssessmentQuestionsPdfs(
  meta: AssessmentQuestionsPdfMeta,
  mcqFlat: AssessmentQuestionExportRow[],
  codingFlat: AssessmentQuestionExportRow[],
  subjectiveFlat: AssessmentQuestionExportRow[] = [],
): { fileCount: number } {
  const tasks: Array<() => void> = [];
  if (mcqFlat.length > 0) {
    tasks.push(() => saveAssessmentMcqQuestionsPdf(meta, mcqFlat));
  }
  if (codingFlat.length > 0) {
    tasks.push(() => saveAssessmentCodingQuestionsPdf(meta, codingFlat));
  }
  if (subjectiveFlat.length > 0) {
    tasks.push(() => saveAssessmentSubjectiveQuestionsPdf(meta, subjectiveFlat));
  }
  tasks.forEach((fn, i) => {
    setTimeout(() => fn(), i * 140);
  });
  return { fileCount: tasks.length };
}
