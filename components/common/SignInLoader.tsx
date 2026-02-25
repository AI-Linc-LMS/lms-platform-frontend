"use client";

import { Box, CircularProgress, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";

export const SignInLoader: React.FC = () => {
  const { t } = useTranslation("common");
  return (
    <Box
      sx={{
        position: "fixed",
        top: 0,
        insetInlineStart: 0,
        insetInlineEnd: 0,
        bottom: 0,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "background.default",
        zIndex: 9999,
      }}
    >
      <CircularProgress size={48} sx={{ mb: 3 }} />
      <Typography variant="body1" color="text.secondary">
        {t("auth.signingYouIn")}
      </Typography>
    </Box>
  );
};

