"use client";

import { useRouter } from "next/navigation";
import { Box, ButtonBase, Typography } from "@mui/material";
import { motion } from "framer-motion";
import { Icon } from "@iconify/react";
import type { AdaptiveAttemptSummary } from "@/lib/services/adaptive-quiz.service";

interface RecentAttemptsRowProps {
  attempts: AdaptiveAttemptSummary[];
}

const STATUS_THEME: Record<AdaptiveAttemptSummary["status"], { label: string; accent: string; icon: string }> = {
  active: { label: "In progress", accent: "#f59e0b", icon: "mdi:progress-clock" },
  completed: { label: "Completed", accent: "#10b981", icon: "mdi:check-circle-outline" },
  abandoned: { label: "Abandoned", accent: "#94a3b8", icon: "mdi:close-circle-outline" },
};

function relativeTime(iso: string): string {
  const now = Date.now();
  const then = new Date(iso).getTime();
  const ms = Math.max(0, now - then);
  const minutes = Math.floor(ms / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  return `${months}mo ago`;
}

function accentForAccuracy(acc: number): string {
  if (acc >= 0.8) return "#10b981";
  if (acc >= 0.6) return "#6366f1";
  if (acc >= 0.4) return "#f59e0b";
  return "#ef4444";
}

/**
 * Horizontal scrollable row of attempt cards rendered above the quiz library.
 * Each card links to that attempt's results page (or back to the live session
 * if it's still active) - the missing piece that lets learners revisit their
 * past adaptive runs.
 */
export function RecentAttemptsRow({ attempts }: RecentAttemptsRowProps) {
  const router = useRouter();
  if (attempts.length === 0) return null;

  function openAttempt(a: AdaptiveAttemptSummary) {
    if (a.status === "active") {
      router.push(`/adaptive-quizzes/session/${a.session_id}`);
    } else {
      router.push(`/adaptive-quizzes/session/${a.session_id}/results`);
    }
  }

  return (
    <Box sx={{ mb: 4, display: "flex", flexDirection: "column", gap: 1.5 }}>
      <Box sx={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 2 }}>
        <Box>
          <Typography
            sx={{
              fontSize: "0.7rem",
              fontWeight: 700,
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              color: "text.secondary",
            }}
          >
            Your Attempts
          </Typography>
          <Typography
            sx={{
              fontSize: "1.15rem",
              fontWeight: 800,
              letterSpacing: "-0.015em",
              mt: 0.25,
            }}
          >
            {attempts.length} {attempts.length === 1 ? "attempt" : "attempts"} so far
          </Typography>
        </Box>
        <Typography sx={{ fontSize: "0.74rem", color: "text.secondary", fontWeight: 600 }}>
          Click any to revisit its results
        </Typography>
      </Box>

      <Box
        sx={{
          display: "grid",
          gridAutoFlow: "column",
          gridAutoColumns: "minmax(260px, 1fr)",
          gap: 1.5,
          overflowX: "auto",
          pb: 1,
          // Soft fade on the right edge to hint at horizontal overflow.
          maskImage: {
            xs: "linear-gradient(to right, black 90%, transparent 100%)",
            md: "none",
          },
        }}
      >
        {attempts.map((a) => (
          <AttemptCard key={a.session_id} attempt={a} onClick={() => openAttempt(a)} />
        ))}
      </Box>
    </Box>
  );
}

