"use client";

import { Box, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";

export function AICourseBuilderHeader() {
  const { t } = useTranslation("common");
  return (
    <Box sx={{ mb: 4 }}>
      <Typography
        variant="h4"
        sx={{
          fontWeight: 700,
          color: "var(--font-primary)",
          fontSize: { xs: "1.5rem", sm: "2rem" },
          mb: 1,
        }}
      >
        {t("adminAICourseBuilder.title")}
      </Typography>
      <Typography variant="body2" sx={{ color: "var(--font-secondary)" }}>
        {t("adminAICourseBuilder.subtitle")}
      </Typography>
    </Box>
  );
}
