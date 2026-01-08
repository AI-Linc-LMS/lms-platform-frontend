"use client";

import { Box, Typography, Button, IconButton } from "@mui/material";
import { IconWrapper } from "@/components/common/IconWrapper";
import { InterviewTimer } from "./InterviewTimer";
import { memo } from "react";

interface InterviewHeaderProps {
  title: string;
  topic: string;
  difficulty: string;
  interviewStarted: boolean;
  onBack?: () => void;
  durationMinutes: number;
  startedAt: Date | null;
  onTimeUp: () => void;
  onEndInterview: () => void;
  // Proctoring status
  isProctoringActive: boolean;
  proctoringStatus: "NORMAL" | "WARNING" | "VIOLATION";
  faceCount: number;
  latestViolation: {
    type: string;
    message: string;
  } | null;
}

export const InterviewHeader = memo(function InterviewHeader({
  title,
  topic,
  difficulty,
  interviewStarted,
  onBack,
  durationMinutes,
  startedAt,
  onTimeUp,
  onEndInterview,
  isProctoringActive,
  proctoringStatus,
  faceCount,
  latestViolation,
}: InterviewHeaderProps) {
  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        px: 3,
        py: 2,
        backgroundColor: "#ffffff",
        borderBottom: "1px solid #e5e7eb",
        boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
        {!interviewStarted && onBack && (
          <IconButton onClick={onBack} sx={{ color: "#374151" }}>
            <IconWrapper icon="mdi:arrow-left" size={24} />
          </IconButton>
        )}
        <Box>
          <Typography
            variant="h6"
            sx={{ fontWeight: 700, fontSize: "1.25rem", color: "#111827" }}
          >
            {title}
          </Typography>
          <Typography
            variant="caption"
            sx={{ color: "#6b7280", fontSize: "0.75rem" }}
          >
            {topic} • {difficulty}
          </Typography>
        </Box>
      </Box>

      <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
        {/* Proctoring Status Indicator */}
        {interviewStarted && isProctoringActive && (
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1,
              px: 1.5,
              py: 0.75,
              backgroundColor:
                proctoringStatus === "VIOLATION"
                  ? "rgba(239, 68, 68, 0.9)"
                  : proctoringStatus === "WARNING"
                  ? "rgba(245, 158, 11, 0.9)"
                  : "rgba(16, 185, 129, 0.9)",
              borderRadius: 1,
              border: `2px solid ${
                proctoringStatus === "VIOLATION"
                  ? "#ef4444"
                  : proctoringStatus === "WARNING"
                  ? "#f59e0b"
                  : "#10b981"
              }`,
            }}
          >
            <IconWrapper
              icon={
                faceCount === 0
                  ? "mdi:account-off"
                  : faceCount > 1
                  ? "mdi:account-multiple"
                  : latestViolation?.type === "LOOKING_AWAY"
                  ? "mdi:eye-off"
                  : latestViolation?.type === "FACE_TOO_CLOSE"
                  ? "mdi:arrow-down"
                  : latestViolation?.type === "FACE_TOO_FAR"
                  ? "mdi:arrow-up"
                  : "mdi:check-circle"
              }
              size={18}
              color="#ffffff"
            />
            <Typography
              variant="caption"
              sx={{ color: "#ffffff", fontSize: "0.75rem", fontWeight: 500 }}
            >
              {faceCount === 0
                ? "No Face"
                : faceCount > 1
                ? `${faceCount} Faces`
                : latestViolation
                ? latestViolation.message
                : "Face OK"}
            </Typography>
          </Box>
        )}

        {interviewStarted && (
          <InterviewTimer
            durationMinutes={durationMinutes}
            startedAt={startedAt || new Date()}
            onTimeUp={onTimeUp}
          />
        )}

        {interviewStarted && (
          <>
            <Button
              variant="contained"
              size="small"
              sx={{
                backgroundColor: "#ef4444",
                color: "#ffffff",
                textTransform: "none",
                "&:hover": {
                  backgroundColor: "#dc2626",
                },
              }}
              startIcon={<IconWrapper icon="mdi:record" size={18} />}
            >
              Live Recording
            </Button>
            <Button
              variant="outlined"
              size="small"
              onClick={onEndInterview}
              sx={{
                borderColor: "#d1d5db",
                color: "#374151",
                textTransform: "none",
                "&:hover": {
                  borderColor: "#9ca3af",
                  backgroundColor: "#f9fafb",
                },
              }}
            >
              End Interview
            </Button>
          </>
        )}
      </Box>
    </Box>
  );
});
