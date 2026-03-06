"use client";

import { Paper, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";
import { IconWrapper } from "@/components/common/IconWrapper";

export function LiveSessionsEmptyState() {
  const { t } = useTranslation("common");
  return (
    <Paper
      sx={{
        p: 5,
        textAlign: "center",
        borderRadius: 2,
        border: "1px solid #e5e7eb",
      }}
    >
      <IconWrapper
        icon="mdi:video-off-outline"
        size={72}
        color="#9ca3af"
      />
      <Typography variant="h6" sx={{ color: "#374151", mt: 2, mb: 1 }}>
        {t("liveSessions.emptyStateTitle")}
      </Typography>
      <Typography variant="body2" sx={{ color: "#6b7280" }}>
        {t("liveSessions.emptyStateDesc")}
      </Typography>
    </Paper>
  );
}
