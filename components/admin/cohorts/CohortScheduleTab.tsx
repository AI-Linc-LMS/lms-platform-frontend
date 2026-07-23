"use client";

import { useState } from "react";
import { Box, Button, MenuItem, TextField, Typography } from "@mui/material";
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
        <Typography sx={{ fontWeight: 800, fontSize: "1.05rem" }}>Schedule &amp; lifecycle</Typography>
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
          helperText="Blank = unlimited"
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
        <TextField label="Timezone" value={timezone} onChange={(e) => setTimezone(e.target.value)} />
        <Box sx={{ display: "flex", gap: 2 }}>
          <TextField
            label="Week stagger (days)"
            type="number"
            value={stagger}
            onChange={(e) => setStagger(Number(e.target.value))}
            fullWidth
          />
          <TextField
            label="Week window (days)"
            type="number"
            value={window}
            onChange={(e) => setWindow(Number(e.target.value))}
            fullWidth
          />
        </Box>
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
