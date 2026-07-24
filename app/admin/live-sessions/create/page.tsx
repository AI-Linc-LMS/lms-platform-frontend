"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import {
  Box,
  Container,
  Stepper,
  Step,
  StepLabel,
  TextField,
  MenuItem,
  Switch,
  FormControlLabel,
  ButtonBase,
  CircularProgress,
  Typography,
} from "@mui/material";
import { MainLayout } from "@/components/layout/MainLayout";
import { IconWrapper } from "@/components/common/IconWrapper";
import { useToast } from "@/components/common/Toast";
import { useAuth } from "@/lib/auth/auth-context";
import { canAccessAdminArea } from "@/lib/auth/role-utils";
import { liveClassService, LiveClassSession } from "@/lib/services/live-class.service";
import {
  adminLiveActivitiesService,
  MeetingPreset,
  MeetingTemplate,
  LiveSessionRecurrence,
} from "@/lib/services/admin/admin-live-activities.service";
import { RecurrenceControls } from "@/components/admin/live-sessions/RecurrenceControls";
import { summarizeRecurrence } from "@/lib/utils/live-session-recurrence";
import { adminCoursesService } from "@/lib/services/admin/admin-courses.service";
import { adminCohortsService } from "@/lib/services/admin/admin-cohorts.service";
import { adminAdaptiveCourseService } from "@/lib/services/admin/admin-adaptive-course.service";
import { googleService } from "@/lib/services/google.service";
import {
  getLiveSessionErrorMessage,
  getZoomApiErrorMessage,
  ZOOM_MEETING_ALREADY_EXISTS_MESSAGE,
  copyToClipboard,
} from "@/lib/utils/live-session-errors";
import { InfoCallout, SectionCard } from "@/components/live-sessions/ui/LiveSessionUI";

type SessionType = "zoom" | "webinar" | "meet";

