"use client";

import { Box, Typography } from "@mui/material";

export function CourseBuilderHeader() {
  return (
    <Box sx={{ mb: 4 }}>
      <Typography
        variant="h4"
        sx={{
          fontWeight: 700,
          color: "#111827",
          fontSize: { xs: "1.5rem", sm: "2rem" },
          mb: 1,
        }}
      >
        Course Builder
      </Typography>
      <Typography variant="body2" sx={{ color: "#6b7280" }}>
        Manage your courses and content
      </Typography>
    </Box>
  );
}

