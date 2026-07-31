/**
 * Lazy, cached loader for the assessment PDF's AiLinc logo mark, rasterized to PNG for jsPDF.
 * The first report download pays the cost once; the All-PDFs zip reuses the cache.
 *
 * Browser-only (fetch / Image / canvas). Resolves to null on the server or on any failure, and
 * the PDF generator degrades gracefully (no logo) so a report always renders.
 */

// White monochrome mark so the logo reads cleanly on the violet→pink header gradient.
const LOGO_SVG_URL = "/logos/ai-linc-mark-white.svg";

export interface PdfLogo {
  dataUrl: string;
  w: number;
  h: number;
  /** True for the AI Linc mark, which is white-on-transparent and sits directly on the gradient.
   *  A tenant logo is arbitrary artwork and needs a light plate behind it to stay legible. */
  isMonochromeMark: boolean;
}

let _logoPng: { dataUrl: string; w: number; h: number } | null | undefined;
//: Per-URL cache. A bulk export renders many reports for one tenant; re-fetching and
//: re-rasterizing the same logo per report is the difference between a fast zip and a slow one.
const _tenantLogos = new Map<string, PdfLogo | null>();
let _activeBrand: { name: string; logo: PdfLogo | null } | null = null;

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

/**
 * Rasterize a tenant's own logo for the report header.
 *
 * Returns null on ANY failure, and the caller falls back to the AI Linc mark rather than dropping
 * the header — a report with no branding is worse than one with ours.
 *
 * `crossOrigin` is set because the canvas is read back with toDataURL: without it a logo served
 * from S3 or a CDN taints the canvas and the read throws, which would take the whole PDF down
 * rather than just the logo.
 */
export async function loadTenantLogoPng(url: string): Promise<PdfLogo | null> {
  const key = (url || "").trim();
  if (!key) return null;
  if (_tenantLogos.has(key)) return _tenantLogos.get(key) ?? null;
  if (typeof window === "undefined" || typeof document === "undefined") return null;

  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const im = new Image();
      im.crossOrigin = "anonymous";
      im.onload = () => resolve(im);
      im.onerror = () => reject(new Error("tenant logo decode failed"));
      im.src = key;
    });
    const w = img.naturalWidth || img.width;
    const h = img.naturalHeight || img.height;
    if (!w || !h) {
      _tenantLogos.set(key, null);
      return null;
    }
    // Cap the raster so a 4000px logo does not bloat every report in a bulk export.
    const scale = Math.min(4, Math.max(1, 1200 / Math.max(w, h)));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(w * scale);
    canvas.height = Math.round(h * scale);
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      _tenantLogos.set(key, null);
      return null;
    }
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    const out: PdfLogo = {
      dataUrl: canvas.toDataURL("image/png"),
      w,
      h,
      isMonochromeMark: false,
    };
    _tenantLogos.set(key, out);
    return out;
  } catch {
    // Most often a CORS-less host. Cached as a miss so a bulk export does not retry per report.
    _tenantLogos.set(key, null);
    return null;
  }
}

/**
 * Preload branding for the report header (call before a bulk export so each item reuses the cache).
 *
 * Passing the tenant makes the report say who it is from. Without it the export is AI Linc-branded
 * for every institution, which is wrong on a document a learner keeps and may forward.
 */
export async function preloadPdfBrandAssets(brand?: {
  name?: string | null;
  logoUrl?: string | null;
}): Promise<void> {
  const fallback = await loadLogoPng();
  const tenantLogo = brand?.logoUrl ? await loadTenantLogoPng(brand.logoUrl) : null;
  _activeBrand = {
    name: (brand?.name || "").trim(),
    logo:
      tenantLogo ??
      (fallback ? { ...fallback, isMonochromeMark: true } : null),
  };
}

/** The branding the (synchronous) PDF generator should draw. Falls back to the AI Linc mark. */
export function getActivePdfBrand(): { name: string; logo: PdfLogo | null } {
  if (_activeBrand) return _activeBrand;
  const fallback = getCachedLogoPng();
  return {
    name: "",
    logo: fallback ? { ...fallback, isMonochromeMark: true } : null,
  };
}

/** Synchronous cache read for the (sync) PDF generator - null until preloaded. */
export function getCachedLogoPng(): { dataUrl: string; w: number; h: number } | null {
  return _logoPng ?? null;
}
