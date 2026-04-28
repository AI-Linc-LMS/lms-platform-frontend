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
        border: "1px solid var(--border-default)",
        backgroundColor: "var(--card-bg)",
      }}
    >
      <IconWrapper
        icon="mdi:video-off-outline"
        size={72}
        color="var(--font-tertiary)"
      />
      <Typography variant="h6" sx={{ color: "var(--font-primary)", mt: 2, mb: 1 }}>
        {t("liveSessions.emptyStateTitle")}
      </Typography>
      <Typography variant="body2" sx={{ color: "var(--font-secondary)" }}>
        {t("liveSessions.emptyStateDesc")}
      </Typography>
    </Paper>
  );
}
