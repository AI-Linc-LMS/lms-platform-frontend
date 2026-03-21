import { toPng } from "html-to-image";
import jsPDF from "jspdf";

export interface DashboardPdfOptions {
  element: HTMLElement;
  fileName?: string;
  backgroundColor?: string;
  sectionSelector?: string;
}

interface PdfGenerationOptions {
  element: HTMLElement;
  fileName?: string;
  backgroundColor?: string;
  quality?: number;
  pixelRatio?: number;
  /** When false, skip live DOM tweaks before capture (e.g. assessment results — avoids layout shift). Default true. */
  prepareDom?: boolean;
  /** When true, embed lossless PNG in the PDF instead of JPEG recompression. Larger files, sharper output. Default false. */
  usePngInPdf?: boolean;
  /** When true, scale the full capture to fit one A4 page (no page slicing). */
  fitToSingleA4?: boolean;
  /** Margin in mm when fitToSingleA4 is enabled. */
  a4MarginMm?: number;
}

interface CssRulesPatch {
  originalDescriptor?: PropertyDescriptor;
  patchApplied: boolean;
}

/**
 * Applies a patch to CSSStyleSheet.prototype.cssRules to prevent SecurityError
 * when accessing cross-origin stylesheets during PDF generation.
 * 
 * @returns Object containing patch state and cleanup function
 */
const applyCssRulesPatch = (): CssRulesPatch => {
  const originalDescriptor = Object.getOwnPropertyDescriptor(
    CSSStyleSheet.prototype,
    "cssRules"
  );

  let patchApplied = false;

  try {
    Object.defineProperty(CSSStyleSheet.prototype, "cssRules", {
      get: function () {
        try {
          if (originalDescriptor && originalDescriptor.get) {
            return originalDescriptor.get.call(this);
          }
          return (this as any).cssRules || [];
        } catch (e) {
          return [];
        }
      },
      configurable: true,
      enumerable: originalDescriptor?.enumerable ?? true,
    });
    patchApplied = true;
  } catch (e) {
    // If patching fails, continue without patch
  }

  return { originalDescriptor, patchApplied };
};

/**
 * Restores the original CSSStyleSheet.prototype.cssRules descriptor.
 */
const restoreCssRulesPatch = ({ originalDescriptor, patchApplied }: CssRulesPatch): void => {
  if (patchApplied) {
    try {
      if (originalDescriptor) {
        Object.defineProperty(
          CSSStyleSheet.prototype,
          "cssRules",
          originalDescriptor
        );
      } else {
        delete (CSSStyleSheet.prototype as any).cssRules;
      }
    } catch (e) {
      // Ignore restore errors
    }
  }
};

/**
 * Preloads background images and waits for all images to load.
 */
const preloadImages = async (element: HTMLElement): Promise<void> => {
  // Preload background image for header
  const bgImage = new Image();
  bgImage.crossOrigin = "anonymous";
  await new Promise<void>((resolve) => {
    bgImage.onload = () => resolve();
    bgImage.onerror = () => resolve(); // Continue even if image fails
    bgImage.src = "/images/psychometric-test.png";
    setTimeout(() => resolve(), 1000); // Timeout after 1 second
  });

  // Wait for all images to load
  const images = element.querySelectorAll("img");
  await Promise.all(
    Array.from(images).map((img) => {
      if (img.complete) return Promise.resolve();
      return new Promise<void>((resolve) => {
        img.onload = () => resolve();
        img.onerror = () => resolve(); // Continue even if image fails
        setTimeout(() => resolve(), 2000); // Timeout after 2 seconds
      });
    })
  );
};

/**
 * Prepares the DOM element for PDF generation by:
 * - Expanding all collapsible sections
 * - Ensuring proper text wrapping
 * - Preserving background styles
 */
const prepareContentForPdf = (element: HTMLElement): void => {
  // Expand all expandable sections
  const expandableSections = element.querySelectorAll('[class*="border-t"]');
  expandableSections.forEach((el) => {
    const htmlEl = el as HTMLElement;
    const computedStyle = window.getComputedStyle(htmlEl);
    if (computedStyle.display === "none" || computedStyle.maxHeight === "0px") {
      htmlEl.style.display = "block";
      htmlEl.style.visibility = "visible";
      htmlEl.style.opacity = "1";
      htmlEl.style.height = "auto";
      htmlEl.style.maxHeight = "none";
    }
  });

  // Ensure text wrapping for all cards and grid items
  const cards = element.querySelectorAll('[class*="group"], [class*="rounded"]');
  cards.forEach((el) => {
    const htmlEl = el as HTMLElement;
    htmlEl.style.wordWrap = "break-word";
    htmlEl.style.overflowWrap = "break-word";
    htmlEl.style.overflow = "visible";
  });

  // Ensure background images and gradients are preserved
  const headerElements = element.querySelectorAll(
    '[style*="backgroundImage"], [style*="background"]'
  );
  headerElements.forEach((el) => {
    const htmlEl = el as HTMLElement;
    // Force reflow to ensure styles are applied
    void htmlEl.offsetHeight;
  });

  // Ensure job profile cards maintain their background styles
  const jobCards = element.querySelectorAll('[class*="group"][class*="relative"]');
  jobCards.forEach((el) => {
    const htmlEl = el as HTMLElement;
    const bgDiv = htmlEl.querySelector('[style*="background"]') as HTMLElement;
    if (bgDiv) {
      bgDiv.style.opacity = "1";
      bgDiv.style.visibility = "visible";
    }
  });
};

