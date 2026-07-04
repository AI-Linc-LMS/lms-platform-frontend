"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import {
  Box,
  Container,
  Tabs,
  Tab,
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
import { LiveSessionRosterSection } from "@/components/admin/live-sessions/LiveSessionRosterSection";
import { ZoomAttendanceSection } from "@/components/admin/live-sessions/ZoomAttendanceSection";
import { GoogleMeetParticipantsSection } from "@/components/admin/live-sessions/GoogleMeetParticipantsSection";
import { LiveSessionTranscriptSection } from "@/components/admin/live-sessions/LiveSessionTranscriptSection";
import { WebinarInvitationsSection } from "@/components/admin/live-sessions/WebinarInvitationsSection";
import { WebinarEmailSection } from "@/components/admin/live-sessions/WebinarEmailSection";
import { RecordingPlayerDialog } from "@/components/live-sessions/RecordingPlayerDialog";
import { EditWebinarDialog } from "@/components/admin/live-sessions/EditWebinarDialog";

function formatDateTime(s?: string | null) {
  if (!s) return "—";
  return new Date(s).toLocaleString("en-US", {
    year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
  });
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

  const [activity, setActivity] = useState<LiveActivity | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [tab, setTab] = useState(0);
  const [webhookConfigured, setWebhookConfigured] = useState(false);

  const [endConfirmOpen, setEndConfirmOpen] = useState(false);
  const [endingMeeting, setEndingMeeting] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deletingWebinar, setDeletingWebinar] = useState(false);
  const [syncingRecording, setSyncingRecording] = useState(false);
  const [playerOpen, setPlayerOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
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
        /* transient poll error — ignore */
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
  const isCancelled = activity?.zoom_status === "cancelled";
  // Platform-created Google Meet (vs a manually pasted link) — can be synced/cancelled via the API.
  const isPlatformGoogle = Boolean(activity?.is_google_meet && activity?.google_source === "platform" && activity?.google_event_id);
  // A platform Google session whose Calendar event was never minted (e.g. provisioning failed
  // mid-create) — offer a retry so it's never a dead end.
  const isGoogleOrphan = Boolean(activity?.is_google_meet && activity?.google_source === "platform" && !activity?.google_event_id && !activity?.is_zoom);
  const isGoogleCancelled = activity?.google_status === "cancelled";
  const scheduledOrLive = activity?.meeting_status === "scheduled" || activity?.meeting_status === "live";
  const hasRecording = Boolean(
    activity?.zoom_recording_url?.trim()
    || (activity as { google_recording_url?: string } | null)?.google_recording_url
    || (activity as { has_recording?: boolean } | null)?.has_recording
  );

  const isGoogleMeet = Boolean(activity?.is_google_meet);
  const tabs = useMemo(() => {
    const overview = { key: "overview", icon: "mdi:information-outline", label: t("adminLiveSessions.tabOverview", "Overview") };
    const recording = { key: "recording", icon: "mdi:play-circle-outline", label: t("adminLiveSessions.tabRecording", "Recording") };
    const transcript = { key: "transcript", icon: "mdi:text-box-outline", label: t("adminLiveSessions.tabTranscript", "Transcript") };
    // Google Meet sessions get the artifact tabs too (recording/transcript come from the Meet
    // artifact poller), plus a Participants tab — the roster is synced post-meeting from the Meet
    // REST API (conferenceRecords.participants), so no manual-sync affordance like Zoom's.
    if (isGoogleMeet)
      return [
        overview,
        { key: "participants", icon: "mdi:account-group-outline", label: t("adminLiveSessions.tabParticipants", "Participants") },
        recording,
        transcript,
      ];
    if (!isZoom) return [overview];
    const base = [
      overview,
      { key: "attendance", icon: "mdi:account-group-outline", label: t("adminLiveSessions.tabAttendance", "Attendance") },
      recording,
      transcript,
    ];
    return isWebinar
      ? [...base, { key: "invitations", icon: "mdi:email-outline", label: t("adminLiveSessions.tabInvitations", "Invitations") }, { key: "emails", icon: "mdi:email-fast-outline", label: t("adminLiveSessions.tabEmail", "Email") }]
      : base;
  }, [isZoom, isGoogleMeet, isWebinar, t]);
  const tabKey = tabs[tab]?.key ?? "overview";

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

  if (!authLoading && !canAccessAdmin) return null;

  return (
    <MainLayout>
      <Container maxWidth="lg" sx={{ py: { xs: 3, md: 5 } }}>
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
                subtitle={`${formatDateTime(activity.class_datetime)} · ${activity.duration_minutes} ${t("liveSessions.minShort", "min")}${activity.course_detail?.title ? ` · ${activity.course_detail.title}` : ""}`}
                accent="indigo"
                icon={platformIcon(activity)}
                rightSlot={backButton}
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
                  {tabs.map((tb, i) => (
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
                          <ControlButton icon="mdi:video" label={t("adminLiveSessions.startMeeting", "Start session")} tone="primary" onClick={() => window.open(activity.zoom_start_url!, "_blank")} />
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
                        {t("adminLiveSessions.admitOn", "Host-admit is on — people with the link must be let in by a host. Make sure a host or co-host is present to admit them.")}
                      </InfoCallout>
                    )}

                    {/* Same-org instructor: as an invitee they can already admit lobby knockers
                        (Google grants admit to any in-org participant when moderation is off) — no setup. */}
                    {isGoogleMeet && activity.google_instructor_cohost_state === "invitee_can_admit" && (
                      <InfoCallout icon="mdi:account-check-outline">
                        {t("adminLiveSessions.instructorCanAdmit", "{{email}} is in your organization, so they can let people in from the lobby directly — no extra setup. Just make sure they join the meeting.", { email: activity.instructor_email || t("adminLiveSessions.theInstructor", "the instructor") })}
                      </InfoCallout>
                    )}

                    {/* External/out-of-org instructor: being invited does NOT let them admit — Google
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
                            {t("adminLiveSessions.finishCohostStep3", "Add the instructor and Save. For a recurring series this sticks — you only do it once.")}
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
                          ? t("adminLiveSessions.overviewHint", "Attendance, recording and transcript appear in their tabs automatically once the meeting ends — or you can sync them manually.")
                          : t("adminLiveSessions.overviewHintGoogle", "Recording and transcript appear in their tabs automatically after the meeting ends, when the host recorded it (Google Workspace).")}
                      </InfoCallout>
                    )}
                  </Box>
                )}

                {/* Attendance (Zoom) */}
                {tabKey === "attendance" && (
                  <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                    <SectionCard><LiveSessionRosterSection liveClassId={activity.id} /></SectionCard>
                    <SectionCard><ZoomAttendanceSection liveClassId={activity.id} /></SectionCard>
                  </Box>
                )}

                {/* Participants (Google Meet) — synced post-meeting from the Meet REST API */}
                {tabKey === "participants" && (
                  <SectionCard><GoogleMeetParticipantsSection liveClassId={activity.id} /></SectionCard>
                )}

                {/* Recording */}
                {tabKey === "recording" && (
                  <SectionCard title={t("adminLiveSessions.recording", "Recording")} icon="mdi:play-circle-outline">
                    <Box sx={{ display: "flex", gap: 1.25, flexWrap: "wrap", alignItems: "center" }}>
                      {hasRecording ? (
                        <ControlButton icon="mdi:play" label={t("adminLiveSessions.playRecording", "Play recording")} tone="primary" onClick={() => setPlayerOpen(true)} />
                      ) : (
                        <InfoCallout icon="mdi:cloud-clock-outline" color="var(--font-tertiary)">
                          {t("liveSessions.recordingNotAvailable")}
                        </InfoCallout>
                      )}
                      {isZoom && (
                        <ControlButton icon="mdi:cloud-download" label={t("adminLiveSessions.syncRecording")} tone="outline" loading={syncingRecording} onClick={handleSyncRecording} />
                      )}
                      {isGoogleMeet && !hasRecording && (
                        <Typography variant="caption" sx={{ color: "var(--font-tertiary)", width: "100%" }}>
                          {t(
                            "adminLiveSessions.googleRecordingHint",
                            "Meet recordings appear here automatically after the session ends — the host must press Record in the meeting (requires Google Workspace)."
                          )}
                        </Typography>
                      )}
                    </Box>
                  </SectionCard>
                )}

                {/* Transcript */}
                {tabKey === "transcript" && (
                  <SectionCard>
                    <LiveSessionTranscriptSection liveClassId={activity.id} hasSummary={Boolean(activity.zoom_ai_summary?.trim() || (activity as { google_ai_summary?: string }).google_ai_summary?.trim())} />
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
        open={playerOpen}
        liveClassId={activity?.id ?? null}
        title={activity?.topic_name ?? undefined}
        onClose={() => setPlayerOpen(false)}
      />

      {activity && isWebinar && (
        <EditWebinarDialog
          activity={activity}
          open={editOpen}
          onClose={() => setEditOpen(false)}
          onSaved={load}
        />
      )}
    </MainLayout>
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
