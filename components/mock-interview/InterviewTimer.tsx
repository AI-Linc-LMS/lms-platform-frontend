"use client";

import { useEffect, useState, useRef } from "react";
import { Box, Typography } from "@mui/material";
import { IconWrapper } from "@/components/common/IconWrapper";

interface InterviewTimerProps {
  durationMinutes: number;
  onTimeUp?: () => void;
  startedAt?: Date;
}

export function InterviewTimer({
  durationMinutes,
  onTimeUp,
  startedAt,
}: InterviewTimerProps) {
  const [timeRemaining, setTimeRemaining] = useState(durationMinutes * 60);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<Date>(startedAt || new Date());

  useEffect(() => {
    if (startedAt) {
      startTimeRef.current = startedAt;
      // Calculate elapsed time
      const elapsed = Math.floor(
        (new Date().getTime() - startedAt.getTime()) / 1000
      );
      setTimeRemaining(Math.max(0, durationMinutes * 60 - elapsed));
    } else {
      setTimeRemaining(durationMinutes * 60);
    }
  }, [durationMinutes, startedAt]);

  useEffect(() => {
    if (timeRemaining <= 0) {
      onTimeUp?.();
      return;
    }

    intervalRef.current = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          onTimeUp?.();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [timeRemaining, onTimeUp]);

  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}:${mins.toString().padStart(2, "0")}:${secs
        .toString()
        .padStart(2, "0")}`;
    }
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const getTimeColor = () => {
    if (timeRemaining < 300) return "#ef4444"; // Red for last 5 minutes
    if (timeRemaining < 600) return "#f59e0b"; // Orange for last 10 minutes
    return "#10b981"; // Green
  };

  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 1.5,
        px: 2,
        py: 1,
        backgroundColor: "rgba(255, 255, 255, 0.1)",
        borderRadius: 2,
        backdropFilter: "blur(10px)",
        border: `1px solid ${getTimeColor()}40`,
      }}
    >
      <IconWrapper icon="mdi:timer-outline" size={20} color={getTimeColor()} />
      <Typography
        variant="body1"
        sx={{
          fontWeight: 700,
          fontSize: "1rem",
          color: getTimeColor(),
          fontFamily: "monospace",
          letterSpacing: "0.05em",
        }}
      >
        {formatTime(timeRemaining)}
      </Typography>
    </Box>
  );
}

