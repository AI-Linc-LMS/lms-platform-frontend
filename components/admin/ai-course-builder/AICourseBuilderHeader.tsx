"use client";

import { Box, Typography } from "@mui/material";

export function AICourseBuilderHeader() {
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
        AI Course Builder
      </Typography>
      <Typography variant="body2" sx={{ color: "#6b7280" }}>
        Generate course outlines and content with AI
      </Typography>
    </Box>
  );
}
