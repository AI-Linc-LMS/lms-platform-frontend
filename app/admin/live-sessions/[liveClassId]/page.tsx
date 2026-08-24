"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import {
  Box,
  Button,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  Tabs,
  Tab,
  TextField,
  ButtonBase,
  CircularProgress,
  IconButton,
  Tooltip,
  Typography,
} from "@mui/material";
import { MainLayout } from "@/components/layout/MainLayout";
import { AdaptiveSectionShell } from "@/components/adaptive-quiz/shared/AdaptiveSectionShell";
import { AdaptiveSectionHero } from "@/components/adaptive-quiz/shared/AdaptiveSectionHero";
import { IconWrapper } from "@/components/common/IconWrapper";
import { useToast } from "@/components/common/Toast";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { useAuth } from "@/lib/auth/auth-context";
import { isClientOrgAdminRole } from "@/lib/auth/role-utils";
import { canAccessAdminArea } from "@/lib/auth/role-utils";
import {
  adminLiveActivitiesService,
  LiveActivity,
} from "@/lib/services/admin/admin-live-activities.service";
import { zoomService } from "@/lib/services/zoom.service";
import {
  getLiveSessionErrorMessage,
  getZoomApiErrorMessage,
  RECORDING_PROCESSING_MESSAGE,
} from "@/lib/utils/live-session-errors";
import {
  SectionCard,
  InfoCallout,
  MeetingStatusChip,
  PlatformChip,
} from "@/components/live-sessions/ui/LiveSessionUI";
import { AttendanceCenter } from "@/components/admin/live-sessions/AttendanceCenter";
import { LiveSessionEmailPanel } from "@/components/admin/live-sessions/LiveSessionEmailPanel";
import { LiveSessionOccurrenceTimeline } from "@/components/admin/live-sessions/LiveSessionOccurrenceTimeline";
import { GoogleMeetParticipantsSection } from "@/components/admin/live-sessions/GoogleMeetParticipantsSection";
import { LiveSessionTranscriptSection } from "@/components/admin/live-sessions/LiveSessionTranscriptSection";
import { WebinarInvitationsSection } from "@/components/admin/live-sessions/WebinarInvitationsSection";
import { WebinarEmailSection } from "@/components/admin/live-sessions/WebinarEmailSection";
import { LiveSessionFeedbackSection } from "@/components/admin/live-sessions/LiveSessionFeedbackSection";
import { LiveSessionNoticeDialog } from "@/components/admin/live-sessions/LiveSessionNoticeDialog";
import { RecordingPlayerDialog } from "@/components/live-sessions/RecordingPlayerDialog";
import { StudyMaterialManager } from "@/components/live-sessions/StudyMaterialManager";
import { EditWebinarDialog } from "@/components/admin/live-sessions/EditWebinarDialog";
import { EditSessionDialog } from "@/components/admin/live-sessions/EditSessionDialog";
import { getAxiosErrorDetail } from "@/lib/utils/api-error";
import { formatSessionTime } from "@/lib/utils/session-time";

function formatDateTime(s?: string | null, timezone?: string | null) {
  return formatSessionTime(s, timezone);
}

function platformIcon(a: LiveActivity): string {
  if (a.is_google_meet) return "mdi:google";
  if (a.zoom_meeting_type === "webinar") return "mdi:presentation";
  return "mdi:video-outline";
}

