"use client";

import { Box, Paper, Typography } from "@mui/material";
import { ContentDetails } from "@/lib/services/admin/admin-content-management.service";
import { extractArticleBodyAndAttachments } from "@/lib/utils/articleAttachments";

interface ArticleViewProps {
  content: ContentDetails;
}

export function ArticleView({ content }: ArticleViewProps) {
  const raw = content.content_details?.content || "";
  const { body: articleContent } = extractArticleBodyAndAttachments(raw);
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
          backgroundColor: "var(--card-bg)",
          borderRadius: 2,
          border: "1px solid var(--border-default)",
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
              bgcolor: "var(--surface)",
              color: "var(--font-secondary)",
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
            color: "var(--font-primary)",
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
              color: "var(--font-secondary)",
            },
            "& h2": {
              mt: 4,
              mb: 2,
              fontWeight: 600,
              color: "var(--font-primary)",
            },
            "& h3": {
              mt: 3,
              mb: 1.5,
              fontWeight: 600,
              color: "var(--font-primary)",
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
