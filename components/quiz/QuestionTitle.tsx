"use client";

import { Box, Typography } from "@mui/material";

/** Check if string contains HTML tags so we can render with dangerouslySetInnerHTML */
function hasHtml(str: unknown): str is string {
  return typeof str === "string" && /<[a-z][\s\S]*>/i.test(str);
}

interface QuestionTitleProps {
  question: string;
  /** When true, reduce spacing so quiz fits without scroll */
  compact?: boolean;
}

const titleSx = {
  fontWeight: 700,
  color: "#111827",
  fontSize: { xs: "1.125rem", sm: "1.25rem", md: "1.375rem" },
  lineHeight: 1.7,
  letterSpacing: "-0.01em",
};

export function QuestionTitle({ question, compact }: QuestionTitleProps) {
  return (
    <Box
      sx={{
        mb: compact ? { xs: 1.5, sm: 2 } : { xs: 2, sm: 3 },
        maxHeight: compact ? "180px" : "200px",
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
      {hasHtml(question) ? (
        <Box
          component="div"
          sx={{
            ...titleSx,
            "& p": { margin: "0 0 0.5em 0" },
            "& p:last-child": { marginBottom: 0 },
          }}
          dangerouslySetInnerHTML={{ __html: question }}
        />
      ) : (
        <Typography variant="h6" sx={titleSx}>
          {question}
        </Typography>
      )}
    </Box>
  );
}

