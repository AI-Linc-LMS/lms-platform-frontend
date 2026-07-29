"use client";

import { useEffect, useState } from "react";
import { useTenantTimezone } from "@/lib/hooks/useTenantTimezone";
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@mui/material";
import { IconWrapper } from "@/components/common/IconWrapper";
import { adminLiveActivitiesService } from "@/lib/services/admin/admin-live-activities.service";
import { timezoneOptions, toLocalInputInZone, viewerTimeZone } from "@/lib/utils/session-time";

export interface NoticeDialogSession {
  id: number;
  topic_name?: string;
  class_datetime?: string;
  timezone?: string | null;
  duration_minutes?: number;
  notice_type?: "" | "cancelled" | "rescheduled" | null;
  notice_reason?: string | null;
}

interface Props {
  open: boolean;
  session: NoticeDialogSession | null;
  onClose: () => void;
  onSaved: (message: string) => void;
}

/** Common reasons, so the usual case is one click rather than free typing. */
const REASON_PRESETS = [
  "Trainer unavailable",
  "Public holiday",
  "Technical issue",
  "Low attendance expected",
  "Rescheduled at learners' request",
];

/**
 * Post or clear a student-visible cancellation / reschedule notice.
 *
 * Students see the reason on their Live Sessions screen and the Join button disappears, so this is
 * how a class gets called off — not by deleting the session, which would erase its history.
 */
export function LiveSessionNoticeDialog({ open, session, onClose, onSaved }: Props) {
  const [mode, setMode] = useState<"cancelled" | "rescheduled">("cancelled");
  const [reason, setReason] = useState("");
  const [when, setWhen] = useState("");
  const [tz, setTz] = useState("");
  const [duration, setDuration] = useState<number | "">("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const tenantTz = useTenantTimezone();
  useEffect(() => {
    if (!open || !session) return;
    setMode(session.notice_type === "rescheduled" ? "rescheduled" : "cancelled");
    setReason(session.notice_reason || "");
    const zone = session.timezone || tenantTz;
    setWhen(toLocalInputInZone(session.class_datetime, zone));
    // The session's own zone is authoritative; only fall back to the viewer's when it has none.
    setTz(zone);
    setDuration(session.duration_minutes ?? "");
    setError(null);
  }, [open, session]);

  const hasExisting = Boolean(session?.notice_type);
  const canSave =
    reason.trim().length > 0 && (mode === "cancelled" || Boolean(when)) && !saving;

  const save = async () => {
    if (!session || !canSave) return;
    setSaving(true);
    setError(null);
    try {
      await adminLiveActivitiesService.postSessionNotice(session.id, {
        notice_type: mode,
        reason: reason.trim(),
        ...(mode === "rescheduled"
          ? {
              class_datetime: when,
              timezone: tz || undefined,
              ...(duration ? { duration_minutes: Number(duration) } : {}),
            }
          : {}),
      });
      onSaved(
        mode === "cancelled"
          ? "Session cancelled. Students can see the reason."
          : "Session rescheduled. Students can see the new time and the reason."
      );
      onClose();
    } catch (e) {
      const detail = (e as { response?: { data?: { error?: string } } })?.response?.data?.error;
      setError(detail || "Could not save the notice. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const clear = async () => {
    if (!session) return;
    setSaving(true);
    setError(null);
    try {
      await adminLiveActivitiesService.clearSessionNotice(session.id);
      onSaved("Notice removed. The session is back to normal.");
      onClose();
    } catch (e) {
      const detail = (e as { response?: { data?: { error?: string } } })?.response?.data?.error;
      setError(detail || "Could not remove the notice.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={saving ? undefined : onClose} fullWidth maxWidth="sm">
      <DialogTitle sx={{ fontWeight: 800, display: "flex", alignItems: "center", gap: 1 }}>
        <IconWrapper icon="mdi:calendar-alert" size={22} color="#f59e0b" />
        {session?.topic_name || "Live session"}
      </DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2.25}>
          <Box>
            <Typography sx={{ fontWeight: 700, fontSize: "0.82rem", mb: 0.75 }}>
              What happened?
            </Typography>
            <ToggleButtonGroup
              exclusive
              size="small"
              value={mode}
              onChange={(_, v) => v && setMode(v)}
              sx={{ "& .MuiToggleButton-root": { textTransform: "none", fontWeight: 700, px: 2 } }}
            >
              <ToggleButton value="cancelled">Cancel session</ToggleButton>
              <ToggleButton value="rescheduled">Reschedule</ToggleButton>
            </ToggleButtonGroup>
          </Box>

          <Box>
            <TextField
              label="Reason shown to students"
              placeholder="e.g. Trainer unavailable due to illness"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              fullWidth
              multiline
              minRows={2}
              required
              helperText="Students see this exactly as written, before they try to join."
            />
            <Stack direction="row" spacing={0.75} sx={{ mt: 1, flexWrap: "wrap", gap: 0.75 }}>
              {REASON_PRESETS.map((p) => (
                <Button
                  key={p}
                  size="small"
                  variant="outlined"
                  onClick={() => setReason(p)}
                  sx={{ textTransform: "none", borderRadius: 999, fontSize: "0.75rem", py: 0.15 }}
                >
                  {p}
                </Button>
              ))}
            </Stack>
          </Box>

          {mode === "rescheduled" && (
            <Stack spacing={1.5}>
              <TextField
                label="New date & time"
                type="datetime-local"
                value={when}
                onChange={(e) => setWhen(e.target.value)}
                fullWidth
                required
                InputLabelProps={{ shrink: true }}
              />
              <TextField
                select
                label="Timezone"
                value={tz}
                onChange={(e) => setTz(e.target.value)}
                fullWidth
                helperText="The time above is read in this zone — not your browser's."
              >
                {timezoneOptions(tz).map((z) => (
                  <MenuItem key={z.value} value={z.value}>{z.label}</MenuItem>
                ))}
              </TextField>
              <TextField
                label="Duration (minutes)"
                type="number"
                value={duration}
                onChange={(e) => setDuration(e.target.value === "" ? "" : Number(e.target.value))}
                fullWidth
                inputProps={{ min: 1, max: 600 }}
              />
            </Stack>
          )}

          {error && (
            <Typography sx={{ color: "#ef4444", fontWeight: 700, fontSize: "0.84rem" }}>{error}</Typography>
          )}
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 2, gap: 1 }}>
        {hasExisting && (
          <Button onClick={clear} disabled={saving} sx={{ mr: "auto", textTransform: "none", fontWeight: 700, color: "#64748b" }}>
            Remove notice
          </Button>
        )}
        <Button onClick={onClose} disabled={saving} sx={{ textTransform: "none", fontWeight: 700 }}>
          Cancel
        </Button>
        <Button
          onClick={save}
          disabled={!canSave}
          variant="contained"
          sx={{ textTransform: "none", fontWeight: 800, bgcolor: mode === "cancelled" ? "#ef4444" : "#f59e0b",
            "&:hover": { bgcolor: mode === "cancelled" ? "#dc2626" : "#d97706" } }}
        >
          {saving ? "Saving…" : mode === "cancelled" ? "Cancel session" : "Reschedule"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
