"use client";

import { Box, Paper, Typography } from "@mui/material";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { IconWrapper } from "@/components/common/IconWrapper";

interface BrandingSectionCardProps {
  icon: string;
  title: string;
  description?: string;
  /** Optional step number for guided flow (1, 2, 3…). */
  step?: number;
  children: ReactNode;
}

export function BrandingSectionCard({
  icon,
  title,
  description,
  step,
  children,
}: BrandingSectionCardProps) {
  const { t } = useTranslation("common");

  return (
    <Paper
      elevation={0}
      sx={{
        border: "1px solid",
        borderColor: "divider",
        borderRadius: 2,
        overflow: "hidden",
        bgcolor: "background.paper",
      }}
    >
      <Box
        sx={{
          px: 2.5,
          py: 2,
          borderBottom: "1px solid",
          borderColor: "divider",
          background: (theme) =>
            theme.palette.mode === "dark"
              ? "rgba(255,255,255,0.04)"
              : "linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%)",
          display: "flex",
          alignItems: "flex-start",
          gap: 1.5,
        }}
      >
        <Box
          sx={{
            width: 40,
            height: 40,
            borderRadius: 1.5,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            bgcolor: "primary.main",
            color: "primary.contrastText",
            flexShrink: 0,
          }}
        >
          <IconWrapper icon={icon} size={22} style={{ color: "currentColor" }} />
        </Box>
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="subtitle1" fontWeight={700} component="h2">
            {typeof step === "number" ? (
              <Box
                component="span"
                sx={{
                  color: "primary.main",
                  fontWeight: 800,
                  mr: 0.5,
                }}
              >
                {t("branding.stepPrefix", { n: step })}{" "}
              </Box>
            ) : null}
            {title}
          </Typography>
          {description ? (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, lineHeight: 1.5 }}>
              {description}
            </Typography>
          ) : null}
        </Box>
      </Box>
      <Box sx={{ p: 2.5 }}>{children}</Box>
    </Paper>
  );
}
