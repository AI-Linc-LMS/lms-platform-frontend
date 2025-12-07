/**
 * Download utility functions for ebook processing
 * Generates PPT, DOCX, and PDF files from extracted book content
 */

import { ExtractedContent } from "./fileReader";
import PptxGenJS from "pptxgenjs";

/**
 * Downloads a PowerPoint presentation file generated from book content
 * Creates a real PPTX file using pptxgenjs
 */
export const downloadPPT = (
  bookName: string,
  content: ExtractedContent,
  originalFileName?: string,
  clientName?: string
): void => {
  try {
    // Create a new presentation
    const pptx = new PptxGenJS();

    // Set presentation properties
    pptx.author = clientName || "LMS Platform";
    pptx.company = clientName || "AI Linc";
    pptx.title = content.title || bookName;
    pptx.subject = "Ebook Content";

    // Get chapters or split text into chapters
    const chapters =
      content.chapters && content.chapters.length > 0
        ? content.chapters.slice(0, 50) // Limit to 50 chapters
        : splitIntoChapters(content.text);

    // Get images and map them by page/chapter index
    const images = content.images || [];
    const imagesByChapter = new Map<
      number,
      Array<{ data: string; format?: string }>
    >();

    images.forEach((img) => {
      const chapterIndex = img.pageIndex ?? 0;
      if (!imagesByChapter.has(chapterIndex)) {
        imagesByChapter.set(chapterIndex, []);
      }
      imagesByChapter.get(chapterIndex)!.push({
        data: img.data,
        format: img.format,
      });
    });

    // Add title slide
    const titleSlide = pptx.addSlide();
    titleSlide.addText(content.title || bookName, {
      x: 1,
      y: 2.5,
      w: 8,
      h: 1.5,
      fontSize: 44,
      bold: true,
      color: "1a1a1a",
      align: "center",
      valign: "middle",
    });

    // Add slides for each chapter
    chapters.forEach((chapterContent, chapterIndex) => {
      // Get images for this chapter
      const chapterImages = imagesByChapter.get(chapterIndex) || [];

      // Split chapter content into multiple slides if it's too long
      const chapterSlides = splitIntoSlides(chapterContent, 800);

      chapterSlides.forEach((slideContent, slideIndex) => {
        const slide = pptx.addSlide();

        // Add chapter title/header
        const chapterTitle = `Chapter ${chapterIndex + 1}${
          chapterSlides.length > 1 ? ` - Part ${slideIndex + 1}` : ""
        }`;
        slide.addText(chapterTitle, {
          x: 0.5,
          y: 0.3,
          w: 9,
          h: 0.6,
          fontSize: 28,
          bold: true,
          color: "0078d4",
          align: "left",
        });

        // Add images if available (only on first slide of chapter or distribute them)
        if (chapterImages.length > 0 && slideIndex === 0) {
          // Add first image(s) to the slide
          const imagesToAdd = chapterImages.slice(0, 2); // Max 2 images per slide

          if (imagesToAdd.length === 1) {
            // Single image - center it
            try {
              slide.addImage({
                data: imagesToAdd[0].data,
                x: 1,
                y: 1.2,
                w: 8,
                h: 4,
              });
            } catch (imgError) {
              console.warn("Failed to add image to slide:", imgError);
            }
          } else if (imagesToAdd.length === 2) {
            // Two images - side by side
            try {
              slide.addImage({
                data: imagesToAdd[0].data,
                x: 0.5,
                y: 1.2,
                w: 4.5,
                h: 3,
              });
              slide.addImage({
                data: imagesToAdd[1].data,
                x: 5,
                y: 1.2,
                w: 4.5,
                h: 3,
              });
            } catch (imgError) {
              console.warn("Failed to add images to slide:", imgError);
            }
          }

          // Add text below images
          const cleanText = slideContent
            .trim()
            .replace(/\n\s*\n/g, "\n")
            .replace(/\n+/g, " ")
            .substring(0, 1000);

          if (cleanText.length > 0) {
            slide.addText(cleanText, {
              x: 0.5,
              y: 4.5,
              w: 9,
              h: 2,
              fontSize: 18,
              color: "333333",
              align: "left",
              valign: "top",
              lineSpacing: 24,
              wrap: true,
            });
          }
        } else {
          // No images or not first slide - add text content
          const cleanText = slideContent
            .trim()
            .replace(/\n\s*\n/g, "\n")
            .replace(/\n+/g, " ")
            .substring(0, 2000);

          if (cleanText.length > 0) {
            slide.addText(cleanText, {
              x: 0.5,
              y: 1.2,
              w: 9,
              h: 5,
              fontSize: 20,
              color: "333333",
              align: "left",
              valign: "top",
              lineSpacing: 28,
              wrap: true,
            });
          }
        }

        // Add slide number at the bottom
        slide.addText(`Chapter ${chapterIndex + 1} - Slide ${slideIndex + 1}`, {
          x: 8,
          y: 6.8,
          w: 1.5,
          h: 0.3,
          fontSize: 12,
          color: "666666",
          align: "right",
        });
      });
    });

    // Get base file name from original file or use book name
    const baseFileName = originalFileName
      ? originalFileName.replace(/\.[^/.]+$/, "")
      : sanitizeFileName(content.title || bookName);

    // Generate and download the PPTX file
    pptx.writeFile({ fileName: `${baseFileName}.pptx` });
  } catch (error) {
    throw new Error(
      `Failed to generate PPTX: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
};

/**
 * Downloads a Word document file generated from book content
 * Creates an HTML file that Word can open and save as DOCX
 */
export const downloadDOCX = (
  bookName: string,
  content: ExtractedContent,
  originalFileName?: string
): void => {
  // Get base file name from original file or use book name
  const baseFileName = originalFileName
    ? originalFileName.replace(/\.[^/.]+$/, "")
    : sanitizeFileName(content.title || bookName);

  // Create HTML content that Word can open and save as DOCX
  const htmlContent = `<!DOCTYPE html>
<html xmlns:o="urn:schemas-microsoft-com:office:office"
      xmlns:w="urn:schemas-microsoft-com:office:word"
      xmlns="http://www.w3.org/TR/REC-html40">
<head>
  <meta charset="UTF-8">
  <meta name="ProgId" content="Word.Document">
  <meta name="Generator" content="Microsoft Word">
  <meta name="Originator" content="Microsoft Word">
  <title>${escapeHTML(content.title || bookName)}</title>
  <style>
    @page {
      size: 8.5in 11in;
      margin: 1in 1.25in;
    }
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: "Calibri", "Arial", sans-serif;
      font-size: 11pt;
      line-height: 1.6;
      color: #000000;
      margin: 0;
      padding: 0;
      text-align: left;
    }
    .title {
      font-size: 28pt;
      font-weight: bold;
      text-align: center;
      margin-bottom: 36pt;
      margin-top: 24pt;
      border-bottom: 3pt solid #000000;
      padding-bottom: 18pt;
      line-height: 1.2;
      color: #1a1a1a;
    }
    .content {
      margin-top: 24pt;
    }
    p {
      margin: 0;
      margin-bottom: 12pt;
      text-align: justify;
      text-indent: 0;
      orphans: 2;
      widows: 2;
      line-height: 1.6;
    }
    p:first-of-type {
      margin-top: 0;
    }
    p:last-of-type {
      margin-bottom: 0;
    }
    .paragraph-spacing {
      margin-bottom: 18pt;
    }
  </style>
</head>
<body>
  <div class="title">${escapeHTML(content.title || bookName)}</div>
  <div class="content">
    ${formatTextForDOCX(content.text)}
  </div>
</body>
</html>`;

  // Create blob and download as HTML (Word can open and save as DOCX)
  const blob = new Blob([htmlContent], { type: "application/msword" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${baseFileName}.doc`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

/**
 * Downloads a PDF file generated from book content
 */
export const downloadPDF = (
  bookName: string,
  content: ExtractedContent,
  originalFileName?: string
): void => {
  // Create a simple PDF with the extracted text
  // For better PDF generation, you could use html2pdf.js (already in project)
  // or jsPDF library

  // Create HTML content for PDF generation
  const htmlContent = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    @page {
      size: A4;
      margin: 2.5cm 2cm;
    }
    body {
      font-family: "Times New Roman", "Georgia", serif;
      font-size: 12pt;
      line-height: 1.8;
      color: #1a1a1a;
      padding: 0;
      background: #ffffff;
    }
    .container {
      max-width: 100%;
      margin: 0 auto;
    }
    h1 {
      font-size: 24pt;
      font-weight: bold;
      color: #000000;
      text-align: center;
      margin-bottom: 30pt;
      margin-top: 20pt;
      border-bottom: 3pt solid #000000;
      padding-bottom: 15pt;
      line-height: 1.3;
    }
    .content {
      margin-top: 20pt;
    }
    p {
      margin: 0;
      margin-bottom: 12pt;
      text-align: justify;
      text-indent: 0;
      orphans: 3;
      widows: 3;
      line-height: 1.8;
    }
    p:first-of-type {
      margin-top: 0;
    }
    p:last-of-type {
      margin-bottom: 0;
    }
    .paragraph-break {
      margin-bottom: 18pt;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>${escapeHTML(content.title || bookName)}</h1>
    <div class="content">
      ${formatTextForPDF(content.text)}
    </div>
  </div>
</body>
</html>`;

  // Create a blob with HTML content
  const blob = new Blob([htmlContent], { type: "text/html" });
  const url = URL.createObjectURL(blob);

  // Open in new window and trigger print (user can save as PDF)
  const printWindow = window.open(url, "_blank");
  if (printWindow) {
    printWindow.onload = () => {
      setTimeout(() => {
        printWindow.print();
      }, 250);
    };
  }

  // Also provide direct download option with text content
  const baseFileName = originalFileName
    ? originalFileName.replace(/\.[^/.]+$/, "")
    : sanitizeFileName(content.title || bookName);

  setTimeout(() => {
    const textBlob = new Blob([content.text], { type: "text/plain" });
    const textUrl = URL.createObjectURL(textBlob);
    const link = document.createElement("a");
    link.href = textUrl;
    link.download = `${baseFileName}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(textUrl);
  }, 1000);
};

/**
 * Helper function to split text into chapters
 */
const splitIntoChapters = (text: string): string[] => {
  // Try to split by common chapter markers
  const chapterPatterns = [
    /(?:^|\n)\s*(?:Chapter|CHAPTER|Ch\.|CH\.)\s+\d+/i,
    /(?:^|\n)\s*\d+\.\s+[A-Z]/,
    /(?:^|\n)\s*#{1,3}\s+/,
    /(?:^|\n)\s*[IVX]+\.\s+/,
  ];

  for (const pattern of chapterPatterns) {
    const matches = text.split(pattern);
    if (matches.length > 1) {
      // Found chapter markers
      const chapters: string[] = [];
      const parts = text.split(pattern);

      // First part might be intro, rest are chapters
      if (parts[0]?.trim()) {
        chapters.push(parts[0].trim());
      }

      // Reconstruct chapters with their markers
      const markers = text.match(new RegExp(pattern.source, "gi")) || [];
      for (let i = 1; i < parts.length; i++) {
        const marker = markers[i - 1] || "";
        const chapterText = (marker + parts[i]).trim();
        if (chapterText) {
          chapters.push(chapterText);
        }
      }

      if (chapters.length > 1) {
        return chapters;
      }
    }
  }

  // If no chapter markers found, split by double newlines or large paragraphs
  const paragraphs = text.split(/\n\s*\n/).filter((p) => p.trim().length > 0);
  if (paragraphs.length > 3) {
    return paragraphs;
  }

  // Last resort: split by sentences into reasonable chunks
  return splitIntoSlides(text, 2000);
};

/**
 * Helper function to split text into slides
 */
const splitIntoSlides = (text: string, maxLength: number): string[] => {
  const slides: string[] = [];
  let currentSlide = "";

  const sentences = text.split(/[.!?]\s+/);
  for (const sentence of sentences) {
    if (currentSlide.length + sentence.length > maxLength && currentSlide) {
      slides.push(currentSlide.trim());
      currentSlide = sentence;
    } else {
      currentSlide += (currentSlide ? ". " : "") + sentence;
    }
  }

  if (currentSlide.trim()) {
    slides.push(currentSlide.trim());
  }

  return slides.length > 0 ? slides : [text];
};

/**
 * Escapes HTML special characters
 */
const escapeHTML = (str: string): string => {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
};

/**
 * Formats text for PDF display (preserves paragraphs with proper spacing)
 */
const formatTextForPDF = (text: string): string => {
  // Split by double newlines for paragraphs
  const paragraphs = text.split(/\n\s*\n/).filter((p) => p.trim().length > 0);

  if (paragraphs.length > 1) {
    return paragraphs
      .map((paragraph, index) => {
        const trimmed = paragraph.trim();
        // Handle single newlines within paragraphs (convert to spaces)
        const formatted = trimmed.replace(/\n+/g, " ");
        return `<p class="${index > 0 ? "paragraph-break" : ""}">${escapeHTML(
          formatted
        )}</p>`;
      })
      .join("\n");
  } else {
    // Single paragraph - split by single newlines and join with spaces
    const formatted = text.trim().replace(/\n+/g, " ");
    return `<p>${escapeHTML(formatted)}</p>`;
  }
};

/**
 * Formats text for DOCX display (preserves paragraphs and line breaks)
 */
const formatTextForDOCX = (text: string): string => {
  // Split by double newlines for paragraphs, single newlines for line breaks
  const paragraphs = text.split(/\n\s*\n/).filter((p) => p.trim().length > 0);

  if (paragraphs.length > 1) {
    // Multiple paragraphs
    return paragraphs
      .map((paragraph) => {
        // Handle line breaks within paragraphs
        const lines = paragraph.split(/\n/).filter((l) => l.trim().length > 0);
        if (lines.length > 1) {
          return lines
            .map((line) => `<p>${escapeHTML(line.trim())}</p>`)
            .join("\n");
        }
        return `<p>${escapeHTML(paragraph.trim())}</p>`;
      })
      .join("\n");
  } else {
    // Single paragraph or no clear paragraph breaks
    const lines = text.split(/\n/).filter((l) => l.trim().length > 0);
    return lines.map((line) => `<p>${escapeHTML(line.trim())}</p>`).join("\n");
  }
};

/**
 * Sanitizes a file name by removing invalid characters
 */
const sanitizeFileName = (fileName: string): string => {
  return fileName
    .replace(/[^a-z0-9]/gi, "_")
    .replace(/_+/g, "_")
    .replace(/^_|_$/g, "")
    .substring(0, 100); // Limit length
};
