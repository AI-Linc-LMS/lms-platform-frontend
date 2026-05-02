"use client";

import { Box, Typography } from "@mui/material";
import { IconWrapper } from "@/components/common/IconWrapper";
import { useEffect } from "react";

interface AssessmentCameraPreviewProps {
  videoRef: React.RefObject<HTMLVideoElement>;
  visible?: boolean;
  faceCount?: number;
  status?: "NORMAL" | "WARNING" | "VIOLATION";
}

export function AssessmentCameraPreview({
  videoRef,
  visible = false,
  faceCount = 0,
  status = "NORMAL",
}: AssessmentCameraPreviewProps) {
  // Determine violation message and icon
  const getViolationInfo = () => {
    if (status === "VIOLATION") {
      if (faceCount === 0) {
        return {
          icon: "mdi:alert-circle",
          message: "No Face Detected",
          color: "var(--error-500)",
        };
      } else if (faceCount > 1) {
        return {
          icon: "mdi:account-multiple-alert",
          message: `${faceCount} Faces Detected`,
          color: "var(--error-500)",
        };
      }
    }
    return null;
  };

  const violationInfo = getViolationInfo();

  // Ensure video plays when stream is attached and visible
  useEffect(() => {
    if (videoRef.current) {
      const video = videoRef.current;

      // Check if video has a stream
      if (video.srcObject) {
        const stream = video.srcObject as MediaStream;
        const videoTracks = stream.getVideoTracks();

        // Force play when visible
        if (visible) {
          // Ensure track is enabled
          videoTracks.forEach((track) => {
            if (!track.enabled) {
              track.enabled = true;
            }
          });

          // Force play
          if (video.paused || video.readyState < 2) {
            video.play().catch(() => {
              // Silently handle play failure
              });
          }
        }
      }
    }
  }, [visible, videoRef]);

  return (
    <Box
      sx={{
        position: "fixed",
        bottom: visible ? 80 : -1000,
        right: visible ? 16 : -1000,
        zIndex: visible ? 1200 : -1000,
        width: 200,
        height: 150,
        borderRadius: 2,
        overflow: "hidden",
        border: visible
          ? `2px solid ${violationInfo ? violationInfo.color : "var(--assessment-success-strong)"}`
          : "none",
        backgroundColor: "var(--assessment-video-letterbox-bg)",
        boxShadow: visible
          ? "0 4px 12px color-mix(in srgb, var(--font-dark) 32%, transparent)"
          : "none",
        opacity: visible ? 1 : 0,
        visibility: visible ? "visible" : "hidden",
        pointerEvents: visible ? "auto" : "none",
        transition: "opacity 0.3s ease-in-out, visibility 0.3s ease-in-out",
      }}
    >
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          transform: "scaleX(-1)", // Mirror effect
          display: "block",
        }}
      />

      {/* CAMERA Label - Top Left */}
      <Box
        sx={{
          position: "absolute",
          top: 4,
          left: 4,
          backgroundColor: "color-mix(in srgb, var(--font-dark) 72%, transparent)",
          borderRadius: 1,
          px: 1,
          py: 0.5,
        }}
      >
        <Typography
          variant="caption"
          sx={{ color: "var(--font-light)", fontWeight: 600, fontSize: "0.7rem" }}
        >
          CAMERA
        </Typography>
      </Box>

      {/* Violation Indicator - Centered */}
      {violationInfo && (
        <Box
          sx={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "color-mix(in srgb, var(--font-dark) 82%, transparent)",
            borderRadius: 2,
            px: 2,
            py: 1.5,
            minWidth: "80%",
          }}
        >
          <IconWrapper
            icon={violationInfo.icon}
            size={32}
            style={{ color: violationInfo.color, marginBottom: 4 }}
          />
          <Typography
            variant="caption"
            sx={{
              color: violationInfo.color,
              fontWeight: 700,
              fontSize: "0.65rem",
              textAlign: "center",
            }}
          >
            {violationInfo.message}
          </Typography>
        </Box>
      )}
    </Box>
  );
}
