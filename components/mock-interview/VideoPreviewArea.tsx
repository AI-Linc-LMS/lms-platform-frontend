"use client";

import { memo } from "react";
import {
  Box,
  Paper,
  Typography,
  CircularProgress,
  Button,
} from "@mui/material";
import { ProctoringVideoPreview } from "@/components/assessment/ProctoringVideoPreview";
import { IconWrapper } from "@/components/common/IconWrapper";
import { AIAvatar } from "./AIAvatar";

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
  isUserSpeaking?: boolean;
  interviewVideoSrc?: string;
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
  isUserSpeaking = false,
  interviewVideoSrc,
  interviewTitle,
  questionsCount,
  durationMinutes,
}: VideoPreviewAreaProps) {
  return (
    <Paper
      elevation={0}
      sx={{
        flex: 1,
        backgroundColor: "var(--interview-paper-bg)",
        borderRadius: 3,
        overflow: "hidden",
        position: "relative",
        border: "1px solid var(--border-default)",
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
          <CircularProgress size={48} sx={{ color: "var(--accent-indigo)" }} />
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
              backgroundColor: "var(--interview-user-video-bg)",
              border: "2px solid var(--border-default)",
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
                sx={{ color: "var(--font-light)", fontSize: "0.75rem" }}
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
          {/* AI Avatar — fills column for classy full-panel look */}
          <Box
            sx={{
              flex: 1,
              minHeight: 320,
              borderRadius: 2,
              overflow: "hidden",
              backgroundColor: "var(--interview-surface)",
              border: "2px solid var(--border-default)",
              position: "relative",
            }}
          >
            <AIAvatar
              isSpeaking={isSpeaking}
              question={questionText}
              onSpeakComplete={onSpeakComplete}
              isUserSpeaking={isUserSpeaking}
              interviewVideoSrc={interviewVideoSrc}
            />
            <Box
              sx={{
                position: "absolute",
                bottom: 10,
                left: 10,
                px: 1.5,
                py: 0.5,
                backgroundColor: "var(--interview-badge-speaking-bg)",
                borderRadius: 1,
                backdropFilter: "blur(10px)",
              }}
            >
              <Typography
                variant="caption"
                sx={{ color: "var(--font-light)", fontSize: "0.75rem" }}
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
          <IconWrapper icon="mdi:video-account" size={80} color="var(--accent-indigo)" />
          <Typography variant="h5" sx={{ fontWeight: 700, color: "var(--font-primary-dark)" }}>
            Ready to Start Interview?
          </Typography>
          {interviewTitle && (
            <Box sx={{ textAlign: "center", mb: 2 }}>
              <Typography variant="body2" sx={{ color: "var(--font-secondary)", mb: 1 }}>
                {interviewTitle}
              </Typography>
              <Typography variant="caption" sx={{ color: "var(--font-tertiary)" }}>
                {questionsCount || 0} questions • {durationMinutes || 0} minutes
              </Typography>
            </Box>
          )}
          <Button
            variant="contained"
            size="large"
            onClick={onStartInterview}
            disabled={isInitializing}
            aria-label={isInitializing ? "Starting interview" : "Start interview"}
            startIcon={
              isInitializing ? (
                <CircularProgress size={20} color="inherit" />
              ) : (
                <IconWrapper icon="mdi:play" size={24} />
              )
            }
            sx={{
              backgroundColor: "var(--accent-indigo)",
              color: "var(--font-light)",
              px: 4,
              py: 1.5,
              fontSize: "1rem",
              fontWeight: 600,
              textTransform: "none",
              "&:hover": {
                backgroundColor: "var(--accent-indigo-dark)",
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
