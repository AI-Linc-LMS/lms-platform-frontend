"use client";

import { useState, useEffect } from "react";
import { useTenantTimezone } from "@/lib/hooks/useTenantTimezone";
import { useTranslation } from "react-i18next";
import {
  Box,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  IconButton,
  CircularProgress,
} from "@mui/material";
import { IconWrapper } from "@/components/common/IconWrapper";
import { useToast } from "@/components/common/Toast";
import {
  adminLiveActivitiesService,
  LiveActivity,
} from "@/lib/services/admin/admin-live-activities.service";
import { getZoomApiErrorMessage } from "@/lib/utils/live-session-errors";
import { InfoCallout } from "@/components/live-sessions/ui/LiveSessionUI";
import { viewerTimeZone, timezoneOptions, wallClockToUtcIso, toLocalInputInZone } from "@/lib/utils/session-time";

interface Props {
  activity: LiveActivity;
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
}

/** Edit a webinar's core fields; PATCHes Zoom and mirrors locally (two-way sync). */
export function EditWebinarDialog({ activity, open, onClose, onSaved }: Props) {
  const { t } = useTranslation("common");
  const { showToast } = useToast();
  const [topic, setTopic] = useState("");
  const [datetime, setDatetime] = useState("");
  const [sessionTz, setSessionTz] = useState("");
  const [duration, setDuration] = useState(60);
  const [passcode, setPasscode] = useState("");
  const [saving, setSaving] = useState(false);

  const tenantTz = useTenantTimezone();
  useEffect(() => {
    if (!open) return;
    const tz = activity.timezone || tenantTz;
    setTopic(activity.topic_name ?? "");
    setSessionTz(tz);
    // Show the wall-clock in the session's OWN zone so editing from another zone doesn't shift it.
    setDatetime(toLocalInputInZone(activity.class_datetime, tz));
    setDuration(activity.duration_minutes ?? 60);
    setPasscode(activity.zoom_password ?? "");
  }, [open, activity]);

  const handleSave = async () => {
    const input: {
      topic?: string;
      start_time?: string;
      timezone?: string;
      duration?: number;
      passcode?: string;
    } = {};
    if (topic.trim() && topic.trim() !== activity.topic_name) input.topic = topic.trim();
    if (datetime) {
      // Interpret the wall-clock in the picked zone → an unambiguous UTC instant for Zoom.
      input.start_time = wallClockToUtcIso(datetime, sessionTz).replace(/\.\d{3}Z$/, "Z");
      if (sessionTz) input.timezone = sessionTz;
    }
    if (duration && duration !== activity.duration_minutes) input.duration = duration;
    if (passcode !== (activity.zoom_password ?? "")) input.passcode = passcode;

    if (Object.keys(input).length === 0) {
      showToast(t("adminLiveSessions.noChanges", "No changes to save"), "info");
      return;
    }
    try {
      setSaving(true);
      const res = await adminLiveActivitiesService.editWebinar(activity.id, input);
      if (res.status === "error") {
        showToast(getZoomApiErrorMessage(res.message), "error");
        return;
      }
      showToast(t("adminLiveSessions.webinarUpdated", "Webinar updated"), "success");
      onSaved();
      onClose();
    } catch (e: unknown) {
      showToast(getZoomApiErrorMessage(String(e)), "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: "18px",
          border: "1px solid var(--border-default)",
          backgroundColor: "var(--card-bg)",
          backgroundImage: "none",
        },
      }}
    >
      <DialogTitle>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Typography sx={{ fontWeight: 700, fontSize: "1.05rem", color: "var(--font-primary)" }}>
            {t("adminLiveSessions.editWebinar", "Edit webinar")}
          </Typography>
          <IconButton onClick={onClose} size="small" sx={{ color: "var(--font-secondary)" }}>
            <IconWrapper icon="mdi:close" size={20} />
          </IconButton>
        </Box>
      </DialogTitle>
      <DialogContent>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}>
          <InfoCallout icon="mdi:sync">
            {t("adminLiveSessions.editWebinarHint", "Changes are pushed to Zoom and reflected here.")}
          </InfoCallout>
          <TextField
            label={t("adminLiveSessions.topicName")}
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            fullWidth
            size="small"
          />
          <TextField
            label={t("adminLiveSessions.classDateAndTime")}
            type="datetime-local"
            value={datetime}
            onChange={(e) => setDatetime(e.target.value)}
            fullWidth
            size="small"
            InputLabelProps={{ shrink: true }}
            helperText={t("adminLiveSessions.timeInSelectedZone", "The wall-clock time, in the timezone below")}
          />
          <TextField
            select
            label={t("adminLiveSessions.timezone", "Timezone")}
            value={sessionTz}
            onChange={(e) => setSessionTz(e.target.value)}
            fullWidth
            size="small"
          >
            {timezoneOptions(sessionTz).map((z) => (
              <MenuItem key={z.value} value={z.value}>{z.label}</MenuItem>
            ))}
          </TextField>
          <TextField
            label={t("adminLiveSessions.durationMinutes")}
            type="number"
            value={duration}
            onChange={(e) => setDuration(Math.min(480, Math.max(1, Number(e.target.value) || 60)))}
            fullWidth
            size="small"
            inputProps={{ min: 1, max: 480 }}
          />
          <TextField
            label={t("adminLiveSessions.webinarPasscodeOptional", "Webinar passcode (optional)")}
            value={passcode}
            onChange={(e) => setPasscode(e.target.value)}
            fullWidth
            size="small"
          />
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button
          onClick={onClose}
          sx={{ borderRadius: "12px", textTransform: "none", color: "var(--font-secondary)" }}
        >
          {t("adminLiveSessions.cancel")}
        </Button>
        <Button
          variant="contained"
          onClick={handleSave}
          disabled={saving}
          sx={{
            borderRadius: "12px",
            textTransform: "none",
            fontWeight: 700,
            background: "var(--accent-indigo)",
            color: "#fff",
            "&:hover": { background: "var(--accent-indigo-dark)" },
          }}
        >
          {saving ? <CircularProgress size={20} color="inherit" /> : t("adminLiveSessions.save", "Save")}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
