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
        backgroundColor: "#ffffff",
        borderRadius: 2,
        border: "1px solid #e5e7eb",
      }}
    >
      <Typography
        variant="h6"
        sx={{ fontWeight: 600, color: "#1a1f2e", mb: 2 }}
      >
        Description
      </Typography>
      <Box
        dangerouslySetInnerHTML={{
          __html: content.details.description,
        }}
        sx={{
          "& h2, & h3": {
            color: "#1a1f2e",
            fontWeight: 600,
            mt: 2,
            mb: 1,
          },
          "& p": {
            color: "#4b5563",
            lineHeight: 1.7,
            mb: 1.5,
          },
          "& ul, & ol": {
            color: "#4b5563",
            pl: 3,
            mb: 1.5,
          },
          "& li": {
            mb: 0.5,
          },
          "& code": {
            backgroundColor: "#f3f4f6",
            padding: "2px 6px",
            borderRadius: 1,
            fontSize: "0.875rem",
            fontFamily: "monospace",
          },
          "& pre": {
            backgroundColor: "#1a1f2e",
            color: "#ffffff",
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

