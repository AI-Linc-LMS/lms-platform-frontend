"use client";

import { Box, Typography, Paper } from "@mui/material";
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
  return (
    <Box>
      <Typography
        variant="h5"
        sx={{
          fontWeight: 700,
          color: "#111827",
          fontSize: { xs: "1.25rem", sm: "1.5rem" },
          mb: 1,
        }}
      >
        All Courses
      </Typography>
      <Typography variant="body2" sx={{ color: "#6b7280", mb: 2 }}>
        Here is a glimpse of your overall progress.
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
                bgcolor: "#3b82f6",
              }}
            />
            <Typography variant="body2" sx={{ color: "#6b7280" }}>
              <Typography
                component="span"
                sx={{ fontWeight: 600, color: "#3b82f6" }}
              >
                {draftCount}
              </Typography>{" "}
              Drafts
            </Typography>
          </Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Box
              sx={{
                width: 12,
                height: 12,
                borderRadius: "50%",
                bgcolor: "#10b981",
              }}
            />
            <Typography variant="body2" sx={{ color: "#6b7280" }}>
              <Typography
                component="span"
                sx={{ fontWeight: 600, color: "#10b981" }}
              >
                {publishedCount}
              </Typography>{" "}
              Published
            </Typography>
          </Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Box
              sx={{
                width: 12,
                height: 12,
                borderRadius: "50%",
                bgcolor: "#6b7280",
              }}
            />
            <Typography variant="body2" sx={{ color: "#6b7280" }}>
              <Typography
                component="span"
                sx={{ fontWeight: 600, color: "#6b7280" }}
              >
                {totalCount}
              </Typography>{" "}
              Total
            </Typography>
          </Box>
        </Box>
      )}
    </Box>
  );
}

