"use client";

import {
  Box,
  Paper,
  Typography,
  CircularProgress,
  Button,
} from "@mui/material";
import { IconWrapper } from "@/components/common/IconWrapper";
import { AIAvatar } from "./AIAvatar";
import { ProctoringVideoPreview } from "@/components/assessment/ProctoringVideoPreview";
import { memo } from "react";

interface VideoPreviewAreaProps {
  loading: boolean;
  interviewStarted: boolean;
  showStartButton: boolean;
  onStartInterview: () => void;
  isInitializing: boolean;
  // Video refs
  proctoringVideoRef: React.RefObject<HTMLVideoElement | null>;
  // Proctoring status
  isProctoringActive: boolean;
  proctoringStatus: "NORMAL" | "WARNING" | "VIOLATION";
  faceCount: number;
  latestViolation: {
    type: string;
    message: string;
  } | null;
  // AI Avatar
  isSpeaking: boolean;
  questionText: string;
  onSpeakComplete: () => void;
  // Interview info
  interviewTitle?: string;
  questionsCount?: number;
  durationMinutes?: number;
}

export const VideoPreviewArea = memo(function VideoPreviewArea({
  loading,
  interviewStarted,
  onStartInterview,
  isInitializing,
  proctoringVideoRef,
  isProctoringActive,
  proctoringStatus,
  faceCount,
  latestViolation,
  isSpeaking,
  questionText,
  onSpeakComplete,
  interviewTitle,
  questionsCount,
  durationMinutes,
}: VideoPreviewAreaProps) {
  return (
    <Paper
      elevation={0}
      sx={{
        flex: 1,
        backgroundColor: "#f9fafb",
        borderRadius: 3,
        overflow: "hidden",
        position: "relative",
        border: "1px solid #e5e7eb",
      }}
    >
      {loading ? (
        <Box
          sx={{
            width: "100%",
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <CircularProgress size={48} sx={{ color: "#6366f1" }} />
        </Box>
      ) : interviewStarted ? (
        <Box
          sx={{
            width: "100%",
            height: "100%",
            display: "flex",
            gap: 2,
            p: 2,
          }}
        >
          {/* User Video Preview */}
          <Box
            sx={{
              flex: 1,
              borderRadius: 2,
              overflow: "hidden",
              backgroundColor: "#1f2937",
              border: "2px solid #e5e7eb",
              position: "relative",
            }}
          >
            <video
              ref={proctoringVideoRef}
              autoPlay
              playsInline
              muted
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                transform: "scaleX(-1)", // Mirror the video
              }}
            />
            <Box
              sx={{
                position: "absolute",
                bottom: 10,
                left: 10,
                px: 1.5,
                py: 0.5,
                backgroundColor: "rgba(0, 0, 0, 0.6)",
                borderRadius: 1,
                backdropFilter: "blur(10px)",
              }}
            >
              <Typography
                variant="caption"
                sx={{ color: "#ffffff", fontSize: "0.75rem" }}
              >
                You
              </Typography>
            </Box>
            {/* Proctoring Status Indicator */}
            <ProctoringVideoPreview
              videoRef={proctoringVideoRef}
              status={proctoringStatus}
              faceCount={faceCount}
              latestViolation={latestViolation}
              visible={isProctoringActive}
            />
          </Box>
          {/* AI Avatar */}
          <Box
            sx={{
              flex: 1,
              borderRadius: 2,
              overflow: "hidden",
              backgroundColor: "#ffffff",
              border: "2px solid #e5e7eb",
              position: "relative",
            }}
          >
            <AIAvatar
              isSpeaking={isSpeaking}
              question={questionText}
              onSpeakComplete={onSpeakComplete}
            />
            <Box
              sx={{
                position: "absolute",
                bottom: 10,
                left: 10,
                px: 1.5,
                py: 0.5,
                backgroundColor: "rgba(99, 102, 241, 0.9)",
                borderRadius: 1,
                backdropFilter: "blur(10px)",
              }}
            >
              <Typography
                variant="caption"
                sx={{ color: "#ffffff", fontSize: "0.75rem" }}
              >
                AI Interviewer
              </Typography>
            </Box>
          </Box>
        </Box>
      ) : (
        <Box
          sx={{
            width: "100%",
            height: "100%",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 3,
          }}
        >
          <IconWrapper icon="mdi:robot" size={120} color="#6366f1" />
          <Typography variant="h5" sx={{ fontWeight: 700, color: "#111827" }}>
            Ready to Start Interview?
          </Typography>
          {interviewTitle && (
            <Box sx={{ textAlign: "center", mb: 2 }}>
              <Typography variant="body2" sx={{ color: "#6b7280", mb: 1 }}>
                {interviewTitle}
              </Typography>
              <Typography variant="caption" sx={{ color: "#9ca3af" }}>
                {questionsCount || 0} questions • {durationMinutes || 0} minutes
              </Typography>
            </Box>
          )}
          <Button
            variant="contained"
            size="large"
            onClick={onStartInterview}
            disabled={isInitializing}
            startIcon={
              isInitializing ? (
                <CircularProgress size={20} color="inherit" />
              ) : (
                <IconWrapper icon="mdi:play" size={24} />
              )
            }
            sx={{
              backgroundColor: "#6366f1",
              color: "#ffffff",
              px: 4,
              py: 1.5,
              fontSize: "1rem",
              fontWeight: 600,
              textTransform: "none",
              "&:hover": {
                backgroundColor: "#4f46e5",
              },
            }}
          >
            {isInitializing ? "Starting Interview..." : "Start Interview"}
          </Button>
        </Box>
      )}
    </Paper>
  );
});
