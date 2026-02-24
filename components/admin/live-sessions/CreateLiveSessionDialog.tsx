"use client";

import { useState, useEffect } from "react";
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
import { liveClassService, LiveClassSession } from "@/lib/services/live-class.service";
import { adminLiveActivitiesService } from "@/lib/services/admin/admin-live-activities.service";
import { adminCoursesService } from "@/lib/services/admin/admin-courses.service";
import {
  getLiveSessionErrorMessage,
  getZoomApiErrorMessage,
  ZOOM_MEETING_ALREADY_EXISTS_MESSAGE,
  copyToClipboard,
} from "@/lib/utils/live-session-errors";

interface CreateLiveSessionDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function CreateLiveSessionDialog({
  open,
  onClose,
  onSuccess,
}: CreateLiveSessionDialogProps) {
  const { showToast } = useToast();
  const [step, setStep] = useState<"form" | "create-zoom" | "success">("form");
  const [topicName, setTopicName] = useState("");
  const [description, setDescription] = useState("");
  const [classDatetime, setClassDatetime] = useState("");
  const [durationMinutes, setDurationMinutes] = useState(60);
  const [instructorId, setInstructorId] = useState<string>("");
  const [creating, setCreating] = useState(false);
  const [creatingZoom, setCreatingZoom] = useState(false);
  const [createdSession, setCreatedSession] = useState<LiveClassSession | null>(
    null
  );
  const [zoomStartUrl, setZoomStartUrl] = useState<string | null>(null);
  const [zoomPassword, setZoomPassword] = useState<string | null>(null);
  const [courseId, setCourseId] = useState<number | null>(null);
  const [courses, setCourses] = useState<{ id: number; title: string }[]>([]);
  const [loadingCourses, setLoadingCourses] = useState(false);

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
            .filter((c: unknown) => c && typeof c === "object" && "id" in c && "title" in c)
            .map((c: unknown) => ({ id: (c as { id: number }).id, title: (c as { title: string }).title }))
        );
      })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoadingCourses(false); });
    return () => { cancelled = true; };
  }, [open]);

  const getValidInstructorId = (): number | undefined => {
    const trimmed = instructorId.trim();
    if (!trimmed) return undefined;
    const num = parseInt(trimmed, 10);
    if (Number.isNaN(num) || num < 1) return undefined;
    return num;
  };

  const handleCreateSession = async () => {
    const trimmedTopic = topicName.trim();
    if (!trimmedTopic) {
      showToast("Please enter a topic name", "error");
      return;
    }
    if (trimmedTopic.length < 2) {
      showToast("Topic name must be at least 2 characters", "error");
      return;
    }
    if (!classDatetime.trim()) {
      showToast("Please enter class date and time", "error");
      return;
    }
    const classDate = new Date(classDatetime);
    const now = Date.now();
    const oneMinuteMs = 60 * 1000;
    if (
      Number.isNaN(classDate.getTime()) ||
      classDate.getTime() < now - oneMinuteMs
    ) {
      showToast("Class date and time must be in the future", "error");
      return;
    }
    const duration = Math.min(480, Math.max(1, Math.floor(durationMinutes)));
    if (duration !== durationMinutes) {
      setDurationMinutes(duration);
    }
    try {
      setCreating(true);
      const session = await liveClassService.createSession({
        topic_name: trimmedTopic,
        description: description.trim() || undefined,
        class_datetime: classDatetime,
        duration_minutes: duration,
        instructor_id: getValidInstructorId(),
        course: courseId ?? undefined,
      });
      setCreatedSession(session);
      setStep("create-zoom");
    } catch (error: unknown) {
      showToast(getLiveSessionErrorMessage(error), "error");
    } finally {
      setCreating(false);
    }
  };

  const applyZoomSuccessState = (detail: { zoom_start_url?: string | null; zoom_join_url?: string | null; zoom_password?: string | null }, data?: { zoom_start_url?: string; zoom_join_url?: string; zoom_password?: string }) => {
    if (data?.zoom_start_url) setZoomStartUrl(data.zoom_start_url);
    else if (data?.zoom_join_url && !data.zoom_start_url) setZoomStartUrl(data.zoom_join_url);
    else if (detail.zoom_start_url) setZoomStartUrl(detail.zoom_start_url);
    else if (detail.zoom_join_url) setZoomStartUrl(detail.zoom_join_url);
    if (detail.zoom_password) setZoomPassword(detail.zoom_password);
    else if (data && "zoom_password" in data && (data as { zoom_password?: string }).zoom_password)
      setZoomPassword((data as { zoom_password: string }).zoom_password);
    setStep("success");
  };

  const handleCreateZoom = async () => {
    if (!createdSession?.id) return;
    try {
      setCreatingZoom(true);
      const result = await adminLiveActivitiesService.createZoom(
        createdSession.id
      );
      if (result.status === "error") {
        const msg = (result.message || "").toLowerCase();
        if (msg.includes("already exists") || msg.includes("already created")) {
          const detail = await adminLiveActivitiesService.getLiveActivity(createdSession.id);
          applyZoomSuccessState(detail, result.data ?? undefined);
          showToast(ZOOM_MEETING_ALREADY_EXISTS_MESSAGE, "info");
        } else {
          showToast(
            getZoomApiErrorMessage(result.message, "zoom_create"),
            "error"
          );
        }
        return;
      }
      const data = result.data ?? undefined;
      const detail = await adminLiveActivitiesService.getLiveActivity(
        createdSession.id
      );
      applyZoomSuccessState(detail, data);
      showToast("Zoom meeting created", "success");
    } catch (error: unknown) {
      showToast(
        getLiveSessionErrorMessage(error, "zoom_create"),
        "error"
      );
    } finally {
      setCreatingZoom(false);
    }
  };

  const handleDone = () => {
    setStep("form");
    setCreatedSession(null);
    setZoomStartUrl(null);
    setZoomPassword(null);
    setTopicName("");
    setDescription("");
    setClassDatetime("");
    setDurationMinutes(60);
    setInstructorId("");
    setCourseId(null);
    onSuccess();
    onClose();
  };

  const handleClose = () => {
    if (step === "success") {
      handleDone();
      return;
    }
    setStep("form");
    setCreatedSession(null);
    setTopicName("");
    setDescription("");
    setClassDatetime("");
    setDurationMinutes(60);
    setInstructorId("");
    setCourseId(null);
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          m: { xs: 1, sm: 2 },
          maxHeight: { xs: "calc(100% - 16px)", sm: "calc(100% - 32px)" },
        },
      }}
    >
      <DialogTitle sx={{ pb: { xs: 1, sm: 2 } }}>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            {step === "form" && "Create Live Session"}
            {step === "create-zoom" && "Create Zoom Meeting"}
            {step === "success" && "Zoom session created"}
          </Typography>
          <IconButton onClick={handleClose} size="small" aria-label="Close dialog">
            <IconWrapper icon="mdi:close" size={20} />
          </IconButton>
        </Box>
      </DialogTitle>
      <DialogContent sx={{ px: { xs: 2, sm: 3 } }}>
        {step === "form" && (
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              gap: 2,
              mt: 1,
            }}
          >
            <TextField
              label="Topic name"
              value={topicName}
              onChange={(e) => setTopicName(e.target.value)}
              placeholder="e.g. Week 1 – Introduction"
              fullWidth
              required
              size="small"
              error={topicName.trim().length > 0 && topicName.trim().length < 2}
              helperText={topicName.trim().length > 0 && topicName.trim().length < 2 ? "At least 2 characters" : undefined}
            />
            <TextField
              label="Description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              multiline
              rows={2}
              fullWidth
              size="small"
            />
            <TextField
              label="Class date & time"
              type="datetime-local"
              value={classDatetime}
              onChange={(e) => setClassDatetime(e.target.value)}
              fullWidth
              required
              size="small"
              InputLabelProps={{ shrink: true }}
              helperText="Times are in your local timezone."
            />
            <TextField
              label="Duration (minutes)"
              type="number"
              value={durationMinutes}
              onChange={(e) => {
                const v = Number(e.target.value);
                if (e.target.value.trim() === "") setDurationMinutes(60);
                else setDurationMinutes(Math.min(480, Math.max(1, Number.isNaN(v) ? 60 : v)));
              }}
              fullWidth
              inputProps={{ min: 1, max: 480 }}
              size="small"
              error={durationMinutes < 1 || durationMinutes > 480}
              helperText={durationMinutes > 480 ? "Max 480 minutes (8 hours)" : undefined}
            />
            <TextField
              label="Instructor ID (optional)"
              value={instructorId}
              onChange={(e) => setInstructorId(e.target.value)}
              type="number"
              fullWidth
              size="small"
              error={instructorId.trim().length > 0 && (Number.isNaN(parseInt(instructorId, 10)) || parseInt(instructorId, 10) < 1)}
              helperText={instructorId.trim().length > 0 && (Number.isNaN(parseInt(instructorId, 10)) || parseInt(instructorId, 10) < 1) ? "Enter a positive number" : undefined}
            />
            <TextField
              select
              label="Course (optional)"
              value={courseId ?? ""}
              onChange={(e) => {
                const v = e.target.value;
                setCourseId(v === "" ? null : Number(v));
              }}
              fullWidth
              size="small"
              disabled={loadingCourses}
            >
              <MenuItem value="">None</MenuItem>
              {courses.map((c) => (
                <MenuItem key={c.id} value={c.id}>
                  {c.title}
                </MenuItem>
              ))}
            </TextField>
          </Box>
        )}

        {step === "create-zoom" && (
          <Box sx={{ py: 2 }}>
            <Typography variant="body1" sx={{ color: "#6b7280", mb: 2 }}>
              Session &quot;{createdSession?.topic_name ?? createdSession?.title ?? "—"}&quot; was created. Create a Zoom meeting to get the start and join links.
            </Typography>
            <Button
              variant="contained"
              onClick={handleCreateZoom}
              disabled={creatingZoom}
              startIcon={
                creatingZoom ? (
                  <CircularProgress size={20} color="inherit" />
                ) : (
                  <IconWrapper icon="mdi:video" size={20} />
                )
              }
              sx={{
                bgcolor: "#6366f1",
                "&:hover": { bgcolor: "#4f46e5" },
              }}
            >
              {creatingZoom ? "Creating…" : "Create Zoom meeting"}
            </Button>
          </Box>
        )}

        {step === "success" && (
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              gap: 2,
              py: 2,
            }}
          >
            <Typography variant="body1" sx={{ color: "#6b7280" }}>
              Your Zoom session is ready. Start the meeting or share the join
              link with students.
            </Typography>
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2 }}>
              {zoomStartUrl && (
                <Button
                  variant="contained"
                  onClick={() => window.open(zoomStartUrl!, "_blank")}
                  startIcon={<IconWrapper icon="mdi:video" size={20} />}
                  sx={{
                    bgcolor: "#6366f1",
                    "&:hover": { bgcolor: "#4f46e5" },
                  }}
                >
                  Start meeting
                </Button>
              )}
              {zoomPassword && (
                <Typography
                  variant="body2"
                  sx={{ color: "#6b7280", display: "flex", alignItems: "center", gap: 1 }}
                >
                  Password: {zoomPassword}
                  <Button
                    size="small"
                    onClick={() => copyToClipboard(zoomPassword, showToast, "Password copied")}
                  >
                    Copy
                  </Button>
                </Typography>
              )}
            </Box>
          </Box>
        )}
      </DialogContent>
      {step === "form" && (
        <DialogActions sx={{ px: { xs: 2, sm: 3 }, pb: 2 }}>
          <Button onClick={handleClose}>Cancel</Button>
          <Button
            type="button"
            variant="contained"
            onClick={handleCreateSession}
            disabled={
              creating ||
              !topicName.trim() ||
              topicName.trim().length < 2 ||
              !classDatetime.trim() ||
              (() => {
                const t = new Date(classDatetime).getTime();
                const now = Date.now();
                return Number.isNaN(t) || t < now - 60 * 1000;
              })() ||
              durationMinutes < 1 ||
              durationMinutes > 480 ||
              (instructorId.trim().length > 0 && (Number.isNaN(parseInt(instructorId, 10)) || parseInt(instructorId, 10) < 1))
            }
            sx={{ bgcolor: "#6366f1", "&:hover": { bgcolor: "#4f46e5" } }}
          >
            {creating ? (
              <CircularProgress size={20} color="inherit" />
            ) : (
              "Create session"
            )}
          </Button>
        </DialogActions>
      )}
      {step === "create-zoom" && (
        <DialogActions sx={{ px: { xs: 2, sm: 3 }, pb: 2 }}>
          <Button onClick={handleDone}>Skip (done)</Button>
        </DialogActions>
      )}
      {step === "success" && (
        <DialogActions sx={{ px: { xs: 2, sm: 3 }, pb: 2 }}>
          <Button variant="contained" onClick={handleDone}>
            Done
          </Button>
        </DialogActions>
      )}
    </Dialog>
  );
}
