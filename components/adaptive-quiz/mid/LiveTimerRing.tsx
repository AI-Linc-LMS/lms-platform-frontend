"use client";

import { useEffect, useState } from "react";
import { Box, Typography } from "@mui/material";
import { AnimatedRing } from "@/components/scorecard/shared/AnimatedRing";

interface LiveTimerRingProps {
  /** Resets the timer whenever this changes — pass the current MCQ id. */
  resetKey: number | string;
  /** Soft cap in seconds; ring reads percent of this. */
  expectedSeconds?: number;
  /** When false the ring holds at 0:00 (e.g. the pre-"Begin" preview) and only
   *  starts ticking once the learner begins. Defaults to running. */
  running?: boolean;
  /** Absolute epoch ms (client clock) the question's server clock started. When set, elapsed is
   *  measured from this anchor — so the timer reflects server time and resumes after leaving. */
  startedAtMs?: number;
}

/** Per-question elapsed-time ring. Doesn't enforce a deadline — the engine
 *  uses time-on-question as a signal, not a hard limit. */
export function LiveTimerRing({ resetKey, expectedSeconds = 60, running = true, startedAtMs }: LiveTimerRingProps) {
  const [elapsedMs, setElapsedMs] = useState(0);

  // Measure from the server-anchored start (so a resumed question shows the time already elapsed);
  // falls back to mount time. While paused we hold at 0:00 until the learner begins.
  useEffect(() => {
    if (!running) return;
    const anchor = startedAtMs ?? Date.now();
    const tick = () => setElapsedMs(Math.max(0, Date.now() - anchor));
    tick();
    const id = window.setInterval(tick, 250);
    return () => window.clearInterval(id);
  }, [resetKey, running, startedAtMs]);

  const seconds = Math.floor(elapsedMs / 1000);
  const pct = Math.min(100, (seconds / expectedSeconds) * 100);
  const color = seconds < expectedSeconds * 0.6
    ? "#10b981"
    : seconds < expectedSeconds
      ? "#f59e0b"
      : "#ef4444";

  return (
    <Box sx={{ position: "relative", width: 96, height: 96, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <AnimatedRing
        value={pct}
        size={96}
        strokeWidth={8}
        color={color}
        glow={false}
        asPercent={false}
        showValue={false}
      />
      <Box sx={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
        <Typography sx={{ fontSize: "1.05rem", fontWeight: 800, lineHeight: 1, fontVariantNumeric: "tabular-nums" }}>
          {Math.floor(seconds / 60)}:{String(seconds % 60).padStart(2, "0")}
        </Typography>
        <Typography sx={{ fontSize: "0.6rem", color: "text.secondary", letterSpacing: "0.14em", textTransform: "uppercase", mt: 0.4 }}>
          on this Q
        </Typography>
      </Box>
    </Box>
  );
}
