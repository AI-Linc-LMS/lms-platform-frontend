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
          fontWeight: 600,
          color: "#1a1f2e",
          fontSize: { xs: "1rem", sm: "1.125rem", md: "1.25rem" },
          lineHeight: 1.6,
        }}
      >
        {question}
      </Typography>
    </Box>
  );
}

