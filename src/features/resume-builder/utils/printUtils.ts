// Print utility functions to handle clean printing without browser headers/footers

/**
 * Creates a print-optimized window with resume content
 * This approach uses browser's native print-to-PDF which handles all modern CSS including oklch
 */
export const createResumePrintWindow = (
  contentElement: HTMLElement,
  title: string = "Resume"
): Window | null => {
  try {
    // Use features to ensure popup doesn't interfere with main window
    const printWindow = window.open("", "_blank", "width=800,height=600,popup=yes");

    if (!printWindow || printWindow.closed) {
      throw new Error(
        "Unable to open print window. Please check popup blocker settings."
      );
    }

    // Simply get the HTML - don't manipulate DOM
    // The browser's print engine will handle all CSS correctly including oklch
    let contentHTML = '';
    
    try {
      // Clone element without appending to DOM to avoid side effects
      const clonedElement = contentElement.cloneNode(true) as HTMLElement;
      
      // Remove any interactive elements and non-printable content
      const nonPrintableSelectors = [
        'button',
        '.no-print',
        '[data-no-print]',
        '.cursor-pointer',
        'input',
        'select',
        'textarea'
      ];
      
      nonPrintableSelectors.forEach(selector => {
        try {
          clonedElement.querySelectorAll(selector).forEach(el => {
            el.remove();
          });
        } catch (e) {
          // Ignore selector errors
        }
      });

      // Get HTML content directly from clone
      contentHTML = clonedElement.innerHTML;
    } catch (cloneError) {
      // If cloning fails, just use the original innerHTML
      console.warn("Error processing element, using original:", cloneError);
      try {
        contentHTML = contentElement.innerHTML;
      } catch (e) {
        console.error("Error getting innerHTML:", e);
        contentHTML = '<p>Error loading resume content</p>';
      }
    }
    
    // Get all CSS link tags from the main document
    let cssLinks = '';
    try {
      const linkTags = document.querySelectorAll('link[rel="stylesheet"]');
      linkTags.forEach((link: Element) => {
        const href = link.getAttribute('href');
        if (href) {
          // Use absolute URL or relative path
          const absoluteHref = href.startsWith('http') ? href : new URL(href, window.location.origin).href;
          cssLinks += `<link rel="stylesheet" href="${absoluteHref}">\n`;
        }
      });
    } catch (e) {
      console.warn("Could not extract CSS link tags:", e);
    }

    // Get all inline style tags from the main document
    let inlineStyles = '';
    try {
      const styleTags = document.querySelectorAll('style');
      styleTags.forEach((style: Element) => {
        inlineStyles += `<style>${style.innerHTML}</style>\n`;
      });
    } catch (e) {
      console.warn("Could not extract inline style tags:", e);
    }

    // Also extract styles from stylesheets that can be accessed
    let extractedStyles = '';
    try {
      Array.from(document.styleSheets).forEach(sheet => {
        try {
          if (sheet.cssRules && !sheet.href) {
            // Include inline stylesheets (already processed as style tags)
            Array.from(sheet.cssRules).forEach(rule => {
              try {
                extractedStyles += rule.cssText + '\n';
              } catch (e) {
                // Skip rules that can't be accessed
              }
            });
          }
        } catch (e) {
          // Some stylesheets may not be accessible (CORS) - this is expected
        }
      });
    } catch (e) {
      console.warn("Could not extract all stylesheets:", e);
    }

    const printHTML = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${title}</title>
        ${cssLinks}
        ${inlineStyles}
        <style>
          /* Base reset */
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            color-adjust: exact !important;
          }
          
          /* Include extracted styles (if any) */
          ${extractedStyles || '/* No additional styles extracted */'}
          
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
            }
            
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Helvetica Neue', Arial, sans-serif;
              background: white !important;
              padding: 15mm;
            }
            
            /* Ensure proper page breaks */
            .resume-section {
              page-break-inside: avoid;
              break-inside: avoid;
            }
            
            h1, h2, h3 {
              page-break-after: avoid;
              break-after: avoid;
            }
            
            /* Remove shadows and non-essential effects for print */
            * {
              box-shadow: none !important;
              text-shadow: none !important;
            }
          }
          
          @media screen {
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Helvetica Neue', Arial, sans-serif;
              background: white;
              padding: 20px;
              max-width: 800px;
              margin: 0 auto;
            }
          }
          
          /* Preserve all styling from the original */
          [data-resume-content] {
            width: 100% !important;
            max-width: 100% !important;
          }
        </style>
      </head>
      <body>
        ${contentHTML}
        <script>
          // Wait for all stylesheets to load before printing
          function waitForStylesheets(callback) {
            const stylesheets = Array.from(document.querySelectorAll('link[rel="stylesheet"]'));
            if (stylesheets.length === 0) {
              callback();
              return;
            }
            
            // Check which stylesheets are already loaded
            const alreadyLoaded = stylesheets.filter(link => link.sheet !== null);
            const notLoaded = stylesheets.filter(link => link.sheet === null);
            
            // If all are already loaded, call callback immediately
            if (notLoaded.length === 0) {
              callback();
              return;
            }
            
            let loadedCount = alreadyLoaded.length;
            const totalCount = stylesheets.length;
            
            function checkComplete() {
              loadedCount++;
              if (loadedCount >= totalCount) {
                callback();
              }
            }
            
            // Set up load handlers for stylesheets that aren't loaded yet
            notLoaded.forEach(function(link) {
              link.onload = checkComplete;
              link.onerror = checkComplete; // Continue even if some fail
            });
            
            // Fallback timeout in case stylesheets don't load
            setTimeout(callback, 2000);
          }
          
          // Auto-trigger print dialog when window loads and styles are ready
          try {
            window.onload = function() {
              waitForStylesheets(function() {
              // Use requestAnimationFrame to ensure DOM is ready
              requestAnimationFrame(function() {
                setTimeout(function() {
                  try {
                    // Focus and print
                    window.focus();
                    window.print();
                  } catch (printError) {
                    console.error("Error triggering print:", printError);
                  }
                  }, 500);
                });
              });
            };
          } catch (e) {
            console.error("Error setting up print handler:", e);
          }
          
          // Ensure window can be closed and doesn't block parent
          window.addEventListener('beforeunload', function() {
            // Cleanup if needed
          });
        </script>
      </body>
      </html>
    `;

    try {
      printWindow.document.write(printHTML);
      printWindow.document.close();
      
      // Wait a bit for the window to be ready
      setTimeout(() => {
        try {
          printWindow.focus();
        } catch (e) {
          // Ignore focus errors
        }
      }, 100);
      
      return printWindow;
    } catch (writeError) {
      console.error("Error writing to print window:", writeError);
      try {
        printWindow.close();
      } catch (e) {
        // Ignore close errors
      }
      return null;
    }
  } catch (error) {
    console.error("Error creating print window:", error);
    return null;
  }
};

/**
 * Opens print dialog for resume using browser's native print-to-PDF
 * This bypasses html2canvas and handles all modern CSS correctly
 */
export const printResumeToPDF = (
  element: HTMLElement,
  title: string = "Resume"
): boolean => {
  try {
    // Get the actual resume content element - this is the exact same element shown in preview
    // The preview uses data-resume-content attribute, so we find it to ensure perfect match
    const contentElement = element.querySelector('[data-resume-content]') as HTMLElement || element;
    
    if (!contentElement) {
      console.error("Resume content element not found");
      return false;
    }

    // Create print window synchronously but ensure it doesn't block
    const printWindow = createResumePrintWindow(contentElement, title);
    
    if (!printWindow) {
      console.error("Failed to create print window");
      return false;
    }

    return true;
  } catch (error) {
    console.error("Print error:", error);
    return false;
  }
};

// Legacy function for backwards compatibility
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
