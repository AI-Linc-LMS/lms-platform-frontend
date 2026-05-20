"use client";

import { useState } from "react";
import { Box } from "@mui/material";
import { useTranslation } from "react-i18next";
import { PREVIEW_HEIGHT } from "./shared";
import { FallbackPreview } from "./FallbackPreview";

interface ImagePreviewProps {
  url: string;
  alt: string;
}

export function ImagePreview({ url, alt }: ImagePreviewProps) {
  const [error, setError] = useState(false);
  const { t } = useTranslation("common");

  if (error) {
    return <FallbackPreview url={url} filename={alt} />;
  }

  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "center",
        bgcolor: "var(--card-bg)",
        borderRadius: 1,
        p: 1,
        maxHeight: PREVIEW_HEIGHT,
        overflow: "auto",
      }}
    >
      {/* Using regular img tag for S3-signed URLs which may not be in Next allowed domains */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={url}
        alt={alt || t("courseBuilderAttachments.imagePreview")}
        onError={() => setError(true)}
        style={{
          maxWidth: "100%",
          maxHeight: PREVIEW_HEIGHT - 16,
          objectFit: "contain",
          borderRadius: 4,
        }}
      />
    </Box>
  );
}
