"use client";

import { Box, Alert, Typography } from "@mui/material";
import { ContentDetail } from "@/lib/services/courses.service";
import { VideoPlayer } from "@/components/video/VideoPlayer";

interface VideoContentProps {
  content: ContentDetail;
  contentId: number;
  isFirstVideoView: boolean;
  videoCanSeek: boolean;
  onVideoStart: () => void;
  onVideoComplete?: () => void;
}

export function VideoContent({
  content,
  contentId,
  isFirstVideoView,
  videoCanSeek,
  onVideoStart,
  onVideoComplete,
}: VideoContentProps) {
  if (!content.details?.video_url) return null;

  const videoUrl = content.details.video_url;
  const isFirstWatch = isFirstVideoView && !videoCanSeek && content.status !== "complete";

  return (
    <Box sx={{ mb: 3 }}>
      {isFirstWatch && (
        <Alert
          severity="info"
          sx={{
            mb: 2,
            backgroundColor: "#eff6ff",
            color: "#1e40af",
            border: "1px solid #bfdbfe",
            "& .MuiAlert-icon": {
              color: "#3b82f6",
            },
          }}
        >
          <Typography variant="body2" sx={{ fontWeight: 500 }}>
            Please watch the video from the beginning. Seeking forward is disabled on first view.
          </Typography>
        </Alert>
      )}
      <Box
        sx={{
          width: "100%",
          borderRadius: 2,
          overflow: "hidden",
          mb: 2,
          position: "relative",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <VideoPlayer
          videoUrl={videoUrl}
          title={content.content_title}
          videoId={contentId}
          isFirstWatch={isFirstWatch}
          activityCompletionThreshold={90}
          onComplete={onVideoComplete ? () => {
            try {
              if (onVideoComplete) onVideoComplete();
            } catch (error) {
              // Error in onVideoComplete
            }
          } : undefined}
          onVideoLoad={onVideoStart}
        />
      </Box>
    </Box>
  );
}

