"use client";

import { Box, Typography } from "@mui/material";

interface QuestionTitleProps {
  question: string;
}

export function QuestionTitle({ question }: QuestionTitleProps) {
  return (
    <Box
      sx={{
        mb: { xs: 2, sm: 3 },
        maxHeight: "200px",
        overflowY: "auto",
        pr: 1,
        "&::-webkit-scrollbar": {
          width: "8px",
        },
        "&::-webkit-scrollbar-track": {
          backgroundColor: "#f1f1f1",
          borderRadius: "4px",
        },
        "&::-webkit-scrollbar-thumb": {
          backgroundColor: "#c1c1c1",
          borderRadius: "4px",
          "&:hover": {
            backgroundColor: "#a8a8a8",
          },
        },
      }}
    >
      <Typography
        variant="h6"
        sx={{
          fontWeight: 700,
          color: "#111827",
          fontSize: { xs: "1.125rem", sm: "1.25rem", md: "1.375rem" },
          lineHeight: 1.7,
          letterSpacing: "-0.01em",
        }}
      >
        {question}
      </Typography>
    </Box>
  );
}

