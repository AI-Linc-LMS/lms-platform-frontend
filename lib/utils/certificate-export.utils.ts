import { toPng } from "html-to-image";
import jsPDF from "jspdf";
import {
  applyCssRulesPatch,
  restoreCssRulesPatch,
} from "@/lib/utils/pdf-generation.utils";

const waitForImagesInElement = async (root: HTMLElement): Promise<void> => {
  const images = root.querySelectorAll("img");
  await Promise.all(
    Array.from(images).map(
      (img) =>
        new Promise<void>((resolve) => {
          if (img.complete) {
            resolve();
            return;
          }
          img.onload = () => resolve();
          img.onerror = () => resolve();
          setTimeout(() => resolve(), 2500);
        })
    )
  );
};

export interface CertificatePngOptions {
  pixelRatio?: number;
  backgroundColor?: string;
}

/**
 * Rasterizes a certificate DOM node to PNG (for download or clipboard).
 * Applies the same cssRules patch used elsewhere so cross-origin stylesheets do not break capture.
 */
export async function certificateElementToPngBlob(
  element: HTMLElement,
  options: CertificatePngOptions = {}
): Promise<Blob> {
  const { pixelRatio = 2.5, backgroundColor = "#ffffff" } = options;
  const cssPatch = applyCssRulesPatch();
  try {
    await waitForImagesInElement(element);
    await new Promise((r) => setTimeout(r, 120));
    const dataUrl = await toPng(element, {
      pixelRatio,
      backgroundColor,
      cacheBust: true,
      skipFonts: false,
      filter: (node) => {
        if (node instanceof HTMLElement) {
          return !node.classList.contains("exclude-from-certificate-export");
        }
        return true;
      },
    });
    const res = await fetch(dataUrl);
    return await res.blob();
  } finally {
    restoreCssRulesPatch(cssPatch);
  }
}

export async function downloadCertificatePng(
  element: HTMLElement,
  fileName: string,
  options?: CertificatePngOptions
): Promise<void> {
  const blob = await certificateElementToPngBlob(element, options);
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName.endsWith(".png") ? fileName : `${fileName}.png`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/** Single-page landscape PDF scaled to fit A4 landscape with margins. */
export async function downloadCertificatePdf(
  element: HTMLElement,
  fileName: string,
  options?: CertificatePngOptions
): Promise<void> {
  const blob = await certificateElementToPngBlob(element, options);
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("Failed to read PNG blob"));
    reader.readAsDataURL(blob);
  });

  const pdf = new jsPDF({
    orientation: "landscape",
    unit: "mm",
    format: "a4",
  });
  const pageW = pdf.internal.pageSize.getWidth();
  const pageH = pdf.internal.pageSize.getHeight();
  const margin = 8;
  const maxW = pageW - margin * 2;
  const maxH = pageH - margin * 2;

  const img = new Image();
  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve();
    img.onerror = () => reject(new Error("Certificate image load failed"));
    img.src = dataUrl;
    setTimeout(() => reject(new Error("Certificate image timeout")), 15000);
  });

  const aspect = img.naturalWidth / img.naturalHeight;
  let drawW = maxW;
  let drawH = drawW / aspect;
  if (drawH > maxH) {
    drawH = maxH;
    drawW = drawH * aspect;
  }
  const x = margin + (maxW - drawW) / 2;
  const y = margin + (maxH - drawH) / 2;

  pdf.addImage(dataUrl, "PNG", x, y, drawW, drawH, undefined, "FAST");
  pdf.save(fileName.endsWith(".pdf") ? fileName : `${fileName}.pdf`);
}
