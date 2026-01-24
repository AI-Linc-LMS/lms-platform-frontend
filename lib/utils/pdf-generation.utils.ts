import { toPng } from "html-to-image";
import jsPDF from "jspdf";

interface PdfGenerationOptions {
  element: HTMLElement;
  fileName?: string;
  backgroundColor?: string;
  quality?: number;
  pixelRatio?: number;
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
}: PdfGenerationOptions): Promise<void> => {
  const cssPatch = applyCssRulesPatch();

  try {
    // Preload images
    await preloadImages(element);

    // Prepare content for PDF
    prepareContentForPdf(element);

    // Small delay to ensure all styles are applied
    await new Promise((resolve) => setTimeout(resolve, 200));

    // Generate image from element
    const imgData = await toPng(element, {
      quality,
      pixelRatio,
      backgroundColor,
      cacheBust: true,
      skipFonts: true,
      fontEmbedCSS: "",
      filter: (node) => {
        // Exclude elements with 'exclude-from-pdf' class from the PDF
        if (node instanceof HTMLElement) {
          return !node.classList.contains("exclude-from-pdf");
        }
        return true;
      },
    });

    // Compress image to JPEG
    const { data: compressedImgData, width: imgWidthPx, height: imgHeightPx } = await compressImageToJpeg(imgData, 0.85);

    // Create PDF
    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });

    const imgWidth = 210; // A4 width in mm
    const pageHeight = 297; // A4 height in mm

    // Calculate image height in mm
    const calculatedImgHeight = (imgHeightPx * imgWidth) / imgWidthPx;
    let heightLeft = calculatedImgHeight;
    let position = 0;

    // Add first page
    pdf.addImage(compressedImgData, "JPEG", 0, position, imgWidth, calculatedImgHeight, undefined, "FAST");
    heightLeft -= pageHeight;

    // Add additional pages if needed
    while (heightLeft >= 0) {
      position = heightLeft - calculatedImgHeight;
      pdf.addPage();
      pdf.addImage(compressedImgData, "JPEG", 0, position, imgWidth, calculatedImgHeight, undefined, "FAST");
      heightLeft -= pageHeight;
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
