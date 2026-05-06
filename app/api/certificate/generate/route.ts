import { NextRequest, NextResponse } from "next/server";
import { createCanvas, loadImage, registerFont } from "canvas";
import path from "path";
import fs from "fs";

const fontsDir = path.join(process.cwd(), "public", "assets", "fonts");
const alexBrushPath = path.join(fontsDir, "AlexBrush-Regular.ttf");
const robotoRegularPath = path.join(fontsDir, "Roboto-Regular.ttf");
const coltonsPath = path.join(fontsDir, "COLTONSC.ttf");

let alexBrushRegistered = false;
if (fs.existsSync(alexBrushPath)) {
  try {
    registerFont(alexBrushPath, { family: "Alex Brush", weight: "normal", style: "normal" });
    registerFont(alexBrushPath, { family: "Alex Brush Regular", weight: "normal", style: "normal" });
    registerFont(robotoRegularPath, { family: "Roboto", weight: "normal", style: "normal" });
    alexBrushRegistered = true;
  } catch {
    alexBrushRegistered = false;
  }
}
if (fs.existsSync(coltonsPath)) {
  registerFont(coltonsPath, { family: "COLTONS" });
}

const IMAGES_DIR = path.join(process.cwd(), "public", "images");
const EXTENSIONS = [".jpeg", ".jpg", ".png"];
const DEFAULT_IMAGE = "Quantitative Aptitude -BEC College.jpeg";

/** Normalize course name to path segment: no whitespace, lowercase. */
function normalizeCourseNameToPath(courseName: string): string {
  return (courseName || "")
    .trim()
    .replace(/\s+/g, "")
    .toLowerCase();
}

/** Resolve certificate image path by course name. Returns null if none found. */
function getCertificateImagePathForCourse(courseName: string): string | null {
  const normalized = normalizeCourseNameToPath(courseName);
  if (!normalized) return null;

  for (const ext of EXTENSIONS) {
    const candidate = path.join(IMAGES_DIR, normalized + ext);
    if (fs.existsSync(candidate)) return candidate;
  }

  try {
    const files = fs.readdirSync(IMAGES_DIR);
    for (const file of files) {
      const ext = path.extname(file).toLowerCase();
      if (!EXTENSIONS.includes(ext)) continue;
      const baseWithoutExt = path.basename(file, ext);
      if (normalizeCourseNameToPath(baseWithoutExt) === normalized) {
        return path.join(IMAGES_DIR, file);
      }
    }
  } catch {
    // ignore
  }

  const defaultPath = path.join(IMAGES_DIR, DEFAULT_IMAGE);
  const defaultBase = path.basename(DEFAULT_IMAGE, path.extname(DEFAULT_IMAGE));
  if (normalizeCourseNameToPath(defaultBase) === normalized && fs.existsSync(defaultPath)) {
    return defaultPath;
  }

  return null;
}

function generateCertificateId(prefix?: string) {
  const year = new Date().getFullYear();
  const seq = Math.floor(1000 + Math.random() * 9000);
  const letters = String(prefix ?? "")
    .replace(/[^a-zA-Z]/g, "")
    .toUpperCase()
    .slice(0, 2);
  const idPrefix = letters.length === 2 ? letters : "ZS";
  return `${idPrefix}-${year}-${seq}`;
}

function toTitleCaseName(name: string): string {
  return String(name || "")
    .toLowerCase()
    .replace(/\b([a-z])/g, (m) => m.toUpperCase())
    .trim();
}

function setSansFont(
  ctx: { font: string },
  sizePx: number,
  weight: "normal" | "bold" = "normal",
) {
  // Keep all non-name text on sans fonts only.
  ctx.font = `${weight} ${sizePx}px "Arial","Helvetica","Segoe UI",sans-serif`;
}

