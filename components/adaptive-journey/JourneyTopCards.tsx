"use client";

import { useRouter } from "next/navigation";
import { Box, ButtonBase, Chip, Stack, Typography } from "@mui/material";
import { Icon } from "@iconify/react";
import type { JourneyBoard } from "@/lib/types/adaptive-journey";

function Pill({ icon, label, dark }: { icon: string; label: string; dark?: boolean }) {
  return (
    <Stack
      direction="row"
      spacing={0.5}
      alignItems="center"
      sx={{
        px: 1, py: 0.4, borderRadius: 999, fontSize: "0.72rem", fontWeight: 600,
        bgcolor: dark ? "rgba(255,255,255,0.08)" : "#f1f5f9",
        color: dark ? "rgba(255,255,255,0.85)" : "#475569",
        border: dark ? "1px solid rgba(255,255,255,0.12)" : "1px solid #e2e8f0",
      }}
    >
      <Icon icon={icon} width={13} />
      {label}
    </Stack>
  );
}

const CALIB_STATUS_CHIP: Record<string, { label: string; color: string }> = {
  done: { label: "DONE", color: "#86efac" },
  not_started: { label: "NOT STARTED", color: "#fcd34d" },
  not_configured: { label: "SETUP PENDING", color: "#cbd5e1" },
  generating: { label: "PREPARING", color: "#c7d2fe" },
};

function CalibrationCard({ calibration, courseId }: { calibration: JourneyBoard["calibration"]; courseId: number }) {
  const router = useRouter();
  const card = calibration.card;
  if (!card) return null;
  const status = card.generating ? "generating" : card.status;
  const slug = card.assessmentSlug;
  const canStart = status === "not_started" && !!slug;
  const chip = CALIB_STATUS_CHIP[status] ?? CALIB_STATUS_CHIP.not_configured;

  let ctaLabel = "Start proctored assessment →";
  if (status === "done") ctaLabel = "Calibration complete";
  else if (status === "generating") ctaLabel = "Calibration is being prepared…";
  else if (status === "not_configured") ctaLabel = "Calibration not set up yet";

  return (
    <Box
      sx={{
        flex: 1, minWidth: 280, p: 2.5, borderRadius: 4, color: "white",
        background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
        boxShadow: "0 18px 40px -22px rgba(15,23,42,0.6)",
      }}
    >
      <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
        <Stack direction="row" spacing={1.25} alignItems="center">
          <Box sx={{ width: 36, height: 36, borderRadius: 2, display: "grid", placeItems: "center", bgcolor: "rgba(255,255,255,0.1)" }}>
            <Icon icon="mdi:shield-half-full" width={20} />
          </Box>
          <Box>
            <Typography sx={{ fontWeight: 800, fontSize: "1rem" }}>Calibration Assessment</Typography>
            <Typography sx={{ fontSize: "0.74rem", color: "rgba(255,255,255,0.6)" }}>
              Required before personalization unlocks
            </Typography>
          </Box>
        </Stack>
        <Chip
          label={chip.label}
          size="small"
          sx={{ height: 22, fontSize: "0.62rem", fontWeight: 800, color: chip.color, bgcolor: "rgba(255,255,255,0.08)" }}
        />
      </Stack>

      <Typography sx={{ fontSize: "0.8rem", color: "rgba(255,255,255,0.72)", mt: 1.5, lineHeight: 1.5 }}>
        A standardized, <b>non-adaptive</b> test — the same fixed question set for every learner — so we can fairly
        measure where everyone starts. Your baseline seeds the AI Student Model.
      </Typography>

      <Stack direction="row" flexWrap="wrap" gap={0.75} sx={{ mt: 1.75 }}>
        {card.durationMinutes != null && <Pill dark icon="mdi:clock-outline" label={`${card.durationMinutes} min`} />}
        {card.questionCount > 0 && <Pill dark icon="mdi:help-circle-outline" label={`${card.questionCount} fixed Qs`} />}
        <Pill dark icon="mdi:star-four-points-outline" label={`${card.points} pts`} />
        {card.proctored && <Pill dark icon="mdi:webcam" label="Webcam proctored" />}
        {card.proctored && <Pill dark icon="mdi:lock-outline" label="Lockdown" />}
      </Stack>

      <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mt: 2 }}>
        <ButtonBase
          disabled={!canStart}
          onClick={() => canStart && slug && router.push(`/assessments/${slug}/calibration?courseId=${courseId}`)}
          sx={{
            flex: 1, py: 1.1, borderRadius: 2, fontWeight: 800, fontSize: "0.85rem",
            bgcolor: canStart ? "#fff" : "rgba(255,255,255,0.12)",
            color: canStart ? "#0f172a" : "rgba(255,255,255,0.6)",
            "&:hover": { bgcolor: canStart ? "#f1f5f9" : "rgba(255,255,255,0.12)" },
          }}
        >
          {ctaLabel}
        </ButtonBase>
        <Typography sx={{ fontSize: "0.68rem", color: "rgba(255,255,255,0.5)", maxWidth: 130 }}>
          {status === "generating"
            ? "Being prepared by AI — check back shortly"
            : status === "not_configured"
              ? "Your instructor will enable this soon"
              : "Same for everyone · not graded on a curve"}
        </Typography>
      </Stack>
    </Box>
  );
}

