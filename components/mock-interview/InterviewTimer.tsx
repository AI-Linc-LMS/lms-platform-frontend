"use client";

import { useEffect, useState, useRef } from "react";
import { Box, Typography } from "@mui/material";
import { IconWrapper } from "@/components/common/IconWrapper";

interface InterviewTimerProps {
  durationMinutes: number;
  onTimeUp?: () => void;
  startedAt?: Date;
  paused?: boolean;
  bonusSeconds?: number;
}

export function InterviewTimer({
  durationMinutes,
  onTimeUp,
  startedAt,
  paused = false,
  bonusSeconds = 0,
}: InterviewTimerProps) {
  const [timeRemaining, setTimeRemaining] = useState(durationMinutes * 60);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<Date>(startedAt || new Date());
  const initialBonusRef = useRef(bonusSeconds);

  useEffect(() => {
    if (startedAt) {
      startTimeRef.current = startedAt;
      const wallElapsed = Math.floor(
        (new Date().getTime() - startedAt.getTime()) / 1000
      );
      const adjustedElapsed = Math.max(
        0,
        wallElapsed - initialBonusRef.current,
      );
      setTimeRemaining(Math.max(0, durationMinutes * 60 - adjustedElapsed));
    } else {
      setTimeRemaining(durationMinutes * 60);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [durationMinutes, startedAt]);

  useEffect(() => {
    if (paused) return;
    if (timeRemaining <= 0) return;

    intervalRef.current = setInterval(() => {
      setTimeRemaining((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [timeRemaining, paused]);

  const onTimeUpFiredRef = useRef(false);
  useEffect(() => {
    if (timeRemaining > 0) {
      onTimeUpFiredRef.current = false;
      return;
    }
    if (onTimeUpFiredRef.current) return;
    onTimeUpFiredRef.current = true;
    onTimeUp?.();
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
      <IconWrapper
        icon={paused ? "mdi:timer-pause-outline" : "mdi:timer-outline"}
        size={20}
        color={getTimeColor()}
      />
      <Typography
        variant="body1"
        sx={{
          fontWeight: 700,
          fontSize: "1rem",
          color: getTimeColor(),
          fontFamily: "monospace",
          letterSpacing: "0.05em",
          opacity: paused ? 0.6 : 1,
        }}
      >
        {formatTime(timeRemaining)}
      </Typography>
      {paused && (
        <Typography
          variant="caption"
          sx={{
            color: getTimeColor(),
            fontWeight: 600,
            letterSpacing: "0.06em",
            fontSize: "0.65rem",
          }}
        >
          PAUSED
        </Typography>
      )}
    </Box>
  );
}

