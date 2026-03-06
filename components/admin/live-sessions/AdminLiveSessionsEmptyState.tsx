"use client";

import { Paper, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";
import { IconWrapper } from "@/components/common/IconWrapper";

export function AdminLiveSessionsEmptyState() {
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
        {t("adminLiveSessions.emptyStateTitle")}
      </Typography>
      <Typography variant="body2" sx={{ color: "#6b7280", mb: 1 }}>
        {t("adminLiveSessions.emptyStateDesc")}
      </Typography>
      <Typography variant="body2" sx={{ color: "#9ca3af" }}>
        {t("adminLiveSessions.emptyStateAction")}
      </Typography>
    </Paper>
  );
}