function hasLikelyPrintedTextInRegion(
  ctx: { getImageData: (sx: number, sy: number, sw: number, sh: number) => { data: Uint8ClampedArray } },
  x: number,
  y: number,
  w: number,
  h: number
): boolean {
  const sx = Math.max(0, Math.floor(x));
  const sy = Math.max(0, Math.floor(y));
  const sw = Math.max(1, Math.floor(w));
  const sh = Math.max(1, Math.floor(h));
  const data = ctx.getImageData(sx, sy, sw, sh).data;
  let ink = 0;
  let considered = 0;
  // Ignore 6% edges of the slot to avoid borders/ornaments causing false hits.
  const ix0 = Math.floor(sw * 0.06);
  const ix1 = Math.ceil(sw * 0.94);
  const iy0 = Math.floor(sh * 0.06);
  const iy1 = Math.ceil(sh * 0.94);
  for (let py = iy0; py < iy1; py++) {
    for (let px = ix0; px < ix1; px++) {
      const i = (py * sw + px) * 4;
      const a = data[i + 3];
      if (a < 10) continue;
      considered++;
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const max = Math.max(r, g, b);
      const min = Math.min(r, g, b);
      const chroma = max - min;
      const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b;
      // Text strokes are usually either darker than the light paper,
      // or have enough chroma (e.g. blue/purple subject text).
      if (lum < 165 || chroma > 20) ink++;
    }
  }
  if (considered <= 0) return false;
  // Low threshold: a small amount of ink in this slot likely means value already printed.
  return ink / considered > 0.02;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const courseName = searchParams.get("courseName") ?? "";
  const imagePath = getCertificateImagePathForCourse(courseName);
  return NextResponse.json({ available: !!imagePath });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      studentName,
      courseName,
      certificateId,
      templateUrl,
      templateHasDate,
      templateHasSubject,
      issuerName,
      structuredTrainingSubject,
    } = body;

    if (!studentName) {
      return NextResponse.json(
        { error: "Student name is required" },
        { status: 400 }
      );
    }
    const templateCandidate =
      typeof templateUrl === "string" && templateUrl.trim() ? templateUrl.trim() : null;
    const imagePath = templateCandidate ?? getCertificateImagePathForCourse(courseName ?? "");

    if (!imagePath) {
      return NextResponse.json(
        { error: "Certificate template not found for this course" },
        { status: 404 }
      );
    }

    if (!fs.existsSync(alexBrushPath) || !alexBrushRegistered) {
      return NextResponse.json(
        {
          error:
            "Alex Brush font could not be loaded. Verify public/assets/fonts/AlexBrush-Regular.ttf and restart the server.",
        },
        { status: 500 }
      );
    }

    const image = await loadImage(imagePath);
    const canvas = createCanvas(image.width, image.height);
    const ctx = canvas.getContext("2d");

    ctx.drawImage(image, 0, 0);

    /* ===== NAME ===== */
    ctx.fillStyle = "#5A46A0";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    // Only learner name uses Alex Brush.
    const nameFont = fs.existsSync(alexBrushPath) ? "Alex Brush" : "Segoe Script";
    const cleanName = toTitleCaseName(String(studentName || ""));
    let fontSize = Math.round(canvas.width * 0.072);
    if (cleanName.length > 20) fontSize = Math.round(canvas.width * 0.072);
    if (cleanName.length > 30) fontSize = Math.round(canvas.width * 0.062);

    // Fit to template width so long names remain visible.
    const maxNameWidth = canvas.width * 0.82;
    do {
      ctx.font = `normal ${fontSize}px "${nameFont}"`;
      if (ctx.measureText(cleanName).width <= maxNameWidth || fontSize <= 38) break;
      fontSize -= 2;
    } while (fontSize > 38);

    // Plain Alex Brush text only (no stroke/shadow/effects).

    const nameX = canvas.width / 2;
    const nameY = canvas.height * 0.53;
    ctx.fillText(cleanName, nameX, nameY);

    /** Uploaded templates often print “… training in” with a blank for course/test name — fill it here. */
    const trainingSubject =
      typeof structuredTrainingSubject === "string"
        ? structuredTrainingSubject.trim()
        : "";
    const templateSubjectAlreadyRendered =
      templateHasSubject === true ||
      (templateCandidate
        ? hasLikelyPrintedTextInRegion(
          ctx,
          // Check only the expected SUBJECT VALUE slot (below "For completing..." text).
          canvas.width * 0.2,
          canvas.height * 0.665,
          canvas.width * 0.6,
          canvas.height * 0.055,
        )
        : false);

    if (templateCandidate && trainingSubject && !templateSubjectAlreadyRendered) {
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillStyle = "#3e3aa5";
      let subFont = Math.round(canvas.width * 0.026);
      const maxSubWidth = canvas.width * 0.72;
      do {
        setSansFont(ctx, subFont, "bold");
        if (ctx.measureText(trainingSubject).width <= maxSubWidth || subFont <= 14) break;
        subFont -= 1;
      } while (subFont > 14);
      ctx.fillText(trainingSubject, canvas.width / 2, canvas.height * 0.67);
    }

    /* ===== CERTIFICATE ID (VALUE ONLY) ===== */
    const id = certificateId ?? generateCertificateId(issuerName ?? courseName ?? "");

    ctx.fillStyle = "#000";
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";

    // FORCE reset font (important)
    ctx.font = `normal 37px "Roboto","Arial","Helvetica","Segoe UI",sans-serif`;

    ctx.fillText(id, canvas.width * 0.16, canvas.height * 0.872);

    // Draw issue date unless the client says the template image already bakes in a final date value.
    // (Previously any `templateUrl` skipped the date, which left “DATE OF ISSUE” labels empty.)
    const templateDateAlreadyRendered =
      templateHasDate === true ||
      (templateCandidate
        ? hasLikelyPrintedTextInRegion(
          ctx,
          // Check only the expected DATE VALUE slot (avoid "DATE OF ISSUE" label row).
          canvas.width * 0.69,
          canvas.height * 0.86,
          canvas.width * 0.22,
          canvas.height * 0.045,
        )
        : false);
    if (!templateDateAlreadyRendered) {
      const dateStr = new Date().toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
      ctx.textAlign = "right";
      ctx.textBaseline = "middle";
      ctx.fillStyle = "#000";
      ctx.font = `normal 37px "Roboto","Arial","Helvetica","Segoe UI",sans-serif`;

      ctx.fillText(dateStr, canvas.width * 0.85, canvas.height * 0.872);
    }

    const buffer = canvas.toBuffer("image/png");

    return new NextResponse(Buffer.from(buffer), {
      headers: {
        "Content-Type": "image/png",
        "Content-Disposition": `attachment; filename="certificate-${id}.png"`,
      },
    });
  } catch (error: any) {
    console.error("Certificate generation error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to generate certificate" },
      { status: 500 }
    );
  }
}
