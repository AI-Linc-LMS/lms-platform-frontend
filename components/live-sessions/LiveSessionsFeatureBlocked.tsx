"use client";

import Link from "next/link";
import { Paper, Typography, Button } from "@mui/material";
import { useTranslation } from "react-i18next";

export function LiveSessionsFeatureBlocked() {
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
        {t("liveSessions.featureBlockedTitle")}
      </Typography>
      <Typography variant="body2" sx={{ color: "var(--font-secondary)", mb: 2 }}>
        {t("liveSessions.featureBlockedDesc")}
      </Typography>
      <Button component={Link} href="/dashboard" variant="contained">
        {t("liveSessions.backToDashboard")}
      </Button>
    </Paper>
  );
}
