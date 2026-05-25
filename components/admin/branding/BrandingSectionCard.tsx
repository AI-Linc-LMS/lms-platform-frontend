"use client";

import { Box, Paper, Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";
import type { ReactNode } from "react";
import { IconWrapper } from "@/components/common/IconWrapper";

interface BrandingSectionCardProps {
  icon: string;
  title: string;
  description?: string;
  /** Right-aligned slot for actions (toggles, reset buttons, etc.). */
  action?: ReactNode;
  children: ReactNode;
}

export function BrandingSectionCard({
  icon,
  title,
  description,
  action,
  children,
}: BrandingSectionCardProps) {
  return (
    <Paper
      elevation={0}
      sx={{
        border: "1px solid var(--border-default)",
        borderRadius: 2.5,
        overflow: "hidden",
        bgcolor: "background.paper",
      }}
    >
      <Box
        sx={{
          px: 2.5,
          py: 2,
          borderBottom: "1px solid var(--border-default)",
          background: (theme) =>
            `linear-gradient(180deg, ${alpha(
              theme.palette.primary.main,
              0.03
            )} 0%, var(--surface) 100%)`,
          display: "flex",
          alignItems: "center",
          gap: 1.75,
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
            bgcolor: (theme) => alpha(theme.palette.primary.main, 0.12),
            color: "primary.main",
            flexShrink: 0,
          }}
        >
          <IconWrapper icon={icon} size={22} style={{ color: "currentColor" }} />
        </Box>
        <Box sx={{ minWidth: 0, flex: 1 }}>
          <Typography
            variant="subtitle1"
            fontWeight={700}
            component="h2"
            sx={{ color: "var(--font-primary)", letterSpacing: "-0.01em" }}
          >
            {title}
          </Typography>
          {description ? (
            <Typography
              variant="body2"
              sx={{ mt: 0.25, lineHeight: 1.5, color: "var(--font-secondary)" }}
            >
              {description}
            </Typography>
          ) : null}
        </Box>
        {action ? <Box sx={{ flexShrink: 0 }}>{action}</Box> : null}
      </Box>
      <Box sx={{ p: 2.5 }}>{children}</Box>
    </Paper>
  );
}
