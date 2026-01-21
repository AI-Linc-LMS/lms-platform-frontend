"use client";

import { Box, Paper, Typography } from "@mui/material";
import { ContentDetails } from "@/lib/services/admin/admin-content-management.service";

interface ArticleViewProps {
  content: ContentDetails;
}

export function ArticleView({ content }: ArticleViewProps) {
  const articleContent = content.content_details?.content || "";
  const difficultyLevel = content.content_details?.difficulty_level || "";

  return (
    <Box
      sx={{
        height: "100%",
        p: { xs: 2, sm: 3, md: 4 },
        maxWidth: "1200px",
        mx: "auto",
      }}
    >
      <Paper
        elevation={0}
        sx={{
          p: { xs: 3, sm: 4, md: 5 },
          backgroundColor: "#ffffff",
          borderRadius: 2,
          border: "1px solid #e5e7eb",
          height: "100%",
          overflow: "auto",
        }}
      >
        {difficultyLevel && (
          <Typography
            variant="caption"
            sx={{
              display: "inline-block",
              mb: 2,
              px: 1.5,
              py: 0.5,
              bgcolor: "#f3f4f6",
              color: "#6b7280",
              borderRadius: 1,
              fontWeight: 600,
            }}
          >
            {difficultyLevel}
          </Typography>
        )}
        <Typography
          variant="h4"
          sx={{
            fontWeight: 700,
            color: "#111827",
            mb: 3,
            fontSize: { xs: "1.5rem", sm: "2rem" },
          }}
        >
          {content.title}
        </Typography>
        <Box
          sx={{
            "& p": {
              mb: 2,
              lineHeight: 1.8,
              color: "#374151",
            },
            "& h2": {
              mt: 4,
              mb: 2,
              fontWeight: 600,
              color: "#111827",
            },
            "& h3": {
              mt: 3,
              mb: 1.5,
              fontWeight: 600,
              color: "#111827",
            },
            "& ul, & ol": {
              mb: 2,
              pl: 3,
            },
            "& li": {
              mb: 1,
              lineHeight: 1.8,
            },
          }}
          dangerouslySetInnerHTML={{ __html: articleContent }}
        />
      </Paper>
    </Box>
  );
}
