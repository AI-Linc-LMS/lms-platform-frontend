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
import { FallbackPreview } from "./previews/FallbackPreview";

// Re-export so callers can keep importing the type from this module.
export type { PreviewableAttachment } from "./previews/shared";

interface AttachmentPreviewProps {
  attachment: PreviewableAttachment;
}

/**
 * Dispatcher that picks the right renderer for a given attachment's MIME / extension.
 * Each renderer lives in ./previews/ to keep this file focused on routing logic.
 */
export function AttachmentPreview({ attachment }: AttachmentPreviewProps) {
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

  if (file_type === "text" || mime_type?.startsWith("text/")) {
    const lower = original_filename.toLowerCase();
    if (lower.endsWith(".csv")) {
      return <CsvPreview url={file_url} />;
    }
    return <TextPreview url={file_url} />;
  }

  if (file_type === "document" || isOfficeDoc(original_filename)) {
    const lower = original_filename.toLowerCase();
    // mammoth handles .docx (not .doc). Use it for instant inline rendering;
    // fall back to Office Online Viewer for other formats.
    if (lower.endsWith(".docx")) {
      return <DocxPreview url={file_url} filename={original_filename} />;
    }
    return <OfficeDocPreview url={file_url} filename={original_filename} />;
  }

  return <FallbackPreview url={file_url} filename={original_filename} />;
}
