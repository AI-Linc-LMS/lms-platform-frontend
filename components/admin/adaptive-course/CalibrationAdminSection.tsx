"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Box, Button, Chip, CircularProgress, Stack, TextField, Typography } from "@mui/material";
import { Icon } from "@iconify/react";
import { useToast } from "@/components/common/Toast";
import { adaptiveJourneyService } from "@/lib/services/adaptive-journey.service";

type CalibStatus = Awaited<ReturnType<typeof adaptiveJourneyService.getCalibration>>;

const STATUS_CHIP: Record<string, { label: string; color: string; bg: string }> = {
  ready: { label: "Ready", color: "#15803d", bg: "#dcfce7" },
  generating: { label: "Generating…", color: "#4338ca", bg: "#e0e7ff" },
  setup_pending: { label: "Setup pending", color: "#b45309", bg: "#fef3c7" },
  not_started: { label: "Not set up", color: "#64748b", bg: "#f1f5f9" },
};

export function CalibrationAdminSection({ courseId }: { courseId: number }) {
  const router = useRouter();
  const { showToast } = useToast();
  const [calib, setCalib] = useState<CalibStatus | null>(null);
  const [startDate, setStartDate] = useState<string>("");
  const [scheduleSet, setScheduleSet] = useState(false);
  const [calendarWeeks, setCalendarWeeks] = useState(0);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [savingDate, setSavingDate] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopPolling = () => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [c, s] = await Promise.allSettled([
        adaptiveJourneyService.getCalibration(courseId),
        adaptiveJourneyService.getSchedule(courseId),
      ]);
      if (c.status === "fulfilled") setCalib(c.value);
      if (s.status === "fulfilled") {
        setScheduleSet(s.value.schedule_set);
        setCalendarWeeks(s.value.calendar.length);
        if (s.value.schedule?.start_date) setStartDate(s.value.schedule.start_date);
      }
    } finally {
      setLoading(false);
    }
  }, [courseId]);

  useEffect(() => {
    void load();
  }, [load]);

  const startPolling = useCallback(() => {
    if (pollRef.current) return;
    let elapsed = 0;
    pollRef.current = setInterval(async () => {
      elapsed += 3;
      try {
        const c = await adaptiveJourneyService.getCalibration(courseId);
        setCalib(c);
        if (!c.generating) {
          stopPolling();
          setBusy(false);
          showToast(c.configured ? "Calibration is ready." : "Calibration generation finished.",
            c.configured ? "success" : "info");
        }
      } catch {
        /* keep polling */
      }
      if (elapsed > 120) {
        stopPolling();
        setBusy(false);
      }
    }, 3000);
  }, [courseId, showToast]);

  // Resume polling if the status loads as generating (e.g. page refresh mid-gen).
  useEffect(() => {
    if (calib?.generating) startPolling();
    return stopPolling;
  }, [calib?.generating, startPolling]);

  const generate = async () => {
    setBusy(true);
    try {
      await adaptiveJourneyService.createCalibration(courseId, { question_count: 30 });
      showToast("Generating field-aptitude questions… this takes a few seconds.", "info");
      const c = await adaptiveJourneyService.getCalibration(courseId);
      setCalib(c);
      startPolling();
    } catch {
      showToast("Couldn't start calibration generation.", "error");
      setBusy(false);
    }
  };

  const saveStartDate = async () => {
    if (!startDate) return;
    setSavingDate(true);
    try {
      const res = await adaptiveJourneyService.setSchedule(courseId, { start_date: startDate });
      setScheduleSet(res.schedule_set);
      setCalendarWeeks(res.calendar.length);
      showToast("Cohort start date saved.", "success");
    } catch {
      showToast("Couldn't save the start date.", "error");
    } finally {
      setSavingDate(false);
    }
  };

  const card = (children: React.ReactNode) => (
    <Box sx={{ borderRadius: 3, p: { xs: 2, md: 2.5 }, mb: 2.5, bgcolor: "var(--card-bg, #fff)", border: "1px solid var(--border-default, #ececf1)" }}>
      {children}
    </Box>
  );

  if (loading) {
    return card(
      <Box sx={{ display: "grid", placeItems: "center", py: 2 }}>
        <CircularProgress size={22} sx={{ color: "#6366f1" }} />
      </Box>,
    );
  }

  const generating = busy || !!calib?.generating;
  const configured = !!calib?.configured;
  const status = generating ? "generating" : (calib?.status ?? "not_started");
  const chip = STATUS_CHIP[status] ?? STATUS_CHIP.not_started;

  return card(
    <>
      <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1.5 }}>
        <Icon icon="mdi:shield-half-full" width={20} color="#6366f1" />
        <Typography sx={{ fontWeight: 800, fontSize: "1.05rem" }}>Calibration & schedule</Typography>
      </Stack>

      {/* Calibration */}
      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1.5, alignItems: "center", justifyContent: "space-between", py: 1 }}>
        <Box sx={{ minWidth: 0 }}>
          <Stack direction="row" spacing={1} alignItems="center">
            <Typography sx={{ fontWeight: 700 }}>Calibration assessment</Typography>
            <Chip label={chip.label} size="small" sx={{ height: 20, fontSize: "0.66rem", fontWeight: 800, color: chip.color, bgcolor: chip.bg }} />
            {configured && <Typography sx={{ fontSize: "0.8rem", color: "#94a3b8" }}>{calib?.question_count ?? 0} questions</Typography>}
          </Stack>
          <Typography sx={{ fontSize: "0.8rem", color: "text.secondary", mt: 0.25 }}>
            {generating
              ? "AI is generating the field-aptitude question set — this card will update when it's ready."
              : configured
                ? "Live. Learners take it before personalization unlocks. Edit the questions anytime."
                : "Proctored, non-adaptive field-aptitude test that seeds each learner's Student Model. New courses get this automatically; generate it here for older courses."}
          </Typography>
        </Box>
        <Stack direction="row" spacing={1}>
          {configured ? (
            <Button variant="outlined" onClick={() => router.push(`/admin/assessment/${calib?.assessment_id}/build`)}
              sx={{ textTransform: "none", fontWeight: 700, borderRadius: 2 }}
              startIcon={<Icon icon="mdi:playlist-edit" width={18} />}>
              Edit questions
            </Button>
          ) : (
            <Button variant="contained" disabled={generating} onClick={generate}
              startIcon={generating ? <CircularProgress size={16} sx={{ color: "white" }} /> : <Icon icon="mdi:auto-fix" width={18} />}
              sx={{ textTransform: "none", fontWeight: 700, borderRadius: 2, background: "linear-gradient(135deg, #6366f1 0%, #a855f7 100%)" }}>
              {generating ? "Generating…" : "Generate calibration (AI)"}
            </Button>
          )}
        </Stack>
      </Box>

      <Box sx={{ height: "1px", bgcolor: "var(--border-default, #ececf1)", my: 1.5 }} />

      {/* Cohort start date */}
      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1.5, alignItems: "flex-end", justifyContent: "space-between", py: 1 }}>
        <Box>
          <Typography sx={{ fontWeight: 700 }}>Cohort start date</Typography>
          <Typography sx={{ fontSize: "0.8rem", color: "text.secondary", mt: 0.25 }}>
            {scheduleSet
              ? `Drives weekly windows (9-day stagger, 10-day window) + late penalties — ${calendarWeeks} weeks generated.`
              : "Not set — week deadlines and late penalties stay inactive until you set a start date."}
          </Typography>
        </Box>
        <Stack direction="row" spacing={1} alignItems="center">
          <TextField type="date" size="small" value={startDate} onChange={(e) => setStartDate(e.target.value)}
            InputLabelProps={{ shrink: true }} sx={{ minWidth: 170 }} />
          <Button variant="outlined" disabled={!startDate || savingDate} onClick={saveStartDate}
            sx={{ textTransform: "none", fontWeight: 700, borderRadius: 2 }}>
            {savingDate ? "Saving…" : "Save"}
          </Button>
        </Stack>
      </Box>
    </>,
  );
}
