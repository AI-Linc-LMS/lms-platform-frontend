"use client";

import { useEffect, useState } from "react";
import { Box, CircularProgress, Typography } from "@mui/material";
import { Icon } from "@iconify/react";

import {
  adaptiveCodingService,
  type CodingSessionSummary,
} from "@/lib/services/adaptive-coding.service";

/**
 * "Previous Attempts" for the current problem on the AI Coding Mentor page.
 *
 * The backend models each attempt as a CodingSession (run/submit history lives
 * inside it); GET /sessions/ returns the learner's sessions, which we filter to
 * this problem. `refreshKey` is bumped by the parent after a submit so a new
 * attempt appears without a reload.
 */
export function AdaptiveCodingPreviousAttempts({
  problemId,
  refreshKey = 0,
}: {
  problemId: number;
  refreshKey?: number;
}) {
  const [attempts, setAttempts] = useState<CodingSessionSummary[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const all = await adaptiveCodingService.listMyAttempts();
        if (cancelled) return;
        const mine = all
          .filter((a) => a.problem_id === problemId)
          .sort((a, b) => new Date(b.started_at).getTime() - new Date(a.started_at).getTime());
        setAttempts(mine);
      } catch {
        if (!cancelled) setAttempts([]); // soft-fail: history is non-critical
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [problemId, refreshKey]);

  // Don't take up space while loading the very first time.
  if (attempts === null) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 2 }}>
        <CircularProgress size={20} />
      </Box>
    );
  }
  if (attempts.length === 0) return null; // nothing attempted yet — keep the page clean

  return (
    <Box
      sx={{
        borderRadius: 3,
        overflow: "hidden",
        border: "1px solid color-mix(in srgb, var(--border-default) 70%, transparent)",
        background: "var(--card-bg, #fff)",
      }}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 0.75,
          px: 1.75,
          py: 1.1,
          background: "color-mix(in srgb, var(--border-default) 14%, transparent)",
        }}
      >
        <Icon icon="mdi:history" width={18} style={{ color: "#6366f1" }} />
        <Typography sx={{ fontWeight: 800, fontSize: "0.85rem" }}>Previous attempts</Typography>
        <Box
          sx={{
            ml: 0.25,
            px: 0.75,
            py: 0.1,
            borderRadius: 999,
            fontSize: "0.7rem",
            fontWeight: 800,
            color: "#6366f1",
            background: "color-mix(in srgb, #6366f1 12%, transparent)",
          }}
        >
          {attempts.length}
        </Box>
      </Box>

      <Box sx={{ display: "flex", flexDirection: "column" }}>
        {attempts.map((a) => (
          <AttemptRow key={a.id} attempt={a} />
        ))}
      </Box>
    </Box>
  );
}

function AttemptRow({ attempt }: { attempt: CodingSessionSummary }) {
  const status = attempt.passed
    ? { label: "Solved", color: "#10b981", icon: "mdi:check-circle" }
    : attempt.status === "active"
      ? { label: "In progress", color: "#f59e0b", icon: "mdi:progress-clock" }
      : { label: "Not solved", color: "#ef4444", icon: "mdi:close-circle-outline" };

  const when = formatWhen(attempt.completed_at || attempt.started_at);

  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 1,
        px: 1.75,
        py: 1.1,
        borderTop: "1px solid color-mix(in srgb, var(--border-default) 45%, transparent)",
        "&:first-of-type": { borderTop: "none" },
      }}
    >
      <Icon icon={status.icon} width={18} style={{ color: status.color, flexShrink: 0 }} />
      <Box sx={{ minWidth: 0, flex: 1 }}>
        <Typography sx={{ fontSize: "0.82rem", fontWeight: 800, color: status.color }}>
          {status.label}
        </Typography>
        <Typography sx={{ fontSize: "0.72rem", color: "text.secondary" }}>
          {attempt.submit_count} {attempt.submit_count === 1 ? "submit" : "submits"} ·{" "}
          {attempt.run_count} {attempt.run_count === 1 ? "run" : "runs"}
          {attempt.hints_revealed > 0 ? ` · ${attempt.hints_revealed} hints` : ""}
        </Typography>
      </Box>
      <Box sx={{ textAlign: "right", flexShrink: 0 }}>
        <Typography
          sx={{
            fontSize: "0.7rem",
            fontWeight: 700,
            color: "text.secondary",
            textTransform: "uppercase",
          }}
        >
          {attempt.language}
        </Typography>
        <Typography sx={{ fontSize: "0.7rem", color: "text.secondary" }}>{when}</Typography>
      </Box>
    </Box>
  );
}

function formatWhen(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export default AdaptiveCodingPreviousAttempts;
