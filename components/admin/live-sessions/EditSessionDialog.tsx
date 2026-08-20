"use client";

import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useTenantTimezone } from "@/lib/hooks/useTenantTimezone";
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
import { LiveActivity } from "@/lib/services/admin/admin-live-activities.service";
import { liveClassService, UpdateLiveClassSessionPayload } from "@/lib/services/live-class.service";
import { instructorService } from "@/lib/services/instructor.service";
import { adminCohortsService } from "@/lib/services/admin/admin-cohorts.service";
import { getAxiosErrorDetail } from "@/lib/utils/api-error";
import { InfoCallout } from "@/components/live-sessions/ui/LiveSessionUI";
import { timezoneOptions, toLocalInputInZone } from "@/lib/utils/session-time";

interface Props {
  activity: LiveActivity;
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
}

/** The serializer sends `instructor` as an id or a nested object depending on the endpoint. */
function currentInstructorId(a: LiveActivity): number | null {
  const ins = a.instructor;
  if (typeof ins === "number") return ins;
  if (ins && typeof ins === "object" && "id" in ins && typeof (ins as { id: unknown }).id === "number") {
    return (ins as { id: number }).id;
  }
  return null;
}

/**
 * Edit the platform session itself - topic, schedule, duration, trainer, cohort - for EVERY
 * provider and state. Before this dialog only webinars-while-scheduled had an Edit at all; a
 * plain Zoom meeting or a Meet session could only be deleted and recreated. PATCHes the
 * sessions/<id>/update/ endpoint, which mirrors schedule changes to the provider server-side.
 */
