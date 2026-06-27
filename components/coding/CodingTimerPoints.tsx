"use client";

import { useEffect, useState } from "react";
import { Box, LinearProgress, Stack, Typography } from "@mui/material";
import { Icon } from "@iconify/react";
import type { CodingPointsDecay } from "@/lib/services/adaptive-coding.service";

/** Mirror of engine.points_after_decay — keep in lockstep so the live number matches the award. */
function pointsAfterDecay(elapsedSec: number, d: CodingPointsDecay): number {
  if (elapsedSec <= d.grace) return d.base;
  const intervals = Math.floor((elapsedSec - d.grace) / d.iv);
  return Math.max(d.floor, d.base - d.dec * intervals);
}

function fmtElapsed(totalSec: number): string {
  const s = Math.max(0, Math.floor(totalSec));
  const days = Math.floor(s / 86400);
  const hrs = Math.floor((s % 86400) / 3600);
  const mins = Math.floor((s % 3600) / 60);
  const secs = s % 60;
  if (days > 0) return `${days}d ${hrs}h`;          // e.g. returned after 3 days
  if (hrs > 0) return `${hrs}h ${mins}m`;
  return `${mins}:${String(secs).padStart(2, "0")}`;
}

/**
 * Live, server-anchored timer + decaying points for a coding problem. The clock is the SESSION age:
 * elapsed = (server_now − started_at) captured at fetch, then ticked locally — so it keeps running
 * across reloads and even days away (clock-skew corrected via server_now). Holds full points through
 * the grace window, then ticks down to the floor; once submitted it freezes on the earned points.
 */
export function CodingTimerPoints({
  decay,
  startedAt,
  serverNow,
  running = true,
  earned = null,
}: {
  decay: CodingPointsDecay;
  startedAt: string;
  serverNow: string;
  running?: boolean;
  earned?: number | null;
}) {
  // Server-elapsed at fetch + a local anchor captured once → live elapsed without trusting the
  // client clock's absolute value (only its delta).
  const [baseMs] = useState(() => Math.max(0, Date.parse(serverNow) - Date.parse(startedAt)));
  const [anchor] = useState(() => Date.now());
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!running) return;
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, [running]);

  const elapsedSec = (baseMs + (running ? now - anchor : 0)) / 1000;
  const livePts = Math.round(pointsAfterDecay(elapsedSec, decay));
  const submitted = earned !== null && earned !== undefined;
  const pts = submitted ? (earned as number) : livePts;
  const inGrace = elapsedSec < decay.grace;
  const atFloor = livePts <= decay.floor;
  const pct = decay.base > 0 ? Math.max(0, Math.min(100, (pts / decay.base) * 100)) : 0;
  const color = submitted ? "#7c3aed" : inGrace ? "#10b981" : atFloor ? "#ef4444" : "#f59e0b";
  const graceLeft = Math.max(0, Math.ceil(decay.grace - elapsedSec));

  return (
    <Box
      sx={{
        p: 1.5, borderRadius: 3, display: "flex", alignItems: "center", gap: 2,
        bgcolor: "color-mix(in srgb, var(--card-bg, #ffffff) 60%, transparent)",
        border: "1px solid color-mix(in srgb, var(--border-default, #e5e7eb) 70%, transparent)",
      }}
    >
      {/* Timer */}
      <Stack alignItems="center" sx={{ minWidth: 78 }}>
        <Stack direction="row" spacing={0.4} alignItems="center" sx={{ color: "text.secondary" }}>
          <Icon icon="mdi:timer-outline" width={13} />
          <Typography sx={{ fontSize: "0.58rem", fontWeight: 800, letterSpacing: "0.1em", textTransform: "uppercase" }}>
            {submitted ? "Time" : "On the clock"}
          </Typography>
        </Stack>
        <Typography sx={{ fontWeight: 800, fontSize: "1.15rem", fontVariantNumeric: "tabular-nums", lineHeight: 1.1 }}>
          {fmtElapsed(elapsedSec)}
        </Typography>
      </Stack>

      <Box sx={{ width: "1px", alignSelf: "stretch", bgcolor: "color-mix(in srgb, var(--border-default) 70%, transparent)" }} />

      {/* Points */}
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Stack direction="row" alignItems="baseline" justifyContent="space-between">
          <Stack direction="row" spacing={0.4} alignItems="center" sx={{ color: "text.secondary" }}>
            <Icon icon="mdi:star-four-points" width={12} color="#7c3aed" />
            <Typography sx={{ fontSize: "0.58rem", fontWeight: 800, letterSpacing: "0.1em", textTransform: "uppercase" }}>
              {submitted ? "Earned" : "Points on offer"}
            </Typography>
          </Stack>
          <Box>
            <Typography component="span" sx={{ fontWeight: 900, fontSize: "1.4rem", color, fontVariantNumeric: "tabular-nums", transition: "color .3s" }}>
              {pts}
            </Typography>
            <Typography component="span" sx={{ fontSize: "0.72rem", fontWeight: 700, color: "text.secondary", ml: 0.4 }}>
              / {decay.base}
            </Typography>
          </Box>
        </Stack>
        <LinearProgress
          variant="determinate"
          value={pct}
          sx={{ mt: 0.6, height: 6, borderRadius: 4, bgcolor: "rgba(148,163,184,0.2)",
            "& .MuiLinearProgress-bar": { bgcolor: color, borderRadius: 4, transition: "transform .4s ease, background-color .3s" } }}
        />
        <Typography sx={{ fontSize: "0.68rem", fontWeight: 700, mt: 0.5,
          color: submitted ? "#6d28d9" : inGrace ? "#15803d" : atFloor ? "#b91c1c" : "#b45309" }}>
          {submitted
            ? "Locked in on submit"
            : inGrace
              ? `Full points for ${graceLeft}s more`
              : atFloor
                ? `At the ${decay.floor}-pt floor`
                : `Decaying −${decay.dec} every ${decay.iv}s — submit soon`}
        </Typography>
      </Box>
    </Box>
  );
}
