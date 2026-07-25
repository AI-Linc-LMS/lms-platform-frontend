"use client";

import { useEffect, useState } from "react";
import { Box, LinearProgress, Stack, Typography } from "@mui/material";
import { Icon } from "@iconify/react";
import type { QuestionPointsDecay } from "@/lib/types/adaptive-quiz";

/** Mirror of the backend engine.points_after_decay - keep in lockstep so the live number
 *  matches what gets awarded. */
function pointsAfterDecay(elapsedSec: number, d: QuestionPointsDecay): number {
  if (elapsedSec <= d.grace) return d.base;
  const intervals = Math.floor((elapsedSec - d.grace) / d.iv);
  return Math.max(d.floor, d.base - d.dec * intervals);
}

function fmtSecs(s: number): string {
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  const r = s % 60;
  return r ? `${m}m ${r}s` : `${m}m`;
}

/**
 * Live, decaying points meter for the current question. Holds full points through the grace
 * window, then ticks down step-by-step - the visible incentive to answer well *and* quickly.
 * Display-only (the scored time is tracked precisely in the session hook); paused until the
 * learner begins, and remounted (key) per question by the caller so it resets to full.
 */
export function LiveQuizPoints({ decay, running = true, hints = 0, startedAtMs }: { decay: QuestionPointsDecay; running?: boolean; hints?: number; startedAtMs?: number }) {
  const [elapsedMs, setElapsedMs] = useState(0);

  // Measure from the server-anchored start so the live "on offer" matches the server award after a
  // resume (the clock kept running while away); falls back to mount time.
  useEffect(() => {
    if (!running) return; // paused preview - hold at full points until the learner begins
    const anchor = startedAtMs ?? Date.now();
    const tick = () => setElapsedMs(Math.max(0, Date.now() - anchor));
    tick();
    const id = window.setInterval(tick, 200);
    return () => window.clearInterval(id);
  }, [running, startedAtMs]);

  const elapsedSec = elapsedMs / 1000;
  // Hint penalty mirrors the engine: each hint shaves decay.hint_penalty off the points.
  const hintMult = Math.max(0, 1 - (decay.hint_penalty ?? 0) * Math.max(0, hints));
  const pts = Math.round(pointsAfterDecay(elapsedSec, decay) * hintMult);
  const inGrace = elapsedSec < decay.grace && hints === 0;
  const atFloor = pts <= decay.floor;
  const pct = decay.base > 0 ? Math.max(0, Math.min(100, (pts / decay.base) * 100)) : 0;
  const color = inGrace ? "#10b981" : atFloor ? "#ef4444" : "#f59e0b";
  const graceLeft = Math.max(0, Math.ceil(decay.grace - elapsedSec));

  return (
    <Box
      sx={{
        p: 1.75, borderRadius: 3,
        bgcolor: "color-mix(in srgb, var(--card-bg, #ffffff) 60%, transparent)",
        border: "1px solid color-mix(in srgb, var(--border-default, #e5e7eb) 70%, transparent)",
        textAlign: "center",
      }}
    >
      <Stack direction="row" spacing={0.5} alignItems="center" justifyContent="center">
        <Icon icon="mdi:star-four-points" width={13} color="#7c3aed" />
        <Typography sx={{ fontSize: "0.6rem", fontWeight: 800, letterSpacing: "0.12em", textTransform: "uppercase", color: "text.secondary" }}>
          Points on offer
        </Typography>
      </Stack>

      {/* Updates in place as it decays - no per-tick remount, so the number ticks down
          smoothly instead of re-popping every interval. */}
      <Box sx={{ mt: 0.5, lineHeight: 1 }}>
        <Typography component="span" sx={{ fontWeight: 900, fontSize: "2.1rem", color, fontVariantNumeric: "tabular-nums", transition: "color .3s" }}>
          {pts}
        </Typography>
        <Typography component="span" sx={{ fontSize: "0.8rem", fontWeight: 700, color: "text.secondary", ml: 0.5 }}>
          / {decay.base} pts
        </Typography>
      </Box>

      <LinearProgress
        variant="determinate"
        value={pct}
        sx={{ mt: 1, height: 7, borderRadius: 4, bgcolor: "rgba(148,163,184,0.2)", "& .MuiLinearProgress-bar": { bgcolor: color, borderRadius: 4, transition: "transform .3s ease, background-color .3s" } }}
      />

      <Typography sx={{ fontSize: "0.72rem", color: inGrace ? "#15803d" : atFloor ? "#b91c1c" : "#b45309", fontWeight: 700, mt: 0.85, lineHeight: 1.4 }}>
        {inGrace
          ? `Full points for ${fmtSecs(graceLeft)} more`
          : atFloor
            ? `At the ${decay.floor}-pt floor`
            : `Decaying −${decay.dec} every ${decay.iv}s`}
        {hints > 0 && (decay.hint_penalty ?? 0) > 0
          ? ` · −${Math.round((decay.hint_penalty ?? 0) * 100 * hints)}% from hint`
          : ""}
      </Typography>
      <Typography sx={{ fontSize: "0.64rem", color: "text.secondary", mt: 0.25 }}>
        {hints > 0 ? "A hint trims your points - but a right answer still counts" : "Answer fast & right to keep more"}
      </Typography>
    </Box>
  );
}
