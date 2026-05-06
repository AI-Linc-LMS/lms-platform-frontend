import { NextRequest, NextResponse } from "next/server";
import { createCanvas, loadImage, registerFont } from "canvas";
import path from "path";
import fs from "fs";

const fontsDir = path.join(process.cwd(), "public", "assets", "fonts");
const alexBrushPath = path.join(fontsDir, "AlexBrush-Regular.ttf");
const coltonsPath = path.join(fontsDir, "COLTONSC.ttf");

// ✅ Register fonts (NO duplicate family names)
if (fs.existsSync(alexBrushPath)) {
  registerFont(alexBrushPath, { family: "AlexBrush" });
}
if (fs.existsSync(coltonsPath)) {
  registerFont(coltonsPath, { family: "COLTONS" });
}

const IMAGES_DIR = path.join(process.cwd(), "public", "images");
const EXTENSIONS = [".jpeg", ".jpg", ".png"];
const DEFAULT_IMAGE = "Quantitative Aptitude -BEC College.jpeg";

/* ================= HELPERS ================= */

function normalizeCourseNameToPath(courseName: string): string {
  return (courseName || "").trim().replace(/\s+/g, "").toLowerCase();
}

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
      const base = path.basename(file, ext);
      if (normalizeCourseNameToPath(base) === normalized) {
        return path.join(IMAGES_DIR, file);
      }
    }
  } catch {}

  return null;
}

function generateCertificateId(prefix?: string) {
  const year = new Date().getFullYear();
  const seq = Math.floor(1000 + Math.random() * 9000);
  const letters = String(prefix ?? "")
    .replace(/[^a-zA-Z]/g, "")
    .toUpperCase()
    .slice(0, 2);
  return `${letters || "ZS"}-${year}-${seq}`;
}

function toTitleCaseName(name: string): string {
  return String(name || "")
    .toLowerCase()
    .replace(/\b([a-z])/g, (m) => m.toUpperCase())
    .trim();
}

/* ✅ FONT LOCK HELPERS */

function setNameFont(ctx: any, size: number) {
  ctx.font = `normal ${size}px "AlexBrush"`; // ONLY here
}

function setSansFont(
  ctx: any,
  size: number,
  weight: "normal" | "bold" = "normal"
) {
  ctx.font = `${weight} ${size}px "Arial","Helvetica","Segoe UI",sans-serif`;
}

/* ================= API ================= */

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      studentName,
      courseName,
      certificateId,
      templateUrl,
      issuerName,
      structuredTrainingSubject,
    } = body;

    if (!studentName) {
      return NextResponse.json(
        { error: "Student name is required" },
        { status: 400 }
      );
    }

    const imagePath =
      templateUrl?.trim() ||
      getCertificateImagePathForCourse(courseName ?? "");

    if (!imagePath) {
      return NextResponse.json(
        { error: "Template not found" },
        { status: 404 }
      );
    }

    const image = await loadImage(imagePath);
    const canvas = createCanvas(image.width, image.height);
    const ctx = canvas.getContext("2d");

    ctx.drawImage(image, 0, 0);

    /* ================= NAME ================= */

    ctx.save(); // 🔒 isolate styling

    ctx.fillStyle = "#5A46A0";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    const cleanName = toTitleCaseName(studentName);
    let fontSize = Math.round(canvas.width * 0.072);

    const maxWidth = canvas.width * 0.82;

    do {
      setNameFont(ctx, fontSize);
      if (ctx.measureText(cleanName).width <= maxWidth || fontSize <= 38) break;
      fontSize -= 2;
    } while (fontSize > 38);

    ctx.fillText(cleanName, canvas.width / 2, canvas.height * 0.53);

    ctx.restore(); // 🔒 resets EVERYTHING

    /* ================= SUBJECT ================= */

    if (structuredTrainingSubject) {
      ctx.fillStyle = "#3e3aa5";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";

      let size = Math.round(canvas.width * 0.026);

      do {
        setSansFont(ctx, size, "bold");
        if (
          ctx.measureText(structuredTrainingSubject).width <=
            canvas.width * 0.72 ||
          size <= 14
        )
          break;
        size--;
      } while (size > 14);

      ctx.fillText(
        structuredTrainingSubject,
        canvas.width / 2,
        canvas.height * 0.67
      );
    }

    /* ================= CERTIFICATE ID ================= */

    const id =
      certificateId ??
      generateCertificateId(issuerName ?? courseName ?? "");

    ctx.fillStyle = "#000";
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";

    setSansFont(ctx, 37, "normal"); // ✅ strictly sans
    ctx.fillText(id, canvas.width * 0.16, canvas.height * 0.872);

    /* ================= DATE ================= */

    const dateStr = new Date().toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    ctx.textAlign = "right";
    setSansFont(ctx, 24, "normal"); // ✅ strictly sans
    ctx.fillText(dateStr, canvas.width * 0.85, canvas.height * 0.872);

    /* ================= OUTPUT ================= */

    const buffer = canvas.toBuffer("image/png");

    return new NextResponse(Buffer.from(buffer), {
      headers: {
        "Content-Type": "image/png",
        "Content-Disposition": `attachment; filename="certificate-${id}.png"`,
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Generation failed" },
      { status: 500 }
    );
  }
}