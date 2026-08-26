import { certificateElementToPngBlob } from "@/lib/utils/certificate-export.utils";
import {
  CERTIFICATE_CANVAS_HEIGHT,
  CERTIFICATE_CANVAS_WIDTH,
} from "@/lib/certificates/types";
import type { CertificateRenderPayload } from "@/lib/certificates/types";

/**
 * Certificate export: PNG for sharing, PDF for printing and for the file people
 * attach to a job application.
 *
 * This deliberately wraps `lib/utils/certificate-export.utils.ts` rather than
 * calling html-to-image directly. That module carries two patches that exist
 * because exports failed without them, and both are easy to lose in a rewrite:
 *
 *  - it awaits every <img> inside the node (with a 2.5s ceiling per image)
 *    before capturing. Tenant logos and uploaded backgrounds load from external
 *    hosts, and html-to-image happily rasterises a half-loaded <img> as empty
 *    space, which is how a certificate ends up exported with no logo on it.
 *  - it patches CSSStyleSheet.prototype.cssRules for the duration of the
 *    capture. html-to-image walks the document's stylesheets to inline fonts,
 *    and touching a cross-origin sheet throws a SecurityError that aborts the
 *    whole export.
 *
 * It also applies the `.exclude-from-certificate-export` filter, which is how
 * overlay chrome (the locked scrim, hover actions) stays out of the raster.
 *
 * pixelRatio 2.5 on the 1000x707 canvas gives a 2500x1768 image: about 300dpi
 * across an A4 landscape page, which is the point where print stops looking
 * like a screenshot.
 */

export interface CertificateExportOptions {
  /** Raster scale. 2.5 puts the A4 print at ~300dpi. */
  pixelRatio?: number;
  /** Ground painted behind the canvas. The artwork paints its own opaque
   *  background, so this only matters for the JPEG re-encode below. */
  backgroundColor?: string;
  /** JPEG quality for the PDF path only. PNG is always lossless. */
  jpegQuality?: number;
}

const DEFAULT_PIXEL_RATIO = 2.5;
const DEFAULT_BACKGROUND = "#ffffff";
const DEFAULT_JPEG_QUALITY = 0.92;

/** A4 landscape in mm. The canvas is authored at the same sqrt-2 ratio, so the
 *  image fills the page edge to edge with no letterboxing and no scaling maths. */
const A4_LANDSCAPE_WIDTH_MM = 297;
const A4_LANDSCAPE_HEIGHT_MM = 210;

/**
 * Rasterise a certificate node to a lossless PNG blob. Use this for clipboard,
 * for a share sheet, or to hand the bytes to an upload.
 *
 * Pass the node the artwork's ref points at, NOT the scaled preview wrapper:
 * html-to-image measures clientWidth, which a CSS transform does not affect, so
 * the untransformed 1000x707 node exports at full resolution no matter how small
 * it is being displayed.
 */
export async function certificateBlob(
  node: HTMLElement,
  options: CertificateExportOptions = {},
): Promise<Blob> {
  const {
    pixelRatio = DEFAULT_PIXEL_RATIO,
    backgroundColor = DEFAULT_BACKGROUND,
  } = options;
  return certificateElementToPngBlob(node, { pixelRatio, backgroundColor });
}

export async function downloadCertificatePng(
  node: HTMLElement,
  fileName: string,
  options: CertificateExportOptions = {},
): Promise<void> {
  const blob = await certificateBlob(node, options);
  saveBlob(blob, ensureExtension(fileName, ".png"));
}

/**
 * Single-page landscape A4 PDF, full bleed.
 *
 * The PNG is re-encoded to JPEG first and jsPDF is created with compress:true.
 * That is not premature optimisation: a 2500x1768 lossless PNG of an ornate
 * certificate embedded raw is comfortably over 10MB, which is a download a
 * learner on a phone abandons and an attachment several job portals reject
 * outright. At quality 0.92 the same page lands around 400-700KB and the
 * difference is invisible on paper. PNG downloads stay lossless because that is
 * the file people crop and post.
 */
export async function downloadCertificatePdf(
  node: HTMLElement,
  fileName: string,
  options: CertificateExportOptions = {},
): Promise<void> {
  const pdf = await buildCertificatePdf(node, options);
  pdf.save(ensureExtension(fileName, ".pdf"));
}

/** The same PDF as a blob, for callers that want to upload or attach it rather
 *  than trigger a download. */
