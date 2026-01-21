"use client";

import { Box, Paper, Typography } from "@mui/material";
import { VideoPlayer } from "@/components/video/VideoPlayer";
import { ContentDetails } from "@/lib/services/admin/admin-content-management.service";

interface VideoTutorialViewProps {
  content: ContentDetails;
}

export function VideoTutorialView({ content }: VideoTutorialViewProps) {
  const videoUrl = content.content_details?.video_url || "";
  const description = content.content_details?.description || "";
  const difficultyLevel = content.content_details?.difficulty_level || "";

  if (!videoUrl) {
    return (
      <Box sx={{ p: 3, textAlign: "center" }}>
        <Typography variant="h6">No video URL provided</Typography>
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
            backgroundColor: "#ffffff",
            borderRadius: 2,
            border: "1px solid #e5e7eb",
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
            variant="h5"
            sx={{
              fontWeight: 700,
              color: "#111827",
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
                color: "#111827",
                fontSize: { xs: "1.125rem", sm: "1.25rem" },
              },
              "& h3": {
                mt: 2.5,
                mb: 1,
                fontWeight: 600,
                color: "#111827",
                fontSize: { xs: "1rem", sm: "1.125rem" },
              },
              "& h4": {
                mt: 2,
                mb: 0.5,
                fontWeight: 600,
                color: "#111827",
                fontSize: { xs: "0.9375rem", sm: "1rem" },
              },
              "& p": {
                mb: 1.5,
                lineHeight: 1.8,
                color: "#374151",
                fontSize: { xs: "0.9375rem", sm: "1rem" },
              },
              "& ul, & ol": {
                mb: 1.5,
                pl: 3,
              },
              "& li": {
                mb: 0.75,
                lineHeight: 1.8,
                color: "#374151",
              },
              "& strong": {
                fontWeight: 600,
                color: "#111827",
              },
              "& pre": {
                backgroundColor: "#f9fafb",
                border: "1px solid #e5e7eb",
                borderRadius: 1,
                p: 2,
                overflow: "auto",
                mb: 1.5,
                "& code": {
                  fontFamily: "monospace",
                  fontSize: "0.875rem",
                  color: "#111827",
                },
              },
              "& blockquote": {
                borderLeft: "4px solid #6366f1",
                pl: 2,
                ml: 0,
                py: 1,
                mb: 1.5,
                fontStyle: "italic",
                color: "#6b7280",
                backgroundColor: "#f9fafb",
              },
              "& .video-description": {
                "& .real-world-example": {
                  backgroundColor: "#f0f9ff",
                  border: "1px solid #bae6fd",
                  borderRadius: 1,
                  p: 2,
                  mb: 2,
                },
                "& .banner": {
                  backgroundColor: "#fef3c7",
                  border: "1px solid #fde68a",
                  borderRadius: 1,
                  p: 1.5,
                  mb: 1.5,
                  "& h4": {
                    mt: 0,
                    mb: 0.5,
                    color: "#92400e",
                  },
                  "& p": {
                    mb: 0,
                    color: "#78350f",
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