/**
 * Converts an image to JPEG format with compression for smaller file size.
 * Returns both the compressed image data and the image dimensions.
 */
const compressImageToJpeg = (
  imageData: string,
  quality: number = 0.85
): Promise<{ data: string; width: number; height: number }> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.src = imageData;
    img.crossOrigin = "anonymous";

    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Failed to get canvas context"));
        return;
      }

      ctx.drawImage(img, 0, 0);
      const compressedImgData = canvas.toDataURL("image/jpeg", quality);
      resolve({
        data: compressedImgData,
        width: img.width,
        height: img.height,
      });
    };

    img.onerror = () => reject(new Error("Failed to load image"));
    setTimeout(() => reject(new Error("Image load timeout")), 10000);
  });
};

const getDataUrlImageDimensions = (
  dataUrl: string
): Promise<{ width: number; height: number }> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () =>
      resolve({ width: img.naturalWidth, height: img.naturalHeight });
    img.onerror = () => reject(new Error("Failed to load image for dimensions"));
    img.src = dataUrl;
    setTimeout(() => reject(new Error("Image dimension load timeout")), 10000);
  });
};

/**
 * Generates a PDF from an HTML element.
 * 
 * @param options - Configuration options for PDF generation
 * @returns Promise that resolves when PDF is generated and saved
 */
export const generatePdfFromElement = async ({
  element,
  fileName = "document.pdf",
  backgroundColor = "#f8fafc",
  quality = 0.92,
  pixelRatio = 1.5,
  prepareDom = true,
  usePngInPdf = false,
  fitToSingleA4 = false,
  a4MarginMm = 8,
}: PdfGenerationOptions): Promise<void> => {
  const cssPatch = applyCssRulesPatch();

  try {
    // Preload images
    await preloadImages(element);

    if (prepareDom) {
      prepareContentForPdf(element);
    }

    // Small delay to ensure all styles are applied
    await new Promise((resolve) => setTimeout(resolve, 200));

    // Generate image from element
    const imgData = await toPng(element, {
      quality,
      pixelRatio,
      backgroundColor,
      cacheBust: true,
      skipFonts: false,
      filter: (node) => {
        // Exclude elements with 'exclude-from-pdf' class from the PDF
        if (node instanceof HTMLElement) {
          return !node.classList.contains("exclude-from-pdf");
        }
        return true;
      },
    });

    let rasterData: string;
    let imgWidthPx: number;
    let imgHeightPx: number;
    const pdfImageFormat: "PNG" | "JPEG" = usePngInPdf ? "PNG" : "JPEG";

    if (usePngInPdf) {
      rasterData = imgData;
      const dims = await getDataUrlImageDimensions(imgData);
      imgWidthPx = dims.width;
      imgHeightPx = dims.height;
    } else {
      const compressed = await compressImageToJpeg(imgData, 0.85);
      rasterData = compressed.data;
      imgWidthPx = compressed.width;
      imgHeightPx = compressed.height;
    }

    // Create PDF
    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });

    const imgWidthMm = pdf.internal.pageSize.getWidth();
    const pageHeightMm = pdf.internal.pageSize.getHeight();

    if (fitToSingleA4) {
      const maxWidth = imgWidthMm - a4MarginMm * 2;
      const maxHeight = pageHeightMm - a4MarginMm * 2;
      const srcAspect = imgWidthPx / imgHeightPx;
      let drawWidth = maxWidth;
      let drawHeight = drawWidth / srcAspect;
      if (drawHeight > maxHeight) {
        drawHeight = maxHeight;
        drawWidth = drawHeight * srcAspect;
      }
      const x = (imgWidthMm - drawWidth) / 2;
      const y = (pageHeightMm - drawHeight) / 2;
      if (pdfImageFormat === "JPEG") {
        pdf.addImage(rasterData, "JPEG", x, y, drawWidth, drawHeight, undefined, "FAST");
      } else {
        pdf.addImage(rasterData, "PNG", x, y, drawWidth, drawHeight);
      }
    } else {
      // Slice by page in pixel space to avoid seam artifacts at page boundaries.
      const sourceImage = new Image();
      sourceImage.crossOrigin = "anonymous";
      sourceImage.src = rasterData;
      await new Promise<void>((resolve, reject) => {
        sourceImage.onload = () => resolve();
        sourceImage.onerror = () =>
          reject(new Error("Failed to load raster image for PDF slicing"));
        setTimeout(
          () => reject(new Error("Timed out loading raster image for PDF slicing")),
          10000
        );
      });

      const pageHeightPx = Math.max(
        1,
        Math.floor((pageHeightMm * imgWidthPx) / imgWidthMm)
      );

      let offsetY = 0;
      let pageIndex = 0;

      while (offsetY < imgHeightPx) {
        const sliceHeightPx = Math.min(pageHeightPx, imgHeightPx - offsetY);
        const sliceCanvas = document.createElement("canvas");
        sliceCanvas.width = imgWidthPx;
        sliceCanvas.height = sliceHeightPx;
        const ctx = sliceCanvas.getContext("2d");
        if (!ctx) {
          throw new Error("Failed to get canvas context for PDF slicing");
        }

        ctx.drawImage(
          sourceImage,
          0,
          offsetY,
          imgWidthPx,
          sliceHeightPx,
          0,
          0,
          imgWidthPx,
          sliceHeightPx
        );

        const pageData =
          pdfImageFormat === "PNG"
            ? sliceCanvas.toDataURL("image/png")
            : sliceCanvas.toDataURL("image/jpeg", quality);

        const sliceHeightMm = (sliceHeightPx * imgWidthMm) / imgWidthPx;

        if (pageIndex > 0) {
          pdf.addPage();
        }

        if (pdfImageFormat === "JPEG") {
          pdf.addImage(
            pageData,
            "JPEG",
            0,
            0,
            imgWidthMm,
            sliceHeightMm,
            undefined,
            "FAST"
          );
        } else {
          pdf.addImage(pageData, "PNG", 0, 0, imgWidthMm, sliceHeightMm);
        }

        offsetY += sliceHeightPx;
        pageIndex += 1;
      }
    }

    // Save PDF
    pdf.save(fileName);
  } catch (error) {
    // Error handling - no console.log per project requirement
    throw error;
  } finally {
    // Always restore CSS patch
    restoreCssRulesPatch(cssPatch);
  }
};

