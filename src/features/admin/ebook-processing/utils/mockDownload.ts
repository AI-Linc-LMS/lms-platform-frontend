/**
 * Download utility functions for ebook processing
 * Generates PPT, DOCX, and PDF files from extracted book content
 */

import { ExtractedContent } from "./fileReader";

/**
 * Downloads a PowerPoint presentation file generated from book content
 * Creates an HTML file that can be opened in PowerPoint or converted to PPTX
 */
export const downloadPPT = (
  bookName: string,
  content: ExtractedContent,
  originalFileName?: string
): void => {
  // Split content into slides
  const slides =
    content.chapters && content.chapters.length > 0
      ? content.chapters.slice(0, 50) // Limit to 50 slides
      : splitIntoSlides(content.text, 800);

  // Create HTML that PowerPoint can open
  const htmlContent = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${escapeHTML(content.title || bookName)}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: 'Segoe UI', Arial, sans-serif;
      margin: 0;
      padding: 20px;
      background: #f5f5f5;
    }
    .slide {
      width: 960px;
      min-height: 720px;
      margin: 30px auto;
      background: linear-gradient(to bottom, #ffffff 0%, #f8f9fa 100%);
      padding: 60px 80px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.15);
      page-break-after: always;
      display: flex;
      flex-direction: column;
      border-radius: 8px;
    }
    .slide-title {
      font-size: 36px;
      font-weight: 700;
      color: #1a1a1a;
      margin-bottom: 40px;
      border-bottom: 4px solid #0078d4;
      padding-bottom: 20px;
      line-height: 1.2;
    }
    .slide-content {
      font-size: 20px;
      line-height: 1.8;
      color: #333333;
      flex: 1;
      overflow: hidden;
      margin-top: 20px;
    }
    .slide-content p {
      margin-bottom: 20px;
      text-align: left;
    }
    .slide-content p:last-child {
      margin-bottom: 0;
    }
    .slide-number {
      text-align: right;
      color: #666666;
      font-size: 14px;
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid #e0e0e0;
      font-weight: 500;
    }
    @media print {
      body {
        background: white;
        padding: 0;
      }
      .slide {
        margin: 0;
        box-shadow: none;
        border-radius: 0;
        page-break-after: always;
      }
    }
  </style>
</head>
<body>
  ${slides
    .map(
      (slide, index) => `
    <div class="slide">
      <div class="slide-title">${escapeHTML(content.title || bookName)}</div>
      <div class="slide-content">${formatSlideContent(slide)}</div>
      <div class="slide-number">Slide ${index + 1} of ${slides.length}</div>
    </div>
  `
    )
    .join("\n")}
</body>
</html>`;

  // Get base file name from original file or use book name
  const baseFileName = originalFileName
    ? originalFileName.replace(/\.[^/.]+$/, "")
    : sanitizeFileName(content.title || bookName);

  // Create blob and download
  const blob = new Blob([htmlContent], { type: "text/html" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${baseFileName}.html`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  // Also create a text-based version that can be imported into PowerPoint
  setTimeout(() => {
    const pptText = slides
      .map(
        (slide, index) => `Slide ${index + 1}\n${"=".repeat(50)}\n${slide}\n\n`
      )
      .join("\n");

    const textBlob = new Blob([pptText], { type: "text/plain" });
    const textUrl = URL.createObjectURL(textBlob);
    const textLink = document.createElement("a");
    textLink.href = textUrl;
    textLink.download = `${baseFileName}_slides.txt`;
    document.body.appendChild(textLink);
    textLink.click();
    document.body.removeChild(textLink);
    URL.revokeObjectURL(textUrl);
  }, 500);

  URL.revokeObjectURL(url);
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
 * Formats slide content with proper spacing and line breaks
 */
const formatSlideContent = (text: string): string => {
  // Split by double newlines first for paragraphs
  const paragraphs = text.split(/\n\s*\n/).filter((p) => p.trim().length > 0);

  if (paragraphs.length > 1) {
    // Multiple paragraphs
    return paragraphs
      .map((para) => {
        const trimmed = para.trim();
        // Replace single newlines with spaces within paragraphs
        const formatted = trimmed.replace(/\n+/g, " ");
        return `<p style="margin: 0 0 20px 0; line-height: 1.8;">${escapeHTML(
          formatted
        )}</p>`;
      })
      .join("\n");
  } else {
    // Single paragraph or lines - format with proper spacing
    const lines = text.split(/\n/).filter((l) => l.trim().length > 0);
    if (lines.length > 1) {
      // Multiple lines - join with spaces for better readability
      const formatted = lines.join(" ");
      return `<p style="margin: 0; line-height: 1.8;">${escapeHTML(
        formatted
      )}</p>`;
    } else {
      // Single line
      return `<p style="margin: 0; line-height: 1.8;">${escapeHTML(
        text.trim()
      )}</p>`;
    }
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
