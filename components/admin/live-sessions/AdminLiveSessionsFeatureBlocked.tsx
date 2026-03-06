"use client";

import Link from "next/link";
import { Paper, Typography, Button } from "@mui/material";
import { useTranslation } from "react-i18next";

export function AdminLiveSessionsFeatureBlocked() {
  const { t } = useTranslation("common");
  return (
    <Paper
      sx={{
        p: 5,
        textAlign: "center",
        borderRadius: 2,
        border: "1px solid var(--border-default)",
      }}
    >
      <Typography variant="h6" sx={{ color: "var(--font-muted)", mb: 1 }}>
        {t("adminLiveSessions.featureBlockedTitle")}
      </Typography>
      <Typography variant="body2" sx={{ color: "var(--font-secondary)", mb: 2 }}>
        {t("adminLiveSessions.featureBlockedDesc")}
      </Typography>
      <Button component={Link} href="/admin/dashboard" variant="contained">
        {t("adminLiveSessions.backToAdminDashboard")}
      </Button>
    </Paper>
  );
}
