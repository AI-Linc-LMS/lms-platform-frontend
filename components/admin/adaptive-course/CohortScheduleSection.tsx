"use client";

import { useEffect, useState } from "react";
import { Box, Button, CircularProgress, Stack, TextField, Typography } from "@mui/material";
import { Icon } from "@iconify/react";
import { useToast } from "@/components/common/Toast";
import { adaptiveJourneyService } from "@/lib/services/adaptive-journey.service";

/**
 * Cohort start date - drives the weekly windows (stagger + window) and late
 * penalties for the whole course. Lives under the Content tab.
 */
export function CohortScheduleSection({ courseId }: { courseId: number }) {
  const { showToast } = useToast();
  const [startDate, setStartDate] = useState("");
  const [scheduleSet, setScheduleSet] = useState(false);
  const [calendarWeeks, setCalendarWeeks] = useState(0);
  const [loading, setLoading] = useState(true);
  const [savingDate, setSavingDate] = useState(false);

  useEffect(() => {
    if (!Number.isFinite(courseId)) return;
    let cancelled = false;
    (async () => {
      try {
        const s = await adaptiveJourneyService.getSchedule(courseId);
        if (cancelled) return;
        setScheduleSet(s.schedule_set);
        setCalendarWeeks(s.calendar.length);
        if (s.schedule?.start_date) setStartDate(s.schedule.start_date);
      } catch {
        /* leave empty */
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [courseId]);

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

  return (
    <Box sx={{ borderRadius: 3, p: { xs: 2, md: 2.5 }, mb: 2.5, bgcolor: "var(--card-bg, #fff)", border: "1px solid var(--border-default, #ececf1)" }}>
      <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
        <Icon icon="mdi:calendar-clock" width={20} color="#6366f1" />
        <Typography sx={{ fontWeight: 800, fontSize: "1.05rem" }}>Cohort start date</Typography>
      </Stack>

      {loading ? (
        <Box sx={{ display: "grid", placeItems: "center", py: 2 }}>
          <CircularProgress size={22} sx={{ color: "#6366f1" }} />
        </Box>
      ) : (
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1.5, alignItems: "flex-end", justifyContent: "space-between" }}>
          <Box>
            <Typography sx={{ fontSize: "0.8rem", color: "text.secondary", mt: 0.25 }}>
              {scheduleSet
                ? `Weeks open 7 days apart, each with a 10-day points window + late penalties - ${calendarWeeks} weeks generated.`
                : "Not set - week deadlines and late penalties stay inactive until you set a start date."}
            </Typography>
          </Box>
          <Stack direction="row" spacing={1} alignItems="center">
            <TextField
              type="date"
              size="small"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
              sx={{ minWidth: 170 }}
            />
            <Button
              variant="outlined"
              disabled={!startDate || savingDate}
              onClick={saveStartDate}
              sx={{ textTransform: "none", fontWeight: 700, borderRadius: 2 }}
            >
              {savingDate ? "Saving…" : "Save"}
            </Button>
          </Stack>
        </Box>
      )}
    </Box>
  );
}