function isValidHttpUrl(s: string): boolean {
  try {
    const u = new URL(s.trim());
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

const NEXT_GRADIENT = "linear-gradient(135deg, #6366f1 0%, #4338ca 100%)";

export default function CreateLiveSessionPage() {
  const { t } = useTranslation("common");
  const { showToast } = useToast();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const canAccessAdmin = canAccessAdminArea(user?.role);

  const [stepIndex, setStepIndex] = useState(0);
  const [sessionType, setSessionType] = useState<SessionType>("zoom");
  const [topicName, setTopicName] = useState("");
  const [description, setDescription] = useState("");
  const [classDatetime, setClassDatetime] = useState("");
  const [durationMinutes, setDurationMinutes] = useState(60);
  const [recurrence, setRecurrence] = useState<LiveSessionRecurrence | null>(null);
  const [closesAt, setClosesAt] = useState("");
  const [meetLink, setMeetLink] = useState("");
  const [instructorId, setInstructorId] = useState("");
  const [courseId, setCourseId] = useState<number | null>(null);
  const [courses, setCourses] = useState<{ id: number; title: string }[]>([]);
  const [loadingCourses, setLoadingCourses] = useState(false);
  const [cohortId, setCohortId] = useState<number | null>(null);
  const [cohorts, setCohorts] = useState<{ id: number; name: string }[]>([]);
  const [loadingCohorts, setLoadingCohorts] = useState(false);
  const [adaptiveCourseId, setAdaptiveCourseId] = useState<number | null>(null);
  const [adaptiveCourses, setAdaptiveCourses] = useState<{ id: number; title: string }[]>([]);
  const [loadingAdaptive, setLoadingAdaptive] = useState(false);

  const [presets, setPresets] = useState<MeetingPreset[]>([]);
  const [templates, setTemplates] = useState<MeetingTemplate[]>([]);
  const [selectedPresetId, setSelectedPresetId] = useState<number | "">("");
  const [selectedTemplateId, setSelectedTemplateId] = useState("");
  const [loadingTemplates, setLoadingTemplates] = useState(false);
  const [webinarPasscode, setWebinarPasscode] = useState("");
  const [registrationRequired, setRegistrationRequired] = useState(false);

  const [creating, setCreating] = useState(false);
  const [createdSession, setCreatedSession] = useState<LiveClassSession | null>(null);
  const [zoomStartUrl, setZoomStartUrl] = useState<string | null>(null);
  const [zoomPassword, setZoomPassword] = useState<string | null>(null);

  // Google Meet: "auto" creates the meeting + calendar invite via the Google API (default);
  // "manual" is the legacy paste-your-own-link path (works with no Google connection).
  const [meetMode, setMeetMode] = useState<"auto" | "manual">("auto");
  const [googleConnected, setGoogleConnected] = useState<boolean | null>(null);
  // Admit-control (Phase 2). admitAvailable = Workspace host + admit scopes granted (null = unknown).
  const [admitAvailable, setAdmitAvailable] = useState<boolean | null>(null);
  const [requireAdmit, setRequireAdmit] = useState(false);
  const [instructorEmail, setInstructorEmail] = useState("");

  const isMeet = sessionType === "meet";
  const isWebinar = sessionType === "webinar";
  const isAutoMeet = isMeet && meetMode === "auto";

  // Dynamic step list: Google Meet skips the Zoom-config step.
  const steps = useMemo(
    () =>
      isMeet
        ? [
            { key: "details", label: t("adminLiveSessions.stepDetails", "Details") },
            { key: "review", label: t("adminLiveSessions.stepReview", "Review") },
            { key: "done", label: t("adminLiveSessions.stepDone", "Done") },
          ]
        : [
            { key: "details", label: t("adminLiveSessions.stepDetails", "Details") },
            { key: "zoom", label: t("adminLiveSessions.stepZoomConfig", "Zoom setup") },
            { key: "review", label: t("adminLiveSessions.stepReview", "Review") },
            { key: "done", label: t("adminLiveSessions.stepDone", "Done") },
          ],
    [isMeet, t]
  );
  const stepKey = steps[stepIndex]?.key ?? "details";
  const lastInputStep = steps.length - 2; // the "review" step (before "done")

  useEffect(() => {
    if (!authLoading && !canAccessAdmin) router.replace("/dashboard");
  }, [authLoading, canAccessAdmin, router]);

  // Clamp step index if the step list shrinks (e.g. switching to Google Meet).
  useEffect(() => {
    if (stepIndex > steps.length - 1) setStepIndex(steps.length - 1);
  }, [steps.length, stepIndex]);

  // Check Google connection once so we can steer the Meet flow (auto vs manual), and learn whether
  // this tenant's connected account can gate joins (Workspace-only) to enable/disable the toggle.
  useEffect(() => {
    let cancelled = false;
    googleService
      .getGoogleCredentials()
      .then((res) => {
        if (cancelled) return;
        setGoogleConnected(Boolean(res.credentials?.is_connected && res.credentials?.is_active));
        setAdmitAvailable(Boolean(res.credentials?.admit_control_available));
      })
      .catch(() => { if (!cancelled) { setGoogleConnected(false); setAdmitAvailable(false); } });
    return () => { cancelled = true; };
  }, []);

  // If Google isn't connected, default the Meet flow to the manual paste-a-link path.
  useEffect(() => {
    if (googleConnected === false) setMeetMode("manual");
  }, [googleConnected]);

  // Load courses once.
  useEffect(() => {
    let cancelled = false;
    setLoadingCourses(true);
    adminCoursesService
      .getCourses({ limit: 1000 })
      .then((data: unknown) => {
        if (cancelled) return;
        const list = Array.isArray(data) ? data : (data as { results?: unknown[] })?.results ?? [];
        setCourses(
          list
            .filter((c: unknown) => c && typeof c === "object" && "id" in c && "title" in c)
            .map((c: unknown) => ({ id: (c as { id: number }).id, title: (c as { title: string }).title }))
        );
      })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoadingCourses(false); });
    return () => { cancelled = true; };
  }, []);

  // Load cohorts once (Cohort Builder) - a session may target a cohort instead of / with a course.
  useEffect(() => {
    let cancelled = false;
    setLoadingCohorts(true);
    adminCohortsService
      .listCohorts()
      .then((list) => {
        if (cancelled) return;
        setCohorts(list.map((c) => ({ id: c.id, name: c.name })));
      })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoadingCohorts(false); });
    return () => { cancelled = true; };
  }, []);

  // Load published adaptive courses (courses→adaptive migration) - a session may target one.
  useEffect(() => {
    let cancelled = false;
    setLoadingAdaptive(true);
    adminAdaptiveCourseService
      .listCourses()
      .then((list) => {
        if (cancelled) return;
        setAdaptiveCourses(list.filter((c) => c.is_published).map((c) => ({ id: c.id, title: c.title })));
      })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoadingAdaptive(false); });
    return () => { cancelled = true; };
  }, []);

  // Load presets + native templates for Zoom/Webinar sessions.
  useEffect(() => {
    if (isMeet) return;
    let cancelled = false;
    setLoadingTemplates(true);
    const templatePromise = isWebinar
      ? adminLiveActivitiesService.getWebinarTemplates()
      : adminLiveActivitiesService.getMeetingTemplates();
    Promise.allSettled([adminLiveActivitiesService.listPresets(), templatePromise])
      .then(([presetRes, templateRes]) => {
        if (cancelled) return;
        if (presetRes.status === "fulfilled") {
          setPresets(presetRes.value);
          const def = presetRes.value.find((p) => p.is_default);
          if (def) setSelectedPresetId(def.id);
        }
        if (templateRes.status === "fulfilled") setTemplates(templateRes.value);
      })
      .finally(() => { if (!cancelled) setLoadingTemplates(false); });
    return () => { cancelled = true; };
  }, [isMeet, isWebinar]);

  const getValidInstructorId = (): number | undefined => {
    const trimmed = instructorId.trim();
    if (!trimmed) return undefined;
    const num = parseInt(trimmed, 10);
    if (Number.isNaN(num) || num < 1) return undefined;
    return num;
  };

  const instructorInvalid =
    instructorId.trim().length > 0 && (Number.isNaN(parseInt(instructorId, 10)) || parseInt(instructorId, 10) < 1);

  const detailsValid = useMemo(() => {
    if (topicName.trim().length < 2) return false;
    if (!classDatetime.trim()) return false;
    const t0 = new Date(classDatetime).getTime();
    if (Number.isNaN(t0) || t0 < Date.now() - 60 * 1000) return false;
    if (durationMinutes < 1 || durationMinutes > 480) return false;
    if (instructorInvalid) return false;
    // Only the manual paste-a-link mode requires a URL; auto-create generates it.
    if (isMeet && meetMode === "manual" && (!meetLink.trim() || !isValidHttpUrl(meetLink))) return false;
    return true;
  }, [topicName, classDatetime, durationMinutes, instructorInvalid, isMeet, meetMode, meetLink]);

  const stepValid = stepKey === "details" ? detailsValid : true;

  const applyZoomSuccessState = (
    detail: { zoom_start_url?: string | null; zoom_join_url?: string | null; zoom_password?: string | null },
    data?: { zoom_start_url?: string; zoom_join_url?: string; zoom_password?: string }
  ) => {
    if (data?.zoom_start_url) setZoomStartUrl(data.zoom_start_url);
    else if (data?.zoom_join_url) setZoomStartUrl(data.zoom_join_url);
    else if (detail.zoom_start_url) setZoomStartUrl(detail.zoom_start_url);
    else if (detail.zoom_join_url) setZoomStartUrl(detail.zoom_join_url);
    if (detail.zoom_password) setZoomPassword(detail.zoom_password);
    else if (data?.zoom_password) setZoomPassword(data.zoom_password);
  };

  const goToDone = () => setStepIndex(steps.length - 1);

  const handleCreate = async () => {
    if (!detailsValid || creating) return;
    const trimmedTopic = topicName.trim();
    const duration = Math.min(480, Math.max(1, Math.floor(durationMinutes)));

    try {
      setCreating(true);

      if (isMeet) {
        let closesIso: string | null = null;
        if (closesAt.trim()) {
          const cd = new Date(closesAt);
          if (Number.isNaN(cd.getTime())) {
            showToast(t("adminLiveSessions.invalidCloseDateTime"), "error");
            return;
          }
          closesIso = cd.toISOString();
        }

        // Manual mode: legacy paste-your-own-link - save the session with the link directly.
        if (meetMode === "manual") {
          const session = await liveClassService.createSession({
            topic_name: trimmedTopic,
            description: description.trim() || undefined,
            class_datetime: classDatetime,
            duration_minutes: duration,
            instructor_id: getValidInstructorId(),
            course: courseId ?? undefined,
            cohort: cohortId ?? undefined,
            adaptive_course: adaptiveCourseId ?? undefined,
            join_link: meetLink.trim(),
            is_google_meet: true,
            closes_at: closesIso,
          });
          setCreatedSession(session);
          setZoomStartUrl(session.join_link?.trim() ?? null);
          showToast(t("adminLiveSessions.meetSessionCreatedToast"), "success");
          goToDone();
          return;
        }

        // Auto mode: create the session (marked as a platform Google Meet so a failed
        // provisioning shows correctly and isn't mistaken for a broken Zoom session), then
        // mint the Meet + calendar invite via the Google API. Reuse an already-created session
        // on retry so re-clicking after a transient failure doesn't spawn duplicate rows
        // (google/create is idempotent server-side).
        let session = createdSession;
        if (!session) {
          session = await liveClassService.createSession({
            topic_name: trimmedTopic,
            description: description.trim() || undefined,
            class_datetime: classDatetime,
            duration_minutes: duration,
            instructor_id: getValidInstructorId(),
            course: courseId ?? undefined,
            cohort: cohortId ?? undefined,
            adaptive_course: adaptiveCourseId ?? undefined,
            is_google_meet: true,
            google_source: "platform",
            closes_at: closesIso,
          });
          setCreatedSession(session);
        }

        const result = await adminLiveActivitiesService.createGoogleMeet(session.id, {
          require_admit: requireAdmit && admitAvailable === true,
          instructor_email: instructorEmail.trim() || undefined,
        });
        if (result.status === "error") {
          const msg = (result.message || "").toLowerCase();
          if (msg.includes("already exists")) {
            const detail = await adminLiveActivitiesService.getLiveActivity(session.id);
            setZoomStartUrl(detail.join_link?.trim() ?? null);
            showToast(result.message || t("adminLiveSessions.googleMeetExists", "Google Meet already exists"), "info");
            goToDone();
          } else {
            showToast(result.message || getLiveSessionErrorMessage(null, "generic"), "error");
          }
          return;
        }

        const meetUrl =
          result.data?.join_link ||
          (await adminLiveActivitiesService.getLiveActivity(session.id)).join_link ||
          null;
        setZoomStartUrl(meetUrl?.trim() ?? null);
        showToast(t("adminLiveSessions.googleMeetCreated", "Google Meet created and invite sent"), "success");
        // Admit-control couldn't be applied (e.g. personal-Gmail host) - the meeting was still
        // created, so warn rather than fail.
        if (result.data?.warning) showToast(result.data.warning, "warning");
        goToDone();
        return;
      }

      // Zoom meeting / webinar: create the session, then create the Zoom object. Reuse an
      // already-created session on retry so re-clicking after the zoom/create step failed doesn't
      // spawn duplicate rows (this, plus the server-side create dedup, is what left Agileology with
      // 3 identical undeletable sessions).
      let session = createdSession;
      if (!session) {
        session = await liveClassService.createSession({
          topic_name: trimmedTopic,
          description: description.trim() || undefined,
          class_datetime: classDatetime,
          duration_minutes: duration,
          instructor_id: getValidInstructorId(),
          course: courseId ?? undefined,
            cohort: cohortId ?? undefined,
            adaptive_course: adaptiveCourseId ?? undefined,
          zoom_meeting_type: isWebinar ? "webinar" : "meeting",
        });
        setCreatedSession(session);
      }

      const result = await adminLiveActivitiesService.createZoom(session.id, {
        preset_id: selectedPresetId === "" ? undefined : selectedPresetId,
        template_id: selectedTemplateId || undefined,
        passcode: isWebinar && webinarPasscode.trim() ? webinarPasscode.trim() : undefined,
        registration_required: isWebinar ? registrationRequired : undefined,
        recurrence: recurrence ?? undefined,
      });

      if (result.status === "error") {
        const msg = (result.message || "").toLowerCase();
        if (msg.includes("already exists") || msg.includes("already created")) {
          const detail = await adminLiveActivitiesService.getLiveActivity(session.id);
          applyZoomSuccessState(detail, result.data ?? undefined);
          showToast(ZOOM_MEETING_ALREADY_EXISTS_MESSAGE, "info");
          goToDone();
        } else {
          showToast(getZoomApiErrorMessage(result.message, "zoom_create"), "error");
        }
        return;
      }

      const detail = await adminLiveActivitiesService.getLiveActivity(session.id);
      applyZoomSuccessState(detail, result.data ?? undefined);
      showToast(t("adminLiveSessions.zoomMeetingCreated"), "success");
      goToDone();
    } catch (error: unknown) {
      showToast(getLiveSessionErrorMessage(error, "zoom_create"), "error");
    } finally {
      setCreating(false);
    }
  };

  if (!authLoading && !canAccessAdmin) return null;

  return (
    <MainLayout fullWidthContent>
      <Container maxWidth="lg" sx={{ py: { xs: 3, md: 5 } }}>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
          {/* Clean header (assessment style) */}
          <Box sx={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 2, flexWrap: "wrap" }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.75, minWidth: 0 }}>
              <Box
                sx={{
                  width: 52, height: 52, borderRadius: "14px", flexShrink: 0,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  background: "linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)", color: "#fff",
                }}
              >
                <IconWrapper icon="mdi:video-plus" size={26} color="#fff" />
              </Box>
              <Box sx={{ minWidth: 0 }}>
                <Typography sx={{ fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--font-tertiary)" }}>
                  {t("adminLiveSessions.createChapter", "Create · Live Session")}
                </Typography>
                <Typography sx={{ fontSize: { xs: "1.5rem", md: "1.9rem" }, fontWeight: 800, lineHeight: 1.15, letterSpacing: "-0.02em", color: "var(--font-primary)" }}>
                  {t("adminLiveSessions.createTitle", "New live session")}
                </Typography>
                <Typography sx={{ mt: 0.25, fontSize: "0.9rem", color: "var(--font-secondary)" }}>
                  {t("adminLiveSessions.createSubtitle", "Set the details, configure Zoom, review, and go live.")}
                </Typography>
              </Box>
            </Box>
            <ButtonBase
              onClick={() => router.push("/admin/live-sessions")}
              sx={{ px: 2.25, py: 1, borderRadius: 999, fontWeight: 700, color: "var(--font-secondary)", border: "1px solid var(--border-default)", fontSize: "0.82rem", "&:hover": { bgcolor: "var(--surface)" } }}
            >
              {t("adminLiveSessions.cancel", "Cancel")}
            </ButtonBase>
          </Box>

            <Stepper
              activeStep={stepIndex}
              alternativeLabel
              sx={{
                "& .MuiStepIcon-root": { color: "var(--border-default)" },
                "& .MuiStepIcon-root.Mui-active": { color: "var(--accent-indigo)" },
                "& .MuiStepIcon-root.Mui-completed": { color: "var(--accent-indigo)" },
                "& .MuiStepLabel-label": { fontSize: "0.82rem", fontWeight: 600, color: "var(--font-tertiary)", mt: "6px !important" },
                "& .MuiStepLabel-label.Mui-active": { color: "var(--font-primary)", fontWeight: 700 },
                "& .MuiStepLabel-label.Mui-completed": { color: "var(--font-secondary)" },
              }}
            >
              {steps.map((s) => (
                <Step key={s.key}>
                  <StepLabel>{s.label}</StepLabel>
                </Step>
              ))}
            </Stepper>

            <Box
              sx={{
                p: { xs: 2.5, md: 3.5 },
                borderRadius: "var(--radius-card)",
                bgcolor: "var(--card-bg)",
                border: "1px solid var(--border-default)",
              }}
            >
              {stepKey === "details" && (
                <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                  <TextField
                    select
                    label={t("adminLiveSessions.sessionType")}
                    value={sessionType}
                    onChange={(e) => {
                      const v = e.target.value as SessionType;
                      setSessionType(v);
                      if (v !== "meet") { setMeetLink(""); setClosesAt(""); }
                    }}
                    fullWidth
                    size="small"
                  >
                    <MenuItem value="zoom">{t("adminLiveSessions.sessionTypeZoom")}</MenuItem>
                    <MenuItem value="webinar">{t("adminLiveSessions.sessionTypeWebinar", "Zoom Webinar")}</MenuItem>
                    <MenuItem value="meet">{t("adminLiveSessions.sessionTypeMeet")}</MenuItem>
                  </TextField>
                  <InfoCallout icon={isMeet ? "mdi:google" : isWebinar ? "mdi:presentation" : "mdi:video"}>
                    {sessionType === "zoom"
                      ? t("adminLiveSessions.zoomTypeHint", "We create the Zoom meeting for you, email enrolled students the link, and auto-sync attendance, recording and transcript after it ends.")
                      : isWebinar
                        ? t("adminLiveSessions.webinarTypeHint", "We create a Zoom webinar (requires the Zoom Webinar add-on on your account), email enrolled students the link, and auto-sync attendance, recording and transcript after it ends.")
                        : isAutoMeet
                          ? t("adminLiveSessions.meetAutoTypeHint", "We create the Google Meet for you, add it to the calendar, and email enrolled students an invite (with an .ics). Requires a connected Google account.")
                          : t("adminLiveSessions.meetTypeHint", "Paste your own Google Meet link. Students get the link by email, but attendance, recording and transcript aren't available for Google Meet.")}
                  </InfoCallout>

                  {isMeet && (
                    <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                      <TextField
                        select
                        label={t("adminLiveSessions.meetMode", "Google Meet mode")}
                        value={meetMode}
                        onChange={(e) => setMeetMode(e.target.value as "auto" | "manual")}
                        fullWidth
                        size="small"
                      >
                        <MenuItem value="auto" disabled={googleConnected === false}>
                          {t("adminLiveSessions.meetModeAuto", "Auto-create (recommended)")}
                          {googleConnected === false ? ` - ${t("adminLiveSessions.googleNotConnectedShort", "connect Google first")}` : ""}
                        </MenuItem>
                        <MenuItem value="manual">{t("adminLiveSessions.meetModeManual", "Paste my own link")}</MenuItem>
                      </TextField>
                      {isAutoMeet && googleConnected === false && (
                        <InfoCallout icon="mdi:alert-outline">
                          {t("adminLiveSessions.googleNotConnectedHint", "No Google account is connected. Connect one on the Live Sessions page, or switch to \"Paste my own link\".")}
                        </InfoCallout>
                      )}
                    </Box>
                  )}
                  <TextField
                    label={t("adminLiveSessions.topicName")}
                    value={topicName}
                    onChange={(e) => setTopicName(e.target.value)}
                    placeholder={t("adminLiveSessions.topicPlaceholder")}
                    fullWidth required size="small"
                    error={topicName.trim().length > 0 && topicName.trim().length < 2}
                    helperText={topicName.trim().length > 0 && topicName.trim().length < 2 ? t("adminLiveSessions.atLeast2Chars") : undefined}
                  />
                  <TextField
                    label={t("adminLiveSessions.description")}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    multiline rows={2} fullWidth size="small"
                  />
                  <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
                    <TextField
                      label={t("adminLiveSessions.classDateAndTime")}
                      type="datetime-local"
                      value={classDatetime}
                      onChange={(e) => setClassDatetime(e.target.value)}
                      required size="small"
                      sx={{ flex: "1 1 240px" }}
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
                      inputProps={{ min: 1, max: 480 }}
                      size="small"
                      sx={{ flex: "1 1 160px" }}
                      error={durationMinutes < 1 || durationMinutes > 480}
                      helperText={durationMinutes > 480 ? t("adminLiveSessions.maxDurationHelper") : undefined}
                    />
                  </Box>
                  {isMeet && (
                    <>
                      {meetMode === "manual" && (
                        <TextField
                          label={t("adminLiveSessions.meetLink")}
                          value={meetLink}
                          onChange={(e) => setMeetLink(e.target.value)}
                          placeholder="https://meet.google.com/..."
                          fullWidth required size="small"
                          error={meetLink.trim().length > 0 && !isValidHttpUrl(meetLink)}
                          helperText={meetLink.trim().length > 0 && !isValidHttpUrl(meetLink) ? t("adminLiveSessions.invalidMeetLink") : t("adminLiveSessions.meetLinkHelper")}
                        />
                      )}
                      {isAutoMeet && (
                        <Box sx={{ display: "flex", flexDirection: "column", gap: 1, p: 1.5, borderRadius: 1.5, border: "1px solid var(--border-default)", bgcolor: "var(--surface)" }}>
                          <FormControlLabel
                            sx={{ m: 0 }}
                            control={
                              <Switch
                                checked={requireAdmit && admitAvailable === true}
                                disabled={admitAvailable !== true}
                                onChange={(e) => setRequireAdmit(e.target.checked)}
                              />
                            }
                            label={t("adminLiveSessions.requireAdmit", "Require a host to admit participants")}
                          />
                          <Typography variant="caption" sx={{ color: "var(--font-tertiary)", mt: -0.5, ml: 0.5 }}>
                            {admitAvailable === true
                              ? t("adminLiveSessions.requireAdmitHelp", "Link-holders can't just walk in - they wait on an “asking to join” screen until a host lets them in. A host or co-host must be present to admit them.")
                              : t("adminLiveSessions.requireAdmitUnavailable", "Available only with a connected Google Workspace account. Reconnect Google if you just upgraded - personal Gmail can't gate joins.")}
                          </Typography>
                          <TextField
                            label={t("adminLiveSessions.instructorEmail", "Instructor email (host who can admit)")}
                            value={instructorEmail}
                            onChange={(e) => setInstructorEmail(e.target.value)}
                            type="email" size="small" fullWidth
                            placeholder="teacher@school.edu"
                            helperText={t("adminLiveSessions.instructorEmailHelp", "Optional. They're invited and skip the lobby. If they're in your Google Workspace organization, they can also admit others straight away - otherwise you'll add them as a co-host (we'll show you where).")}
                          />
                        </Box>
                      )}
                      <TextField
                        label={t("adminLiveSessions.closeDateAndTimeOptional")}
                        type="datetime-local"
                        value={closesAt}
                        onChange={(e) => setClosesAt(e.target.value)}
                        fullWidth size="small"
                        InputLabelProps={{ shrink: true }}
                        helperText={t("adminLiveSessions.closeDateHelper")}
                      />
                    </>
                  )}
                  <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
                    <TextField
                      label={t("adminLiveSessions.instructorIdOptional")}
                      value={instructorId}
                      onChange={(e) => setInstructorId(e.target.value)}
                      type="number" size="small"
                      sx={{ flex: "1 1 160px" }}
                      error={instructorInvalid}
                      helperText={instructorInvalid ? t("adminLiveSessions.enterPositiveNumber") : undefined}
                    />
                    <TextField
                      select
                      label={t("adminLiveSessions.courseOptional")}
                      value={courseId ?? ""}
                      onChange={(e) => setCourseId(e.target.value === "" ? null : Number(e.target.value))}
                      size="small" disabled={loadingCourses}
                      sx={{ flex: "1 1 240px" }}
                    >
                      <MenuItem value="">{t("adminLiveSessions.none")}</MenuItem>
                      {courses.map((c) => (
                        <MenuItem key={c.id} value={c.id}>{c.title}</MenuItem>
                      ))}
                    </TextField>
                    <TextField
                      select
                      label="Cohort (optional)"
                      value={cohortId ?? ""}
                      onChange={(e) => setCohortId(e.target.value === "" ? null : Number(e.target.value))}
                      size="small" disabled={loadingCohorts}
                      sx={{ flex: "1 1 240px" }}
                      helperText="Map this session to a cohort - its members see it and appear on the roster."
                    >
                      <MenuItem value="">{t("adminLiveSessions.none")}</MenuItem>
                      {cohorts.map((c) => (
                        <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>
                      ))}
                    </TextField>
                    <TextField
                      select
                      label="Adaptive course (optional)"
                      value={adaptiveCourseId ?? ""}
                      onChange={(e) => setAdaptiveCourseId(e.target.value === "" ? null : Number(e.target.value))}
                      size="small" disabled={loadingAdaptive}
                      sx={{ flex: "1 1 240px" }}
                      helperText="Tag this session to an adaptive course - its enrollees see it and appear on the roster."
                    >
                      <MenuItem value="">{t("adminLiveSessions.none")}</MenuItem>
                      {adaptiveCourses.map((c) => (
                        <MenuItem key={c.id} value={c.id}>{c.title}</MenuItem>
                      ))}
                    </TextField>
                  </Box>
                </Box>
              )}

              {stepKey === "zoom" && (
                <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                  <InfoCallout icon="mdi:email-fast-outline">
                    {t("adminLiveSessions.createZoomHint", "Creating the meeting emails the join link to all enrolled students and turns on automatic attendance, recording and transcript sync.")}
                  </InfoCallout>
                  {presets.length > 0 && (
                    <TextField
                      select
                      label={t("adminLiveSessions.meetingPreset", "Settings preset (optional)")}
                      value={selectedPresetId}
                      onChange={(e) => setSelectedPresetId(e.target.value === "" ? "" : Number(e.target.value))}
                      fullWidth size="small"
                      helperText={t("adminLiveSessions.meetingPresetHelper", "Reusable Zoom settings applied to this meeting.")}
                    >
                      <MenuItem value="">{t("adminLiveSessions.none")}</MenuItem>
                      {presets.map((p) => (
                        <MenuItem key={p.id} value={p.id}>
                          {p.name}{p.is_default ? ` (${t("adminLiveSessions.default", "default")})` : ""}
                        </MenuItem>
                      ))}
                    </TextField>
                  )}
                  <TextField
                    select
                    label={isWebinar ? t("adminLiveSessions.webinarTemplate", "Zoom webinar template (optional)") : t("adminLiveSessions.meetingTemplate", "Zoom template (optional)")}
                    value={selectedTemplateId}
                    onChange={(e) => setSelectedTemplateId(e.target.value)}
                    fullWidth size="small"
                    disabled={loadingTemplates || templates.length === 0}
                    helperText={
                      loadingTemplates
                        ? t("adminLiveSessions.loadingTemplates", "Loading templates…")
                        : templates.length === 0
                          ? isWebinar
                            ? t("adminLiveSessions.noWebinarTemplates", "No webinar templates found on your Zoom account (create one in Zoom; requires the Webinar add-on). You can still create the webinar without one.")
                            : t("adminLiveSessions.noMeetingTemplates", "No saved Zoom templates found on your account.")
                          : isWebinar
                            ? t("adminLiveSessions.webinarTemplateHelper", "Apply branding, email and registration settings from a saved Zoom webinar template.")
                            : t("adminLiveSessions.meetingTemplateHelper", "Apply settings from a saved Zoom meeting template.")
                    }
                  >
                    <MenuItem value="">{t("adminLiveSessions.none")}</MenuItem>
                    {templates.map((tpl) => (
                      <MenuItem key={tpl.id} value={tpl.id}>{tpl.name}</MenuItem>
                    ))}
                  </TextField>
                  {isWebinar && (
                    <>
                      <TextField
                        label={t("adminLiveSessions.webinarPasscodeOptional", "Webinar passcode (optional)")}
                        value={webinarPasscode}
                        onChange={(e) => setWebinarPasscode(e.target.value)}
                        fullWidth size="small"
                        helperText={t("adminLiveSessions.webinarPasscodeHelper", "Leave blank to let Zoom/the template decide.")}
                      />
                      <FormControlLabel
                        control={<Switch checked={registrationRequired} onChange={(e) => setRegistrationRequired(e.target.checked)} />}
                        label={t("adminLiveSessions.requireRegistration", "Require registration (attendees register before joining)")}
                      />
                    </>
                  )}
                  <Box>
                    <Typography sx={{ fontSize: "0.9rem", fontWeight: 700, color: "var(--font-primary)", mb: 1 }}>
                      {t("adminLiveSessions.recurrence", "Recurrence")}
                    </Typography>
                    <RecurrenceControls startDatetime={classDatetime} onChange={setRecurrence} />
                  </Box>
                </Box>
              )}

              {stepKey === "review" && (
                <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                  <SectionCard
                    title={t("adminLiveSessions.stepReview", "Review")}
                    icon="mdi:clipboard-check-outline"
                    sx={{ backdropFilter: "none", boxShadow: "none", bgcolor: "var(--surface)", borderRadius: "14px", border: "1px solid var(--border-default)" }}
                  >
                    <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                      <ReviewRow label={t("adminLiveSessions.sessionType")} value={isMeet ? t("adminLiveSessions.sessionTypeMeet") : isWebinar ? t("adminLiveSessions.sessionTypeWebinar", "Zoom Webinar") : t("adminLiveSessions.sessionTypeZoom")} />
                      <ReviewRow label={t("adminLiveSessions.topicName")} value={topicName.trim() || "-"} />
                      <ReviewRow label={t("adminLiveSessions.classDateAndTime")} value={classDatetime ? new Date(classDatetime).toLocaleString() : "-"} />
                      <ReviewRow label={t("adminLiveSessions.durationMinutes")} value={`${durationMinutes} min`} />
                      {courseId != null && <ReviewRow label={t("adminLiveSessions.course")} value={courses.find((c) => c.id === courseId)?.title ?? String(courseId)} />}
                      {cohortId != null && <ReviewRow label="Cohort" value={cohorts.find((c) => c.id === cohortId)?.name ?? String(cohortId)} />}
                      {adaptiveCourseId != null && <ReviewRow label="Adaptive course" value={adaptiveCourses.find((c) => c.id === adaptiveCourseId)?.title ?? String(adaptiveCourseId)} />}
                      {isMeet && <ReviewRow label={t("adminLiveSessions.meetMode", "Google Meet mode")} value={isAutoMeet ? t("adminLiveSessions.meetModeAuto", "Auto-create (recommended)") : t("adminLiveSessions.meetModeManual", "Paste my own link")} />}
                      {isMeet && meetMode === "manual" && <ReviewRow label={t("adminLiveSessions.meetLink")} value={meetLink.trim() || "-"} />}
                      {!isMeet && selectedTemplateId && <ReviewRow label={t("adminLiveSessions.meetingTemplate", "Template")} value={templates.find((tp) => tp.id === selectedTemplateId)?.name ?? selectedTemplateId} />}
                      {!isMeet && selectedPresetId !== "" && <ReviewRow label={t("adminLiveSessions.meetingPreset", "Preset")} value={presets.find((p) => p.id === selectedPresetId)?.name ?? String(selectedPresetId)} />}
                      {isWebinar && <ReviewRow label={t("adminLiveSessions.requireRegistration", "Registration")} value={registrationRequired ? t("liveSessions.yes", "Yes") : t("liveSessions.no", "No")} />}
                      {!isMeet && recurrence && <ReviewRow label={t("adminLiveSessions.recurrence", "Recurrence")} value={summarizeRecurrence(recurrence)} />}
                    </Box>
                  </SectionCard>
                  <InfoCallout icon="mdi:information-outline">
                    {isAutoMeet
                      ? t("adminLiveSessions.reviewMeetAutoHint", "We'll create the Google Meet, add it to the calendar, and email enrolled students an invite.")
                      : isMeet
                        ? t("adminLiveSessions.reviewMeetHint", "We'll save the session and email the Google Meet link to enrolled students.")
                        : t("adminLiveSessions.reviewZoomHint", "We'll create the session, set up Zoom, and email the join link to enrolled students.")}
                  </InfoCallout>
                </Box>
              )}

              {stepKey === "done" && (
                <Box sx={{ display: "flex", flexDirection: "column", gap: 2, alignItems: "center", textAlign: "center", py: 2 }}>
                  <Box
                    sx={{
                      width: 64, height: 64, borderRadius: 3,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      background: "linear-gradient(135deg, #10b981 0%, #047857 100%)",
                      boxShadow: "0 16px 32px -16px color-mix(in srgb, #047857 60%, transparent)",
                    }}
                  >
                    <IconWrapper icon="mdi:check" size={34} color="#fff" />
                  </Box>
                  <Typography sx={{ fontWeight: 800, fontSize: "1.2rem", color: "var(--font-primary)" }}>
                    {t("adminLiveSessions.sessionReadyTitle", "Session created")}
                  </Typography>
                  <Typography variant="body2" sx={{ color: "var(--font-secondary)", maxWidth: 440 }}>
                    {isMeet ? t("adminLiveSessions.meetReadyPrompt") : t("adminLiveSessions.zoomReadyPrompt")}
                  </Typography>
                  <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1.5, justifyContent: "center", mt: 1 }}>
                    {zoomStartUrl && (
                      <ButtonBase
                        onClick={() => window.open(zoomStartUrl, "_blank")}
                        sx={{ px: 2.5, py: 1.1, borderRadius: 999, fontWeight: 800, color: "white", display: "inline-flex", alignItems: "center", gap: 0.75, background: isMeet ? "linear-gradient(135deg, #10b981 0%, #047857 100%)" : NEXT_GRADIENT }}
                      >
                        <IconWrapper icon="mdi:video" size={18} color="#fff" />
                        {isMeet ? t("adminLiveSessions.openGoogleMeet") : t("adminLiveSessions.startMeeting", "Start session")}
                      </ButtonBase>
                    )}
                    {zoomPassword && (
                      <ButtonBase
                        onClick={() => copyToClipboard(zoomPassword, showToast, t("liveSessions.passwordCopied"))}
                        sx={{ px: 2.5, py: 1.1, borderRadius: 999, fontWeight: 700, color: "var(--font-secondary)", border: "1px solid color-mix(in srgb, var(--border-default) 80%, transparent)", display: "inline-flex", alignItems: "center", gap: 0.75 }}
                      >
                        <IconWrapper icon="mdi:key-variant" size={16} />
                        {t("liveSessions.password")}: {zoomPassword}
                      </ButtonBase>
                    )}
                  </Box>
                  <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1.5, justifyContent: "center", mt: 1 }}>
                    {createdSession?.id && (
                      <ButtonBase
                        onClick={() => router.push(`/admin/live-sessions/${createdSession.id}`)}
                        sx={{ px: 2.5, py: 1.1, borderRadius: 999, fontWeight: 800, color: "white", display: "inline-flex", alignItems: "center", gap: 0.75, background: NEXT_GRADIENT }}
                      >
                        <IconWrapper icon="mdi:cog-outline" size={17} color="#fff" />
                        {t("adminLiveSessions.viewSession", "Manage session")}
                      </ButtonBase>
                    )}
                    <ButtonBase
                      onClick={() => router.push("/admin/live-sessions")}
                      sx={{ px: 2.5, py: 1.1, borderRadius: 999, fontWeight: 700, color: "var(--font-secondary)", border: "1px solid color-mix(in srgb, var(--border-default) 80%, transparent)" }}
                    >
                      {t("adminLiveSessions.backToList", "Back to list")}
                    </ButtonBase>
                  </Box>
                </Box>
              )}
            </Box>

            {/* Wizard navigation (hidden on the Done step) */}
            {stepKey !== "done" && (
              <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                <ButtonBase
                  onClick={() => setStepIndex((i) => Math.max(0, i - 1))}
                  disabled={stepIndex === 0}
                  sx={{
                    px: 2.75, py: 1.15, borderRadius: "12px", fontWeight: 700, fontSize: "0.9rem",
                    color: stepIndex === 0 ? "var(--font-tertiary)" : "var(--font-primary)",
                    border: "1px solid var(--border-default)",
                    "&:hover": { bgcolor: stepIndex === 0 ? "transparent" : "var(--surface)" },
                    "&:disabled": { cursor: "not-allowed" },
                  }}
                >
                  ← {t("adminLiveSessions.back", "Back")}
                </ButtonBase>
                {stepIndex < lastInputStep ? (
                  <ButtonBase
                    onClick={() => stepValid && setStepIndex((i) => i + 1)}
                    disabled={!stepValid}
                    sx={{
                      px: 3.25, py: 1.2, borderRadius: "12px", fontWeight: 700, color: "white", fontSize: "0.9rem",
                      background: stepValid ? "linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)" : "color-mix(in srgb, #6366f1 35%, transparent)",
                      "&:disabled": { cursor: "not-allowed" },
                    }}
                  >
                    {t("adminLiveSessions.next", "Next")} →
                  </ButtonBase>
                ) : (
                  <ButtonBase
                    onClick={() => void handleCreate()}
                    disabled={!detailsValid || creating}
                    sx={{
                      px: 3.25, py: 1.2, borderRadius: "12px", fontWeight: 700, color: "white", fontSize: "0.9rem",
                      display: "inline-flex", alignItems: "center", gap: 0.75,
                      background: detailsValid && !creating ? "linear-gradient(135deg, #10b981 0%, #059669 100%)" : "color-mix(in srgb, #10b981 40%, transparent)",
                      "&:disabled": { cursor: "not-allowed" },
                    }}
                  >
                    {creating ? <CircularProgress size={16} sx={{ color: "white" }} /> : <IconWrapper icon="mdi:rocket-launch-outline" size={17} color="#fff" />}
                    {creating ? t("adminLiveSessions.creating", "Creating…") : t("adminLiveSessions.createSession", "Create session")}
                  </ButtonBase>
                )}
              </Box>
            )}
          </Box>
      </Container>
    </MainLayout>
  );
}

function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <Box sx={{ display: "flex", justifyContent: "space-between", gap: 2, py: 0.5, borderBottom: "1px solid color-mix(in srgb, var(--border-default) 50%, transparent)" }}>
      <Typography sx={{ fontSize: "0.8rem", color: "var(--font-tertiary)", fontWeight: 700 }}>{label}</Typography>
      <Typography sx={{ fontSize: "0.84rem", color: "var(--font-primary)", fontWeight: 700, textAlign: "right", wordBreak: "break-word" }}>{value}</Typography>
    </Box>
  );
}
