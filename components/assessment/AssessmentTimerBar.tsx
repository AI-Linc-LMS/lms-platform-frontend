"use client";

import { Box, Paper, Typography, Button } from "@mui/material";
import { IconWrapper } from "@/components/common/IconWrapper";
import { memo } from "react";

interface AssessmentTimerBarProps {
  title: string;
  formattedTime: string;
  isLastQuestion: boolean;
  submitting: boolean;
  onSubmit: () => void;
  proctoringVideoRef?: React.RefObject<HTMLVideoElement | null>;
  proctoringStatus?: "NORMAL" | "WARNING" | "VIOLATION";
  faceCount?: number;
}

export const AssessmentTimerBar = memo(function AssessmentTimerBar({
  title,
  formattedTime,
  isLastQuestion,
  submitting,
  onSubmit,
  proctoringVideoRef,
  proctoringStatus = "NORMAL",
  faceCount = 0,
}: AssessmentTimerBarProps) {
  const getStatusColor = () => {
    switch (proctoringStatus) {
      case "NORMAL":
        return "#10b981";
      case "WARNING":
        return "#f59e0b";
      case "VIOLATION":
        return "#ef4444";
    }
  };
  return (
    <Paper
      elevation={2}
      sx={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 1300,
        p: 1.2,
        backgroundColor: "#fff",
        borderBottom: "1px solid #e5e7eb",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
      }}
    >
      <Typography
        variant="h6"
        style={{ margin: 0, fontSize: "1.5rem", fontWeight: 700 }}
      >
        {title}
      </Typography>
      <Box sx={{ display: "flex", alignItems: "center", gap: 3 }}>
        {/* Timer */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <IconWrapper icon="mdi:timer-outline" size={24} color="#6b7280" />
          <Typography
            variant="h6"
            sx={{
              fontWeight: 600,
              color: "#374151",
              fontFamily: "monospace",
            }}
          >
            {formattedTime}
          </Typography>
        </Box>

        {/* Hidden video element for proctoring only (no preview) */}
        {proctoringVideoRef && (
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1,
              px: 1.5,
              py: 0.75,
              backgroundColor: "#1f2937",
              borderRadius: 1,
              border: `2px solid ${getStatusColor()}`,
            }}
          >
            <video
              ref={proctoringVideoRef}
              autoPlay
              playsInline
              muted
              width={80}
              height={60}
              style={{
                width: 80,
                height: 60,
                display: "block",
                transform: "scaleX(-1)",
                objectFit: "cover",
                borderRadius: 4,
              }}
            />
            <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 0.5,
                }}
              >
                <Box
                  sx={{
                    width: 6,
                    height: 6,
                    borderRadius: "50%",
                    backgroundColor: getStatusColor(),
                    animation: "pulse 2s infinite",
                    "@keyframes pulse": {
                      "0%, 100%": { opacity: 1 },
                      "50%": { opacity: 0.5 },
                    },
                  }}
                />
                <Typography
                  variant="caption"
                  sx={{ color: "#fff", fontWeight: 600, fontSize: "0.65rem" }}
                >
                  REC
                </Typography>
              </Box>
              <Typography
                variant="caption"
                sx={{
                  color: getStatusColor(),
                  fontWeight: 600,
                  fontSize: "0.65rem",
                }}
              >
                {faceCount === 0
                  ? "No Face"
                  : faceCount === 1
                  ? "Face OK"
                  : `${faceCount} Faces`}
              </Typography>
            </Box>
          </Box>
        )}
      </Box>

      <Button
        variant="contained"
        onClick={onSubmit}
        disabled={!isLastQuestion || submitting}
        startIcon={<IconWrapper icon="mdi:check-circle" />}
        sx={{
          minWidth: "150px",
          backgroundColor: "#374151",
          "&:hover": {
            backgroundColor: "#1f2937",
          },
          "&:disabled": {
            backgroundColor: "#e5e7eb",
            color: "#9ca3af",
          },
        }}
      >
        {submitting ? "Submitting..." : "Submit Assessment"}
      </Button>
    </Paper>
  );
});
