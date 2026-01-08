"use client";

import { Box, Typography } from "@mui/material";
import { IconWrapper } from "@/components/common/IconWrapper";
import { useEffect, useMemo } from "react";

interface ProctoringVideoPreviewProps {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  status: "NORMAL" | "WARNING" | "VIOLATION";
  faceCount: number;
  latestViolation: {
    type: string;
    message: string;
  } | null;
  visible?: boolean;
}

export function ProctoringVideoPreview({
  videoRef,
  status,
  faceCount,
  latestViolation,
  visible = true,
}: ProctoringVideoPreviewProps) {
  // Monitor video state
  useEffect(() => {
    const monitor = setInterval(() => {
      const video = videoRef.current;
      if (video && visible && video.srcObject) {
        if (video.paused && video.readyState >= 2) {
          // Only play if video is ready
          const playPromise = video.play();
          if (playPromise !== undefined) {
            playPromise.catch((error) => {
              // Silently handle play interruption errors
              if (
                error.name !== "AbortError" &&
                error.name !== "NotAllowedError"
              ) {
                // Silently handle video play error
              }
            });
          }
        }
      }
    }, 2000);

    return () => clearInterval(monitor);
  }, [videoRef, visible]);

  useEffect(() => {
    const video = videoRef.current;
    if (video && visible && video.srcObject) {
      // Wait a bit for the source to be fully loaded
      const timer = setTimeout(() => {
        if (video.paused && video.readyState >= 2) {
          const playPromise = video.play();
          if (playPromise !== undefined) {
            playPromise.catch((error) => {
              // Silently handle expected errors
              if (
                error.name !== "AbortError" &&
                error.name !== "NotAllowedError"
              ) {
                // Silently handle video play error
              }
            });
          }
        }
      }, 100);

      return () => clearTimeout(timer);
    }
  }, [videoRef, visible, faceCount, status]);

  // Memoize status calculations to ensure they update immediately when props change
  const statusColor = useMemo(() => {
    // Use faceCount and violations for more accurate real-time color
    if (faceCount === 0) return "#ef4444"; // Red for no face
    if (faceCount > 1) return "#f59e0b"; // Orange for multiple faces

    // If single face, check violations
    if (faceCount === 1 && latestViolation) {
      // High severity violations = red
      if (
        latestViolation.type === "FACE_TOO_CLOSE" ||
        latestViolation.type === "FACE_TOO_FAR"
      ) {
        return "#ef4444";
      }
      // Medium severity = orange
      if (latestViolation.type === "LOOKING_AWAY") {
        return "#f59e0b";
      }
      // Other violations = orange
      return "#f59e0b";
    }

    // Use status prop as fallback
    switch (status) {
      case "NORMAL":
        return "#10b981";
      case "WARNING":
        return "#f59e0b";
      case "VIOLATION":
        return "#ef4444";
      default:
        return "#10b981";
    }
  }, [faceCount, latestViolation, status]);

  const statusText = useMemo(() => {
    // Priority: face count first (0 or multiple), then violations for single face
    if (faceCount === 0) return "No Face Detected";
    if (faceCount > 1) return `${faceCount} Faces Detected`;

    // If faceCount === 1, check for violations first
    if (faceCount === 1 && latestViolation) {
      if (latestViolation.type === "LOOKING_AWAY") return "Looking Away";
      if (latestViolation.type === "FACE_TOO_CLOSE") return "Too Close";
      if (latestViolation.type === "FACE_TOO_FAR") return "Too Far";
      if (latestViolation.type === "POOR_LIGHTING") return "Poor Lighting";
      return latestViolation.message;
    }

    // Default: face is detected and OK
    if (faceCount === 1) return "Face Detected";
    return "Face OK";
  }, [faceCount, latestViolation]);

  // Calculate status icon based on face count and violations
  const statusIcon = useMemo(() => {
    // Use faceCount and violations for more accurate real-time icon
    if (faceCount === 0) return "mdi:account-off";
    if (faceCount > 1) return "mdi:account-multiple";

    // If single face, check violations
    if (faceCount === 1 && latestViolation) {
      if (latestViolation.type === "LOOKING_AWAY") return "mdi:eye-off";
      if (latestViolation.type === "FACE_TOO_CLOSE") return "mdi:arrow-down";
      if (latestViolation.type === "FACE_TOO_FAR") return "mdi:arrow-up";
      return "mdi:alert-circle";
    }

    // Use status prop as fallback
    if (status === "VIOLATION") return "mdi:alert-circle";
    if (status === "WARNING") return "mdi:alert";
    return "mdi:check-circle";
  }, [faceCount, latestViolation, status]);

  if (!visible) return null;

  return (
    <Box
      sx={{
        position: "absolute",
        top: 10,
        left: 10,
        display: "flex",
        alignItems: "center",
        gap: 1,
        px: 1.5,
        py: 0.5,
        backgroundColor: `${statusColor}E6`, // E6 = 90% opacity
        borderRadius: 1,
        backdropFilter: "blur(10px)",
        zIndex: 10,
      }}
    >
      <IconWrapper icon={statusIcon} size={16} color="#ffffff" />
      <Typography
        variant="caption"
        sx={{ color: "#ffffff", fontSize: "0.75rem", fontWeight: 500 }}
      >
        {statusText}
      </Typography>
    </Box>
  );
}
