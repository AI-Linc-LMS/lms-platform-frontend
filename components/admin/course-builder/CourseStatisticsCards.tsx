"use client";

import { Box, Typography, Paper } from "@mui/material";
import { useTranslation } from "react-i18next";
import { IconWrapper } from "@/components/common/IconWrapper";

interface CourseStatisticsCardsProps {
  draftCount: number;
  publishedCount: number;
  totalCount: number;
}

export function CourseStatisticsCards({
  draftCount,
  publishedCount,
  totalCount,
}: CourseStatisticsCardsProps) {
  const { t } = useTranslation("common");
  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: { xs: "1fr", sm: "repeat(3, 1fr)" },
        gap: 2,
        mb: 4,
      }}
    >
      <Paper
        sx={{
          p: 3,
          background:
            "linear-gradient(to right, color-mix(in srgb, var(--accent-indigo) 10%, var(--surface) 90%), color-mix(in srgb, var(--accent-indigo) 18%, var(--surface) 82%))",
          border:
            "1px solid color-mix(in srgb, var(--accent-indigo) 35%, var(--border-default) 65%)",
          borderRadius: 2,
        }}
      >
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Box>
            <Typography
              variant="body2"
              sx={{ fontWeight: 500, color: "var(--accent-indigo)", mb: 0.5 }}
            >
              {t("adminCourseBuilder.draftCourses")}
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 700, color: "var(--accent-indigo)" }}>
              {draftCount}
            </Typography>
          </Box>
          <Box
            sx={{
              width: 48,
              height: 48,
              borderRadius: "50%",
              bgcolor:
                "color-mix(in srgb, var(--accent-indigo) 25%, var(--surface) 75%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <IconWrapper icon="mdi:pencil" size={24} color="var(--accent-indigo)" />
          </Box>
        </Box>
      </Paper>
      <Paper
        sx={{
          p: 3,
          background:
            "linear-gradient(to right, color-mix(in srgb, var(--success-500) 10%, var(--surface) 90%), color-mix(in srgb, var(--success-500) 18%, var(--surface) 82%))",
          border:
            "1px solid color-mix(in srgb, var(--success-500) 35%, var(--border-default) 65%)",
          borderRadius: 2,
        }}
      >
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Box>
            <Typography
              variant="body2"
              sx={{ fontWeight: 500, color: "var(--success-500)", mb: 0.5 }}
            >
              {t("adminCourseBuilder.publishedCourses")}
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 700, color: "var(--success-500)" }}>
              {publishedCount}
            </Typography>
          </Box>
          <Box
            sx={{
              width: 48,
              height: 48,
              borderRadius: "50%",
              bgcolor:
                "color-mix(in srgb, var(--success-500) 25%, var(--surface) 75%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <IconWrapper icon="mdi:check-circle" size={24} color="var(--success-500)" />
          </Box>
        </Box>
      </Paper>
      <Paper
        sx={{
          p: 3,
          background:
            "linear-gradient(to right, color-mix(in srgb, var(--surface) 85%, var(--background) 15%), var(--surface))",
          border: "1px solid var(--border-default)",
          borderRadius: 2,
        }}
      >
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Box>
            <Typography
              variant="body2"
              sx={{ fontWeight: 500, color: "var(--font-secondary)", mb: 0.5 }}
            >
              {t("adminCourseBuilder.totalCourses")}
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 700, color: "var(--font-primary)" }}>
              {totalCount}
            </Typography>
          </Box>
          <Box
            sx={{
              width: 48,
              height: 48,
              borderRadius: "50%",
              bgcolor: "var(--border-default)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <IconWrapper icon="mdi:book-open-variant" size={24} color="var(--font-secondary)" />
          </Box>
        </Box>
      </Paper>
    </Box>
  );
}

