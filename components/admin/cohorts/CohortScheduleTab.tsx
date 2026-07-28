"use client";

import { useState } from "react";
import { Box, Button, ButtonBase, MenuItem, TextField, Typography } from "@mui/material";
import { Icon } from "@iconify/react";
import { useToast } from "@/components/common/Toast";
import {
  adminCohortsService,
  type CohortDetail,
  type CohortStatus,
} from "@/lib/services/admin/admin-cohorts.service";

const STATUS_OPTIONS: CohortStatus[] = ["draft", "scheduled", "active", "completed", "archived"];

export function CohortScheduleTab({ cohort, onSaved }: { cohort: CohortDetail; onSaved: () => void }) {
  const { showToast } = useToast();
  const [status, setStatus] = useState<CohortStatus>(cohort.status);
  const [startDate, setStartDate] = useState(cohort.start_date ?? "");
  const [endDate, setEndDate] = useState(cohort.end_date ?? "");
  const [timezone, setTimezone] = useState(cohort.timezone ?? "Asia/Kolkata");
  const [stagger, setStagger] = useState(cohort.week_stagger_days ?? 7);
  const [window, setWindow] = useState(cohort.week_window_days ?? 10);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [capacity, setCapacity] = useState<string>(cohort.capacity != null ? String(cohort.capacity) : "");
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    try {
      await adminCohortsService.updateCohort(cohort.id, {
        status,
        start_date: startDate || null,
        end_date: endDate || null,
        timezone,
        week_stagger_days: Number(stagger),
        week_window_days: Number(window),
        capacity: capacity.trim() === "" ? null : Number(capacity),
      });
      showToast("Schedule saved.", "success");
      onSaved();
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Couldn't save.", "error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Box
      sx={{
        borderRadius: 4,
        p: { xs: 2.5, md: 3 },
        bgcolor: "var(--card-bg)",
        border: "1px solid var(--border-default)",
        maxWidth: 720,
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
        <Icon icon="mdi:calendar-clock" width={20} style={{ color: "#a855f7" }} />
        <Box>
          <Typography sx={{ fontWeight: 800, fontSize: "1.05rem" }}>Schedule</Typography>
          <Typography sx={{ fontSize: "0.82rem", color: "var(--font-tertiary)" }}>
            When this batch runs, and how many students it can hold.
          </Typography>
        </Box>
      </Box>

      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 2 }}>
        <TextField
          select
          label="Status"
          value={status}
          onChange={(e) => setStatus(e.target.value as CohortStatus)}
        >
          {STATUS_OPTIONS.map((s) => (
            <MenuItem key={s} value={s}>
              {s}
            </MenuItem>
          ))}
        </TextField>
        <TextField
          label="Capacity"
          type="number"
          value={capacity}
          onChange={(e) => setCapacity(e.target.value)}
          helperText="Leave blank for no limit on how many students can join"
        />
        <TextField
          label="Start date"
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          InputLabelProps={{ shrink: true }}
        />
        <TextField
          label="End date"
          type="date"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
          InputLabelProps={{ shrink: true }}
        />
        <TextField
          label="Timezone"
          value={timezone}
          onChange={(e) => setTimezone(e.target.value)}
          helperText="Deadlines and weekly unlocks are calculated in this timezone"
        />
      </Box>

      {/* Weekly-drip settings. These only do anything on a course with the weekly content lock
          switched ON, so they are tucked away instead of sitting in the main form looking like
          required fields nobody understands. */}
      <Box sx={{ mt: 2.5 }}>
        <ButtonBase
          onClick={() => setShowAdvanced((v) => !v)}
          sx={{ display: "inline-flex", alignItems: "center", gap: 0.5, fontWeight: 700,
                fontSize: "0.85rem", color: "#6366f1", borderRadius: 1 }}
        >
          <Icon icon={showAdvanced ? "mdi:chevron-down" : "mdi:chevron-right"} width={18} />
          Weekly unlock settings
        </ButtonBase>
        <Typography sx={{ fontSize: "0.78rem", color: "var(--font-tertiary)", mt: 0.5 }}>
          Only used when a course in this batch has the weekly content lock turned on. Otherwise these
          are ignored — leave them as they are.
        </Typography>
        {showAdvanced && (
          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 2, mt: 2 }}>
            <TextField
              label="Days between weeks opening"
              type="number"
              value={stagger}
              onChange={(e) => setStagger(Number(e.target.value))}
              helperText="7 = a new week unlocks every calendar week"
            />
            <TextField
              label="Days a week stays open"
              type="number"
              value={window}
              onChange={(e) => setWindow(Number(e.target.value))}
              helperText="How long students get full points for that week's work"
            />
          </Box>
        )}
      </Box>

      <Box sx={{ mt: 3, display: "flex", justifyContent: "flex-end" }}>
        <Button
          onClick={() => void save()}
          disabled={saving}
          variant="contained"
          sx={{ textTransform: "none", borderRadius: 999, fontWeight: 700, px: 3 }}
        >
          {saving ? "Saving…" : "Save"}
        </Button>
      </Box>
    </Box>
  );
}
