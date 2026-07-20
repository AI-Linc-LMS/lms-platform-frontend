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
  MenuItem,
} from "@mui/material";
import { IconWrapper } from "@/components/common/IconWrapper";
import { useToast } from "@/components/common/Toast";
import {
  adminLiveActivitiesService,
  LiveActivity,
} from "@/lib/services/admin/admin-live-activities.service";
import { adminCoursesService } from "@/lib/services/admin/admin-courses.service";
import { getZoomApiErrorMessage } from "@/lib/utils/live-session-errors";

interface AssignMeetingDialogProps {
  meeting: LiveActivity | null;
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

/** Assign an imported (unassigned) Zoom meeting to a course/instructor. */
export function AssignMeetingDialog({
  meeting,
  open,
  onClose,
  onSuccess,
}: AssignMeetingDialogProps) {
  const { t } = useTranslation("common");
  const { showToast } = useToast();
  const [topicName, setTopicName] = useState("");
  const [instructor, setInstructor] = useState("");
  const [courseId, setCourseId] = useState<number | null>(null);
  const [courses, setCourses] = useState<{ id: number; title: string }[]>([]);
  const [loadingCourses, setLoadingCourses] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open || !meeting) return;
    setTopicName(meeting.topic_name ?? "");
    setInstructor(
      typeof meeting.instructor === "string" ? meeting.instructor : ""
    );
    setCourseId(meeting.course ?? null);
  }, [open, meeting]);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setLoadingCourses(true);
    adminCoursesService
      .getCourses({ limit: 1000 })
      .then((data: unknown) => {
        if (cancelled) return;
        const list = Array.isArray(data)
          ? data
          : (data as { results?: unknown[] })?.results ?? [];
        setCourses(
          list
            .filter(
              (c: unknown) =>
                c && typeof c === "object" && "id" in c && "title" in c
            )
            .map((c: unknown) => ({
              id: (c as { id: number }).id,
              title: (c as { title: string }).title,
            }))
        );
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoadingCourses(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open]);

  const handleAssign = async () => {
    if (!meeting) return;
    try {
      setSaving(true);
      const result = await adminLiveActivitiesService.assignMeeting(meeting.id, {
        course_id: courseId,
        instructor: instructor.trim(),
        topic_name: topicName.trim() || undefined,
      });
      if (result.status === "error") {
        showToast(getZoomApiErrorMessage(result.message), "error");
        return;
      }
      showToast(
        t("adminLiveSessions.meetingAssigned", "Meeting assigned"),
        "success"
      );
      onSuccess();
      onClose();
    } catch (error: unknown) {
      showToast(getZoomApiErrorMessage(String(error)), "error");
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
      PaperProps={{ sx: { borderRadius: "18px", border: "1px solid var(--border-default)", backgroundColor: "var(--card-bg)", backgroundImage: "none" } }}
    >
      <DialogTitle>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Typography sx={{ fontWeight: 700, fontSize: "1.05rem", color: "var(--font-primary)" }}>
            {t("adminLiveSessions.assignMeetingTitle", "Assign imported meeting")}
          </Typography>
          <IconButton onClick={onClose} size="small" sx={{ color: "var(--font-secondary)" }}>
            <IconWrapper icon="mdi:close" size={20} />
          </IconButton>
        </Box>
      </DialogTitle>
      <DialogContent>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}>
          <Typography variant="body2" sx={{ color: "var(--font-secondary)" }}>
            {t(
              "adminLiveSessions.assignMeetingHint",
              "This Zoom meeting was created directly in Zoom. Assign it to a course so enrolled students see it and get notified."
            )}
          </Typography>
          <TextField
            label={t("adminLiveSessions.topicName")}
            value={topicName}
            onChange={(e) => setTopicName(e.target.value)}
            fullWidth
            size="small"
          />
          <TextField
            select
            label={t("adminLiveSessions.courseOptional")}
            value={courseId ?? ""}
            onChange={(e) =>
              setCourseId(e.target.value === "" ? null : Number(e.target.value))
            }
            fullWidth
            size="small"
            disabled={loadingCourses}
          >
            <MenuItem value="">{t("adminLiveSessions.none")}</MenuItem>
            {courses.map((c) => (
              <MenuItem key={c.id} value={c.id}>
                {c.title}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            label={t("adminLiveSessions.instructorOptional", "Instructor (optional)")}
            value={instructor}
            onChange={(e) => setInstructor(e.target.value)}
            fullWidth
            size="small"
          />
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} sx={{ borderRadius: "12px", textTransform: "none", color: "var(--font-secondary)" }}>{t("adminLiveSessions.cancel")}</Button>
        <Button
          variant="contained"
          onClick={handleAssign}
          disabled={saving}
          sx={{
            borderRadius: "12px",
            textTransform: "none",
            fontWeight: 700,
            bgcolor: "var(--accent-indigo)",
            color: "#fff",
            "&:hover": { bgcolor: "var(--accent-indigo-dark)" },
          }}
        >
          {saving ? (
            <CircularProgress size={20} color="inherit" />
          ) : (
            t("adminLiveSessions.assign", "Assign")
          )}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
