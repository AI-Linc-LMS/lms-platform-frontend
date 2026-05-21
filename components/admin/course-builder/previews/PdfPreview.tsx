"use client";

import { Box, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";
import { PREVIEW_HEIGHT } from "./shared";

interface PdfPreviewProps {
  url: string;
  filename: string;
}

export function PdfPreview({ url, filename }: PdfPreviewProps) {
  const { t } = useTranslation("common");
  return (
    <Box>
      <Box
        sx={{
          width: "100%",
          height: PREVIEW_HEIGHT,
          borderRadius: 1,
          overflow: "hidden",
          border: "1px solid var(--border-default)",
          bgcolor: "var(--card-bg)",
        }}
      >
        <iframe
          src={`${url}#toolbar=1&navpanes=0`}
          title={filename || t("courseBuilderAttachments.pdfPreview")}
          width="100%"
          height="100%"
          style={{ border: 0, display: "block" }}
        />
      </Box>
      <Typography
        variant="caption"
        sx={{
          color: "var(--font-tertiary)",
          display: "block",
          mt: 1,
          textAlign: "center",
        }}
      >
        {t("courseBuilderAttachments.pdfHint")}
      </Typography>
    </Box>
  );
}
