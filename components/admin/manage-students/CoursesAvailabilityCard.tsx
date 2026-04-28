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
        border: "1px solid var(--border-default)",
        backgroundColor: "var(--card-bg)",
        boxShadow:
          "0 1px 3px color-mix(in srgb, var(--font-primary) 10%, transparent)",
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
              backgroundColor:
                "color-mix(in srgb, var(--accent-indigo) 12%, var(--surface) 88%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <IconWrapper icon="mdi:book-education" size={24} color="var(--accent-indigo)" />
          </Box>
          <Box>
            <Typography
              variant="caption"
              sx={{ color: "var(--font-secondary)", fontSize: "0.75rem" }}
            >
              Enrolled Courses
            </Typography>
            <Typography
              variant="h6"
              sx={{ fontWeight: 700, color: "var(--font-primary)", mt: 0.5 }}
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
                backgroundColor:
                  "color-mix(in srgb, var(--success-500) 12%, var(--surface) 88%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <IconWrapper icon="mdi:book-plus" size={24} color="var(--success-500)" />
            </Box>
            <Box>
              <Typography
                variant="caption"
                sx={{ color: "var(--font-secondary)", fontSize: "0.75rem" }}
              >
                Available Courses
              </Typography>
              <Typography
                variant="h6"
                sx={{ fontWeight: 700, color: "var(--font-primary)", mt: 0.5 }}
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
                backgroundColor:
                  "color-mix(in srgb, var(--warning-500) 16%, var(--surface) 84%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <IconWrapper
                icon="mdi:book-open-page-variant"
                size={24}
                color="var(--warning-500)"
              />
            </Box>
            <Box>
              <Typography
                variant="caption"
                sx={{ color: "var(--font-secondary)", fontSize: "0.75rem" }}
              >
                Total Courses
              </Typography>
              <Typography
                variant="h6"
                sx={{ fontWeight: 700, color: "var(--font-primary)", mt: 0.5 }}
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


