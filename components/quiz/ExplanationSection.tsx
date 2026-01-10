"use client";

import { Box, Typography } from "@mui/material";

interface ExplanationSectionProps {
  explanation: string;
}

export function ExplanationSection({ explanation }: ExplanationSectionProps) {
  return (
    <Box
      sx={{
        mt: 3,
        p: 2.5,
        backgroundColor: "#f9fafb",
        borderRadius: 2,
        borderLeft: "4px solid #6366f1",
      }}
    >
      <Typography
        variant="body2"
        sx={{
          fontWeight: 600,
          color: "#6366f1",
          mb: 1,
        }}
      >
        Explanation:
      </Typography>
      <Typography
        variant="body2"
        sx={{
          color: "#4b5563",
          lineHeight: 1.6,
        }}
      >
        {explanation}
      </Typography>
    </Box>
  );
}

