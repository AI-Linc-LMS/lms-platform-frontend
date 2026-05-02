"use client";

import { Box, Paper, Typography, Button, Chip } from "@mui/material";
import { IconWrapper } from "@/components/common/IconWrapper";
import { memo } from "react";
import { useTranslation } from "react-i18next";
import type { LiveStreamStatus } from "@/lib/hooks/useLiveProctoringPublisher";

interface AssessmentTimerBarProps {
  title: string;
  formattedTime: string;
  isLastQuestion: boolean;
  submitting: boolean;
  onSubmit: () => void;
  proctoringVideoRef?: React.RefObject<HTMLVideoElement | null>;
  proctoringStatus?: "NORMAL" | "WARNING" | "VIOLATION";
  faceCount?: number;
  assessmentToolsSlot?: React.ReactNode;
  /** LiveKit SFU publish status for admin live proctoring */
  liveStreamStatus?: LiveStreamStatus;
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
  assessmentToolsSlot,
  liveStreamStatus,
}: AssessmentTimerBarProps) {
  const getStatusColor = () => {
    switch (proctoringStatus) {
      case "NORMAL":
        return "var(--course-cta)";
      case "WARNING":
        return "var(--warning-500)";
      case "VIOLATION":
        return "var(--error-500)";
    }
  };
  return (
    <Paper
      elevation={2}
      sx={{
        position: "fixed",
        top: 0,
        insetInlineStart: 0,
        insetInlineEnd: 0,
        zIndex: 1300,
        p: 1.2,
        backgroundColor: "var(--font-light)",
        borderBottom: "1px solid var(--border-default)",
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
        <Box sx={{ display: "flex", alignItems: "center", gap: { xs: 1, sm: 2, md: 3 } }}>
        {liveStreamStatus && liveStreamStatus !== "idle" && (
          <Chip
            size="small"
            label={
              liveStreamStatus === "connected"
                ? "LIVE"
                : liveStreamStatus === "connecting"
                  ? "LIVE…"
                  : liveStreamStatus === "reconnecting"
                    ? "LIVE (reconnect)"
                    : "LIVE (error)"
            }
            sx={{
              fontWeight: 700,
              fontSize: "0.65rem",
              height: 22,
              bgcolor:
                liveStreamStatus === "connected"
                  ? "color-mix(in srgb, var(--course-cta) 14%, transparent)"
                  : liveStreamStatus === "error"
                    ? "color-mix(in srgb, var(--error-500) 12%, transparent)"
                    : "color-mix(in srgb, var(--warning-500) 18%, transparent)",
              color:
                liveStreamStatus === "connected"
                  ? "color-mix(in srgb, var(--course-cta) 78%, var(--font-dark))"
                  : liveStreamStatus === "error"
                    ? "color-mix(in srgb, var(--error-600) 88%, var(--font-dark))"
                    : "color-mix(in srgb, var(--accent-orange) 55%, var(--font-dark))",
              border:
                liveStreamStatus === "connected"
                  ? "1px solid color-mix(in srgb, var(--course-cta) 38%, transparent)"
                  : "1px solid color-mix(in srgb, var(--warning-500) 42%, transparent)",
            }}
          />
        )}
        {/* Timer */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <IconWrapper icon="mdi:timer-outline" size={24} color="var(--font-secondary)" />
          <Typography
            variant="h6"
            sx={{
              fontWeight: 600,
              color: "var(--font-muted)",
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
              backgroundColor: "var(--font-primary-dark)",
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
                  sx={{ color: "var(--font-light)", fontWeight: 600, fontSize: "0.65rem" }}
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

      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: { xs: 0.75, sm: 1 },
          flexShrink: 0,
        }}
      >
        {assessmentToolsSlot}
        <Button
        variant="contained"
        onClick={onSubmit}
        disabled={submitting}
        startIcon={
          submitting ? (
            <Box
              component="span"
              sx={{
                display: "inline-block",
                animation: "spin 1s linear infinite",
                "@keyframes spin": {
                  "0%": { transform: "rotate(0deg)" },
                  "100%": { transform: "rotate(360deg)" },
                },
              }}
            >
              <IconWrapper icon="mdi:loading" size={20} />
            </Box>
          ) : (
            <IconWrapper icon="mdi:check-circle" size={20} />
          )
        }
        sx={{
          minWidth: { xs: "120px", md: "180px" },
          px: { xs: 2, md: 3 },
          py: 1.25,
          backgroundColor: isLastQuestion ? "var(--course-cta)" : "var(--accent-indigo)",
          color: "var(--font-light)",
          fontWeight: 600,
          fontSize: { xs: "0.875rem", md: "1rem" },
          textTransform: "none",
          borderRadius: 2,
          boxShadow: isLastQuestion
            ? "var(--assessment-catalog-cta-success-shadow)"
            : "var(--assessment-catalog-cta-auto-shadow)",
          transition: "all 0.2s ease-in-out",
          "&:hover": {
            backgroundColor: isLastQuestion ? "var(--assessment-success-strong)" : "var(--accent-indigo-dark)",
            boxShadow: isLastQuestion
              ? "var(--assessment-catalog-cta-success-shadow-hover)"
              : "var(--assessment-catalog-cta-auto-shadow-hover)",
            transform: "translateY(-1px)",
          },
          "&:active": {
            transform: "translateY(0)",
          },
          "&:disabled": {
            backgroundColor: "var(--font-tertiary)",
            color: "var(--font-light)",
            boxShadow: "none",
            transform: "none",
            cursor: "not-allowed",
          },
        }}
      >
        {submitting
          ? "Submitting..."
          : isLastQuestion
          ? "Submit Assessment"
          : "Submit Early"}
        </Button>
      </Box>
    </Paper>
  );
});
