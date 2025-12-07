/**
 * Utility functions to read and extract text content from various ebook formats
 */

export interface ExtractedContent {
  text: string;
  title?: string;
  chapters?: string[];
  images?: Array<{
    data: string; // Base64 encoded image data
    pageIndex?: number; // For PDFs, which page the image is from
    format?: string; // Image format (png, jpeg, etc.)
  }>;
}

/**
 * Loads pdf.js library from CDN (using legacy build for better compatibility)
 */
const loadPdfJs = (): Promise<any> => {
  return new Promise((resolve, reject) => {
    // Check if already loaded
    if ((window as any).pdfjsLib || (window as any).pdfjs) {
      const lib = (window as any).pdfjsLib || (window as any).pdfjs;
      resolve(lib);
      return;
    }

    // Use legacy build for better browser compatibility
    const script = document.createElement("script");
    script.src =
      "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js";
    script.async = true;

    script.onload = () => {
      // Set worker path
      const pdfjsLib = (window as any).pdfjsLib || (window as any).pdfjs;
      if (pdfjsLib) {
        pdfjsLib.GlobalWorkerOptions.workerSrc =
          "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
        resolve(pdfjsLib);
      } else {
        reject(new Error("PDF.js failed to load"));
      }
    };

    script.onerror = () => {
      reject(new Error("Failed to load PDF.js library"));
    };

    document.head.appendChild(script);
  });
};

/**
 * Extracts text content from a PDF file using pdf.js
 */
export const extractTextFromPDF = async (
  file: File
): Promise<ExtractedContent> => {
  try {
    const arrayBuffer = await file.arrayBuffer();

    // Load pdf.js library
    let pdfjsLib: any;
    try {
      pdfjsLib = await loadPdfJs();
    } catch (loadError) {
      console.error("Failed to load PDF.js:", loadError);
      // Fallback: return file name as content
      const title = file.name.replace(/\.[^/.]+$/, "");
      return {
        text: `Content from ${title}\n\nPDF file detected. PDF.js library could not be loaded. Please check your internet connection.`,
        title,
      };
    }

    // Load the PDF document
    const loadingTask = pdfjsLib.getDocument({
      data: arrayBuffer,
      useWorkerFetch: false,
      isEvalSupported: false,
      useSystemFonts: true,
    });

    const pdf = await loadingTask.promise;
    const numPages = pdf.numPages;

    let fullText = "";
    const pages: string[] = [];
    const images: Array<{
      data: string;
      pageIndex: number;
      format: string;
    }> = [];

    // Extract text and images from each page
    for (let pageNum = 1; pageNum <= numPages; pageNum++) {
      try {
        const page = await pdf.getPage(pageNum);
        const textContent = await page.getTextContent();

        // Combine all text items from the page
        const pageText = textContent.items
          .map((item: any) => {
            // Handle text items with transform information
            if (item.str) {
              return item.str;
            }
            return "";
          })
          .filter((text: string) => text.trim().length > 0)
          .join(" ");

        if (pageText.trim().length > 0) {
          fullText += pageText + "\n\n";
          pages.push(pageText);
        }

        // Extract images from the page
        try {
          const operatorList = await page.getOperatorList();
          const ops = operatorList.fnArray;
          const argsArray = operatorList.argsArray;

          for (let i = 0; i < ops.length; i++) {
            // Look for image rendering operators (Do - Draw Object)
            if (ops[i] === pdfjsLib.OPS.paintImageXObject || 
                ops[i] === pdfjsLib.OPS.paintJpegXObject ||
                ops[i] === pdfjsLib.OPS.paintImageXObjectGroup) {
              try {
                const imageName = argsArray[i][0];
                const imageObj = await page.objs.get(imageName);
                
                if (imageObj && imageObj.data) {
                  // Convert image data to base64
                  let base64Data = "";
                  if (imageObj.data instanceof Uint8Array) {
                    // Convert Uint8Array to base64
                    const binary = Array.from(imageObj.data as Uint8Array)
                      .map((byte) => String.fromCharCode(byte))
                      .join("");
                    base64Data = btoa(binary);
                  } else if (typeof imageObj.data === "string") {
                    base64Data = imageObj.data;
                  }

                  if (base64Data) {
                    // Determine image format
                    let format = "png";
                    if (imageName.includes("jpeg") || imageName.includes("jpg")) {
                      format = "jpeg";
                    }

                    images.push({
                      data: `data:image/${format};base64,${base64Data}`,
                      pageIndex: pageNum - 1,
                      format,
                    });
                  }
                }
              } catch (imgError) {
                // Skip images that can't be extracted
                console.warn(`Error extracting image from page ${pageNum}:`, imgError);
              }
            }
          }
        } catch (imgExtractError) {
          // If image extraction fails, continue with text extraction
          console.warn(`Error extracting images from page ${pageNum}:`, imgExtractError);
        }
      } catch (pageError) {
        console.warn(`Error extracting text from page ${pageNum}:`, pageError);
        // Continue with other pages
      }
    }

    // Extract title from first page or use file name
    let title = file.name.replace(/\.[^/.]+$/, "");
    if (pages.length > 0 && pages[0]) {
      // Try to find a title in the first page (first few lines or first sentence)
      const firstPageLines = pages[0]
        .split("\n")
        .filter((line) => line.trim().length > 0);
      if (firstPageLines.length > 0) {
        const potentialTitle = firstPageLines[0].trim().substring(0, 100);
        if (potentialTitle.length > 5) {
          title = potentialTitle;
        }
      }
    }

    // If no text was extracted, provide a message
    if (!fullText.trim()) {
      return {
        text: `Content from ${title}\n\nPDF file processed. This PDF may contain only images or scanned content. Text extraction was not possible.`,
        title,
        chapters: [],
        images: images.length > 0 ? images : undefined,
      };
    }

    return {
      text: fullText.trim(),
      title,
      chapters: pages.length > 0 ? pages : [fullText],
      images: images.length > 0 ? images : undefined,
    };
  } catch (error) {
    console.error("Error extracting PDF text:", error);
    const title = file.name.replace(/\.[^/.]+$/, "");
    return {
      text: `Content from ${title}\n\nError processing PDF: ${
        error instanceof Error ? error.message : "Unknown error"
      }`,
      title,
    };
  }
};

