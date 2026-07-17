/**
 * Lazy, cached loader for the assessment PDF's AiLinc logo mark, rasterized to PNG for jsPDF.
 * The first report download pays the cost once; the All-PDFs zip reuses the cache.
 *
 * Browser-only (fetch / Image / canvas). Resolves to null on the server or on any failure, and
 * the PDF generator degrades gracefully (no logo) so a report always renders.
 */

// White monochrome mark so the logo reads cleanly on the violet→pink header gradient.
const LOGO_SVG_URL = "/logos/ai-linc-mark-white.svg";

let _logoPng: { dataUrl: string; w: number; h: number } | null | undefined;

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

/** Preload the logo (call before a bulk export so each item reuses the cache). */
export async function preloadPdfBrandAssets(): Promise<void> {
  await loadLogoPng();
}

/** Synchronous cache read for the (sync) PDF generator — null until preloaded. */
export function getCachedLogoPng(): { dataUrl: string; w: number; h: number } | null {
  return _logoPng ?? null;
}
