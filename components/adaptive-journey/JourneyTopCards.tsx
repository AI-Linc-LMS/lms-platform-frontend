"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Box, ButtonBase, Chip, CircularProgress, Stack, Typography } from "@mui/material";
import { Icon } from "@iconify/react";
import { useToast } from "@/components/common/Toast";
import mockInterviewService from "@/lib/services/mock-interview.service";
import type { JourneyBoard } from "@/lib/types/adaptive-journey";

// Subtle diagonal "lining" texture for the dark calibration card.
const STRIPES =
  "repeating-linear-gradient(135deg, rgba(255,255,255,0.035) 0px, rgba(255,255,255,0.035) 1px, transparent 1px, transparent 12px)";

function Pill({ icon, label, dark, iconColor }: { icon: string; label: string; dark?: boolean; iconColor?: string }) {
  return (
    <Stack
      direction="row"
      spacing={0.6}
      alignItems="center"
      sx={{
        px: 1.1, py: 0.5, borderRadius: 999, fontSize: "0.74rem", fontWeight: 700,
        bgcolor: dark ? "rgba(255,255,255,0.06)" : "#f1f5f9",
        color: dark ? "#e2e8f0" : "#334155",
        border: dark ? "1px solid rgba(255,255,255,0.16)" : "1px solid #e2e8f0",
      }}
    >
      <Icon icon={icon} width={14} color={iconColor} />
      {label}
    </Stack>
  );
}

const CALIB_STATUS_CHIP: Record<string, { label: string; color: string; bg: string }> = {
  done: { label: "DONE", color: "#14532d", bg: "#4ade80" },
  not_started: { label: "NOT STARTED", color: "#1e293b", bg: "#fbbf24" },
  not_configured: { label: "SETUP PENDING", color: "#1e293b", bg: "#cbd5e1" },
  generating: { label: "PREPARING", color: "#3730a3", bg: "#c7d2fe" },
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
        flex: 1, minWidth: 280, p: 2.5, borderRadius: 4, color: "white", position: "relative", overflow: "hidden",
        display: "flex", flexDirection: "column",
        backgroundColor: "#0f172a",
        backgroundImage: `${STRIPES}, linear-gradient(135deg, #0f172a 0%, #1e293b 100%)`,
        boxShadow: "0 18px 40px -22px rgba(15,23,42,0.7)",
        border: "1px solid rgba(255,255,255,0.07)",
      }}
    >
      <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
        <Stack direction="row" spacing={1.25} alignItems="center">
          <Box sx={{ width: 38, height: 38, borderRadius: 2.5, display: "grid", placeItems: "center", bgcolor: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)" }}>
            <Icon icon="mdi:shield-half-full" width={20} color="#fb923c" />
          </Box>
          <Box>
            <Typography sx={{ fontWeight: 800, fontSize: "1.05rem", color: "#fff" }}>Calibration Assessment</Typography>
            <Typography sx={{ fontSize: "0.76rem", color: "rgba(255,255,255,0.62)" }}>
              Required before personalization unlocks
            </Typography>
          </Box>
        </Stack>
        <Chip label={chip.label} size="small" sx={{ height: 24, fontSize: "0.66rem", fontWeight: 800, color: chip.color, bgcolor: chip.bg }} />
      </Stack>

      <Typography sx={{ fontSize: "0.82rem", color: "rgba(255,255,255,0.85)", mt: 1.5, lineHeight: 1.55 }}>
        A standardized, <b style={{ color: "#fff" }}>non-adaptive</b> test — the same fixed question set for every learner —
        so we can fairly measure where everyone starts. Your baseline feeds the AI Student Model that powers the rest of the course.
      </Typography>

      <Stack direction="row" flexWrap="wrap" gap={0.75} sx={{ mt: 1.75 }}>
        {card.durationMinutes != null && <Pill dark icon="mdi:clock-outline" iconColor="#cbd5e1" label={`${card.durationMinutes} min`} />}
        {card.questionCount > 0 && <Pill dark icon="mdi:help-circle" iconColor="#f87171" label={`${card.questionCount} fixed Qs`} />}
        <Pill dark icon="mdi:trophy" iconColor="#fbbf24" label={`${card.points} pts`} />
        {card.proctored && <Pill dark icon="mdi:webcam" iconColor="#93c5fd" label="Webcam proctored" />}
        {card.proctored && <Pill dark icon="mdi:lock" iconColor="#fbbf24" label="Lockdown" />}
      </Stack>

      <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mt: "auto", pt: 2 }}>
        <ButtonBase
          disabled={!canStart}
          onClick={() => canStart && slug && router.push(`/assessments/${slug}/calibration?courseId=${courseId}`)}
          sx={{
            flex: 1, py: 1.15, borderRadius: 2.5, fontWeight: 800, fontSize: "0.88rem",
            bgcolor: canStart ? "#fff" : "rgba(255,255,255,0.12)",
            color: canStart ? "#0f172a" : "rgba(255,255,255,0.6)",
            boxShadow: canStart ? "0 10px 24px -14px rgba(255,255,255,0.5)" : "none",
            "&:hover": { bgcolor: canStart ? "#f1f5f9" : "rgba(255,255,255,0.12)" },
          }}
        >
          {ctaLabel}
        </ButtonBase>
        <Typography sx={{ fontSize: "0.7rem", color: "rgba(255,255,255,0.6)", maxWidth: 130 }}>
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

const INTERVIEW_CHIPS: { t: string; hot?: boolean }[] = [
  { t: "Technical", hot: true },
  { t: "Behavioral" },
  { t: "SQL drill" },
  { t: "Case study" },
];

