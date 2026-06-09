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
  const [timeRemaining, setTimeRemaining] = useState(
    durationMinutes * 60 + bonusSeconds,
  );
  const startTimeRef = useRef<Date>(startedAt || new Date());
  // Total seconds the timer has spent paused (e.g. while a coding modal is open), plus the
  // start of the current pause window if we're paused right now. The countdown is derived
  // from wall-clock minus paused time, so it can never drift or "freeze at 6:58".
  const pausedAccumRef = useRef(0);
  const pauseStartedRef = useRef<number | null>(null);
  const onTimeUpFiredRef = useRef(false);

  useEffect(() => {
    if (startedAt) startTimeRef.current = startedAt;
  }, [startedAt]);

  // Track pause windows so the effective elapsed time excludes paused stretches.
  useEffect(() => {
    if (paused) {
      if (pauseStartedRef.current === null) pauseStartedRef.current = Date.now();
    } else if (pauseStartedRef.current !== null) {
      pausedAccumRef.current += (Date.now() - pauseStartedRef.current) / 1000;
      pauseStartedRef.current = null;
    }
  }, [paused]);

  // Single ticking loop. Recomputes remaining from the wall clock every tick and ALWAYS
  // includes the live `bonusSeconds` (coding turns credit extra time) — the previous code
  // snapshotted bonus once at mount, so coding bonus never extended the visible countdown
  // and the timer could hit zero early and fire a spurious auto-submit.
  useEffect(() => {
    const total = durationMinutes * 60 + bonusSeconds;
    const compute = () => {
      const now = Date.now();
      const pausedNow =
        pauseStartedRef.current !== null
          ? (now - pauseStartedRef.current) / 1000
          : 0;
      const elapsed = Math.floor(
        (now - startTimeRef.current.getTime()) / 1000 -
          pausedAccumRef.current -
          pausedNow,
      );
      return Math.max(0, total - Math.max(0, elapsed));
    };
    setTimeRemaining(compute());
    const id = setInterval(() => setTimeRemaining(compute()), 500);
    return () => clearInterval(id);
  }, [durationMinutes, bonusSeconds, startedAt]);

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