function InterviewerCard({ courseId }: { courseId: number }) {
  const router = useRouter();
  return (
    <Box sx={{ flex: 1, minWidth: 280, p: 2.5, borderRadius: 4, border: "1px solid #eef2f7", bgcolor: "#fff" }}>
      <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
        <Stack direction="row" spacing={1.25} alignItems="center">
          <Box sx={{ width: 36, height: 36, borderRadius: "50%", display: "grid", placeItems: "center", border: "2px solid #a855f7", color: "#a855f7" }}>
            <Icon icon="mdi:star-four-points" width={18} />
          </Box>
          <Box>
            <Stack direction="row" spacing={0.75} alignItems="center">
              <Typography sx={{ fontWeight: 800, fontSize: "1rem", color: "#0f172a" }}>AI Mock Interviewer</Typography>
              <Chip label="LIVE" size="small" sx={{ height: 18, fontSize: "0.58rem", fontWeight: 800, color: "#7c3aed", bgcolor: "#ede9fe" }} />
            </Stack>
            <Typography sx={{ fontSize: "0.74rem", color: "#94a3b8" }}>Practice rounds, on demand</Typography>
          </Box>
        </Stack>
      </Stack>

      <Typography sx={{ fontSize: "0.8rem", color: "#64748b", mt: 1.5, lineHeight: 1.5 }}>
        Rehearse with a voice-and-text AI interviewer that asks domain questions, follows up on your answers, and
        scores communication, depth, and correctness. <b>Adapts</b> to how you respond — unlike the calibration test.
      </Typography>

      <Stack direction="row" flexWrap="wrap" gap={0.75} sx={{ mt: 1.75 }}>
        {["Technical", "Behavioral", "SQL drill", "Case study"].map((t) => (
          <Pill key={t} icon="mdi:tag-outline" label={t} />
        ))}
      </Stack>

      <ButtonBase
        onClick={() => router.push("/mock-interview/courses")}
        sx={{
          mt: 2, width: "100%", py: 1.1, borderRadius: 2, fontWeight: 800, fontSize: "0.85rem", color: "white",
          gap: 0.75, background: "linear-gradient(135deg, #6366f1 0%, #a855f7 100%)",
          boxShadow: "0 12px 26px -14px rgba(124,58,237,0.7)",
        }}
      >
        <Icon icon="mdi:plus" width={18} />
        Launch Interviewer
      </ButtonBase>
    </Box>
  );
}

export function JourneyTopCards({ courseId, calibration }: { courseId: number; calibration: JourneyBoard["calibration"] }) {
  return (
    <Stack direction={{ xs: "column", md: "row" }} spacing={2} sx={{ mb: 2.5 }}>
      {calibration.card && <CalibrationCard calibration={calibration} courseId={courseId} />}
      <InterviewerCard courseId={courseId} />
    </Stack>
  );
}