export function EditSessionDialog({ activity, open, onClose, onSaved }: Props) {
  const { t } = useTranslation("common");
  const { showToast } = useToast();
  const tenantTz = useTenantTimezone();

  const [topic, setTopic] = useState("");
  const [datetime, setDatetime] = useState("");
  const [sessionTz, setSessionTz] = useState("");
  const [duration, setDuration] = useState(60);
  const [instructorSel, setInstructorSel] = useState<number | "">("");
  const [cohortSel, setCohortSel] = useState<number | "">("");
  const [saving, setSaving] = useState(false);

  const [instructors, setInstructors] = useState<{ profile_id: number; name: string; email: string }[]>([]);
  // The directory endpoint is admin-only and can fail independently of this page - fall back to
  // the same raw numeric field the create page uses rather than losing the ability to assign.
  const [directoryFailed, setDirectoryFailed] = useState(false);
  const [cohorts, setCohorts] = useState<{ id: number; name: string }[]>([]);

  useEffect(() => {
    if (!open) return;
    const tz = activity.timezone || tenantTz;
    setTopic(activity.topic_name ?? "");
    setSessionTz(tz);
    // Show the wall-clock in the session's OWN zone so editing from another zone doesn't shift it.
    setDatetime(toLocalInputInZone(activity.class_datetime, tz));
    setDuration(activity.duration_minutes ?? 60);
    setInstructorSel(currentInstructorId(activity) ?? "");
    setCohortSel(activity.cohort ?? activity.cohort_detail?.id ?? "");
    // eslint-disable-next-line react-hooks/exhaustive-deps -- prefill on open only
  }, [open, activity]);

  useEffect(() => {
    if (!open) return;
    instructorService
      .getInstructorDirectory()
      .then((rows) => {
        setInstructors(rows.map((r) => ({ profile_id: r.profile_id, name: r.name, email: r.email })));
        setDirectoryFailed(false);
      })
      .catch(() => setDirectoryFailed(true));
    adminCohortsService
      .listCohorts()
      .then((list) => setCohorts(list.map((c) => ({ id: c.id, name: c.name }))))
      .catch(() => undefined);
  }, [open]);

  const initialInstructorId = currentInstructorId(activity);
  const initialCohortId = activity.cohort ?? activity.cohort_detail?.id ?? "";
  const valid = topic.trim().length >= 2 && Boolean(datetime) && duration >= 1 && duration <= 480;

  const handleSave = async () => {
    if (!valid || saving) return;
    const payload: UpdateLiveClassSessionPayload = {
      topic_name: topic.trim(),
      // Naive wall-clock + the zone it's in; the backend converts (contract of sessions/update/).
      class_datetime: datetime,
      ...(sessionTz ? { timezone: sessionTz } : {}),
      duration_minutes: duration,
    };
    if (instructorSel === "" && initialInstructorId != null) {
      payload.instructor_id = ""; // explicit clear, distinct from "not sent"
    } else if (typeof instructorSel === "number" && instructorSel !== initialInstructorId) {
      payload.instructor_id = instructorSel;
    }
    if (cohortSel !== initialCohortId) {
      payload.cohort = cohortSel === "" ? null : cohortSel;
    }
    try {
      setSaving(true);
      await liveClassService.updateSession(activity.id, payload);
      showToast(t("adminLiveSessions.sessionUpdated", "Session updated."), "success");
      onSaved();
      onClose();
    } catch (e) {
      showToast(getAxiosErrorDetail(e, t("adminLiveSessions.sessionUpdateFailed", "Couldn't update the session.")), "error");
    } finally {
      setSaving(false);
    }
  };

  // Keep a vanished trainer selectable: the current assignee may not be in the directory (role
  // changed, endpoint filtered) and the Select would otherwise silently render as "No trainer".
  const showSyntheticCurrent =
    initialInstructorId != null && !instructors.some((i) => i.profile_id === initialInstructorId);

  return (
    <Dialog
      open={open}
      onClose={saving ? undefined : onClose}
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
            {t("adminLiveSessions.editSession", "Edit session")}
          </Typography>
          <IconButton onClick={onClose} size="small" sx={{ color: "var(--font-secondary)" }}>
            <IconWrapper icon="mdi:close" size={20} />
          </IconButton>
        </Box>
      </DialogTitle>
      <DialogContent>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}>
          {activity.zoom_is_recurring && (
            <InfoCallout icon="mdi:calendar-multiselect">
              {t(
                "adminLiveSessions.editSessionRecurringHint",
                "This is a recurring series - changing the schedule here moves the WHOLE series. To move, rename or cancel a single date, use the Timeline tab."
              )}
            </InfoCallout>
          )}
          <TextField
            label={t("adminLiveSessions.topicName", "Topic")}
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            fullWidth
            size="small"
          />
          <TextField
            label={t("adminLiveSessions.classDateAndTime", "Date and time")}
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
            label={t("adminLiveSessions.durationMinutes", "Duration (minutes)")}
            type="number"
            value={duration}
            onChange={(e) => setDuration(Math.min(480, Math.max(1, Number(e.target.value) || 60)))}
            fullWidth
            size="small"
            inputProps={{ min: 1, max: 480 }}
          />
          {directoryFailed ? (
            <TextField
              label={t("adminLiveSessions.instructorIdOptional", "Instructor ID (optional)")}
              value={instructorSel === "" ? "" : String(instructorSel)}
              onChange={(e) => {
                const n = parseInt(e.target.value, 10);
                setInstructorSel(Number.isNaN(n) || n < 1 ? "" : n);
              }}
              fullWidth
              size="small"
              helperText={t("adminLiveSessions.instructorDirectoryUnavailable", "Couldn't load the trainer list - enter the profile id directly, or leave blank for none.")}
            />
          ) : (
            <TextField
              select
              label={t("adminLiveSessions.trainer", "Trainer")}
              value={instructorSel === "" ? "" : String(instructorSel)}
              onChange={(e) => setInstructorSel(e.target.value === "" ? "" : Number(e.target.value))}
              fullWidth
              size="small"
              helperText={t("adminLiveSessions.trainerHelp", "Shown to students by their trainer code.")}
            >
              <MenuItem value="">{t("adminLiveSessions.noTrainer", "No trainer")}</MenuItem>
              {showSyntheticCurrent && (
                <MenuItem value={String(initialInstructorId)}>
                  {t("adminLiveSessions.currentTrainer", "Current trainer")} (#{initialInstructorId})
                </MenuItem>
              )}
              {instructors.map((i) => (
                <MenuItem key={i.profile_id} value={String(i.profile_id)}>
                  {i.name || i.email}{i.name && i.email ? ` · ${i.email}` : ""}
                </MenuItem>
              ))}
            </TextField>
          )}
          <TextField
            select
            label={t("adminLiveSessions.cohort", "Cohort")}
            value={cohortSel === "" ? "" : String(cohortSel)}
            onChange={(e) => setCohortSel(e.target.value === "" ? "" : Number(e.target.value))}
            fullWidth
            size="small"
          >
            <MenuItem value="">{t("adminLiveSessions.noCohort", "No cohort")}</MenuItem>
            {cohorts.map((c) => (
              <MenuItem key={c.id} value={String(c.id)}>{c.name}</MenuItem>
            ))}
          </TextField>
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button
          onClick={onClose}
          disabled={saving}
          sx={{ borderRadius: "12px", textTransform: "none", color: "var(--font-secondary)" }}
        >
          {t("adminLiveSessions.cancel", "Cancel")}
        </Button>
        <Button
          variant="contained"
          onClick={handleSave}
          disabled={!valid || saving}
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
