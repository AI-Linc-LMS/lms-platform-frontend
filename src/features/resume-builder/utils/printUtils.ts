// Print utility functions to handle clean printing without browser headers/footers

export const createPrintWindow = (
  content: string,
  title: string = "Resume"
) => {
  const printWindow = window.open("", "_blank", "width=800,height=600");

  if (!printWindow) {
    throw new Error(
      "Unable to open print window. Please check popup blocker settings."
    );
  }

  const printHTML = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${title}</title>
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        @media print {
          @page {
            size: A4;
            margin: 0;
          }
          
          html, body {
            width: 210mm;
            height: 297mm;
            margin: 0;
            padding: 0;
            -webkit-print-color-adjust: exact !important;
            color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
            font-size: 12pt;
            line-height: 1.4;
            color: #333;
            background: white;
            padding: 0.5in;
          }
        }
        
        @media screen {
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
            font-size: 14px;
            line-height: 1.4;
            color: #333;
            background: white;
            padding: 20px;
            max-width: 800px;
            margin: 0 auto;
          }
        }
        
        /* SVG Icon sizing for all media */
        svg {
          width: 14px !important;
          height: 14px !important;
          max-width: 14px !important;
          max-height: 14px !important;
          fill: currentColor !important;
          stroke: currentColor !important;
          display: inline-block !important;
          vertical-align: middle !important;
          flex-shrink: 0 !important;
        }
        
        .contact-icon svg,
        .icon svg {
          width: 12px !important;
          height: 12px !important;
        }
        
        /* Typography */
        h1 {
          font-size: 24pt;
          font-weight: bold;
          margin-bottom: 8pt;
          page-break-after: avoid;
        }
        
        h2 {
          font-size: 16pt;
          font-weight: bold;
          margin-top: 16pt;
          margin-bottom: 8pt;
          page-break-after: avoid;
          border-bottom: 1pt solid #333;
          padding-bottom: 4pt;
        }
        
        h3 {
          font-size: 14pt;
          font-weight: bold;
          margin-top: 8pt;
          margin-bottom: 4pt;
        }
        
        p, li {
          font-size: 11pt;
          line-height: 1.3;
          margin-bottom: 4pt;
        }
        
        /* Sections */
        .resume-section {
          margin-bottom: 16pt;
          page-break-inside: avoid;
        }
        
        /* Contact info */
        .contact-info {
          display: flex;
          flex-direction: column;
          gap: 4pt;
          margin-bottom: 12pt;
        }
        
        .contact-item {
          display: flex;
          align-items: center;
          gap: 6pt;
          font-size: 10pt;
        }
        
        /* Entry formatting */
        .entry {
          margin-bottom: 12pt;
          page-break-inside: avoid;
        }
        
        .entry-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 4pt;
        }
        
        /* Flex layouts */
        .flex {
          display: flex;
        }
        
        .items-center {
          align-items: center;
        }
        
        .justify-between {
          justify-content: space-between;
        }
        
        .gap-1 {
          gap: 4px;
        }
        
        .gap-4 {
          gap: 16px;
        }
        
        /* Colors */
        .text-blue-600, .text-blue-700 {
          color: #1e40af !important;
        }
        
        .text-gray-600 {
          color: #4b5563 !important;
        }
        
        .text-gray-700 {
          color: #374151 !important;
        }
        
        .text-gray-800, .text-gray-900 {
          color: #1f2937 !important;
        }
        
        /* Borders */
        .border-blue-600 {
          border-color: #1e40af !important;
        }
        
        .border-gray-300 {
          border-color: #d1d5db !important;
        }
        
        /* Hide backgrounds for print */
        .bg-blue-50, .bg-gray-50, .bg-white {
          background: transparent !important;
        }
        
        /* Remove shadows */
        .shadow, .shadow-lg, .shadow-xl {
          box-shadow: none !important;
        }
        
        /* Hide interactive elements */
        .no-print, button, .cursor-pointer {
          display: none !important;
        }
      </style>
    </head>
    <body>
      ${content}
    </body>
    </html>
  `;

  printWindow.document.write(printHTML);
  printWindow.document.close();

  return printWindow;
};

export const printWithoutHeaders = (
  element: HTMLElement,
  title: string = "Resume"
) => {
  try {
    const content = element.innerHTML;
    const printWindow = createPrintWindow(content, title);

    // Wait for content to load
    printWindow.onload = () => {
      setTimeout(() => {
        printWindow.focus();
        printWindow.print();

        // Close after a delay to ensure printing completes
        setTimeout(() => {
          printWindow.close();
        }, 1000);
      }, 500);
    };

    return true;
  } catch (error) {
    console.error("Print error:", error);
    return false;
  }
};
