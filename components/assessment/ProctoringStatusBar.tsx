"use client";

import { Box, Paper, Typography, Chip } from "@mui/material";
import { IconWrapper } from "@/components/common/IconWrapper";

interface ProctoringStatusBarProps {
  status: "NORMAL" | "WARNING" | "VIOLATION";
  faceCount: number;
  violationCount: number;
  maxViolations: number;
  timeRemaining?: number; // in seconds
  isFullscreen: boolean;
}

export function ProctoringStatusBar({
  status,
  faceCount,
  violationCount,
  maxViolations,
  timeRemaining,
  isFullscreen,
}: ProctoringStatusBarProps) {
  const getStatusColor = () => {
    switch (status) {
      case "NORMAL":
        return "#10b981";
      case "WARNING":
        return "#f59e0b";
      case "VIOLATION":
        return "#ef4444";
    }
  };

  const formatTime = (seconds?: number) => {
    if (seconds === undefined) return "--:--";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <Paper
      elevation={0}
      sx={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 1300,
        p: 1.5,
        borderRadius: 0,
        backgroundColor: "#fff",
        borderBottom: `3px solid ${getStatusColor()}`,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        flexWrap: "wrap",
        gap: 2,
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center", gap: 2, flexWrap: "wrap" }}>
        <Chip
          icon={<IconWrapper icon="mdi:shield-check" size={16} />}
          label="PROCTORING ACTIVE"
          color={status === "NORMAL" ? "success" : status === "WARNING" ? "warning" : "error"}
          size="small"
          sx={{ fontWeight: 600 }}
        />
        <Typography variant="body2" color="text.secondary">
          Status: <strong style={{ color: getStatusColor() }}>{status}</strong>
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Faces: <strong>{faceCount}</strong>
        </Typography>
        {timeRemaining !== undefined && (
          <Typography variant="body2" color="text.secondary">
            Time: <strong>{formatTime(timeRemaining)}</strong>
          </Typography>
        )}
      </Box>

      {!isFullscreen && (
        <Chip
          icon={<IconWrapper icon="mdi:alert-circle" size={16} />}
          label="PLEASE ENTER FULLSCREEN"
          color="error"
          size="small"
          sx={{ fontWeight: 600 }}
        />
      )}
    </Paper>
  );
}

