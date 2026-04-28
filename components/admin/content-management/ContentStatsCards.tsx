"use client";

import { Box, Paper, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";
import { IconWrapper } from "@/components/common/IconWrapper";
import { ContentCountByType } from "@/lib/services/admin/admin-content-management.service";

interface ContentStatsCardsProps {
  counts: ContentCountByType;
  loading?: boolean;
}

const contentTypeConfig: Record<
  keyof ContentCountByType,
  { labelKey: string; icon: string; color: string; bgColor: string }
> = {
  Quiz: {
    labelKey: "adminContentManagement.typeQuiz",
    icon: "mdi:help-circle",
    color: "var(--accent-indigo)",
    bgColor: "color-mix(in srgb, var(--accent-indigo) 14%, var(--surface) 86%)",
  },
  Article: {
    labelKey: "adminContentManagement.typeArticle",
    icon: "mdi:book-open-page-variant",
    color: "var(--success-500)",
    bgColor: "color-mix(in srgb, var(--success-500) 14%, var(--surface) 86%)",
  },
  Assignment: {
    labelKey: "adminContentManagement.typeAssignment",
    icon: "mdi:clipboard-text",
    color: "var(--warning-500)",
    bgColor: "color-mix(in srgb, var(--warning-500) 14%, var(--surface) 86%)",
  },
  CodingProblem: {
    labelKey: "adminContentManagement.typeCodingProblem",
    icon: "mdi:code-tags",
    color: "var(--accent-purple)",
    bgColor: "color-mix(in srgb, var(--accent-purple) 14%, var(--surface) 86%)",
  },
  DevCodingProblem: {
    labelKey: "adminContentManagement.typeDevCodingProblem",
    icon: "mdi:code-braces-box",
    color: "var(--accent-purple)",
    bgColor: "color-mix(in srgb, var(--accent-purple) 10%, var(--surface) 90%)",
  },
  VideoTutorial: {
    labelKey: "adminContentManagement.typeVideoTutorial",
    icon: "mdi:play-circle",
    color: "var(--error-500)",
    bgColor: "color-mix(in srgb, var(--error-500) 14%, var(--surface) 86%)",
  },
};

export function ContentStatsCards({
  counts,
  loading = false,
}: ContentStatsCardsProps) {
  const { t } = useTranslation("common");
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
              boxShadow:
                "0 1px 3px color-mix(in srgb, var(--font-primary) 12%, transparent)",
              border: "1px solid var(--border-default)",
              backgroundColor: "var(--card-bg)",
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
                boxShadow:
                  "0 1px 3px color-mix(in srgb, var(--font-primary) 12%, transparent)",
                backgroundColor: config.bgColor,
                transition: "transform 0.2s, box-shadow 0.2s",
                height: "100%",
                display: "flex",
                flexDirection: "column",
                "&:hover": {
                  transform: "translateY(-2px)",
                  boxShadow:
                    "0 4px 6px color-mix(in srgb, var(--font-primary) 16%, transparent)",
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
                      color: "var(--font-secondary)",
                      fontSize: { xs: "0.75rem", sm: "0.875rem" },
                      textAlign: "center",
                    }}
                  >
                    {t(config.labelKey)}
                  </Typography>
                </Box>
              </Paper>
          );
        }
      )}
    </Box>
  );
}