/**
 * Extracts text content from an EPUB file
 */
export const extractTextFromEPUB = async (
  file: File
): Promise<ExtractedContent> => {
  try {
    // For EPUB, we'll use a simpler approach - read as zip and extract HTML
    // Note: Full EPUB parsing requires epub.js library
    // EPUB is a ZIP file with HTML content, but for POC we'll provide a message
    const text = `Content from ${file.name}\n\nEPUB file detected. Full text extraction requires additional processing.`;

    return {
      text,
      title: file.name.replace(/\.[^/.]+$/, ""),
    };
  } catch (error) {
    console.error("Error extracting EPUB text:", error);
    return {
      text: `Content from ${file.name}`,
      title: file.name.replace(/\.[^/.]+$/, ""),
    };
  }
};

/**
 * Extracts text content from a text file
 */
export const extractTextFromTXT = async (
  file: File
): Promise<ExtractedContent> => {
  return new Promise((resolve, reject) => {
    try {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const text = e.target?.result as string;
          if (!text || text.trim().length === 0) {
            reject(new Error("File is empty"));
            return;
          }

          // Split into paragraphs (double newlines) or lines
          const paragraphs = text
            .split(/\n\s*\n/)
            .filter((p) => p.trim().length > 0);
          const lines = text
            .split("\n")
            .filter((line) => line.trim().length > 0);

          // Use first line or first paragraph as title
          const title =
            lines[0]?.trim().substring(0, 100) ||
            paragraphs[0]?.trim().substring(0, 100) ||
            file.name.replace(/\.[^/.]+$/, "");

          resolve({
            text: text.trim(),
            title,
            chapters: paragraphs.length > 1 ? paragraphs : lines,
          });
        } catch (parseError) {
          reject(new Error("Failed to parse text content"));
        }
      };
      reader.onerror = () => {
        reject(new Error("Failed to read file"));
      };
      reader.readAsText(file, "UTF-8");
    } catch (error) {
      reject(
        error instanceof Error ? error : new Error("Unknown error reading file")
      );
    }
  });
};

/**
 * Main function to extract content from any supported file type
 */
export const extractBookContent = async (
  file: File
): Promise<ExtractedContent> => {
  const fileName = file.name.toLowerCase();

  if (fileName.endsWith(".pdf")) {
    return extractTextFromPDF(file);
  } else if (fileName.endsWith(".epub") || fileName.endsWith(".mobi")) {
    return extractTextFromEPUB(file);
  } else if (fileName.endsWith(".txt")) {
    return extractTextFromTXT(file);
  } else {
    // Default: try to read as text
    return extractTextFromTXT(file);
  }
};
