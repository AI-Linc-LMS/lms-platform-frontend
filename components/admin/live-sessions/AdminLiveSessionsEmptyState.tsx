"use client";

import { Paper, Typography, Button, Box } from "@mui/material";
import { useTranslation } from "react-i18next";
import { IconWrapper } from "@/components/common/IconWrapper";

export function AdminLiveSessionsEmptyState({ onCreate }: { onCreate?: () => void }) {
  const { t } = useTranslation("common");
  return (
    <Paper
      elevation={0}
      sx={{
        py: 7,
        px: 3,
        textAlign: "center",
        borderRadius: 2,
        border: "1px solid var(--border-default)",
        backgroundColor: "var(--card-bg)",
      }}
    >
      <Box
        sx={{
          width: 76,
          height: 76,
          borderRadius: "50%",
          mx: "auto",
          mb: 2,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          bgcolor: "color-mix(in srgb, var(--accent-indigo) 12%, var(--surface) 88%)",
        }}
      >
        <IconWrapper icon="mdi:video-plus-outline" size={40} color="var(--accent-indigo)" />
      </Box>
      <Typography variant="h6" sx={{ color: "var(--font-primary)", fontWeight: 600, mb: 1 }}>
        {t("adminLiveSessions.emptyStateTitle")}
      </Typography>
      <Typography variant="body2" sx={{ color: "var(--font-secondary)", mb: 3, maxWidth: 460, mx: "auto" }}>
        {t("adminLiveSessions.emptyStateDesc")} {t("adminLiveSessions.emptyStateAction")}
      </Typography>
      {onCreate && (
        <Button
          variant="contained"
          startIcon={<IconWrapper icon="mdi:plus" size={20} />}
          onClick={onCreate}
          sx={{ bgcolor: "var(--accent-indigo)", color: "var(--font-light)", "&:hover": { bgcolor: "var(--accent-indigo-dark)" } }}
        >
          {t("adminLiveSessions.createLiveSession")}
        </Button>
      )}
    </Paper>
  );
}
