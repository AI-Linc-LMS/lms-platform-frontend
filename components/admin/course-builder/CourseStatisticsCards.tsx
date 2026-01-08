"use client";

import { Box, Typography, Paper } from "@mui/material";
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
          bgcolor: "linear-gradient(to right, #eff6ff, #dbeafe)",
          background: "linear-gradient(to right, #eff6ff, #dbeafe)",
          border: "1px solid #bfdbfe",
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
              sx={{ fontWeight: 500, color: "#3b82f6", mb: 0.5 }}
            >
              Draft Courses
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 700, color: "#1e40af" }}>
              {draftCount}
            </Typography>
          </Box>
          <Box
            sx={{
              width: 48,
              height: 48,
              borderRadius: "50%",
              bgcolor: "#bfdbfe",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <IconWrapper icon="mdi:pencil" size={24} color="#3b82f6" />
          </Box>
        </Box>
      </Paper>
      <Paper
        sx={{
          p: 3,
          bgcolor: "linear-gradient(to right, #f0fdf4, #dcfce7)",
          background: "linear-gradient(to right, #f0fdf4, #dcfce7)",
          border: "1px solid #bbf7d0",
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
              sx={{ fontWeight: 500, color: "#10b981", mb: 0.5 }}
            >
              Published Courses
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 700, color: "#065f46" }}>
              {publishedCount}
            </Typography>
          </Box>
          <Box
            sx={{
              width: 48,
              height: 48,
              borderRadius: "50%",
              bgcolor: "#bbf7d0",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <IconWrapper icon="mdi:check-circle" size={24} color="#10b981" />
          </Box>
        </Box>
      </Paper>
      <Paper
        sx={{
          p: 3,
          bgcolor: "linear-gradient(to right, #f9fafb, #f3f4f6)",
          background: "linear-gradient(to right, #f9fafb, #f3f4f6)",
          border: "1px solid #e5e7eb",
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
              sx={{ fontWeight: 500, color: "#6b7280", mb: 0.5 }}
            >
              Total Courses
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 700, color: "#374151" }}>
              {totalCount}
            </Typography>
          </Box>
          <Box
            sx={{
              width: 48,
              height: 48,
              borderRadius: "50%",
              bgcolor: "#e5e7eb",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <IconWrapper icon="mdi:book-open-variant" size={24} color="#6b7280" />
          </Box>
        </Box>
      </Paper>
    </Box>
  );
}

