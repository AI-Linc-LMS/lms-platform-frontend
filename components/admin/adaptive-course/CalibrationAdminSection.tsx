"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Box, Button, Chip, CircularProgress, Stack, TextField, Typography } from "@mui/material";
import { Icon } from "@iconify/react";
import { useToast } from "@/components/common/Toast";
import { adaptiveJourneyService } from "@/lib/services/adaptive-journey.service";

type CalibStatus = Awaited<ReturnType<typeof adaptiveJourneyService.getCalibration>>;

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

  const setUpCalibration = async () => {
    setBusy(true);
    try {
      await adaptiveJourneyService.createCalibration(courseId);
      showToast("Calibration created — add the aptitude questions to make it live.", "success");
      await load();
    } catch {
      showToast("Couldn't set up calibration.", "error");
    } finally {
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

  const configured = calib?.configured;
  const exists = calib?.exists;
  const calibChip = !exists
    ? { label: "Not set up", color: "#64748b", bg: "#f1f5f9" }
    : configured
      ? { label: "Ready", color: "#15803d", bg: "#dcfce7" }
      : { label: "Setup pending", color: "#b45309", bg: "#fef3c7" };

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
            <Chip label={calibChip.label} size="small" sx={{ height: 20, fontSize: "0.66rem", fontWeight: 800, color: calibChip.color, bgcolor: calibChip.bg }} />
            {exists && <Typography sx={{ fontSize: "0.8rem", color: "#94a3b8" }}>{calib?.question_count ?? 0} questions</Typography>}
          </Stack>
          <Typography sx={{ fontSize: "0.8rem", color: "text.secondary", mt: 0.25 }}>
            {!exists
              ? "A proctored, non-adaptive aptitude test that seeds each learner's Student Model. Set one up, then add the question set."
              : configured
                ? "Live. Learners take it before personalization unlocks."
                : "Created — add the field-aptitude question set (not lesson content) to make it live."}
          </Typography>
        </Box>
        <Stack direction="row" spacing={1}>
          {!exists ? (
            <Button variant="contained" disabled={busy} onClick={setUpCalibration}
              sx={{ textTransform: "none", fontWeight: 700, borderRadius: 2, background: "linear-gradient(135deg, #6366f1 0%, #a855f7 100%)" }}>
              {busy ? "Setting up…" : "Set up calibration"}
            </Button>
          ) : (
            <Button variant="outlined" onClick={() => router.push(`/admin/assessment/${calib?.assessment_id}/build`)}
              sx={{ textTransform: "none", fontWeight: 700, borderRadius: 2 }}
              startIcon={<Icon icon="mdi:playlist-edit" width={18} />}>
              {configured ? "Edit questions" : "Add questions"}
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
