"use client";

import { useState } from "react";
import { Box, Typography, Paper, Button, CircularProgress, Alert } from "@mui/material";
import { IconWrapper } from "@/components/common/IconWrapper";
import { toPng } from "html-to-image";
import { jsPDF } from "jspdf";

const PDF_CONTENT_SELECTOR = "[data-scorecard-pdf-content]";
const PDF_EXCLUDE_SELECTOR = "[data-scorecard-pdf-exclude]";

/** A4 in mm */
const A4_WIDTH_MM = 210;
const A4_HEIGHT_MM = 297;
/** Margins (mm) — same as resume-style export */
const MARGIN_MM = 10;
const CONTENT_WIDTH_MM = A4_WIDTH_MM - 2 * MARGIN_MM;
const CONTENT_HEIGHT_MM = A4_HEIGHT_MM - 2 * MARGIN_MM;

/** Capture width in px so layout matches desktop (avoids squashed graphs/cards). 210mm is too narrow. */
const CAPTURE_WIDTH_PX = 1200;
const PIXEL_RATIO = 2;

function getSuggestedFilename(): string {
  const d = new Date();
  const dateStr = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`;
  return `scorecard_${dateStr}.pdf`;
}

/** Convert img[src] in element to data URLs so they embed in the capture (avoids CORS). */
async function convertImagesInElementToDataUrls(el: HTMLElement): Promise<void> {
  const imgs = el.querySelectorAll("img[src]");
  await Promise.all(
    Array.from(imgs).map(
      (img) =>
        new Promise<void>((resolve) => {
          const src = (img as HTMLImageElement).getAttribute("src");
          if (!src || src.startsWith("data:")) {
            resolve();
            return;
          }
          const image = new Image();
          image.crossOrigin = "anonymous";
          image.onload = () => {
            try {
              const canvas = document.createElement("canvas");
              canvas.width = image.naturalWidth;
              canvas.height = image.naturalHeight;
              const ctx = canvas.getContext("2d");
              if (ctx) {
                ctx.drawImage(image, 0, 0);
                (img as HTMLImageElement).setAttribute("src", canvas.toDataURL("image/png"));
              }
            } finally {
              resolve();
            }
          };
          image.onerror = () => resolve();
          image.src = src;
        })
    )
  );
}

export function ExportShareSection() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDownloadPDF = async () => {
    setError(null);
    setLoading(true);

    const el = document.querySelector(PDF_CONTENT_SELECTOR);
    if (!el || !(el instanceof HTMLElement)) {
      setError("Scorecard content not found. Please refresh and try again.");
      setLoading(false);
      return;
    }

    const origDescriptor = Object.getOwnPropertyDescriptor(CSSStyleSheet.prototype, "cssRules");
    let patched = false;
    try {
      Object.defineProperty(CSSStyleSheet.prototype, "cssRules", {
        get: function () {
          try {
            return origDescriptor?.get?.call(this) ?? [];
          } catch {
            return [];
          }
        },
        configurable: true,
        enumerable: origDescriptor?.enumerable ?? true,
      });
      patched = true;
    } catch {
      /* continue without patch */
    }

    try {
      await new Promise((r) => setTimeout(r, 300));
      await convertImagesInElementToDataUrls(el);

      const wrapper = document.createElement("div");
      wrapper.style.cssText =
        "position:fixed;left:-9999px;top:0;width:" +
        CAPTURE_WIDTH_PX +
        "px;overflow:visible;pointer-events:none;z-index:-1;min-height:0;";
      document.body.appendChild(wrapper);

      const clone = el.cloneNode(true) as HTMLElement;

      clone.querySelectorAll(PDF_EXCLUDE_SELECTOR).forEach((node) => node.remove());

      clone.style.setProperty("transform", "none", "important");
      clone.style.setProperty("box-shadow", "none", "important");
      clone.style.setProperty("width", CAPTURE_WIDTH_PX + "px", "important");
      clone.style.setProperty("max-width", CAPTURE_WIDTH_PX + "px", "important");
      clone.style.setProperty("overflow", "visible", "important");
      clone.style.setProperty("background", "#f9fafb", "important");
      clone.style.setProperty("padding", "0", "important");
      clone.style.setProperty("box-sizing", "border-box", "important");

      const headerRow = clone.firstElementChild as HTMLElement | null;
      if (headerRow?.style) {
        headerRow.style.setProperty("justify-content", "flex-start", "important");
        headerRow.style.setProperty("width", "100%", "important");
      }

      const sectionsContainer = clone.children[1] as HTMLElement | undefined;
      if (sectionsContainer?.style) {
        sectionsContainer.style.setProperty("width", "100%", "important");
        sectionsContainer.style.setProperty("max-width", "100%", "important");
        sectionsContainer.style.setProperty("box-sizing", "border-box", "important");
      }

      clone.querySelectorAll(".recharts-wrapper, .recharts-surface, [class*='recharts']").forEach((node) => {
        if (node instanceof HTMLElement) {
          node.style.setProperty("overflow", "visible", "important");
        }
      });
      wrapper.appendChild(clone);

      await new Promise((r) => setTimeout(r, 600));

      const fullHeight = Math.max(clone.scrollHeight, clone.offsetHeight, 1);
      clone.style.setProperty("height", fullHeight + "px", "important");
      clone.style.setProperty("min-height", fullHeight + "px", "important");
      wrapper.style.minHeight = fullHeight + 100 + "px";

      await new Promise((r) => setTimeout(r, 200));

      const dataUrl = await toPng(clone, {
        pixelRatio: PIXEL_RATIO,
        backgroundColor: "#f9fafb",
        cacheBust: true,
      });

      document.body.removeChild(wrapper);

      if (patched && origDescriptor) {
        try {
          Object.defineProperty(CSSStyleSheet.prototype, "cssRules", origDescriptor);
        } catch {
          /* ignore */
        }
      }

      const img = new Image();
      img.src = dataUrl;
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error("Image load failed"));
      });

      const W = img.naturalWidth;
      const H = img.naturalHeight;
      if (!W || !H) {
        setError("Failed to capture scorecard content.");
        setLoading(false);
        return;
      }

      // Content fits 190mm width; full content height in mm = H * (190 / W)
      const fullContentHeightMm = (H * CONTENT_WIDTH_MM) / W;
      const numPages = Math.ceil(fullContentHeightMm / CONTENT_HEIGHT_MM);
      // One page in content = 277mm; in source image that is 277 * (W/190) pixels
      const sourceSliceHeightPx = (CONTENT_HEIGHT_MM * W) / CONTENT_WIDTH_MM;

      const pdf = new jsPDF("p", "mm", "a4");

      for (let i = 0; i < numPages; i++) {
        if (i > 0) pdf.addPage();

        const sy = i * sourceSliceHeightPx;
        const sh = Math.min(sourceSliceHeightPx, H - sy);
        const destHeightMm = (sh * CONTENT_WIDTH_MM) / W;

        const canvas = document.createElement("canvas");
        canvas.width = W;
        canvas.height = Math.round(sh);
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          setError("Canvas not available.");
          setLoading(false);
          return;
        }
        ctx.fillStyle = "#f9fafb";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, sy, W, sh, 0, 0, W, sh);

        const pageImgData = canvas.toDataURL("image/jpeg", 0.92);
        pdf.addImage(pageImgData, "JPEG", MARGIN_MM, MARGIN_MM, CONTENT_WIDTH_MM, destHeightMm);
      }

      pdf.save(getSuggestedFilename());
    } catch (e) {
      console.error("Scorecard PDF export failed:", e);
      setError("Failed to generate PDF. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Paper
      elevation={0}
      sx={{
        p: { xs: 2, sm: 3, md: 4 },
        borderRadius: 3,
        border: "1px solid rgba(0,0,0,0.08)",
        backgroundColor: "#ffffff",
        boxShadow: "0 0 0 1px rgba(0,0,0,0.08), 0 4px 12px rgba(0,0,0,0.06)",
      }}
    >
      {error && (
        <Alert severity="error" onClose={() => setError(null)} sx={{ width: "100%", mb: 2 }}>
          {error}
        </Alert>
      )}
      <Box
        sx={{
          display: "flex",
          flexDirection: { xs: "column", sm: "row" },
          alignItems: { xs: "flex-start", sm: "center" },
          justifyContent: "space-between",
          gap: 3,
        }}
      >
        <Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 1 }}>
            <Box
              sx={{
                width: 40,
                height: 40,
                borderRadius: "50%",
                backgroundColor: "rgba(10, 102, 194, 0.1)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <IconWrapper icon="mdi:file-pdf-box" size={20} color="#0a66c2" />
            </Box>
            <Typography
              variant="h5"
              sx={{
                fontWeight: 700,
                color: "#000000",
                fontSize: { xs: "1.25rem", sm: "1.5rem" },
              }}
            >
              Export Scorecard
            </Typography>
          </Box>
          <Typography
            variant="body2"
            sx={{
              color: "#666666",
              fontSize: "0.875rem",
              pl: 6.5,
            }}
          >
            Download your complete performance scorecard as a PDF document
          </Typography>
        </Box>
        <Button
          variant="contained"
          disabled={loading}
          startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <IconWrapper icon="mdi:download" size={20} />}
          onClick={handleDownloadPDF}
          sx={{
            backgroundColor: "#0a66c2",
            color: "#ffffff",
            textTransform: "none",
            fontWeight: 600,
            fontSize: "0.9375rem",
            px: 3,
            py: 1.5,
            borderRadius: "24px",
            boxShadow: "0 4px 12px rgba(10, 102, 194, 0.3)",
            "&:hover": {
              backgroundColor: "#004182",
              boxShadow: "0 6px 16px rgba(10, 102, 194, 0.4)",
              transform: "translateY(-2px)",
            },
            transition: "all 0.2s ease",
            minWidth: { xs: "100%", sm: "200px" },
          }}
        >
          Download PDF
        </Button>
      </Box>
    </Paper>
  );
}