function InterviewerCard({ interview }: { interview: JourneyBoard["interview"] }) {
  const router = useRouter();
  const { showToast } = useToast();
  const [busy, setBusy] = useState(false);
  const card = interview.card;
  const status = card.status;
  const configured = card.configured && card.templateId != null;

  const launch = async () => {
    if (!configured || card.templateId == null || busy) return;
    setBusy(true);
    try {
      const created = await mockInterviewService.startTemplateInterview(card.templateId);
      router.push(`/mock-interview/${created.id}/device-check`);
    } catch {
      showToast("Couldn't start the interview. Please try again.", "error");
      setBusy(false);
    }
  };

  let ctaLabel = "Launch interviewer";
  if (!configured) ctaLabel = "Interview is being set up";
  else if (status === "done") ctaLabel = "Take it again";

  return (
    <Box
      sx={{
        flex: 1, minWidth: 280, p: 2.5, borderRadius: 4, border: "1px solid #ece9fb",
        display: "flex", flexDirection: "column",
        backgroundImage: "radial-gradient(120% 120% at 100% 0%, #faf5ff 0%, #ffffff 45%)",
      }}
    >
      <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
        <Stack direction="row" spacing={1.25} alignItems="center">
          <Box sx={{ p: "2px", borderRadius: "50%", background: "linear-gradient(135deg, #7c3aed 0%, #db2777 100%)" }}>
            <Box sx={{ width: 36, height: 36, borderRadius: "50%", bgcolor: "#fff", display: "grid", placeItems: "center" }}>
              <Icon icon="mdi:star-four-points" width={18} color="#a855f7" />
            </Box>
          </Box>
          <Box>
            <Stack direction="row" spacing={0.75} alignItems="center">
              <Typography sx={{ fontWeight: 800, fontSize: "1.05rem", color: "#0f172a" }}>AI Mock Interviewer</Typography>
              <Chip
                icon={<Icon icon="mdi:star-four-points" width={11} color="#fff" />}
                label="LIVE"
                size="small"
                sx={{ height: 20, fontSize: "0.6rem", fontWeight: 800, color: "#fff", background: "linear-gradient(135deg, #7c3aed, #db2777)", "& .MuiChip-icon": { color: "#fff", ml: 0.5 } }}
              />
              {status === "done" && <Chip label="DONE" size="small" sx={{ height: 20, fontSize: "0.6rem", fontWeight: 800, color: "#14532d", bgcolor: "#bbf7d0" }} />}
            </Stack>
            <Typography sx={{ fontSize: "0.76rem", color: "#64748b" }}>Practice rounds, on demand</Typography>
          </Box>
        </Stack>
        <ButtonBase disabled={!configured} onClick={launch} sx={{ p: 0.5, borderRadius: "50%", color: "#a855f7", "&.Mui-disabled": { color: "#cbd5e1" } }}>
          <Icon icon="mdi:arrow-right" width={22} />
        </ButtonBase>
      </Stack>

      <Typography sx={{ fontSize: "0.84rem", color: "#334155", mt: 1.5, lineHeight: 1.55 }}>
        Rehearse with a voice-and-text AI interviewer that asks domain questions, follows up on your answers, and
        scores communication, depth, and correctness. <b style={{ color: "#0f172a" }}>Adapts</b> to how you respond — and feeds your AI Student Model, just like the calibration test.
      </Typography>

      <Stack direction="row" flexWrap="wrap" gap={0.75} sx={{ mt: 1.75 }}>
        {INTERVIEW_CHIPS.map(({ t, hot }) => (
          <Box
            key={t}
            sx={{
              px: 1.4, py: 0.5, borderRadius: 999, fontSize: "0.76rem", fontWeight: 700,
              bgcolor: hot ? "#ede9fe" : "#f1f5f9",
              color: hot ? "#6d28d9" : "#334155",
              border: hot ? "1px solid #ddd6fe" : "1px solid #e2e8f0",
            }}
          >
            {t}
          </Box>
        ))}
      </Stack>

      <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mt: "auto", pt: 2 }}>
        <ButtonBase
          disabled={!configured || busy}
          onClick={launch}
          sx={{
            flex: 1, py: 1.15, borderRadius: 2.5, fontWeight: 800, fontSize: "0.88rem", color: "white",
            gap: 0.75, background: configured ? "linear-gradient(135deg, #7c3aed 0%, #db2777 100%)" : "#cbd5e1",
            boxShadow: configured ? "0 12px 26px -12px rgba(124,58,237,0.6)" : "none",
          }}
        >
          {busy ? <CircularProgress size={16} sx={{ color: "white" }} /> : <Icon icon="mdi:star-four-points" width={16} />}
          {ctaLabel}
        </ButtonBase>
        <Typography sx={{ fontSize: "0.7rem", color: "#64748b", maxWidth: 120 }}>
          {`Level gauge · ~${card.durationMinutes ?? 10} min`}
        </Typography>
      </Stack>
    </Box>
  );
}

export function JourneyTopCards({
  courseId,
  calibration,
  interview,
}: {
  courseId: number;
  calibration: JourneyBoard["calibration"];
  interview: JourneyBoard["interview"];
}) {
  return (
    <Stack direction={{ xs: "column", md: "row" }} spacing={2} sx={{ mb: 2.5 }}>
      {calibration.card && <CalibrationCard calibration={calibration} courseId={courseId} />}
      <InterviewerCard interview={interview} />
    </Stack>
  );
}