function AttemptCard({
  attempt,
  onClick,
}: {
  attempt: AdaptiveAttemptSummary;
  onClick: () => void;
}) {
  const status = STATUS_THEME[attempt.status];
  const accuracyPct = Math.round(attempt.accuracy * 100);
  const accuracyAccent = accentForAccuracy(attempt.accuracy);
  const minutes = attempt.time_total_ms
    ? Math.max(1, Math.round(attempt.time_total_ms / 60000))
    : 0;
  const subtitle = attempt.is_personal ? "Personal re-quiz" : "Adaptive quiz";

  return (
    <ButtonBase
      onClick={onClick}
      component={motion.button}
      whileHover={{ y: -2 }}
      transition={{ type: "spring", stiffness: 280, damping: 26 }}
      sx={{
        position: "relative",
        overflow: "hidden",
        textAlign: "left",
        display: "flex",
        flexDirection: "column",
        alignItems: "stretch",
        gap: 1,
        p: 1.75,
        pt: 2.25,
        borderRadius: 3,
        bgcolor: "color-mix(in srgb, var(--card-bg) 65%, transparent)",
        border: "1px solid color-mix(in srgb, var(--border-default) 55%, transparent)",
        backdropFilter: "blur(20px) saturate(140%)",
        boxShadow:
          "0 1px 0 0 color-mix(in srgb, white 14%, transparent) inset, 0 18px 36px -24px rgba(15, 23, 42, 0.18)",
      }}
    >
      {/* Top accent strip - colored by accuracy */}
      <Box
        aria-hidden
        sx={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: 3,
          background: `linear-gradient(90deg, ${accuracyAccent} 0%, color-mix(in srgb, ${accuracyAccent} 50%, #a855f7) 100%)`,
        }}
      />

      <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
        <Box
          sx={{
            display: "inline-flex",
            alignItems: "center",
            gap: 0.35,
            px: 0.85,
            py: 0.2,
            borderRadius: 999,
            fontSize: "0.6rem",
            fontWeight: 800,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            color: status.accent,
            bgcolor: `color-mix(in srgb, ${status.accent} 12%, transparent)`,
            border: `1px solid color-mix(in srgb, ${status.accent} 28%, transparent)`,
          }}
        >
          <Icon icon={status.icon} width={11} />
          {status.label}
        </Box>
        <Typography sx={{ ml: "auto", fontSize: "0.68rem", color: "text.secondary", fontWeight: 700 }}>
          {relativeTime(attempt.completed_at ?? attempt.started_at)}
        </Typography>
      </Box>

      <Typography
        sx={{
          fontSize: "0.95rem",
          fontWeight: 800,
          lineHeight: 1.3,
          display: "-webkit-box",
          WebkitLineClamp: 2,
          WebkitBoxOrient: "vertical",
          overflow: "hidden",
          color: "text.primary",
        }}
      >
        {attempt.quiz_title}
      </Typography>
      <Typography sx={{ fontSize: "0.72rem", color: "text.secondary", fontWeight: 600 }}>
        {subtitle}
      </Typography>

      <Box sx={{ display: "flex", alignItems: "baseline", gap: 1, mt: 0.5 }}>
        <Typography
          sx={{
            fontSize: "1.6rem",
            fontWeight: 900,
            color: accuracyAccent,
            lineHeight: 1,
            fontVariantNumeric: "tabular-nums",
            letterSpacing: "-0.03em",
          }}
        >
          {attempt.question_count > 0 ? `${accuracyPct}%` : "-"}
        </Typography>
        <Typography sx={{ fontSize: "0.74rem", color: "text.secondary", fontWeight: 700 }}>
          {attempt.correct_count} / {attempt.question_count} correct
        </Typography>
      </Box>

      <Box sx={{ display: "flex", alignItems: "center", gap: 1, color: "text.secondary", mt: 0.25 }}>
        {minutes > 0 && (
          <Box sx={{ display: "inline-flex", alignItems: "center", gap: 0.35 }}>
            <Icon icon="mdi:timer-outline" width={13} />
            <Typography sx={{ fontSize: "0.72rem", fontWeight: 700 }}>{minutes}m</Typography>
          </Box>
        )}
        {attempt.has_narration && attempt.status === "completed" && (
          <Box sx={{ display: "inline-flex", alignItems: "center", gap: 0.35, color: "#a855f7" }}>
            <Icon icon="mdi:robot-happy-outline" width={13} />
            <Typography sx={{ fontSize: "0.72rem", fontWeight: 700 }}>AI read ready</Typography>
          </Box>
        )}
        <Typography
          sx={{
            ml: "auto",
            fontSize: "0.74rem",
            fontWeight: 800,
            color: accuracyAccent,
            display: "inline-flex",
            alignItems: "center",
            gap: 0.25,
          }}
        >
          {attempt.status === "active" ? "Resume" : "View results"}
          <Icon icon="mdi:arrow-right" width={14} />
        </Typography>
      </Box>
    </ButtonBase>
  );
}
