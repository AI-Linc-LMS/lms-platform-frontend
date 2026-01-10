"use client";

import { Box, Typography, Paper, Chip } from "@mui/material";
import { IconWrapper } from "@/components/common/IconWrapper";

interface CoursesAvailabilityCardProps {
  enrolledCount: number;
  totalAvailable?: number;
}

export function CoursesAvailabilityCard({
  enrolledCount,
  totalAvailable,
}: CoursesAvailabilityCardProps) {
  const availableCount = totalAvailable
    ? totalAvailable - enrolledCount
    : undefined;

  return (
    <Paper
      sx={{
        p: 3,
        borderRadius: 2,
        boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
        mb: 3,
      }}
    >
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 2,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <Box
            sx={{
              width: 48,
              height: 48,
              borderRadius: 2,
              backgroundColor: "#eef2ff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <IconWrapper icon="mdi:book-education" size={24} color="#6366f1" />
          </Box>
          <Box>
            <Typography
              variant="caption"
              sx={{ color: "#6b7280", fontSize: "0.75rem" }}
            >
              Enrolled Courses
            </Typography>
            <Typography
              variant="h6"
              sx={{ fontWeight: 700, color: "#111827", mt: 0.5 }}
            >
              {enrolledCount}
            </Typography>
          </Box>
        </Box>

        {availableCount !== undefined && (
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <Box
              sx={{
                width: 48,
                height: 48,
                borderRadius: 2,
                backgroundColor: "#f0fdf4",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <IconWrapper icon="mdi:book-plus" size={24} color="#10b981" />
            </Box>
            <Box>
              <Typography
                variant="caption"
                sx={{ color: "#6b7280", fontSize: "0.75rem" }}
              >
                Available Courses
              </Typography>
              <Typography
                variant="h6"
                sx={{ fontWeight: 700, color: "#111827", mt: 0.5 }}
              >
                {availableCount}
              </Typography>
            </Box>
          </Box>
        )}

        {totalAvailable !== undefined && (
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <Box
              sx={{
                width: 48,
                height: 48,
                borderRadius: 2,
                backgroundColor: "#fef3c7",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <IconWrapper icon="mdi:book-open-page-variant" size={24} color="#f59e0b" />
            </Box>
            <Box>
              <Typography
                variant="caption"
                sx={{ color: "#6b7280", fontSize: "0.75rem" }}
              >
                Total Courses
              </Typography>
              <Typography
                variant="h6"
                sx={{ fontWeight: 700, color: "#111827", mt: 0.5 }}
              >
                {totalAvailable}
              </Typography>
            </Box>
          </Box>
        )}
      </Box>
    </Paper>
  );
}


