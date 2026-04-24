"use client";

import { useRef, useState, type RefObject } from "react";
import { Box, Button, CircularProgress } from "@mui/material";
import { IconWrapper } from "@/components/common/IconWrapper";
import { useToast } from "@/components/common/Toast";
import type { CertificateContent } from "@/lib/certificate/types";
import {
  certificateElementToPngBlob,
  downloadCertificatePng,
  downloadCertificatePdf,
} from "@/lib/utils/certificate-export.utils";
import { DynamicCertificate } from "./DynamicCertificate";

function safeFileBase(s: string): string {
  return (s || "certificate")
    .replace(/\s+/g, "-")
    .replace(/[^a-zA-Z0-9.-]/g, "")
    .slice(0, 80) || "certificate";
}

export interface CertificateLearnerToolbarProps {
  content: CertificateContent;
  /** Used for default download filenames */
  fileNameBase: string;
  /** When false, only PNG is offered */
  showPdf?: boolean;
  dense?: boolean;
}

/**
 * Off-screen certificate + download actions (PNG / PDF). Reuse on assessment pages.
 */
export function CertificateLearnerToolbar({
  content,
  fileNameBase,
  showPdf = true,
  dense = false,
}: CertificateLearnerToolbarProps) {
  const certRef = useRef<HTMLDivElement>(null);
  const { showToast } = useToast();
  const [pngBusy, setPngBusy] = useState(false);
  const [pdfBusy, setPdfBusy] = useState(false);

  const root = () => certRef.current;

  const handlePng = async () => {
    const el = root();
    if (!el) {
      showToast("Certificate is not ready yet.", "warning");
      return;
    }
    setPngBusy(true);
    try {
      await downloadCertificatePng(el, `${safeFileBase(fileNameBase)}.png`);
      showToast("Certificate downloaded.", "success");
    } catch (e: unknown) {
      showToast(e instanceof Error ? e.message : "Failed to download certificate", "error");
    } finally {
      setPngBusy(false);
    }
  };

  const handlePdf = async () => {
    const el = root();
    if (!el) {
      showToast("Certificate is not ready yet.", "warning");
      return;
    }
    setPdfBusy(true);
    try {
      await downloadCertificatePdf(el, `${safeFileBase(fileNameBase)}.pdf`);
      showToast("PDF downloaded.", "success");
    } catch (e: unknown) {
      showToast(e instanceof Error ? e.message : "Failed to download PDF", "error");
    } finally {
      setPdfBusy(false);
    }
  };

  return (
    <>
      <Box
        sx={{
          position: "fixed",
          left: -14000,
          top: 0,
          width: 1200,
          height: 675,
          pointerEvents: "none",
          zIndex: -5,
          overflow: "visible",
        }}
        aria-hidden
      >
        <DynamicCertificate ref={certRef} content={content} />
      </Box>

      <Box
        sx={{
          display: "flex",
          gap: dense ? 1 : 1.5,
          flexWrap: "wrap",
          justifyContent: dense ? "flex-start" : "center",
        }}
      >
        <Button
          variant="contained"
          size={dense ? "small" : "medium"}
          disabled={pngBusy}
          onClick={handlePng}
          startIcon={
            pngBusy ? <CircularProgress size={16} color="inherit" /> : <IconWrapper icon="mdi:download" size={20} />
          }
        >
          {pngBusy ? "Preparing…" : "Download certificate (PNG)"}
        </Button>
        {showPdf ? (
          <Button
            variant="outlined"
            size={dense ? "small" : "medium"}
            disabled={pdfBusy}
            onClick={handlePdf}
            startIcon={
              pdfBusy ? (
                <CircularProgress size={16} color="inherit" />
              ) : (
                <IconWrapper icon="mdi:file-pdf-box" size={20} />
              )
            }
          >
            {pdfBusy ? "Preparing…" : "Download PDF"}
          </Button>
        ) : null}
      </Box>
    </>
  );
}

/** Blob for LinkedIn / clipboard flows without mounting a second certificate. */
export async function captureCertificatePngBlobFromRef(
  certRef: RefObject<HTMLDivElement | null>
): Promise<Blob> {
  const el = certRef.current;
  if (!el) throw new Error("Certificate is not ready");
  return certificateElementToPngBlob(el);
}
