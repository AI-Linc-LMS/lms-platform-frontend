"use client";

import { Box, Paper, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";
import { VideoPlayer } from "@/components/video/VideoPlayer";
import { ContentDetails } from "@/lib/services/admin/admin-content-management.service";

interface VideoTutorialViewProps {
  content: ContentDetails;
}

export function VideoTutorialView({ content }: VideoTutorialViewProps) {
  const videoUrl = content.content_details?.video_url || "";
  const description = content.content_details?.description || "";
  const difficultyLevel = content.content_details?.difficulty_level || "";

  const { t } = useTranslation("common");
  if (!videoUrl) {
    return (
      <Box sx={{ p: 3, textAlign: "center" }}>
        <Typography variant="h6">{t("adminContentManagement.noVideoUrlProvided")}</Typography>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        height: "100%",
        width: "100%",
        display: "flex",
        flexDirection: "column",
        p: { xs: 1, sm: 2 },
        gap: 2,
        overflow: "auto",
      }}
    >
      {/* Video Player Section */}
      <Box
        sx={{
          width: "100%",
          flexShrink: 0,
          display: "flex",
          flexDirection: "column",
        }}
      >
        <VideoPlayer
          videoUrl={videoUrl}
          title={content.title}
          videoId={content.id.toString()}
          isFirstWatch={false}
          activityCompletionThreshold={100}
        />
      </Box>

      {/* Description Section */}
      {description && (
        <Paper
          elevation={0}
          sx={{
            p: { xs: 2, sm: 3, md: 4 },
            backgroundColor: "var(--card-bg)",
            borderRadius: 2,
            border: "1px solid var(--border-default)",
            flexShrink: 0,
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
            variant="h5"
            sx={{
              fontWeight: 700,
              color: "var(--font-primary)",
              mb: 2,
              fontSize: { xs: "1.25rem", sm: "1.5rem" },
            }}
          >
            {content.title}
          </Typography>
          <Box
            sx={{
              "& h2": {
                mt: 3,
                mb: 1.5,
                fontWeight: 600,
                color: "var(--font-primary)",
                fontSize: { xs: "1.125rem", sm: "1.25rem" },
              },
              "& h3": {
                mt: 2.5,
                mb: 1,
                fontWeight: 600,
                color: "var(--font-primary)",
                fontSize: { xs: "1rem", sm: "1.125rem" },
              },
              "& h4": {
                mt: 2,
                mb: 0.5,
                fontWeight: 600,
                color: "var(--font-primary)",
                fontSize: { xs: "0.9375rem", sm: "1rem" },
              },
              "& p": {
                mb: 1.5,
                lineHeight: 1.8,
                color: "var(--font-secondary)",
                fontSize: { xs: "0.9375rem", sm: "1rem" },
              },
              "& ul, & ol": {
                mb: 1.5,
                pl: 3,
              },
              "& li": {
                mb: 0.75,
                lineHeight: 1.8,
                color: "var(--font-secondary)",
              },
              "& strong": {
                fontWeight: 600,
                color: "var(--font-primary)",
              },
              "& pre": {
                backgroundColor: "var(--surface)",
                border: "1px solid var(--border-default)",
                borderRadius: 1,
                p: 2,
                overflow: "auto",
                mb: 1.5,
                "& code": {
                  fontFamily: "monospace",
                  fontSize: "0.875rem",
                  color: "var(--font-primary)",
                },
              },
              "& blockquote": {
                borderLeft: "4px solid var(--accent-indigo)",
                pl: 2,
                ml: 0,
                py: 1,
                mb: 1.5,
                fontStyle: "italic",
                color: "var(--font-secondary)",
                backgroundColor: "var(--surface)",
              },
              "& .video-description": {
                "& .real-world-example": {
                  backgroundColor:
                    "color-mix(in srgb, var(--accent-indigo) 10%, var(--surface) 90%)",
                  border:
                    "1px solid color-mix(in srgb, var(--accent-indigo) 28%, var(--border-default) 72%)",
                  borderRadius: 1,
                  p: 2,
                  mb: 2,
                },
                "& .banner": {
                  backgroundColor:
                    "color-mix(in srgb, var(--warning-500) 14%, var(--surface) 86%)",
                  border:
                    "1px solid color-mix(in srgb, var(--warning-500) 35%, var(--border-default) 65%)",
                  borderRadius: 1,
                  p: 1.5,
                  mb: 1.5,
                  "& h4": {
                    mt: 0,
                    mb: 0.5,
                    color: "var(--warning-500)",
                  },
                  "& p": {
                    mb: 0,
                    color: "var(--font-primary)",
                  },
                },
              },
            }}
            dangerouslySetInnerHTML={{ __html: description }}
          />
        </Paper>
      )}
    </Box>
  );
}
