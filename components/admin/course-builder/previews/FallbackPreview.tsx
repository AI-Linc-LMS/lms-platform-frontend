"use client";

import { Box, Typography, Button } from "@mui/material";
import { useTranslation } from "react-i18next";
import { IconWrapper } from "@/components/common/IconWrapper";

interface FallbackPreviewProps {
  url: string;
  filename: string;
}

export function FallbackPreview({ url, filename }: FallbackPreviewProps) {
  const { t } = useTranslation("common");
  return (
    <Box
      sx={{
        textAlign: "center",
        py: 4,
        px: 2,
        bgcolor: "var(--card-bg)",
        borderRadius: 1,
        border: "1px dashed var(--border-default)",
      }}
    >
      <IconWrapper
        icon="mdi:file-question"
        size={48}
        color="var(--font-tertiary)"
      />
      <Typography
        variant="body2"
        sx={{ color: "var(--font-secondary)", mt: 1, mb: 2 }}
      >
        {t("courseBuilderAttachments.previewNotSupported")}
      </Typography>
      <Button
        variant="outlined"
        size="small"
        component="a"
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        startIcon={<IconWrapper icon="mdi:download" size={16} />}
        sx={{
          textTransform: "none",
          borderColor: "var(--accent-indigo)",
          color: "var(--accent-indigo)",
        }}
      >
        {t("courseBuilderAttachments.downloadFile", {
          name: filename || t("courseBuilderAttachments.file"),
        })}
      </Button>
    </Box>
  );
}
