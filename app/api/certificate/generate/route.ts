import { NextRequest, NextResponse } from "next/server";
import { createCanvas, loadImage, registerFont } from "canvas";
import path from "path";
import fs from "fs";

const fontsDir = path.join(process.cwd(), "public", "assets", "fonts");
const alexBrushPath = path.join(fontsDir, "AlexBrush-Regular.ttf");
const coltonsPath = path.join(fontsDir, "COLTONSC.ttf");

let alexBrushRegistered = false;
if (fs.existsSync(alexBrushPath)) {
  try {
    registerFont(alexBrushPath, { family: "Alex Brush", weight: "normal", style: "normal" });
    registerFont(alexBrushPath, { family: "Alex Brush", weight: "normal", style: "normal" });
    registerFont(alexBrushPath, { family: "Alex Brush Regular", weight: "normal", style: "normal" });
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

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const courseName = searchParams.get("courseName") ?? "";
  const imagePath = getCertificateImagePathForCourse(courseName);
  return NextResponse.json({ available: !!imagePath });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { studentName, courseName, certificateId, templateUrl, templateHasDate, issuerName } = body;

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

    // Force Alex Brush for generated certificate name.
    const nameFont = fs.existsSync(alexBrushPath) ? "Alex Brush" : "Segoe Script";
    const cleanName = toTitleCaseName(String(studentName || ""));
    let fontSize = Math.round(canvas.width * 0.072);
    if (cleanName.length > 20) fontSize = Math.round(canvas.width * 0.072);
    if (cleanName.length > 30) fontSize = Math.round(canvas.width * 0.062);

    // Fit to template width so long names remain visible.
    const maxNameWidth = canvas.width * 0.72;
    do {
      ctx.font = `normal ${fontSize}px "${nameFont}"`;
      if (ctx.measureText(cleanName).width <= maxNameWidth || fontSize <= 38) break;
      fontSize -= 2;
    } while (fontSize > 38);

    // Plain Alex Brush text only (no stroke/shadow/effects).

    const nameX = canvas.width / 2;
    const nameY = canvas.height * 0.53;
    ctx.fillText(cleanName, nameX, nameY);

    /* ===== CERTIFICATE ID (VALUE ONLY) ===== */
    const id = certificateId ?? generateCertificateId(issuerName ?? courseName ?? "");

    ctx.fillStyle = "#000";
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    const idFont = "Arial";
    ctx.font = `37px "${idFont}"`;

    ctx.fillText(id, canvas.width * 0.16, canvas.height * 0.872);

    // Uploaded templates usually already include date text/slot.
    // Skip drawing date when template indicates it already has one.
    const hasDateOnTemplate = Boolean(templateCandidate) || Boolean(templateHasDate);
    if (!hasDateOnTemplate) {
      const dateStr = new Date().toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
      ctx.textAlign = "right";
      ctx.font = "Arial";
      ctx.fillText(dateStr, canvas.width * 0.88, canvas.height * 0.872);
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
