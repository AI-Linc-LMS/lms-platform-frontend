"use client";

import { useState, useEffect } from "react";
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
  const [duration, setDuration] = useState(60);
  const [passcode, setPasscode] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setTopic(activity.topic_name ?? "");
    // datetime-local wants 'YYYY-MM-DDTHH:mm' in local time.
    if (activity.class_datetime) {
      const d = new Date(activity.class_datetime);
      const pad = (n: number) => String(n).padStart(2, "0");
      setDatetime(`${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`);
    } else {
      setDatetime("");
    }
    setDuration(activity.duration_minutes ?? 60);
    setPasscode(activity.zoom_password ?? "");
  }, [open, activity]);

  const handleSave = async () => {
    const input: {
      topic?: string;
      start_time?: string;
      duration?: number;
      passcode?: string;
    } = {};
    if (topic.trim() && topic.trim() !== activity.topic_name) input.topic = topic.trim();
    if (datetime) input.start_time = new Date(datetime).toISOString().replace(/\.\d{3}Z$/, "Z");
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
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            {t("adminLiveSessions.editWebinar", "Edit webinar")}
          </Typography>
          <IconButton onClick={onClose} size="small">
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
          />
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
        <Button onClick={onClose}>{t("adminLiveSessions.cancel")}</Button>
        <Button
          variant="contained"
          onClick={handleSave}
          disabled={saving}
          sx={{ bgcolor: "var(--accent-indigo)", color: "var(--font-light)", "&:hover": { bgcolor: "var(--accent-indigo-dark)" } }}
        >
          {saving ? <CircularProgress size={20} color="inherit" /> : t("adminLiveSessions.save", "Save")}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