/**
 * Generates a PDF from dashboard content by capturing each section separately.
 * Ensures no content is cut at page boundaries - each section is scaled to fit.
 * Excludes elements with 'exclude-from-pdf' class (e.g. download button).
 */
export const generateDashboardPdf = async ({
  element,
  fileName = "admin-dashboard.pdf",
  backgroundColor = "#ffffff",
  sectionSelector = ".pdf-section",
}: DashboardPdfOptions): Promise<void> => {
  const cssPatch = applyCssRulesPatch();

  try {
    const sections = element.querySelectorAll<HTMLElement>(sectionSelector);
    if (sections.length === 0) {
      throw new Error("No PDF sections found");
    }

    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });
    const pageWidth = 210;
    const pageHeight = 297;
    const margin = 10;
    const usableWidth = pageWidth - margin * 2;
    const usableHeight = pageHeight - margin * 2;
    let isFirstPage = true;

    for (const section of Array.from(sections)) {
      // Use html-to-image (better Recharts/SVG support) instead of html2canvas
      const imgData = await toPng(section, {
        pixelRatio: 2,
        backgroundColor,
        cacheBust: true,
        filter: (node) =>
          !(node instanceof HTMLElement && node.classList.contains("exclude-from-pdf")),
      });

      const img = new Image();
      img.src = imgData;
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error("Image load failed"));
      });
      const imgAspect = img.height / img.width;

      // Scale to fit page width
      let imgWidthMm = usableWidth;
      let imgHeightMm = imgWidthMm * imgAspect;

      // If section is taller than page, scale down to fit (no cutting)
      const scaledDown = imgHeightMm > usableHeight;
      if (scaledDown) {
        imgHeightMm = usableHeight;
        imgWidthMm = imgHeightMm / imgAspect;
      }
      if (!isFirstPage) {
        pdf.addPage();
      }
      isFirstPage = false;

      // Center horizontally if narrower than page
      const xOffset = margin + (usableWidth - imgWidthMm) / 2;
      pdf.addImage(imgData, "PNG", xOffset, margin, imgWidthMm, imgHeightMm, undefined, "FAST");
    }

    pdf.save(fileName);
  } catch (error) {
    throw error;
  } finally {
    restoreCssRulesPatch(cssPatch);
  }
};
