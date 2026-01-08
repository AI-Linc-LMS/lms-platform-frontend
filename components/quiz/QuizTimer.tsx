"use client";

import { Box, Paper, Typography, CircularProgress } from "@mui/material";
import { useEffect } from "react";

interface QuizTimerProps {
  timeRemaining: number; // in seconds
  onTimeUp?: () => void;
}

export function QuizTimer({ timeRemaining, onTimeUp }: QuizTimerProps) {
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

  // Calculate progress percentage (assuming max time, you can pass this as prop if needed)
  const maxTime = 1200; // 20 minutes default
  const progress = Math.max(0, Math.min(100, (timeRemaining / maxTime) * 100));

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
              color: timeRemaining <= 60 ? "#ef4444" : "#10b981",
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


