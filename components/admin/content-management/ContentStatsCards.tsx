"use client";

import { Box, Paper, Typography } from "@mui/material";
import { IconWrapper } from "@/components/common/IconWrapper";
import { ContentCountByType } from "@/lib/services/admin/admin-content-management.service";

interface ContentStatsCardsProps {
  counts: ContentCountByType;
  loading?: boolean;
}

const contentTypeConfig: Record<
  keyof ContentCountByType,
  { label: string; icon: string; color: string; bgColor: string }
> = {
  Quiz: {
    label: "Quiz",
    icon: "mdi:help-circle",
    color: "#6366f1",
    bgColor: "#eef2ff",
  },
  Article: {
    label: "Article",
    icon: "mdi:book-open-page-variant",
    color: "#10b981",
    bgColor: "#d1fae5",
  },
  Assignment: {
    label: "Assignment",
    icon: "mdi:clipboard-text",
    color: "#f59e0b",
    bgColor: "#fef3c7",
  },
  CodingProblem: {
    label: "Coding Problem",
    icon: "mdi:code-tags",
    color: "#8b5cf6",
    bgColor: "#ede9fe",
  },
  DevCodingProblem: {
    label: "Dev Coding Problem",
    icon: "mdi:code-braces-box",
    color: "#ec4899",
    bgColor: "#fce7f3",
  },
  VideoTutorial: {
    label: "Video Tutorial",
    icon: "mdi:play-circle",
    color: "#ef4444",
    bgColor: "#fee2e2",
  },
};

export function ContentStatsCards({
  counts,
  loading = false,
}: ContentStatsCardsProps) {
  if (loading) {
    return (
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "repeat(2, 1fr)",
            sm: "repeat(3, 1fr)",
            md: "repeat(6, 1fr)",
          },
          gap: 2,
          width: "100%",
        }}
      >
        {Object.keys(contentTypeConfig).map((key) => (
          <Paper
            key={key}
            sx={{
              p: 2,
              borderRadius: 2,
              boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
              textAlign: "center",
              height: "100%",
            }}
          >
            <Box sx={{ height: 60 }} />
          </Paper>
        ))}
      </Box>
    );
  }

  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: {
          xs: "repeat(2, 1fr)",
          sm: "repeat(3, 1fr)",
          md: "repeat(6, 1fr)",
        },
        gap: 2,
        width: "100%",
      }}
    >
      {(Object.keys(contentTypeConfig) as Array<keyof ContentCountByType>).map(
        (type) => {
          const config = contentTypeConfig[type];
          const count = counts[type] || 0;

          return (
            <Paper
              key={type}
              sx={{
                p: 2,
                borderRadius: 2,
                boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                backgroundColor: config.bgColor,
                transition: "transform 0.2s, box-shadow 0.2s",
                height: "100%",
                display: "flex",
                flexDirection: "column",
                "&:hover": {
                  transform: "translateY(-2px)",
                  boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
                },
              }}
            >
                <Box
                  sx={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 1,
                    flex: 1,
                    justifyContent: "center",
                  }}
                >
                  <IconWrapper
                    icon={config.icon}
                    size={32}
                    color={config.color}
                  />
                  <Typography
                    variant="h4"
                    sx={{
                      fontWeight: 700,
                      color: config.color,
                      fontSize: { xs: "1.5rem", sm: "2rem" },
                    }}
                  >
                    {count}
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{
                      color: "#6b7280",
                      fontSize: { xs: "0.75rem", sm: "0.875rem" },
                      textAlign: "center",
                    }}
                  >
                    {config.label}
                  </Typography>
                </Box>
              </Paper>
          );
        }
      )}
    </Box>
  );
}