export async function certificatePdfBlob(
  node: HTMLElement,
  options: CertificateExportOptions = {},
): Promise<Blob> {
  const pdf = await buildCertificatePdf(node, options);
  return pdf.output("blob");
}

/**
 * A safe, meaningful download filename: the recipient, what they earned, and the
 * credential id. The id is in there because a learner who downloads three
 * certificates from the same course over a term otherwise gets
 * "certificate (2).pdf" and cannot tell which is which.
 */
export function certificateFileBase(
  payload: Pick<
    CertificateRenderPayload,
    "recipient_name" | "title" | "subtitle" | "credential_id"
  >,
): string {
  const parts = [
    payload.recipient_name,
    payload.subtitle || payload.title,
    payload.credential_id,
  ];
  const base = parts
    .map((p) => slugSegment(p))
    .filter(Boolean)
    .join("-");
  return base.slice(0, 120) || "certificate";
}

/* ------------------------------------------------------------------ *
 * Internals
 * ------------------------------------------------------------------ */

/** Capture, re-encode, and lay the image edge to edge on one A4 landscape page. */
async function buildCertificatePdf(
  node: HTMLElement,
  options: CertificateExportOptions,
) {
  const blob = await certificateBlob(node, options);
  const jpeg = await pngBlobToJpegDataUrl(
    blob,
    options.jpegQuality ?? DEFAULT_JPEG_QUALITY,
    options.backgroundColor ?? DEFAULT_BACKGROUND,
  );
  const { default: jsPDF } = await import("jspdf");
  const pdf = new jsPDF({
    orientation: "landscape",
    unit: "mm",
    format: "a4",
    compress: true,
  });
  pdf.addImage(
    jpeg.dataUrl,
    jpeg.format,
    0,
    0,
    A4_LANDSCAPE_WIDTH_MM,
    A4_LANDSCAPE_HEIGHT_MM,
    undefined,
    "FAST",
  );
  return pdf;
}

function slugSegment(value: string | null | undefined): string {
  return (value || "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function ensureExtension(fileName: string, ext: string): string {
  const name = (fileName || "certificate").trim() || "certificate";
  return name.toLowerCase().endsWith(ext) ? name : `${name}${ext}`;
}

/**
 * Re-encode the captured PNG as JPEG through a canvas.
 *
 * The white fill before drawImage is load-bearing: JPEG has no alpha channel,
 * and any transparent pixel that survived the capture (a rounded corner, a gap
 * between the canvas and an image that failed to load) comes out BLACK rather
 * than transparent, which on a certificate reads as a printing fault.
 *
 * If anything in this path fails - a tainted canvas, a browser refusing
 * toDataURL - the original lossless PNG is returned instead. A large PDF is a
 * far better outcome than no PDF.
 */
async function pngBlobToJpegDataUrl(
  blob: Blob,
  quality: number,
  background: string,
): Promise<{ dataUrl: string; format: "JPEG" | "PNG" }> {
  const pngDataUrl = await blobToDataUrl(blob);
  try {
    const img = await loadImage(pngDataUrl);
    const canvas = document.createElement("canvas");
    canvas.width = img.naturalWidth || CERTIFICATE_CANVAS_WIDTH;
    canvas.height = img.naturalHeight || CERTIFICATE_CANVAS_HEIGHT;
    const ctx = canvas.getContext("2d");
    if (!ctx) return { dataUrl: pngDataUrl, format: "PNG" };
    ctx.fillStyle = background;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    const jpeg = canvas.toDataURL("image/jpeg", quality);
    // A browser that cannot encode JPEG returns a PNG data URL from toDataURL
    // rather than throwing, so check what actually came back before telling
    // jsPDF it is looking at a JPEG.
    if (!jpeg.startsWith("data:image/jpeg")) {
      return { dataUrl: pngDataUrl, format: "PNG" };
    }
    return { dataUrl: jpeg, format: "JPEG" };
  } catch {
    return { dataUrl: pngDataUrl, format: "PNG" };
  }
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("Could not read the certificate image"));
    reader.readAsDataURL(blob);
  });
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const timer = setTimeout(
      () => reject(new Error("Certificate image load timed out")),
      15000,
    );
    img.onload = () => {
      clearTimeout(timer);
      resolve(img);
    };
    img.onerror = () => {
      clearTimeout(timer);
      reject(new Error("Certificate image failed to load"));
    };
    img.src = src;
  });
}

/** Object-URL download, revoked immediately after the click. Left here rather
 *  than imported so this module has no dependency beyond the capture pipeline. */
function saveBlob(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
