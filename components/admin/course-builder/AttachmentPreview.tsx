"use client";

import { Box, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";
import { isOfficeDoc, type PreviewableAttachment } from "./previews/shared";
import { ImagePreview } from "./previews/ImagePreview";
import { PdfPreview } from "./previews/PdfPreview";
import { OfficeDocPreview } from "./previews/OfficeDocPreview";
import { TextPreview } from "./previews/TextPreview";
import { DocxPreview } from "./previews/DocxPreview";
import { CsvPreview } from "./previews/CsvPreview";
import { MediaPreview } from "./previews/MediaPreview";
import { FallbackPreview } from "./previews/FallbackPreview";

// Re-export so callers can keep importing the type from this module.
export type { PreviewableAttachment } from "./previews/shared";

interface AttachmentPreviewProps {
  attachment: PreviewableAttachment;
  /**
   * Whether an Office format may be rendered by the Office Online viewer. That viewer is the one
   * route where the file leaves the platform - Microsoft's servers fetch the presigned URL - so a
   * surface that has not accepted that trade sets this false and gets the download card instead.
   * .docx is unaffected either way: mammoth renders it client-side, with no third party.
   */
  allowExternalViewer?: boolean;
}

/**
 * Dispatcher that picks the right renderer for a given attachment's MIME / extension.
 * Each renderer lives in ./previews/ to keep this file focused on routing logic.
 */
export function AttachmentPreview({ attachment, allowExternalViewer = true }: AttachmentPreviewProps) {
  const { t } = useTranslation("common");
  const { file_url, file_type, original_filename, mime_type } = attachment;

  if (!file_url) {
    return (
      <Box sx={{ textAlign: "center", py: 4 }}>
        <Typography variant="body2" sx={{ color: "var(--font-secondary)" }}>
          {t("courseBuilderAttachments.previewUnavailable")}
        </Typography>
      </Box>
    );
  }

  if (file_type === "image") {
    return <ImagePreview url={file_url} alt={original_filename} />;
  }

  if (file_type === "pdf") {
    return <PdfPreview url={file_url} filename={original_filename} />;
  }

  if (file_type === "video" || file_type === "audio") {
    return <MediaPreview kind={file_type} url={file_url} filename={original_filename} />;
  }

  // `code` covers json/ipynb/py/js/ts/java/cpp/sql/sh/html/css. Routing it here keeps an .html
  // material in a <pre> and never in an iframe, and stops .json/.ipynb (whose MIME is not text/*)
  // falling through to the download card.
  if (file_type === "text" || file_type === "code" || mime_type?.startsWith("text/")) {
    const lower = original_filename.toLowerCase();
    if (lower.endsWith(".csv")) {
      return <CsvPreview url={file_url} />;
    }
    return <TextPreview url={file_url} />;
  }

  // A CSV classified as `spreadsheet` reaches neither the text branch (its MIME may be
  // application/vnd.ms-excel) nor isOfficeDoc, so it needs its own guard.
  if (original_filename.toLowerCase().endsWith(".csv")) {
    return <CsvPreview url={file_url} />;
  }

  if (file_type === "document" || file_type === "spreadsheet" || file_type === "presentation" || isOfficeDoc(original_filename)) {
    const lower = original_filename.toLowerCase();
    // mammoth handles .docx (not .doc) entirely in the browser. Use it for instant inline
    // rendering; other Office formats need the external viewer, where it is permitted.
    if (lower.endsWith(".docx")) {
      return <DocxPreview url={file_url} filename={original_filename} />;
    }
    if (!allowExternalViewer) {
      return <FallbackPreview url={file_url} filename={original_filename} />;
    }
    return <OfficeDocPreview url={file_url} filename={original_filename} />;
  }

  return <FallbackPreview url={file_url} filename={original_filename} />;
}
