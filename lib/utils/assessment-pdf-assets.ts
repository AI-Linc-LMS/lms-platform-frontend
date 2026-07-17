/**
 * Lazy, cached loaders for the assessment PDF's brand assets — the AiLinc cursive font
 * (AlexBrush) and the AiLinc logo mark rasterized to PNG. Both are fetched from /public and
 * memoized, so the first report download pays the cost once and the All-PDFs zip reuses it.
 *
 * All of this is browser-only (fetch / Image / canvas). The loaders resolve to null on the
 * server or on any failure, and the PDF generator degrades gracefully (helvetica, no logo).
 */

const CURSIVE_FONT_URL = "/assets/fonts/AlexBrush-Regular.ttf";
const LOGO_SVG_URL = "/logos/ai-linc-mark-color.svg";

export const PDF_CURSIVE_FONT = "AlexBrush";
export const PDF_CURSIVE_FILE = "AlexBrush-Regular.ttf";

let _fontB64: string | null | undefined;
let _logoPng: { dataUrl: string; w: number; h: number } | null | undefined;

function arrayBufferToBase64(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf);
  let binary = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode.apply(
      null,
      Array.from(bytes.subarray(i, i + chunk)) as unknown as number[],
    );
  }
  return btoa(binary);
}

/** Base64 of the AlexBrush TTF for jsPDF `addFileToVFS`, or null if unavailable. */
export async function loadCursiveFontBase64(): Promise<string | null> {
  if (_fontB64 !== undefined) return _fontB64;
  try {
    if (typeof window === "undefined") return (_fontB64 = null);
    const res = await fetch(CURSIVE_FONT_URL);
    if (!res.ok) return (_fontB64 = null);
    _fontB64 = arrayBufferToBase64(await res.arrayBuffer());
  } catch {
    _fontB64 = null;
  }
  return _fontB64;
}

/** The AiLinc logo mark rasterized to a PNG data URL (retina-scaled), or null if unavailable. */
export async function loadLogoPng(): Promise<{ dataUrl: string; w: number; h: number } | null> {
  if (_logoPng !== undefined) return _logoPng;
  try {
    if (typeof window === "undefined" || typeof document === "undefined") {
      return (_logoPng = null);
    }
    const res = await fetch(LOGO_SVG_URL);
    if (!res.ok) return (_logoPng = null);
    const svgText = await res.text();
    const blob = new Blob([svgText], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    try {
      const img = await new Promise<HTMLImageElement>((resolve, reject) => {
        const im = new Image();
        im.onload = () => resolve(im);
        im.onerror = () => reject(new Error("logo decode failed"));
        im.src = url;
      });
      // The mark viewBox is 400×240 (5:3). Rasterize at 4× for crisp print.
      const scale = 4;
      const w = 400;
      const h = 240;
      const canvas = document.createElement("canvas");
      canvas.width = w * scale;
      canvas.height = h * scale;
      const ctx = canvas.getContext("2d");
      if (!ctx) return (_logoPng = null);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      _logoPng = { dataUrl: canvas.toDataURL("image/png"), w, h };
    } finally {
      URL.revokeObjectURL(url);
    }
  } catch {
    _logoPng = null;
  }
  return _logoPng;
}

/** Preload both assets (call before a bulk export so each item reuses the cache). */
export async function preloadPdfBrandAssets(): Promise<void> {
  await Promise.all([loadCursiveFontBase64(), loadLogoPng()]);
}

/** Synchronous cache reads for the (sync) PDF generator — null until preloaded. */
export function getCachedCursiveFontBase64(): string | null {
  return _fontB64 ?? null;
}
export function getCachedLogoPng(): { dataUrl: string; w: number; h: number } | null {
  return _logoPng ?? null;
}
