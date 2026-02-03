"use client";

import { Box, Paper, Typography, CircularProgress } from "@mui/material";
import { useEffect } from "react";

interface QuizTimerProps {
  timeRemaining: number; // in seconds
  totalDurationSeconds?: number; // total quiz duration for progress circle
  onTimeUp?: () => void;
}

export function QuizTimer({ timeRemaining, totalDurationSeconds, onTimeUp }: QuizTimerProps) {
  useEffect(() => {
    if (timeRemaining <= 0 && onTimeUp) {
      onTimeUp();
    }
  }, [timeRemaining, onTimeUp]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  // Use actual quiz duration so circle is full at start and diminishes correctly
  const maxTime = totalDurationSeconds && totalDurationSeconds > 0
    ? totalDurationSeconds
    : timeRemaining || 900; // fallback to current or 15 min
  const progress = Math.max(0, Math.min(100, (timeRemaining / maxTime) * 100));

  // Green: >= 2 min, Yellow: < 2 min, Red: <= 0 (handled by onTimeUp)
  const getColor = () => {
    if (timeRemaining <= 120) return "#eab308"; // yellow when < 2 minutes
    return "#10b981"; // green
  };

  return (
    <Paper
      elevation={0}
      sx={{
        p: 3,
        backgroundColor: "#ffffff",
        borderRadius: 2,
        border: "1px solid #e5e7eb",
        textAlign: "center",
      }}
    >
      <Box sx={{ position: "relative", display: "inline-flex", mb: 2 }}>
        <CircularProgress
          variant="determinate"
          value={progress}
          size={80}
          thickness={4}
          sx={{
            color: timeRemaining <= 60 ? "#ef4444" : "#10b981",
            "& .MuiCircularProgress-circle": {
              strokeLinecap: "round",
            },
          }}
        />
        <Box
          sx={{
            top: 0,
            left: 0,
            bottom: 0,
            right: 0,
            position: "absolute",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Typography
            variant="h5"
            component="div"
            sx={{
              fontWeight: 700,
              color: getColor(),
            }}
          >
            {formatTime(timeRemaining)}
          </Typography>
        </Box>
      </Box>
      <Typography
        variant="body2"
        sx={{
          color: "#6b7280",
          fontWeight: 500,
        }}
      >
        Timer Remaining
      </Typography>
    </Paper>
  );
}


