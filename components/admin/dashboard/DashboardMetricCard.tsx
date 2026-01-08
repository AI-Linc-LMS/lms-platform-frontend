"use client";

import { Box, Typography, Paper, Tooltip, IconButton } from "@mui/material";
import { IconWrapper } from "@/components/common/IconWrapper";

interface DashboardMetricCardProps {
  title: string;
  value: string | number;
  icon: string;
  iconColor?: string;
  tooltip?: string;
}

export function DashboardMetricCard({
  title,
  value,
  icon,
  iconColor = "#6366f1",
  tooltip,
}: DashboardMetricCardProps) {
  return (
    <Paper
      sx={{
        p: { xs: 2, sm: 3 },
        borderRadius: 2,
        boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        transition: "transform 0.2s, box-shadow 0.2s",
        "&:hover": {
          transform: "translateY(-2px)",
          boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
        },
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
          <Typography
            variant="body2"
            sx={{
              color: "#6b7280",
              fontSize: { xs: "0.75rem", sm: "0.875rem" },
              fontWeight: 500,
            }}
          >
            {title}
          </Typography>
          {tooltip && (
            <Tooltip title={tooltip} arrow placement="top">
              <IconButton
                size="small"
                sx={{
                  p: 0.25,
                  minWidth: "auto",
                  width: "16px",
                  height: "16px",
                  color: "#9ca3af",
                  "&:hover": {
                    color: "#6b7280",
                    backgroundColor: "transparent",
                  },
                }}
              >
                <IconWrapper icon="mdi:information" size={14} />
              </IconButton>
            </Tooltip>
          )}
        </Box>
        <Box
          sx={{
            width: { xs: 32, sm: 40 },
            height: { xs: 32, sm: 40 },
            borderRadius: "50%",
            backgroundColor: `${iconColor}15`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <IconWrapper icon={icon} size={20} color={iconColor} />
        </Box>
      </Box>
      <Typography
        variant="h4"
        sx={{
          fontWeight: 700,
          color: "#111827",
          fontSize: { xs: "1.5rem", sm: "2rem" },
        }}
      >
        {value}
      </Typography>
    </Paper>
  );
}

