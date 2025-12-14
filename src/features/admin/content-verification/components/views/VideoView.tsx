import { Box, Typography, Paper, Chip } from "@mui/material";
import { VideoTutorialDetails } from "../../types";

interface VideoViewProps {
  details: any;
}

const VideoView: React.FC<VideoViewProps> = ({ details }) => {
  const videoDetails = details as VideoTutorialDetails;

  // Extract Vimeo video ID from URL
  const getVimeoId = (url: string) => {
    const match = url.match(/vimeo\.com\/(\d+)/);
    return match ? match[1] : null;
  };

  const vimeoId = getVimeoId(videoDetails.video_url);

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
      <Paper
        sx={{
          p: 3,
          border: "1px solid var(--neutral-200)",
        }}
      >
        <Box sx={{ mb: 2 }}>
          <Typography
            sx={{
              fontSize: "0.875rem",
              fontWeight: 600,
              color: "var(--font-secondary)",
              mb: 1,
            }}
          >
            Difficulty Level
          </Typography>
          <Chip
            label={videoDetails.difficulty_level}
            size="small"
            sx={{
              bgcolor: "var(--primary-100)",
              color: "var(--primary-700)",
            }}
          />
        </Box>

        {/* Vimeo Player */}
        {vimeoId && (
          <Box sx={{ mb: 3 }}>
            <Typography
              sx={{
                fontSize: "1rem",
                fontWeight: 600,
                color: "var(--font-primary)",
                mb: 2,
              }}
            >
              Video
            </Typography>
            <Box
              sx={{
                position: "relative",
                paddingBottom: "56.25%", // 16:9 aspect ratio
                height: 0,
                overflow: "hidden",
                borderRadius: 1,
              }}
            >
              <iframe
                src={`https://player.vimeo.com/video/${vimeoId}?title=0&byline=0&portrait=0`}
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "100%",
                  height: "100%",
                  border: "none",
                }}
                allow="autoplay; fullscreen; picture-in-picture"
                allowFullScreen
                title={videoDetails.title}
              />
            </Box>
          </Box>
        )}

        {/* Video URL (fallback) */}
        {!vimeoId && (
          <Box sx={{ mb: 3 }}>
            <Typography
              sx={{
                fontSize: "1rem",
                fontWeight: 600,
                color: "var(--font-primary)",
                mb: 2,
              }}
            >
              Video URL
            </Typography>
            <Paper
              sx={{
                p: 2,
                bgcolor: "var(--neutral-50)",
                wordBreak: "break-all",
              }}
            >
              <a
                href={videoDetails.video_url}
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: "var(--primary-600)" }}
              >
                {videoDetails.video_url}
              </a>
            </Paper>
          </Box>
        )}

        {/* Description */}
        {videoDetails.description && (
          <Box>
            <Typography
              sx={{
                fontSize: "1rem",
                fontWeight: 600,
                color: "var(--font-primary)",
                mb: 2,
              }}
            >
              Description
            </Typography>
            <Box
              sx={{
                "& img": {
                  maxWidth: "100%",
                  height: "auto",
                },
                "& a": {
                  color: "var(--primary-600)",
                  textDecoration: "underline",
                },
                "& pre": {
                  bgcolor: "var(--neutral-100)",
                  p: 2,
                  borderRadius: 1,
                  overflow: "auto",
                },
                "& code": {
                  bgcolor: "var(--neutral-100)",
                  px: 0.5,
                  py: 0.25,
                  borderRadius: 0.5,
                  fontFamily: "monospace",
                },
              }}
              dangerouslySetInnerHTML={{ __html: videoDetails.description }}
            />
          </Box>
        )}
      </Paper>
    </Box>
  );
};

export default VideoView;