export default function LiveSessionDetailPage() {
  const { t } = useTranslation("common");
  const router = useRouter();
  const params = useParams();
  const { showToast } = useToast();
  const { user, loading: authLoading } = useAuth();
  const canAccessAdmin = canAccessAdminArea(user?.role);

  const liveClassId = Number(params?.liveClassId);
  // Fetch the host link at CLICK time. The zoom_start_url on the row embeds a token that expires
  // two hours after the MEETING was created, not two hours before the class — so for anything
  // scheduled ahead it is dead before anyone presses this. Measured on one tenant: five sessions,
  // five expired tokens, the oldest three weeks old.
  //
  // The tab opens synchronously and is redirected afterwards. Opening it after the await would sit
  // outside the user gesture, which browsers block as a popup — the button would appear to do
  // nothing, which is worse than the stale link it replaces.
  const handleStart = useCallback(async () => {
    const tab = window.open("", "_blank");
    try {
      const res = await adminLiveActivitiesService.hostLink(liveClassId);
      const url = res.data?.url;
      if (!url) throw new Error("no host link");
      if (tab) tab.location.href = url;
      else window.open(url, "_blank");
    } catch (e) {
      tab?.close();
      showToast(
        getAxiosErrorDetail(
          e,
          t("adminLiveSessions.startFailed", "Couldn't get a host link from Zoom. Try again in a moment."),
        ),
        "error",
      );
    }
  }, [liveClassId, showToast, t]);

  const [activity, setActivity] = useState<LiveActivity | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [tab, setTab] = useState(0);
  const [webhookConfigured, setWebhookConfigured] = useState(false);

  const [endConfirmOpen, setEndConfirmOpen] = useState(false);
  const [endingMeeting, setEndingMeeting] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deletingWebinar, setDeletingWebinar] = useState(false);
  const [deleteSessionConfirmOpen, setDeleteSessionConfirmOpen] = useState(false);
  const [noticeOpen, setNoticeOpen] = useState(false);
  const [deletingSession, setDeletingSession] = useState(false);
  const [syncingRecording, setSyncingRecording] = useState(false);
  const [playerOpen, setPlayerOpen] = useState(false);
  // Which DATE of a recurring series the player streams; null = the series-level recording.
  const [playerOccurrenceId, setPlayerOccurrenceId] = useState<number | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [editSessionOpen, setEditSessionOpen] = useState(false);
  const [addDateOpen, setAddDateOpen] = useState(false);
  // Bumped when a date is added so a MOUNTED Timeline tab refetches (it otherwise loads once).
  const [timelineRefresh, setTimelineRefresh] = useState(0);
  const [creatingGoogle, setCreatingGoogle] = useState(false);
  const [updatingGoogle, setUpdatingGoogle] = useState(false);
  const [cancellingGoogle, setCancellingGoogle] = useState(false);
  const [cancelGoogleConfirmOpen, setCancelGoogleConfirmOpen] = useState(false);

  const load = useCallback(async () => {
    if (!Number.isFinite(liveClassId)) return;
    try {
      const data = await adminLiveActivitiesService.getLiveActivity(liveClassId);
      setActivity(data);
    } catch (error: unknown) {
      if ((error as { response?: { status?: number } })?.response?.status === 404) {
        setNotFound(true);
      } else {
        showToast(getLiveSessionErrorMessage(error, "session_detail"), "error");
      }
    } finally {
      setLoading(false);
    }
  }, [liveClassId, showToast]);

  useEffect(() => {
    if (!authLoading && !canAccessAdmin) {
      router.replace("/dashboard");
      return;
    }
    if (canAccessAdmin) void load();
  }, [authLoading, canAccessAdmin, load, router]);

  // Fetch the webhook-configured flag (controls whether a manual "End meeting" button shows).
  useEffect(() => {
    zoomService
      .getZoomCredentials()
      .then((data) => setWebhookConfigured(Boolean(data?.webhook_configured)))
      .catch(() => {});
  }, []);

  // Poll Zoom status while live so the page reflects the meeting ending.
  useEffect(() => {
    if (activity?.meeting_status !== "live" || activity?.is_google_meet) return;
    const interval = setInterval(async () => {
      try {
        const status = await adminLiveActivitiesService.getZoomStatus(liveClassId);
        if (status.meeting_status === "ended" || status.meeting_status === "expired") void load();
      } catch {
        /* transient poll error - ignore */
      }
    }, 45000);
    return () => clearInterval(interval);
  }, [activity?.meeting_status, activity?.is_google_meet, liveClassId, load]);

  const handleEndMeeting = async () => {
    setEndConfirmOpen(false);
    try {
      setEndingMeeting(true);
      const result = await adminLiveActivitiesService.endMeeting(liveClassId);
      if (result.status === "error") {
        showToast(getZoomApiErrorMessage(result.message) || t("adminLiveSessions.endMeetingFailed", "Failed to end meeting"), "error");
        return;
      }
      showToast(result.message || t("adminLiveSessions.meetingEnded", "Meeting ended"), "success");
      await load();
    } catch (error: unknown) {
      showToast(getLiveSessionErrorMessage(error), "error");
    } finally {
      setEndingMeeting(false);
    }
  };

  const handleDeleteWebinar = async () => {
    setDeleteConfirmOpen(false);
    try {
      setDeletingWebinar(true);
      const result = await adminLiveActivitiesService.deleteWebinar(liveClassId);
      if (result.status === "error") {
        showToast(getZoomApiErrorMessage(result.message) || t("adminLiveSessions.deleteWebinarFailed", "Failed to delete webinar"), "error");
        return;
      }
      showToast(result.message || t("adminLiveSessions.webinarDeleted", "Webinar deleted"), "success");
      await load();
    } catch (error: unknown) {
      showToast(getLiveSessionErrorMessage(error), "error");
    } finally {
      setDeletingWebinar(false);
    }
  };

  const handleDeleteSession = async () => {
    setDeleteSessionConfirmOpen(false);
    try {
      setDeletingSession(true);
      const result = await adminLiveActivitiesService.deleteLiveActivity(liveClassId);
      if (result.status === "error") {
        showToast(getZoomApiErrorMessage(result.message) || t("adminLiveSessions.deleteSessionFailed", "Failed to delete session"), "error");
        return;
      }
      const warnings = result.data?.warnings ?? [];
      showToast(
        warnings.length
          ? `${result.message || t("adminLiveSessions.sessionDeleted", "Session deleted")} ${warnings.join(" ")}`
          : result.message || t("adminLiveSessions.sessionDeleted", "Session deleted"),
        warnings.length ? "warning" : "success"
      );
      router.push("/admin/live-sessions");
    } catch (error: unknown) {
      showToast(getLiveSessionErrorMessage(error), "error");
    } finally {
      setDeletingSession(false);
    }
  };

  const handleSyncRecording = async () => {
    try {
      setSyncingRecording(true);
      const result = await adminLiveActivitiesService.syncRecording(liveClassId);
      if (result.status === "error") {
        const msg = getZoomApiErrorMessage(result.message, "sync_recording");
        showToast(msg === RECORDING_PROCESSING_MESSAGE ? msg : msg || t("adminLiveSessions.syncRecordingFailed", "Failed to sync recording"), msg === RECORDING_PROCESSING_MESSAGE ? "info" : "error");
        return;
      }
      const stillProcessing =
        result.message && (result.message.toLowerCase().includes("processing") || result.message.toLowerCase().includes("still"));
      showToast(stillProcessing ? RECORDING_PROCESSING_MESSAGE : result.message || t("adminLiveSessions.recordingSynced", "Recording synced"), stillProcessing ? "info" : "success");
      await load();
    } catch (error: unknown) {
      const msg = getLiveSessionErrorMessage(error, "sync_recording");
      showToast(msg === RECORDING_PROCESSING_MESSAGE ? msg : msg || t("adminLiveSessions.syncRecordingFailed", "Failed to sync recording"), msg === RECORDING_PROCESSING_MESSAGE ? "info" : "error");
    } finally {
      setSyncingRecording(false);
    }
  };

  const handleCreateGoogleMeet = async () => {
    try {
      setCreatingGoogle(true);
      const result = await adminLiveActivitiesService.createGoogleMeet(liveClassId);
      if (result.status === "error") {
        showToast(result.message || t("adminLiveSessions.googleCreateFailed", "Failed to create Google Meet"), "error");
        return;
      }
      showToast(t("adminLiveSessions.googleMeetCreated", "Google Meet created"), "success");
      await load();
    } catch (error: unknown) {
      showToast(getLiveSessionErrorMessage(error), "error");
    } finally {
      setCreatingGoogle(false);
    }
  };

  const handleUpdateGoogleMeet = async () => {
    try {
      setUpdatingGoogle(true);
      const result = await adminLiveActivitiesService.updateGoogleMeet(liveClassId);
      if (result.status === "error") {
        showToast(result.message || t("adminLiveSessions.googleUpdateFailed", "Failed to update Google Meet"), "error");
        return;
      }
      showToast(t("adminLiveSessions.googleMeetUpdated", "Google Meet updated"), "success");
      await load();
    } catch (error: unknown) {
      showToast(getLiveSessionErrorMessage(error), "error");
    } finally {
      setUpdatingGoogle(false);
    }
  };

  const handleCancelGoogleMeet = async () => {
    try {
      setCancellingGoogle(true);
      const result = await adminLiveActivitiesService.cancelGoogleMeet(liveClassId);
      if (result.status === "error") {
        showToast(result.message || t("adminLiveSessions.googleCancelFailed", "Failed to cancel Google Meet"), "error");
        return;
      }
      showToast(t("adminLiveSessions.googleMeetCancelled", "Google Meet cancelled"), "success");
      setCancelGoogleConfirmOpen(false);
      await load();
    } catch (error: unknown) {
      showToast(getLiveSessionErrorMessage(error), "error");
    } finally {
      setCancellingGoogle(false);
    }
  };

  const copyPasscode = (pwd: string) => {
    navigator.clipboard.writeText(pwd).then(
      () => showToast(t("liveSessions.passwordCopied", "Passcode copied"), "success"),
      () => showToast(t("adminLiveSessions.failedToCopy", "Failed to copy"), "error")
    );
  };

  const isZoom = Boolean(activity?.is_zoom);
  const isWebinar = isZoom && activity?.zoom_meeting_type === "webinar" && Boolean(activity?.zoom_meeting_id);
  const isRecurring = Boolean(activity?.zoom_is_recurring);
  const isCancelled = activity?.zoom_status === "cancelled";
  // Platform-created Google Meet (vs a manually pasted link) - can be synced/cancelled via the API.
  const isPlatformGoogle = Boolean(activity?.is_google_meet && activity?.google_source === "platform" && activity?.google_event_id);
  // A platform Google session whose Calendar event was never minted (e.g. provisioning failed
  // mid-create) - offer a retry so it's never a dead end.
  const isGoogleOrphan = Boolean(activity?.is_google_meet && activity?.google_source === "platform" && !activity?.google_event_id && !activity?.is_zoom);
  const isGoogleCancelled = activity?.google_status === "cancelled";
  const scheduledOrLive = activity?.meeting_status === "scheduled" || activity?.meeting_status === "live";
  const hasRecording = Boolean(
    activity?.zoom_recording_url?.trim()
    || (activity as { google_recording_url?: string } | null)?.google_recording_url
    || (activity as { has_recording?: boolean } | null)?.has_recording
  );

  const isGoogleMeet = Boolean(activity?.is_google_meet);
  // A recurring series' dates, oldest first - the Recording tab lists each inline with its own
  // Play (the series-level player can only stream the series-latest file).
  const recordingDates = useMemo(
    () =>
      isRecurring
        ? [...(activity?.occurrences ?? [])].sort((a, b) =>
            (a.occurrence_datetime || "").localeCompare(b.occurrence_datetime || "")
          )
        : [],
    [isRecurring, activity?.occurrences]
  );
  const tabs = useMemo(() => {
    const overview = { key: "overview", icon: "mdi:information-outline", label: t("adminLiveSessions.tabOverview", "Overview") };
    // Study material is platform state, not provider state — every session type gets this tab,
    // including a pasted-link session whose only other tab is Overview.
    const materials = { key: "materials", icon: "mdi:paperclip", label: t("adminLiveSessions.tabMaterials", "Study material") };
    const recording = { key: "recording", icon: "mdi:play-circle-outline", label: t("adminLiveSessions.tabRecording", "Recording") };
    const transcript = { key: "transcript", icon: "mdi:text-box-outline", label: t("adminLiveSessions.tabTranscript", "Transcript") };
    // Google Meet sessions get the artifact tabs too (recording/transcript come from the Meet
    // artifact poller), plus a Participants tab - the roster is synced post-meeting from the Meet
    // REST API (conferenceRecords.participants), so no manual-sync affordance like Zoom's.
    if (isGoogleMeet)
      return [
        overview,
        { key: "participants", icon: "mdi:account-group-outline", label: t("adminLiveSessions.tabParticipants", "Participants") },
        materials,
        recording,
        transcript,
      ];
    if (!isZoom) return [overview, materials];
    const base = [
      overview,
      { key: "attendance", icon: "mdi:account-group-outline", label: t("adminLiveSessions.tabAttendance", "Attendance") },
      // Recurring series get a per-occurrence Timeline: each date, who joined it, its recording.
      ...(isRecurring
        ? [{ key: "timeline", icon: "mdi:calendar-multiselect", label: t("adminLiveSessions.tabTimeline", "Timeline") }]
        : []),
      materials,
      recording,
      transcript,
    ];
    return isWebinar
      ? [...base, { key: "invitations", icon: "mdi:email-outline", label: t("adminLiveSessions.tabInvitations", "Invitations") }, { key: "emails", icon: "mdi:email-fast-outline", label: t("adminLiveSessions.tabEmail", "Email") }]
      : base;
  }, [isZoom, isGoogleMeet, isWebinar, isRecurring, t]);

  // Feedback applies to every session kind, so it is appended after the provider-specific set
  // rather than folded into any one branch.
  const tabsWithFeedback = useMemo(
    () => [...tabs, { key: "feedback", icon: "mdi:comment-quote-outline", label: t("adminLiveSessions.tabFeedback", "Feedback") }],
    [tabs, t],
  );
  const tabKey = tabsWithFeedback[tab]?.key ?? "overview";

  const backButton = (
    <ButtonBase
      onClick={() => router.push("/admin/live-sessions")}
      sx={{
        px: 2.25, py: 1, borderRadius: 999, fontWeight: 700, fontSize: "0.82rem",
        color: "var(--font-secondary)", display: "inline-flex", alignItems: "center", gap: 0.5,
        border: "1px solid color-mix(in srgb, var(--border-default) 80%, transparent)",
      }}
    >
      <IconWrapper icon="mdi:arrow-left" size={16} />
      {t("adminLiveSessions.backToList", "Back to list")}
    </ButtonBase>
  );

  // Delete the whole session (removes the local record + best-effort cleans up the Zoom/Google
  // object). Always available so a session that failed to provision - no Zoom link, previously
  // impossible to remove - can be deleted.
  const deleteSessionButton = (
    <ButtonBase
      onClick={() => setDeleteSessionConfirmOpen(true)}
      disabled={deletingSession}
      sx={{
        px: 2.25, py: 1, borderRadius: 999, fontWeight: 700, fontSize: "0.82rem",
        color: "var(--error-500)", display: "inline-flex", alignItems: "center", gap: 0.5,
        border: "1px solid color-mix(in srgb, var(--error-500) 35%, transparent)",
        "&:hover": { background: "color-mix(in srgb, var(--error-500) 8%, transparent)" },
      }}
    >
      <IconWrapper icon="mdi:trash-can-outline" size={16} />
      {deletingSession ? t("adminLiveSessions.deleting", "Deleting…") : t("adminLiveSessions.deleteSession", "Delete")}
    </ButtonBase>
  );
  // Calling a class off is NOT the same as deleting it: the session (and its history, recordings and
  // attendance) stays, students just get told why it isn't happening. Sits next to Delete so the
  // gentler action is the one an admin reaches first.
  const noticeButton = (
    <ButtonBase
      onClick={() => setNoticeOpen(true)}
      sx={{
        px: 2.25, py: 1, borderRadius: 999, fontWeight: 700, fontSize: "0.82rem",
        color: activity?.notice_type ? "var(--warning-500)" : "var(--font-secondary)",
        display: "inline-flex", alignItems: "center", gap: 0.5,
        border: "1px solid",
        borderColor: activity?.notice_type
          ? "color-mix(in srgb, var(--warning-500) 45%, transparent)"
          : "var(--border-default)",
        "&:hover": { background: "color-mix(in srgb, var(--warning-500) 8%, transparent)" },
      }}
    >
      <IconWrapper icon="mdi:calendar-alert" size={16} />
      {activity?.notice_type
        ? t("adminLiveSessions.editNotice", "Edit notice")
        : t("adminLiveSessions.cancelOrReschedule", "Cancel / Reschedule")}
    </ButtonBase>
  );
  // Always available, for every provider and state - before this, only webinars-while-scheduled
  // had any Edit, so a plain meeting's typo'd topic or wrong trainer was stuck until recreation.
  const editSessionButton = (
    <ButtonBase
      onClick={() => setEditSessionOpen(true)}
      sx={{
        px: 2.25, py: 1, borderRadius: 999, fontWeight: 700, fontSize: "0.82rem",
        color: "var(--accent-indigo)", display: "inline-flex", alignItems: "center", gap: 0.5,
        border: "1px solid color-mix(in srgb, var(--accent-indigo) 35%, transparent)",
        "&:hover": { background: "color-mix(in srgb, var(--accent-indigo) 8%, transparent)" },
      }}
    >
      <IconWrapper icon="mdi:pencil-outline" size={16} />
      {t("adminLiveSessions.editSession", "Edit session")}
    </ButtonBase>
  );
  // Wise-parity "Add session": Zoom cannot grow a series ad-hoc, so an extra date is a linked
  // SINGLE session with the same topic/audience/trainer, provisioned right here.
  const addDateButton = isRecurring && isZoom && !isCancelled ? (
    <ButtonBase
      onClick={() => setAddDateOpen(true)}
      sx={{
        px: 2.25, py: 1, borderRadius: 999, fontWeight: 700, fontSize: "0.82rem",
        color: "var(--success-500)", display: "inline-flex", alignItems: "center", gap: 0.5,
        border: "1px solid color-mix(in srgb, var(--success-500) 35%, transparent)",
        "&:hover": { background: "color-mix(in srgb, var(--success-500) 8%, transparent)" },
      }}
    >
      <IconWrapper icon="mdi:calendar-plus" size={16} />
      {t("adminLiveSessions.addADate", "Add a date")}
    </ButtonBase>
  ) : null;
  const headerActions = (
    <Box sx={{ display: "flex", gap: 1, alignItems: "center", flexWrap: "wrap" }}>
      {addDateButton}
      {editSessionButton}
      {noticeButton}
      {deleteSessionButton}
      {backButton}
    </Box>
  );

  if (!authLoading && !canAccessAdmin) return null;

  return (
    <MainLayout fullWidthContent>
      <Container maxWidth="xl" sx={{ py: { xs: 3, md: 5 } }}>
        <AdaptiveSectionShell meshOpacity={0.3}>
          {loading && !activity ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
              <CircularProgress />
            </Box>
          ) : notFound || !activity ? (
            <Box sx={{ textAlign: "center", py: 8 }}>
              <Typography sx={{ color: "var(--font-secondary)", mb: 2 }}>
                {t("adminLiveSessions.sessionNotFound", "This session could not be found.")}
              </Typography>
              {backButton}
            </Box>
          ) : (
            <>
              <AdaptiveSectionHero
                chapter={t("adminLiveSessions.chapter", "Manage · Live Sessions")}
                title={activity.topic_name || t("adminLiveSessions.untitledSession", "Untitled session")}
                subtitle={`${formatDateTime(activity.class_datetime, activity.timezone)} · ${activity.duration_minutes} ${t("liveSessions.minShort", "min")}${activity.course_detail?.title ? ` · ${activity.course_detail.title}` : ""}${activity.cohort_detail?.name ? ` · 👥 ${activity.cohort_detail.name}` : ""}`}
                accent="indigo"
                icon={platformIcon(activity)}
                rightSlot={headerActions}
              />

              <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
                <Box sx={{ display: "flex", gap: 0.75, flexWrap: "wrap" }}>
                  <MeetingStatusChip status={activity.meeting_status} cancelled={isCancelled} />
                  <PlatformChip isZoom={activity.is_zoom} isGoogleMeet={activity.is_google_meet} zoomMeetingType={activity.zoom_meeting_type} />
                </Box>

                {isCancelled && (
                  <InfoCallout icon="mdi:cancel" color="var(--error-500)">
                    {t("adminLiveSessions.cancelledInZoom", "This webinar was cancelled in Zoom.")}
                  </InfoCallout>
                )}

                <Tabs
                  value={tab}
                  onChange={(_, v) => setTab(v)}
                  variant="scrollable"
                  scrollButtons="auto"
                  sx={{
                    minHeight: 40,
                    "& .MuiTab-root": { minHeight: 40, textTransform: "none", fontWeight: 700, fontSize: "0.82rem", color: "var(--font-secondary)" },
                    "& .Mui-selected": { color: "var(--accent-indigo) !important" },
                    "& .MuiTabs-indicator": { backgroundColor: "var(--accent-indigo)" },
                  }}
                >
                  {tabsWithFeedback.map((tb, i) => (
                    <Tab key={i} iconPosition="start" icon={<IconWrapper icon={tb.icon} size={17} />} label={tb.label} />
                  ))}
                </Tabs>

                {/* Overview */}
                {tab === 0 && (
                  <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                    <SectionCard title={t("adminLiveSessions.meetingControls", "Meeting controls")} icon="mdi:video-outline">
                      <Box sx={{ display: "flex", gap: 1.25, flexWrap: "wrap", alignItems: "center" }}>
                        {isGoogleOrphan && scheduledOrLive && (
                          <ControlButton icon="mdi:google" label={t("adminLiveSessions.createGoogleMeet", "Create Google Meet")} tone="primary" loading={creatingGoogle} onClick={handleCreateGoogleMeet} />
                        )}
                        {scheduledOrLive && activity.is_google_meet && !isGoogleCancelled && activity.join_link?.trim() && (
                          <ControlButton icon="mdi:video" label={t("adminLiveSessions.openGoogleMeet")} tone="success" onClick={() => window.open(activity.join_link!.trim(), "_blank")} />
                        )}
                        {isPlatformGoogle && scheduledOrLive && !isGoogleCancelled && (
                          <ControlButton icon="mdi:calendar-sync" label={t("adminLiveSessions.syncGoogleMeet", "Sync to Google")} tone="outline" loading={updatingGoogle} onClick={handleUpdateGoogleMeet} />
                        )}
                        {isPlatformGoogle && scheduledOrLive && !isGoogleCancelled && (
                          <ControlButton icon="mdi:calendar-remove" label={t("adminLiveSessions.cancelGoogleMeet", "Cancel Meet")} tone="danger" loading={cancellingGoogle} onClick={() => setCancelGoogleConfirmOpen(true)} />
                        )}
                        {isPlatformGoogle && isGoogleCancelled && (
                          <Typography variant="body2" sx={{ color: "var(--font-tertiary)", fontStyle: "italic" }}>
                            {t("adminLiveSessions.googleMeetCancelledNote", "This Google Meet was cancelled.")}
                          </Typography>
                        )}
                        {scheduledOrLive && activity.zoom_start_url && (
                          <ControlButton icon="mdi:video" label={t("adminLiveSessions.startMeeting", "Start session")} tone="primary" onClick={handleStart} />
                        )}
                        {scheduledOrLive && activity.zoom_join_url && (
                          <ControlButton icon="mdi:link-variant" label={t("adminLiveSessions.openJoinLink", "Join link")} tone="outline" onClick={() => window.open(activity.zoom_join_url!, "_blank")} />
                        )}
                        {isWebinar && scheduledOrLive && !isCancelled && (
                          <ControlButton icon="mdi:pencil-outline" label={t("adminLiveSessions.editWebinar", "Edit webinar")} tone="outline" onClick={() => setEditOpen(true)} />
                        )}
                        {activity.meeting_status === "live" && !webhookConfigured && !activity.is_google_meet && (
                          <ControlButton icon="mdi:video-off" label={t("adminLiveSessions.endMeeting", "End meeting")} tone="danger" loading={endingMeeting} onClick={() => setEndConfirmOpen(true)} />
                        )}
                        {isWebinar && scheduledOrLive && !isCancelled && (
                          <ControlButton icon="mdi:trash-can-outline" label={t("adminLiveSessions.deleteWebinar", "Delete webinar")} tone="danger" loading={deletingWebinar} onClick={() => setDeleteConfirmOpen(true)} />
                        )}
                      </Box>

                      {activity.zoom_password && (
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mt: 1.5 }}>
                          <Typography variant="body2" sx={{ color: "var(--font-secondary)" }}>
                            {t("liveSessions.password")}: <strong style={{ letterSpacing: 1 }}>{activity.zoom_password}</strong>
                          </Typography>
                          <Tooltip title={t("liveSessions.copy", "Copy")}>
                            <IconButton size="small" onClick={() => copyPasscode(activity.zoom_password!)}>
                              <IconWrapper icon="mdi:content-copy" size={16} />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      )}

                      {!scheduledOrLive && !activity.zoom_password && (
                        <Typography variant="body2" sx={{ color: "var(--font-tertiary)" }}>
                          {t("adminLiveSessions.sessionFinished", "This session has finished.")}
                        </Typography>
                      )}
                    </SectionCard>

                    {Boolean((activity as { description?: string }).description?.trim()) && (
                      <SectionCard title={t("adminLiveSessions.description", "Description")} icon="mdi:text-long">
                        <Typography variant="body2" sx={{ color: "var(--font-secondary)", whiteSpace: "pre-wrap" }}>
                          {(activity as { description?: string }).description}
                        </Typography>
                      </SectionCard>
                    )}

                    {/* Admit-control status (Google Meet) */}
                    {isGoogleMeet && activity.google_admit_control_enabled && (
                      <InfoCallout icon="mdi:shield-account-outline">
                        {t("adminLiveSessions.admitOn", "Host-admit is on - people with the link must be let in by a host. Make sure a host or co-host is present to admit them.")}
                      </InfoCallout>
                    )}

                    {/* Same-org instructor: as an invitee they can already admit lobby knockers
                        (Google grants admit to any in-org participant when moderation is off) - no setup. */}
                    {isGoogleMeet && activity.google_instructor_cohost_state === "invitee_can_admit" && (
                      <InfoCallout icon="mdi:account-check-outline">
                        {t("adminLiveSessions.instructorCanAdmit", "{{email}} is in your organization, so they can let people in from the lobby directly - no extra setup. Just make sure they join the meeting.", { email: activity.instructor_email || t("adminLiveSessions.theInstructor", "the instructor") })}
                      </InfoCallout>
                    )}

                    {/* External/out-of-org instructor: being invited does NOT let them admit - Google
                        requires a manual "Add co-hosts" in the calendar event (or an in-org instructor). */}
                    {isGoogleMeet && activity.google_instructor_cohost_state === "manual_pending" && (
                      <SectionCard title={t("adminLiveSessions.finishCohostTitle", "Finish setup: let the instructor admit people")} icon="mdi:account-key-outline">
                        <Typography variant="body2" sx={{ color: "var(--font-secondary)", mb: 1 }}>
                          {t("adminLiveSessions.finishCohostBody", "{{email}} is invited, but they're outside your Google Workspace, so being invited doesn't let them admit people. Make them a Meet co-host in the calendar event (or use an instructor in your organization, who can admit without this step):", { email: activity.instructor_email || t("adminLiveSessions.theInstructor", "the instructor") })}
                        </Typography>
                        <Box component="ol" sx={{ m: 0, pl: 2.5, mb: 1.5 }}>
                          <Box component="li" sx={{ color: "var(--font-secondary)", fontSize: "0.85rem", mb: 0.5 }}>
                            {t("adminLiveSessions.finishCohostStep1", "Open the calendar event (button below).")}
                          </Box>
                          <Box component="li" sx={{ color: "var(--font-secondary)", fontSize: "0.85rem", mb: 0.5 }}>
                            {t("adminLiveSessions.finishCohostStep2", "Click the settings gear → “Meet” → turn on “Host management”, then “Add co-hosts”.")}
                          </Box>
                          <Box component="li" sx={{ color: "var(--font-secondary)", fontSize: "0.85rem" }}>
                            {t("adminLiveSessions.finishCohostStep3", "Add the instructor and Save. For a recurring series this sticks - you only do it once.")}
                          </Box>
                        </Box>
                        {activity.google_html_link && (
                          <ControlButton
                            icon="mdi:open-in-new"
                            label={t("adminLiveSessions.openCalendarEvent", "Open calendar event")}
                            tone="outline"
                            onClick={() => window.open(activity.google_html_link!, "_blank", "noopener")}
                          />
                        )}
                      </SectionCard>
                    )}

                    {(isZoom || isGoogleMeet) && (
                      <InfoCallout icon="mdi:lightbulb-on-outline">
                        {isZoom
                          ? t("adminLiveSessions.overviewHint", "Attendance, recording and transcript appear in their tabs automatically once the meeting ends - or you can sync them manually.")
                          : t("adminLiveSessions.overviewHintGoogle", "Recording and transcript appear in their tabs automatically after the meeting ends, when the host recorded it (Google Workspace).")}
                      </InfoCallout>
                    )}
                  </Box>
                )}

                {/* Attendance (Zoom): the Attendance Center replaces the four stacked tables
                    (roster / staff / every-night's-unmatched union / raw dump) with one
                    date-scoped roster + identification queue. The Timeline tab remains the
                    week-by-week history view. Invites live in the email panel above. */}
                {tabKey === "attendance" && (
                  <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                    <SectionCard><LiveSessionEmailPanel liveClassId={activity.id} meetingStatus={activity.meeting_status ?? null} /></SectionCard>
                    <SectionCard>
                      <AttendanceCenter
                        liveClassId={activity.id}
                        isRecurring={isRecurring}
                        occurrences={activity.occurrences ?? null}
                        meetingStatus={activity.meeting_status ?? null}
                        cohortName={activity.cohort_detail?.name ?? null}
                      />
                    </SectionCard>
                  </Box>
                )}

                {tabKey === "materials" && (
                  <SectionCard><StudyMaterialManager liveClassId={activity.id} /></SectionCard>
                )}

                {/* Timeline (recurring Zoom) - per-occurrence date + who joined it + its recording */}
                {tabKey === "timeline" && (
                  <SectionCard>
                    <LiveSessionOccurrenceTimeline
                      key={timelineRefresh}
                      liveClassId={activity.id}
                      seriesTitle={activity.topic_name}
                      timezone={activity.timezone}
                      // In-platform, like the Recording tab: the timeline used to hand the row's
                      // recording_url to window.open, which is Zoom's HTML share page.
                      onPlayOccurrence={(occ) => { setPlayerOccurrenceId(occ.id); setPlayerOpen(true); }}
                      onChanged={() => void load()}
                    />
                  </SectionCard>
                )}

                {/* Participants (Google Meet) - synced post-meeting from the Meet REST API */}
                {tabKey === "participants" && (
                  <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                    <SectionCard><LiveSessionEmailPanel liveClassId={activity.id} meetingStatus={activity.meeting_status ?? null} /></SectionCard>
                    <SectionCard><GoogleMeetParticipantsSection liveClassId={activity.id} /></SectionCard>
                  </Box>
                )}

                {/* Recording */}
                {tabKey === "recording" && (
                  <SectionCard title={t("adminLiveSessions.recording", "Recording")} icon="mdi:play-circle-outline">
                    {/* A recurring series has one recording PER DATE - asking by the series id
                        resolves to the series-latest file, matching none of the dates - so each
                        date lists inline with its own Play, wired through the occurrence-
                        parameterized playback flow. */}
                    {recordingDates.length > 0 && (
                      <Box sx={{ display: "flex", flexDirection: "column", gap: 1, mb: 1.5 }}>
                        {recordingDates.map((o) => (
                          <Box
                            key={o.id}
                            sx={{
                              display: "flex", alignItems: "center", gap: 1.25, flexWrap: "wrap",
                              p: 1.25, borderRadius: 2, border: "1px solid var(--border-default)", bgcolor: "var(--surface)",
                            }}
                          >
                            <Box sx={{ flex: 1, minWidth: 200 }}>
                              <Typography sx={{ fontWeight: 700, fontSize: "0.88rem", color: "var(--font-primary)" }}>
                                {formatDateTime(o.occurrence_datetime, activity.timezone)}
                              </Typography>
                              <Typography variant="caption" sx={{ color: "var(--font-secondary)" }}>
                                {(o.topic_name?.trim() || activity.topic_name)} · {o.duration_minutes}m
                              </Typography>
                            </Box>
                            <MeetingStatusChip status={o.meeting_status} />
                            {o.has_recording ? (
                              <ControlButton
                                icon="mdi:play"
                                label={t("adminLiveSessions.playRecording", "Play recording")}
                                tone="primary"
                                onClick={() => { setPlayerOccurrenceId(o.id); setPlayerOpen(true); }}
                              />
                            ) : (
                              <Typography variant="caption" sx={{ color: "var(--font-tertiary)" }}>
                                {t("adminLiveSessions.noRecordingForDate", "No recording")}
                              </Typography>
                            )}
                          </Box>
                        ))}
                      </Box>
                    )}
                    <Box sx={{ display: "flex", gap: 1.25, flexWrap: "wrap", alignItems: "center" }}>
                      {recordingDates.length === 0 && (hasRecording ? (
                        <ControlButton icon="mdi:play" label={t("adminLiveSessions.playRecording", "Play recording")} tone="primary" onClick={() => setPlayerOpen(true)} />
                      ) : (
                        <InfoCallout icon="mdi:cloud-clock-outline" color="var(--font-tertiary)">
                          {t("liveSessions.recordingNotAvailable")}
                        </InfoCallout>
                      ))}
                      {isZoom && (
                        <ControlButton icon="mdi:cloud-download" label={t("adminLiveSessions.syncRecording")} tone="outline" loading={syncingRecording} onClick={handleSyncRecording} />
                      )}
                      {isGoogleMeet && !hasRecording && (
                        <Typography variant="caption" sx={{ color: "var(--font-tertiary)", width: "100%" }}>
                          {t(
                            "adminLiveSessions.googleRecordingHint",
                            "Meet recordings appear here automatically after the session ends - the host must press Record in the meeting (requires Google Workspace)."
                          )}
                        </Typography>
                      )}
                    </Box>
                  </SectionCard>
                )}

                {/* Transcript. A recurring series stores transcripts per DATE, so it renders one
                    lazy row per occurrence instead of the single series view. */}
                {tabKey === "transcript" && (
                  <SectionCard>
                    <LiveSessionTranscriptSection
                      liveClassId={activity.id}
                      hasSummary={Boolean(activity.zoom_ai_summary?.trim() || (activity as { google_ai_summary?: string }).google_ai_summary?.trim())}
                      occurrences={isRecurring ? activity.occurrences ?? null : null}
                      timezone={activity.timezone}
                      seriesTitle={activity.topic_name}
                    />
                  </SectionCard>
                )}

                {tabKey === "feedback" && (
                  <SectionCard>
                    <LiveSessionFeedbackSection liveClassId={activity.id} />
                  </SectionCard>
                )}

                {/* Webinar management */}
                {tabKey === "invitations" && <WebinarInvitationsSection liveClassId={activity.id} />}
                {tabKey === "emails" && <WebinarEmailSection liveClassId={activity.id} editable={scheduledOrLive && !isCancelled} />}
              </Box>
            </>
          )}
        </AdaptiveSectionShell>
      </Container>

      <ConfirmDialog
        open={endConfirmOpen}
        title={t("adminLiveSessions.endMeetingConfirmTitle", "End this meeting?")}
        message={t("adminLiveSessions.endMeetingConfirmDesc", "This ends the live meeting for all participants.")}
        confirmText={endingMeeting ? t("adminLiveSessions.endingMeeting", "Ending…") : t("adminLiveSessions.endMeeting", "End meeting")}
        cancelText={t("adminLiveSessions.cancel", "Cancel")}
        confirmColor="error"
        onConfirm={() => void handleEndMeeting()}
        onCancel={() => setEndConfirmOpen(false)}
      />

      <ConfirmDialog
        open={deleteConfirmOpen}
        title={t("adminLiveSessions.deleteWebinarConfirmTitle", "Delete this webinar?")}
        message={t("adminLiveSessions.deleteWebinarConfirmDesc", "This deletes the webinar in Zoom and marks it cancelled here. Zoom notifies registrants. Any recording and attendance already synced are kept. This can't be undone.")}
        confirmText={deletingWebinar ? t("adminLiveSessions.deleting", "Deleting…") : t("adminLiveSessions.deleteWebinar", "Delete webinar")}
        cancelText={t("adminLiveSessions.cancel", "Cancel")}
        confirmColor="error"
        onConfirm={() => void handleDeleteWebinar()}
        onCancel={() => setDeleteConfirmOpen(false)}
      />

      <ConfirmDialog
        open={deleteSessionConfirmOpen}
        title={t("adminLiveSessions.deleteSessionConfirmTitle", "Delete this session?")}
        message={t("adminLiveSessions.deleteSessionConfirmDesc", "This permanently removes the session from the platform and deletes its Zoom meeting/webinar or Google Meet event if one exists. Synced recordings and attendance are removed too. This can't be undone.")}
        confirmText={deletingSession ? t("adminLiveSessions.deleting", "Deleting…") : t("adminLiveSessions.deleteSession", "Delete")}
        cancelText={t("adminLiveSessions.cancel", "Cancel")}
        confirmColor="error"
        onConfirm={() => void handleDeleteSession()}
        onCancel={() => setDeleteSessionConfirmOpen(false)}
      />
      <LiveSessionNoticeDialog
        open={noticeOpen}
        session={activity}
        onClose={() => setNoticeOpen(false)}
        onSaved={(msg) => { showToast(msg, "success"); load(); }}
      />

      <ConfirmDialog
        open={cancelGoogleConfirmOpen}
        title={t("adminLiveSessions.cancelGoogleConfirmTitle", "Cancel this Google Meet?")}
        message={t("adminLiveSessions.cancelGoogleConfirmDesc", "This deletes the event from Google Calendar and notifies attendees. The session stays here but is marked cancelled. This can't be undone.")}
        confirmText={cancellingGoogle ? t("adminLiveSessions.cancelling", "Cancelling…") : t("adminLiveSessions.cancelGoogleMeet", "Cancel Meet")}
        cancelText={t("adminLiveSessions.keepIt", "Keep it")}
        confirmColor="error"
        onConfirm={() => void handleCancelGoogleMeet()}
        onCancel={() => setCancelGoogleConfirmOpen(false)}
      />

      <RecordingPlayerDialog
        // Downloading a class recording is an admin act. Everyone else streams it.
        allowDownload={isClientOrgAdminRole(user?.role)}
        open={playerOpen}
        liveClassId={activity?.id ?? null}
        // The occurrence is what selects the clicked DATE's file - the series id alone streams
        // the series-latest recording, whichever row was clicked.
        occurrenceId={playerOccurrenceId}
        title={
          (playerOccurrenceId != null
            ? recordingDates.find((o) => o.id === playerOccurrenceId)?.topic_name?.trim()
            : undefined) || activity?.topic_name || undefined
        }
        onClose={() => { setPlayerOpen(false); setPlayerOccurrenceId(null); }}
      />

      {activity && isWebinar && (
        <EditWebinarDialog
          activity={activity}
          open={editOpen}
          onClose={() => setEditOpen(false)}
          onSaved={load}
        />
      )}

      {activity && (
        <EditSessionDialog
          activity={activity}
          open={editSessionOpen}
          onClose={() => setEditSessionOpen(false)}
          onSaved={load}
        />
      )}

      {activity && addDateOpen && (
        <AddDateDialog
          activity={activity}
          onClose={() => setAddDateOpen(false)}
          onAdded={() => {
            setAddDateOpen(false);
            showToast(t("adminLiveSessions.addDateDone", "Date added to the series."), "success");
            // Stay HERE: the date belongs to this series, so this page (occurrences + Timeline)
            // is where it appears. Navigating onto a separate session was the tenant's bug -
            // the series scattered and this page's controls "disappeared" with it.
            setTimelineRefresh((n) => n + 1);
            void load();
          }}
        />
      )}
    </MainLayout>
  );
}

