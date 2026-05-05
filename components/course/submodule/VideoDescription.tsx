"use client";

import { Paper, Typography, Box } from "@mui/material";
import { ContentDetail } from "@/lib/services/courses.service";

interface VideoDescriptionProps {
  content: ContentDetail;
}

export function VideoDescription({ content }: VideoDescriptionProps) {
  if (!content.details?.description) return null;

  return (
    <Paper
      elevation={0}
      sx={{
        p: 3,
        backgroundColor: "var(--card-bg)",
        borderRadius: 2,
        border: "1px solid var(--border-default)",
      }}
    >
      <Typography
        variant="h6"
        sx={{ fontWeight: 600, color: "var(--font-primary)", mb: 2 }}
      >
        Description
      </Typography>
      <Box
        dangerouslySetInnerHTML={{
          __html: content.details.description,
        }}
        sx={{
          "& h2, & h3": {
            color: "var(--font-primary)",
            fontWeight: 600,
            mt: 2,
            mb: 1,
          },
          "& p": {
            color: "var(--font-secondary)",
            lineHeight: 1.7,
            mb: 1.5,
          },
          "& ul, & ol": {
            color: "var(--font-secondary)",
            pl: 3,
            mb: 1.5,
          },
          "& li": {
            mb: 0.5,
          },
          "& code": {
            backgroundColor: "var(--surface)",
            padding: "2px 6px",
            borderRadius: 1,
            fontSize: "0.875rem",
            fontFamily: "monospace",
            color: "var(--font-primary)",
          },
          "& pre": {
            backgroundColor:
              "color-mix(in srgb, var(--surface) 55%, var(--background) 45%)",
            color: "var(--font-primary)",
            padding: 2,
            borderRadius: 1,
            overflow: "auto",
            mb: 2,
          },
          "& pre code": {
            backgroundColor: "transparent",
            padding: 0,
            color: "inherit",
          },
        }}
      />
    </Paper>
  );
}

