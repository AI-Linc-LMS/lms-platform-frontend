"use client";

import { useMemo } from "react";
import { Box, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";
import { PREVIEW_HEIGHT } from "./shared";

interface OfficeDocPreviewProps {
  url: string;
  filename: string;
}

export function OfficeDocPreview({ url, filename }: OfficeDocPreviewProps) {
  const { t } = useTranslation("common");
  // Office Online viewer requires public URL accessible to Microsoft servers.
  // S3 presigned URLs work; we URL-encode and pass them.
  const viewerUrl = useMemo(
    () =>
      `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(
        url
      )}`,
    [url]
  );

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
          src={viewerUrl}
          title={filename || t("courseBuilderAttachments.documentPreview")}
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
        {t("courseBuilderAttachments.officeHint")}
      </Typography>
    </Box>
  );
}
