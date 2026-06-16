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
  Switch,
  FormControlLabel,
} from "@mui/material";
import { IconWrapper } from "@/components/common/IconWrapper";
import { useToast } from "@/components/common/Toast";
import { liveClassService, LiveClassSession } from "@/lib/services/live-class.service";
import {
  adminLiveActivitiesService,
  MeetingPreset,
  MeetingTemplate,
} from "@/lib/services/admin/admin-live-activities.service";
import { adminCoursesService } from "@/lib/services/admin/admin-courses.service";
import {
  getLiveSessionErrorMessage,
  getZoomApiErrorMessage,
  ZOOM_MEETING_ALREADY_EXISTS_MESSAGE,
  copyToClipboard,
} from "@/lib/utils/live-session-errors";
import { InfoCallout } from "@/components/live-sessions/ui/LiveSessionUI";

function isValidHttpUrl(s: string): boolean {
  try {
    const u = new URL(s.trim());
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

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
  const { t } = useTranslation("common");
  const { showToast } = useToast();
  const [sessionType, setSessionType] = useState<"zoom" | "webinar" | "meet">("zoom");
  const [step, setStep] = useState<"form" | "create-zoom" | "success">("form");
  const [topicName, setTopicName] = useState("");
  const [description, setDescription] = useState("");
  const [classDatetime, setClassDatetime] = useState("");
  const [durationMinutes, setDurationMinutes] = useState(60);
  const [closesAt, setClosesAt] = useState("");
  const [meetLink, setMeetLink] = useState("");
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
  // Optional Zoom preset / native template applied when creating the meeting.
  const [presets, setPresets] = useState<MeetingPreset[]>([]);
  const [templates, setTemplates] = useState<MeetingTemplate[]>([]);
  const [selectedPresetId, setSelectedPresetId] = useState<number | "">("");
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("");
  const [loadingTemplates, setLoadingTemplates] = useState(false);
  // Webinar-only core fields.
  const [webinarPasscode, setWebinarPasscode] = useState("");
  const [registrationRequired, setRegistrationRequired] = useState(false);

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

  // Load presets + native templates once the session exists and we're on the Zoom step.
  useEffect(() => {
    if (step !== "create-zoom") return;
    let cancelled = false;
    setLoadingTemplates(true);
    // Webinars use Zoom's webinar templates; meetings use meeting templates.
    const templatePromise =
      sessionType === "webinar"
        ? adminLiveActivitiesService.getWebinarTemplates()
        : adminLiveActivitiesService.getMeetingTemplates();
    Promise.allSettled([
      adminLiveActivitiesService.listPresets(),
      templatePromise,
    ])
      .then(([presetRes, templateRes]) => {
        if (cancelled) return;
        if (presetRes.status === "fulfilled") {
          setPresets(presetRes.value);
          const def = presetRes.value.find((p) => p.is_default);
          if (def) setSelectedPresetId(def.id);
        }
        if (templateRes.status === "fulfilled") setTemplates(templateRes.value);
      })
      .finally(() => {
        if (!cancelled) setLoadingTemplates(false);
      });
    return () => {
      cancelled = true;
    };
  }, [step, sessionType]);

  const getValidInstructorId = (): number | undefined => {
    const trimmed = instructorId.trim();
    if (!trimmed) return undefined;
    const num = parseInt(trimmed, 10);
    if (Number.isNaN(num) || num < 1) return undefined;
    return num;
  };

  const resetFormState = () => {
    setSessionType("zoom");
    setStep("form");
    setCreatedSession(null);
    setZoomStartUrl(null);
    setZoomPassword(null);
    setTopicName("");
    setDescription("");
    setClassDatetime("");
    setDurationMinutes(60);
    setClosesAt("");
    setMeetLink("");
    setInstructorId("");
    setCourseId(null);
    setPresets([]);
    setTemplates([]);
    setSelectedPresetId("");
    setSelectedTemplateId("");
    setLoadingTemplates(false);
    setWebinarPasscode("");
    setRegistrationRequired(false);
  };

  const handleCreateSession = async () => {
    const trimmedTopic = topicName.trim();
    if (!trimmedTopic) {
      showToast(t("adminLiveSessions.pleaseEnterTopic"), "error");
      return;
    }
    if (trimmedTopic.length < 2) {
      showToast(t("adminLiveSessions.topicMinLength"), "error");
      return;
    }
    if (!classDatetime.trim()) {
      showToast(t("adminLiveSessions.pleaseEnterClassDateTime"), "error");
      return;
    }
    const classDate = new Date(classDatetime);
    const now = Date.now();
    const oneMinuteMs = 60 * 1000;
    if (
      Number.isNaN(classDate.getTime()) ||
      classDate.getTime() < now - oneMinuteMs
    ) {
      showToast(t("adminLiveSessions.classDateTimeFuture"), "error");
      return;
    }
    const duration = Math.min(480, Math.max(1, Math.floor(durationMinutes)));
    if (duration !== durationMinutes) {
      setDurationMinutes(duration);
    }

    if (sessionType === "meet") {
      const link = meetLink.trim();
      if (!link) {
        showToast(t("adminLiveSessions.pleaseEnterMeetLink"), "error");
        return;
      }
      if (!isValidHttpUrl(link)) {
        showToast(t("adminLiveSessions.invalidMeetLink"), "error");
        return;
      }
    }

    try {
      setCreating(true);
      if (sessionType === "meet") {
        const link = meetLink.trim();
        let closesIso: string | undefined;
        if (closesAt.trim()) {
          const cd = new Date(closesAt);
          if (Number.isNaN(cd.getTime())) {
            showToast(t("adminLiveSessions.invalidCloseDateTime"), "error");
            return;
          }
          closesIso = cd.toISOString();
        }
        const session = await liveClassService.createSession({
          topic_name: trimmedTopic,
          description: description.trim() || undefined,
          class_datetime: classDatetime,
          duration_minutes: duration,
          instructor_id: getValidInstructorId(),
          course: courseId ?? undefined,
          join_link: link,
          is_google_meet: true,
          closes_at: closesIso ?? null,
        });
        setCreatedSession(session);
        setStep("success");
        showToast(t("adminLiveSessions.meetSessionCreatedToast"), "success");
        return;
      }

      const session = await liveClassService.createSession({
        topic_name: trimmedTopic,
        description: description.trim() || undefined,
        class_datetime: classDatetime,
        duration_minutes: duration,
        instructor_id: getValidInstructorId(),
        course: courseId ?? undefined,
        zoom_meeting_type: sessionType === "webinar" ? "webinar" : "meeting",
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
      const isWebinar = sessionType === "webinar";
      const result = await adminLiveActivitiesService.createZoom(
        createdSession.id,
        {
          preset_id: selectedPresetId === "" ? undefined : selectedPresetId,
          template_id: selectedTemplateId || undefined,
          passcode: isWebinar && webinarPasscode.trim() ? webinarPasscode.trim() : undefined,
          registration_required: isWebinar ? registrationRequired : undefined,
        }
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
      showToast(t("adminLiveSessions.zoomMeetingCreated"), "success");
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
    resetFormState();
    onSuccess();
    onClose();
  };

  const handleClose = () => {
    if (step === "success") {
      handleDone();
      return;
    }
    resetFormState();
    onClose();
  };

  const isMeetSuccess = Boolean(createdSession?.is_google_meet && createdSession?.join_link);
  const meetLinkForSuccess = createdSession?.join_link?.trim() ?? "";

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
            {step === "form" && t("adminLiveSessions.createDialogTitle")}
            {step === "create-zoom" && t("adminLiveSessions.createZoomMeetingTitle")}
            {step === "success" && (isMeetSuccess
              ? t("adminLiveSessions.meetSessionCreatedTitle")
              : t("adminLiveSessions.zoomSessionCreatedTitle"))}
          </Typography>
          <IconButton onClick={handleClose} size="small" aria-label={t("adminLiveSessions.closeDialog")}>
            <IconWrapper icon="mdi:close" size={20} />
          </IconButton>
        </Box>
      </DialogTitle>
      <DialogContent sx={{ px: { xs: 2, sm: 3 } }}>
        {(() => {
          const labels =
            sessionType === "meet"
              ? [t("adminLiveSessions.stepDetails", "Details"), t("adminLiveSessions.stepDone", "Done")]
              : [
                  t("adminLiveSessions.stepDetails", "Details"),
                  t("adminLiveSessions.stepZoomMeeting", "Zoom meeting"),
                  t("adminLiveSessions.stepDone", "Done"),
                ];
          const activeIdx = step === "form" ? 0 : step === "create-zoom" ? 1 : sessionType === "meet" ? 1 : 2;
          return (
            <Box sx={{ display: "flex", gap: 1, mb: 2.5, mt: 0.5 }}>
              {labels.map((lbl, i) => {
                const done = i < activeIdx;
                const active = i === activeIdx;
                return (
                  <Box key={i} sx={{ flex: 1, minWidth: 0 }}>
                    <Box
                      sx={{
                        height: 5,
                        borderRadius: 999,
                        bgcolor: done || active ? "var(--accent-indigo)" : "var(--border-default)",
                        opacity: done ? 0.55 : 1,
                        transition: "all 0.2s",
                      }}
                    />
                    <Typography
                      variant="caption"
                      sx={{
                        display: "block",
                        mt: 0.5,
                        fontWeight: active ? 700 : 500,
                        color: active ? "var(--accent-indigo)" : "var(--font-tertiary)",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {i + 1}. {lbl}
                    </Typography>
                  </Box>
                );
              })}
            </Box>
          );
        })()}
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
              select
              label={t("adminLiveSessions.sessionType")}
              value={sessionType}
              onChange={(e) => {
                const v = e.target.value as "zoom" | "webinar" | "meet";
                setSessionType(v);
                // Clear Meet-only fields when switching to a Zoom type so stale values don't submit.
                if (v !== "meet") {
                  setMeetLink("");
                  setClosesAt("");
                }
              }}
              fullWidth
              size="small"
            >
              <MenuItem value="zoom">{t("adminLiveSessions.sessionTypeZoom")}</MenuItem>
              <MenuItem value="webinar">{t("adminLiveSessions.sessionTypeWebinar", "Zoom Webinar")}</MenuItem>
              <MenuItem value="meet">{t("adminLiveSessions.sessionTypeMeet")}</MenuItem>
            </TextField>
            <InfoCallout icon={sessionType === "meet" ? "mdi:google" : sessionType === "webinar" ? "mdi:presentation" : "mdi:video"}>
              {sessionType === "zoom"
                ? t("adminLiveSessions.zoomTypeHint", "We create the Zoom meeting for you, email enrolled students the link, and auto-sync attendance, recording and transcript after it ends.")
                : sessionType === "webinar"
                  ? t("adminLiveSessions.webinarTypeHint", "We create a Zoom webinar (requires the Zoom Webinar add-on on your account), email enrolled students the link, and auto-sync attendance, recording and transcript after it ends.")
                  : t("adminLiveSessions.meetTypeHint", "Paste your own Google Meet link. Students get the link by email, but attendance, recording and transcript aren't available for Google Meet.")}
            </InfoCallout>
            <TextField
              label={t("adminLiveSessions.topicName")}
              value={topicName}
              onChange={(e) => setTopicName(e.target.value)}
              placeholder={t("adminLiveSessions.topicPlaceholder")}
              fullWidth
              required
              size="small"
              error={topicName.trim().length > 0 && topicName.trim().length < 2}
              helperText={topicName.trim().length > 0 && topicName.trim().length < 2 ? t("adminLiveSessions.atLeast2Chars") : undefined}
            />
            <TextField
              label={t("adminLiveSessions.description")}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              multiline
              rows={2}
              fullWidth
              size="small"
            />
            <TextField
              label={t("adminLiveSessions.classDateAndTime")}
              type="datetime-local"
              value={classDatetime}
              onChange={(e) => setClassDatetime(e.target.value)}
              fullWidth
              required
              size="small"
              InputLabelProps={{ shrink: true }}
              helperText={t("adminLiveSessions.timesLocalTimezone")}
            />
            <TextField
              label={t("adminLiveSessions.durationMinutes")}
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
              helperText={durationMinutes > 480 ? t("adminLiveSessions.maxDurationHelper") : undefined}
            />
            {sessionType === "meet" && (
              <>
                <TextField
                  label={t("adminLiveSessions.meetLink")}
                  value={meetLink}
                  onChange={(e) => setMeetLink(e.target.value)}
                  placeholder="https://meet.google.com/..."
                  fullWidth
                  required
                  size="small"
                  error={meetLink.trim().length > 0 && !isValidHttpUrl(meetLink)}
                  helperText={
                    meetLink.trim().length > 0 && !isValidHttpUrl(meetLink)
                      ? t("adminLiveSessions.invalidMeetLink")
                      : t("adminLiveSessions.meetLinkHelper")
                  }
                />
                <TextField
                  label={t("adminLiveSessions.closeDateAndTimeOptional")}
                  type="datetime-local"
                  value={closesAt}
                  onChange={(e) => setClosesAt(e.target.value)}
                  fullWidth
                  size="small"
                  InputLabelProps={{ shrink: true }}
                  helperText={t("adminLiveSessions.closeDateHelper")}
                />
              </>
            )}
            {sessionType === "webinar" && (
              <>
                <TextField
                  label={t("adminLiveSessions.webinarPasscodeOptional", "Webinar passcode (optional)")}
                  value={webinarPasscode}
                  onChange={(e) => setWebinarPasscode(e.target.value)}
                  fullWidth
                  size="small"
                  helperText={t("adminLiveSessions.webinarPasscodeHelper", "Leave blank to let Zoom/the template decide.")}
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={registrationRequired}
                      onChange={(e) => setRegistrationRequired(e.target.checked)}
                    />
                  }
                  label={t("adminLiveSessions.requireRegistration", "Require registration (attendees register before joining)")}
                />
              </>
            )}
            <TextField
              label={t("adminLiveSessions.instructorIdOptional")}
              value={instructorId}
              onChange={(e) => setInstructorId(e.target.value)}
              type="number"
              fullWidth
              size="small"
              error={instructorId.trim().length > 0 && (Number.isNaN(parseInt(instructorId, 10)) || parseInt(instructorId, 10) < 1)}
              helperText={instructorId.trim().length > 0 && (Number.isNaN(parseInt(instructorId, 10)) || parseInt(instructorId, 10) < 1) ? t("adminLiveSessions.enterPositiveNumber") : undefined}
            />
            <TextField
              select
              label={t("adminLiveSessions.courseOptional")}
              value={courseId ?? ""}
              onChange={(e) => {
                const v = e.target.value;
                setCourseId(v === "" ? null : Number(v));
              }}
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
          </Box>
        )}

        {step === "create-zoom" && (
          <Box sx={{ py: 2 }}>
            <Typography variant="body1" sx={{ color: "var(--font-secondary)", mb: 2 }}>
              {t("adminLiveSessions.sessionCreatedPrompt", { topic: createdSession?.topic_name ?? createdSession?.title ?? "—" })}
            </Typography>
            <Box sx={{ mb: 2 }}>
              <InfoCallout icon="mdi:email-fast-outline">
                {t("adminLiveSessions.createZoomHint", "Creating the meeting emails the join link to all enrolled students and turns on automatic attendance, recording and transcript sync.")}
              </InfoCallout>
            </Box>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mb: 2 }}>
              {presets.length > 0 && (
                <TextField
                  select
                  label={t("adminLiveSessions.meetingPreset", "Settings preset (optional)")}
                  value={selectedPresetId}
                  onChange={(e) =>
                    setSelectedPresetId(e.target.value === "" ? "" : Number(e.target.value))
                  }
                  fullWidth
                  size="small"
                  helperText={t("adminLiveSessions.meetingPresetHelper", "Reusable Zoom settings applied to this meeting.")}
                >
                  <MenuItem value="">{t("adminLiveSessions.none")}</MenuItem>
                  {presets.map((p) => (
                    <MenuItem key={p.id} value={p.id}>
                      {p.name}
                      {p.is_default ? ` (${t("adminLiveSessions.default", "default")})` : ""}
                    </MenuItem>
                  ))}
                </TextField>
              )}
              {/* Always render the template picker so it's discoverable; when the account has
                  none (or the Webinar add-on/scope is off) we explain why instead of hiding it. */}
              <TextField
                select
                label={
                  sessionType === "webinar"
                    ? t("adminLiveSessions.webinarTemplate", "Zoom webinar template (optional)")
                    : t("adminLiveSessions.meetingTemplate", "Zoom template (optional)")
                }
                value={selectedTemplateId}
                onChange={(e) => setSelectedTemplateId(e.target.value)}
                fullWidth
                size="small"
                disabled={loadingTemplates || templates.length === 0}
                helperText={
                  loadingTemplates
                    ? t("adminLiveSessions.loadingTemplates", "Loading templates…")
                    : templates.length === 0
                      ? sessionType === "webinar"
                        ? t(
                            "adminLiveSessions.noWebinarTemplates",
                            "No webinar templates found on your Zoom account (create one in Zoom; requires the Webinar add-on). You can still create the webinar without one.",
                          )
                        : t(
                            "adminLiveSessions.noMeetingTemplates",
                            "No saved Zoom templates found on your account.",
                          )
                      : sessionType === "webinar"
                        ? t(
                            "adminLiveSessions.webinarTemplateHelper",
                            "Apply branding, email and registration settings from a saved Zoom webinar template.",
                          )
                        : t(
                            "adminLiveSessions.meetingTemplateHelper",
                            "Apply settings from a saved Zoom meeting template.",
                          )
                }
              >
                <MenuItem value="">{t("adminLiveSessions.none")}</MenuItem>
                {templates.map((tpl) => (
                  <MenuItem key={tpl.id} value={tpl.id}>
                    {tpl.name}
                  </MenuItem>
                ))}
              </TextField>
            </Box>
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
                bgcolor: "var(--accent-indigo)",
                color: "var(--font-light)",
                "&:hover": { bgcolor: "var(--accent-indigo-dark)" },
                "&.Mui-disabled": {
                  color: "var(--font-secondary)",
                  backgroundColor:
                    "color-mix(in srgb, var(--accent-indigo) 24%, var(--surface) 76%)",
                },
              }}
            >
              {creatingZoom
                ? t("adminLiveSessions.creating")
                : sessionType === "webinar"
                  ? t("adminLiveSessions.createWebinar", "Create Webinar")
                  : t("adminLiveSessions.createZoomMeeting")}
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
            <Typography variant="body1" sx={{ color: "var(--font-secondary)" }}>
              {isMeetSuccess
                ? t("adminLiveSessions.meetReadyPrompt")
                : t("adminLiveSessions.zoomReadyPrompt")}
            </Typography>
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2 }}>
              {isMeetSuccess && meetLinkForSuccess && (
                <>
                  <Button
                    variant="contained"
                    onClick={() => window.open(meetLinkForSuccess, "_blank")}
                    startIcon={<IconWrapper icon="mdi:video" size={20} />}
                    sx={{
                      bgcolor: "var(--success-500)",
                      color: "var(--font-light)",
                      "&:hover": {
                        bgcolor:
                          "color-mix(in srgb, var(--success-500) 84%, var(--accent-indigo-dark))",
                      },
                    }}
                  >
                    {t("adminLiveSessions.openGoogleMeet")}
                  </Button>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() =>
                      copyToClipboard(
                        meetLinkForSuccess,
                        showToast,
                        t("adminLiveSessions.meetLinkCopied")
                      )
                    }
                  >
                    {t("liveSessions.copy")}
                  </Button>
                </>
              )}
              {!isMeetSuccess && zoomStartUrl && (
                <Button
                  variant="contained"
                  onClick={() => window.open(zoomStartUrl!, "_blank")}
                  startIcon={<IconWrapper icon="mdi:video" size={20} />}
                  sx={{
                    bgcolor: "var(--accent-indigo)",
                    color: "var(--font-light)",
                    "&:hover": { bgcolor: "var(--accent-indigo-dark)" },
                  }}
                >
                  {t("adminLiveSessions.startMeeting")}
                </Button>
              )}
              {!isMeetSuccess && zoomPassword && (
                <Typography
                  variant="body2"
                  sx={{
                    color: "var(--font-secondary)",
                    display: "flex",
                    alignItems: "center",
                    gap: 1,
                  }}
                >
                  {t("liveSessions.password")}: {zoomPassword}
                  <Button
                    size="small"
                    onClick={() => copyToClipboard(zoomPassword, showToast, t("liveSessions.passwordCopied"))}
                  >
                    {t("liveSessions.copy")}
                  </Button>
                </Typography>
              )}
            </Box>
          </Box>
        )}
      </DialogContent>
      {step === "form" && (
        <DialogActions sx={{ px: { xs: 2, sm: 3 }, pb: 2 }}>
          <Button onClick={handleClose}>{t("adminLiveSessions.cancel")}</Button>
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
                const t0 = new Date(classDatetime).getTime();
                const now = Date.now();
                return Number.isNaN(t0) || t0 < now - 60 * 1000;
              })() ||
              durationMinutes < 1 ||
              durationMinutes > 480 ||
              (instructorId.trim().length > 0 && (Number.isNaN(parseInt(instructorId, 10)) || parseInt(instructorId, 10) < 1)) ||
              (sessionType === "meet" && (!meetLink.trim() || !isValidHttpUrl(meetLink)))
            }
            sx={{
              bgcolor: "var(--accent-indigo)",
              color: "var(--font-light)",
              "&:hover": { bgcolor: "var(--accent-indigo-dark)" },
              "&.Mui-disabled": {
                color: "var(--font-secondary)",
                backgroundColor:
                  "color-mix(in srgb, var(--accent-indigo) 24%, var(--surface) 76%)",
              },
            }}
          >
            {creating ? (
              <CircularProgress size={20} color="inherit" />
            ) : (
              t("adminLiveSessions.createSession")
            )}
          </Button>
        </DialogActions>
      )}
      {step === "create-zoom" && (
        <DialogActions sx={{ px: { xs: 2, sm: 3 }, pb: 2 }}>
          <Button onClick={handleDone}>{t("adminLiveSessions.skipDone")}</Button>
        </DialogActions>
      )}
      {step === "success" && (
        <DialogActions sx={{ px: { xs: 2, sm: 3 }, pb: 2 }}>
          <Button
            variant="contained"
            onClick={handleDone}
            sx={{
              bgcolor: "var(--accent-indigo)",
              color: "var(--font-light)",
              "&:hover": { bgcolor: "var(--accent-indigo-dark)" },
            }}
          >
            {t("adminLiveSessions.done")}
          </Button>
        </DialogActions>
      )}
    </Dialog>
  );
}
