"use client";

import { Box, Typography, Paper } from "@mui/material";
import { useTranslation } from "react-i18next";
import { IconWrapper } from "@/components/common/IconWrapper";

interface CourseStatsSectionProps {
  draftCount: number;
  publishedCount: number;
  totalCount: number;
}

export function CourseStatsSection({
  draftCount,
  publishedCount,
  totalCount,
}: CourseStatsSectionProps) {
  const { t } = useTranslation("common");
  return (
    <Box>
      <Typography
        variant="h5"
        sx={{
          fontWeight: 700,
          color: "var(--font-primary)",
          fontSize: { xs: "1.25rem", sm: "1.5rem" },
          mb: 1,
        }}
      >
        {t("adminCourseBuilder.allCourses")}
      </Typography>
      <Typography variant="body2" sx={{ color: "var(--font-secondary)", mb: 2 }}>
        {t("adminCourseBuilder.glimpseProgress")}
      </Typography>

      {/* Course Counts */}
      {totalCount > 0 && (
        <Box sx={{ display: "flex", gap: 3, flexWrap: "wrap" }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Box
              sx={{
                width: 12,
                height: 12,
                borderRadius: "50%",
                bgcolor: "var(--accent-indigo)",
              }}
            />
            <Typography variant="body2" sx={{ color: "var(--font-secondary)" }}>
              <Typography
                component="span"
                sx={{ fontWeight: 600, color: "var(--accent-indigo)" }}
              >
                {draftCount}
              </Typography>{" "}
              {t("adminCourseBuilder.drafts")}
            </Typography>
          </Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Box
              sx={{
                width: 12,
                height: 12,
                borderRadius: "50%",
                bgcolor: "var(--success-500)",
              }}
            />
            <Typography variant="body2" sx={{ color: "var(--font-secondary)" }}>
              <Typography
                component="span"
                sx={{ fontWeight: 600, color: "var(--success-500)" }}
              >
                {publishedCount}
              </Typography>{" "}
              {t("adminCourseBuilder.published")}
            </Typography>
          </Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Box
              sx={{
                width: 12,
                height: 12,
                borderRadius: "50%",
                bgcolor: "var(--font-secondary)",
              }}
            />
            <Typography variant="body2" sx={{ color: "var(--font-secondary)" }}>
              <Typography
                component="span"
                sx={{ fontWeight: 600, color: "var(--font-secondary)" }}
              >
                {totalCount}
              </Typography>{" "}
              {t("adminCourseBuilder.total")}
            </Typography>
          </Box>
        </Box>
      )}
    </Box>
  );
}