/**
 * Add one extra date to THIS series. Zoom cannot grow a series ad-hoc, so the backend stores the
 * date as a LOCAL occurrence of the same session ("local-" zoom_occurrence_id) - students see it
 * like any other sitting, it lives on this page's timeline, and editing/cancelling it never
 * involves Zoom. Replaces the create-a-separate-single-session chain that scattered the series
 * across pages when a tenant tried it live.
 */
function AddDateDialog({ activity, onClose, onAdded }: {
  activity: LiveActivity;
  onClose: () => void;
  onAdded: () => void;
}) {
  const { t } = useTranslation("common");
  const { showToast } = useToast();
  const [when, setWhen] = useState("");
  const [duration, setDuration] = useState(activity.duration_minutes || 60);
  const [creating, setCreating] = useState(false);

  const valid = Boolean(when) && duration >= 1 && duration <= 480;

  const submit = async () => {
    if (!valid || creating) return;
    try {
      setCreating(true);
      await adminLiveActivitiesService.addOccurrence(activity.id, {
        occurrence_datetime: when,
        ...(activity.timezone ? { timezone: activity.timezone } : {}),
        duration_minutes: duration,
      });
      onAdded();
    } catch (e) {
      // 400 on non-recurring, and any refusal reason, in the server's own words.
      showToast(getAxiosErrorDetail(e, t("adminLiveSessions.addDateFailed", "Couldn't add this date.")), "error");
    } finally {
      setCreating(false);
    }
  };

  return (
    <Dialog open onClose={creating ? undefined : onClose} maxWidth="xs" fullWidth
      PaperProps={{ sx: { borderRadius: "18px", border: "1px solid var(--border-default)", backgroundColor: "var(--card-bg)", backgroundImage: "none" } }}>
      <DialogTitle sx={{ fontWeight: 700, fontSize: "1.02rem", color: "var(--font-primary)" }}>
        {t("adminLiveSessions.addADate", "Add a date")}
      </DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <Typography variant="body2" sx={{ color: "var(--font-secondary)" }}>
            {t(
              "adminLiveSessions.addADateHint",
              "Adds one extra date to this series. Students see it like any other sitting, and it appears on the timeline here."
            )}
          </Typography>
          <TextField
            label={t("adminLiveSessions.classDateAndTime", "Date and time")}
            type="datetime-local"
            value={when}
            onChange={(e) => setWhen(e.target.value)}
            fullWidth
            size="small"
            InputLabelProps={{ shrink: true }}
            helperText={t("adminLiveSessions.addDateTimeInZone", "Wall-clock time in {{zone}}.", {
              zone: activity.timezone || t("adminLiveSessions.theSessionZone", "the session's timezone"),
            })}
          />
          <TextField
            label={t("adminLiveSessions.durationMinutes", "Duration (minutes)")}
            type="number"
            value={duration}
            onChange={(e) => setDuration(Math.min(480, Math.max(1, Number(e.target.value) || 60)))}
            fullWidth
            size="small"
            inputProps={{ min: 1, max: 480 }}
          />
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} disabled={creating} sx={{ borderRadius: "12px", textTransform: "none", color: "var(--font-secondary)" }}>
          {t("adminLiveSessions.cancel", "Cancel")}
        </Button>
        <Button
          variant="contained"
          onClick={() => void submit()}
          disabled={!valid || creating}
          sx={{ borderRadius: "12px", textTransform: "none", fontWeight: 700, background: "var(--accent-indigo)", color: "#fff", "&:hover": { background: "var(--accent-indigo-dark)" } }}
        >
          {creating ? <CircularProgress size={20} color="inherit" /> : t("adminLiveSessions.addADate", "Add a date")}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

function ControlButton({
  icon,
  label,
  tone,
  loading,
  onClick,
}: {
  icon: string;
  label: string;
  tone: "primary" | "success" | "outline" | "danger";
  loading?: boolean;
  onClick: () => void;
}) {
  const styles: Record<string, object> = {
    primary: { color: "white", background: "linear-gradient(135deg, #6366f1 0%, #4338ca 100%)" },
    success: { color: "white", background: "linear-gradient(135deg, #10b981 0%, #047857 100%)" },
    outline: { color: "var(--font-primary)", border: "1px solid color-mix(in srgb, var(--border-default) 80%, transparent)" },
    danger: { color: "#ef4444", border: "1px solid color-mix(in srgb, #ef4444 35%, transparent)" },
  };
  return (
    <ButtonBase
      onClick={onClick}
      disabled={loading}
      sx={{
        px: 2, py: 1, borderRadius: 999, fontWeight: 800, fontSize: "0.82rem",
        display: "inline-flex", alignItems: "center", gap: 0.6,
        opacity: loading ? 0.7 : 1,
        ...styles[tone],
      }}
    >
      {loading ? <CircularProgress size={15} color="inherit" /> : <IconWrapper icon={icon} size={16} color={tone === "primary" || tone === "success" ? "#fff" : undefined} />}
      {label}
    </ButtonBase>
  );
}
