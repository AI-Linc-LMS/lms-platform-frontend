"use client";

import { Box, Typography, Grid } from "@mui/material";
import { IconWrapper } from "@/components/common/IconWrapper";

interface StatItem {
  label: string;
  value: string | number;
  icon: string;
  color?: string;
}

interface QuickStatsGridProps {
  stats: StatItem[];
}

export function QuickStatsGrid({ stats }: QuickStatsGridProps) {
  return (
    <Grid container spacing={2.5}>
      {stats.map((stat, index) => (
        <Grid item xs={12} sm={4} key={index}>
          <Box
            sx={{
              p: 2.5,
              borderRadius: 3,
              backgroundColor: "#ffffff",
              border: `2px solid ${stat.color || "#0a66c2"}30`,
              background: `linear-gradient(135deg, ${stat.color || "#0a66c2"}08 0%, ${stat.color || "#0a66c2"}02 100%)`,
              boxShadow: "0 0 0 1px rgba(0,0,0,0.08), 0 2px 4px rgba(0,0,0,0.04)",
              transition: "all 0.3s ease",
              position: "relative",
              overflow: "hidden",
              "&::before": {
                content: '""',
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                height: "4px",
                background: stat.color
                  ? `linear-gradient(135deg, ${stat.color} 0%, ${stat.color}dd 100%)`
                  : "linear-gradient(135deg, #0a66c2 0%, #004182 100%)",
              },
              "&:hover": {
                boxShadow: `0 8px 24px ${stat.color || "#0a66c2"}25`,
                transform: "translateY(-4px)",
                borderColor: `${stat.color || "#0a66c2"}50`,
              },
            }}
          >
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 2,
              }}
            >
              <Box
                sx={{
                  width: 56,
                  height: 56,
                  borderRadius: "50%",
                  backgroundColor: `${stat.color || "#0a66c2"}15`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                  boxShadow: `0 4px 12px ${stat.color || "#0a66c2"}20`,
                }}
              >
                <IconWrapper
                  icon={stat.icon}
                  size={28}
                  color={stat.color || "#0a66c2"}
                />
              </Box>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography
                  variant="h4"
                  sx={{
                    fontWeight: 700,
                    color: "#000000",
                    fontSize: { xs: "1.5rem", sm: "1.75rem", md: "2rem" },
                    lineHeight: 1.2,
                    mb: 0.5,
                  }}
                >
                  {stat.value}
                </Typography>
                <Typography
                  variant="body2"
                  sx={{
                    color: "#666666",
                    fontSize: "0.875rem",
                    fontWeight: 500,
                  }}
                >
                  {stat.label}
                </Typography>
              </Box>
            </Box>
          </Box>
        </Grid>
      ))}
    </Grid>
  );
}
