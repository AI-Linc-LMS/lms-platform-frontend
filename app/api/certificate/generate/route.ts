import { NextRequest, NextResponse } from "next/server";
import { createCanvas, loadImage, registerFont } from "canvas";
import path from "path";
import fs from "fs";

const fontsDir = path.join(process.cwd(), "public", "assets", "fonts");
const alexBrushPath = path.join(fontsDir, "AlexBrush-Regular.ttf");
const coltonsPath = path.join(fontsDir, "COLTONSC.ttf");

if (fs.existsSync(alexBrushPath)) {
  registerFont(alexBrushPath, { family: "Alex Brush" });
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

function generateCertificateId() {
  const year = new Date().getFullYear();
  const seq = Math.floor(1000 + Math.random() * 9000);
  return `ZS-${year}-${seq}`;
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
    const { studentName, courseName, certificateId, index } = body;

    if (!studentName) {
      return NextResponse.json(
        { error: "Student name is required" },
        { status: 400 }
      );
    }

    const imagePath = getCertificateImagePathForCourse(courseName ?? "");

    if (!imagePath) {
      return NextResponse.json(
        { error: "Certificate template not found for this course" },
        { status: 404 }
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

    let fontSize = 90;
    if (studentName.length > 20) fontSize = 75;
    if (studentName.length > 30) fontSize = 74;

    const nameFont = fs.existsSync(alexBrushPath) ? "Alex Brush" : "Arial";
    ctx.font = `${fontSize}px "${nameFont}"`;
    ctx.fillText(studentName?.toLowerCase(), canvas.width / 2, canvas.height * 0.53);

    /* ===== CERTIFICATE ID (VALUE ONLY) ===== */
    const id = certificateId ?? generateCertificateId();

    ctx.fillStyle = "#000";
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    const idFont = "Arial";
    ctx.font = `37px "${idFont}"`;

    ctx.fillText(id, canvas.width * 0.16, canvas.height * 0.872);

    /* ===== DATE OF ISSUE (bottom-right, on its own line to avoid collision with ID) ===== */
    const dateStr = new Date().toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
    ctx.font = `37px "${idFont}"`;
    ctx.textAlign = "right";
    ctx.fillText(dateStr, canvas.width * 0.88, canvas.height * 0.905);

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
