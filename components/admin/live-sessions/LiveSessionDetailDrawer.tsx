"use client";

import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Box,
  Typography,
  Drawer,
  IconButton,
  Button,
  CircularProgress,
  Tabs,
  Tab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Tooltip,
} from "@mui/material";
import { IconWrapper } from "@/components/common/IconWrapper";
import { useToast } from "@/components/common/Toast";
import {
  adminLiveActivitiesService,
  LiveActivity,
} from "@/lib/services/admin/admin-live-activities.service";
import {
  RECORDING_PROCESSING_MESSAGE,
  getLiveSessionErrorMessage,
  getZoomApiErrorMessage,
} from "@/lib/utils/live-session-errors";
import { ZoomAttendanceSection } from "./ZoomAttendanceSection";
import { LiveSessionRosterSection } from "./LiveSessionRosterSection";
import { LiveSessionTranscriptSection } from "./LiveSessionTranscriptSection";
import { RecordingPlayerDialog } from "@/components/live-sessions/RecordingPlayerDialog";
import {
  MeetingStatusChip,
  PlatformChip,
  SectionCard,
  InfoCallout,
} from "@/components/live-sessions/ui/LiveSessionUI";

interface LiveSessionDetailDrawerProps {
  liveClassId: number | null;
  open: boolean;
  onClose: () => void;
  onUpdated?: () => void;
  webhookConfigured?: boolean;
}

export function LiveSessionDetailDrawer({
  liveClassId,
  open,
  onClose,
  onUpdated,
  webhookConfigured = false,
}: LiveSessionDetailDrawerProps) {
  const { t } = useTranslation("common");
  const { showToast } = useToast();
  const [activity, setActivity] = useState<LiveActivity | null>(null);
  const [loading, setLoading] = useState(false);
  const [sessionNotFound, setSessionNotFound] = useState(false);
  const [endMeetingConfirmOpen, setEndMeetingConfirmOpen] = useState(false);
  const [endingMeeting, setEndingMeeting] = useState(false);
  const [syncingRecording, setSyncingRecording] = useState(false);
  const [playerOpen, setPlayerOpen] = useState(false);
  const [tab, setTab] = useState(0);

  useEffect(() => {
    if (open && liveClassId != null) {
      setActivity(null);
      setSessionNotFound(false);
      setTab(0);
      const fetchDetail = async () => {
        setLoading(true);
        try {
          const data = await adminLiveActivitiesService.getLiveActivity(liveClassId);
          setActivity(data);
        } catch (error: unknown) {
          const message = getLiveSessionErrorMessage(error, "session_detail");
          if ((error as { response?: { status?: number } })?.response?.status === 404) {
            setSessionNotFound(true);
          } else {
            showToast(message, "error");
          }
        } finally {
          setLoading(false);
        }
      };
      fetchDetail();
    }
  }, [open, liveClassId, showToast]);

  // Poll Zoom status when drawer is open and meeting is live.
  useEffect(() => {
    if (!open || liveClassId == null || activity?.meeting_status !== "live" || activity?.is_google_meet) {
      return;
    }
    const interval = setInterval(async () => {
      try {
        const status = await adminLiveActivitiesService.getZoomStatus(liveClassId);
        if (status.meeting_status === "ended" || status.meeting_status === "expired") {
          await refreshDetail();
        }
      } catch (_) {}
    }, 45000);
    return () => clearInterval(interval);
  }, [open, liveClassId, activity?.meeting_status, activity?.is_google_meet]);

  const refreshDetail = async () => {
    if (liveClassId == null) return;
    try {
      const data = await adminLiveActivitiesService.getLiveActivity(liveClassId);
      setActivity(data);
      onUpdated?.();
    } catch (_) {}
  };

  const handleEndMeetingConfirm = async () => {
    if (liveClassId == null) return;
    setEndMeetingConfirmOpen(false);
    try {
      setEndingMeeting(true);
      const result = await adminLiveActivitiesService.endMeeting(liveClassId);
      if (result.status === "error") {
        showToast(getZoomApiErrorMessage(result.message) || "Failed to end meeting", "error");
        return;
      }
      showToast(result.message || "Meeting ended", "success");
      await refreshDetail();
    } catch (error: unknown) {
      showToast(getLiveSessionErrorMessage(error), "error");
    } finally {
      setEndingMeeting(false);
    }
  };

  const handleSyncRecording = async () => {
    if (liveClassId == null) return;
    try {
      setSyncingRecording(true);
      const result = await adminLiveActivitiesService.syncRecording(liveClassId);
      if (result.status === "error") {
        const msg = getZoomApiErrorMessage(result.message, "sync_recording");
        showToast(msg === RECORDING_PROCESSING_MESSAGE ? msg : msg || "Failed to sync recording", msg === RECORDING_PROCESSING_MESSAGE ? "info" : "error");
        return;
      }
      const stillProcessing =
        result.message &&
        (result.message.toLowerCase().includes("processing") || result.message.toLowerCase().includes("still"));
      showToast(stillProcessing ? RECORDING_PROCESSING_MESSAGE : result.message || "Recording synced", stillProcessing ? "info" : "success");
      await refreshDetail();
    } catch (error: unknown) {
      const msg = getLiveSessionErrorMessage(error, "sync_recording");
      showToast(msg === RECORDING_PROCESSING_MESSAGE ? msg : msg || "Failed to sync recording", msg === RECORDING_PROCESSING_MESSAGE ? "info" : "error");
    } finally {
      setSyncingRecording(false);
    }
  };

  const copyPasscode = (pwd: string) => {
    navigator.clipboard.writeText(pwd).then(
      () => showToast(t("liveSessions.passwordCopied", "Passcode copied"), "success"),
      () => showToast(t("adminLiveSessions.failedToCopy", "Failed to copy"), "error")
    );
  };

  const formatDateTime = (s: string | null | undefined) => {
    if (!s) return "—";
    return new Date(s).toLocaleString("en-US", { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
  };

  const hasRecording = Boolean(activity?.zoom_recording_url?.trim());
  const isZoom = Boolean(activity?.is_zoom);
  const scheduledOrLive = activity?.meeting_status === "scheduled" || activity?.meeting_status === "live";

  // Tabs depend on platform: Google Meet sessions only have an Overview.
  const tabs = isZoom
    ? [
        { icon: "mdi:information-outline", label: t("adminLiveSessions.tabOverview", "Overview") },
        { icon: "mdi:account-group-outline", label: t("adminLiveSessions.tabAttendance", "Attendance") },
        { icon: "mdi:play-circle-outline", label: t("adminLiveSessions.tabRecording", "Recording") },
        { icon: "mdi:text-box-outline", label: t("adminLiveSessions.tabTranscript", "Transcript") },
      ]
    : [{ icon: "mdi:information-outline", label: t("adminLiveSessions.tabOverview", "Overview") }];

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      PaperProps={{ sx: { width: { xs: "100%", sm: 540, md: 620 }, maxWidth: "100%", bgcolor: "var(--background)" } }}
    >
      <Box sx={{ p: 2, display: "flex", alignItems: "center", gap: 1, borderBottom: "1px solid var(--border-default)" }}>
        <IconButton onClick={onClose} size="small" aria-label={t("adminLiveSessions.close")}>
          <IconWrapper icon="mdi:close" size={24} />
        </IconButton>
        <Typography variant="h6" sx={{ fontWeight: 600, flex: 1 }}>
          {t("adminLiveSessions.sessionDetailTitle")}
        </Typography>
      </Box>

      {loading && !activity ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
          <CircularProgress />
        </Box>
      ) : sessionNotFound ? (
        <Box sx={{ px: 2, py: 4, textAlign: "center" }}>
          <Typography variant="body1" sx={{ color: "var(--font-secondary)", mb: 2 }}>
            {t("adminLiveSessions.sessionNotFound")}
          </Typography>
          <Button variant="contained" onClick={onClose}>
            {t("adminLiveSessions.close")}
          </Button>
        </Box>
      ) : activity ? (
        <Box sx={{ px: { xs: 2, sm: 2.5 }, py: 2.5 }}>
          {/* Hero */}
          <SectionCard sx={{ mb: 2 }}>
            <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", mb: 1 }}>
              <MeetingStatusChip status={activity.meeting_status} />
              <PlatformChip isZoom={activity.is_zoom} isGoogleMeet={activity.is_google_meet} zoomMeetingType={activity.zoom_meeting_type} />
            </Box>
            <Typography variant="h6" sx={{ fontWeight: 700, color: "var(--font-primary)", mb: 0.75 }}>
              {activity.topic_name ?? "—"}
            </Typography>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1, color: "var(--font-secondary)" }}>
                <IconWrapper icon="mdi:clock-outline" size={16} color="var(--font-tertiary)" />
                <Typography variant="body2">
                  {formatDateTime(activity.class_datetime)} · {activity.duration_minutes} {t("liveSessions.minShort", "min")}
                </Typography>
              </Box>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1, color: "var(--font-secondary)" }}>
                <IconWrapper icon="mdi:book-open-variant" size={16} color="var(--font-tertiary)" />
                <Typography variant="body2">
                  {activity.course_detail?.title ?? t("adminLiveSessions.noCourse")}
                </Typography>
              </Box>
            </Box>
          </SectionCard>

          <Tabs
            value={tab}
            onChange={(_, v) => setTab(v)}
            variant="scrollable"
            scrollButtons="auto"
            sx={{
              minHeight: 40,
              mb: 2,
              "& .MuiTab-root": { minHeight: 40, textTransform: "none", fontWeight: 600, fontSize: "0.8rem", color: "var(--font-secondary)" },
              "& .Mui-selected": { color: "var(--accent-indigo) !important" },
              "& .MuiTabs-indicator": { backgroundColor: "var(--accent-indigo)" },
            }}
          >
            {tabs.map((tb, i) => (
              <Tab key={i} iconPosition="start" icon={<IconWrapper icon={tb.icon} size={17} />} label={tb.label} />
            ))}
          </Tabs>

          {/* Overview tab */}
          {tab === 0 && (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <SectionCard title={t("adminLiveSessions.meetingControls", "Meeting controls")} icon="mdi:video-outline">
                <Box sx={{ display: "flex", flexDirection: "column", gap: 1.25 }}>
                  {scheduledOrLive && activity.is_google_meet && activity.join_link?.trim() && (
                    <Button
                      variant="contained"
                      size="small"
                      startIcon={<IconWrapper icon="mdi:video" size={18} />}
                      onClick={() => window.open(activity.join_link!.trim(), "_blank")}
                      sx={{ bgcolor: "var(--success-500)", color: "var(--font-light)", textTransform: "none", alignSelf: "flex-start", "&:hover": { bgcolor: "color-mix(in srgb, var(--success-500) 84%, var(--accent-indigo-dark))" } }}
                    >
                      {t("adminLiveSessions.openGoogleMeet")}
                    </Button>
                  )}
                  {scheduledOrLive && activity.zoom_start_url && (
                    <Button
                      variant="contained"
                      size="small"
                      startIcon={<IconWrapper icon="mdi:video" size={18} />}
                      onClick={() => window.open(activity.zoom_start_url!, "_blank")}
                      sx={{ bgcolor: "var(--accent-indigo)", color: "var(--font-light)", textTransform: "none", alignSelf: "flex-start", "&:hover": { bgcolor: "var(--accent-indigo-dark)" } }}
                    >
                      {t("adminLiveSessions.startMeeting")}
                    </Button>
                  )}
                  {activity.zoom_password && (
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
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
                  {activity.meeting_status === "live" && !webhookConfigured && !activity.is_google_meet && (
                    <Button
                      variant="outlined"
                      size="small"
                      color="error"
                      disabled={endingMeeting}
                      onClick={() => setEndMeetingConfirmOpen(true)}
                      startIcon={endingMeeting ? <CircularProgress size={16} color="inherit" /> : <IconWrapper icon="mdi:video-off" size={16} />}
                      sx={{ textTransform: "none", alignSelf: "flex-start" }}
                    >
                      {t("adminLiveSessions.endMeeting")}
                    </Button>
                  )}
                  {!scheduledOrLive && !activity.zoom_password && (
                    <Typography variant="body2" sx={{ color: "var(--font-tertiary)" }}>
                      {t("adminLiveSessions.sessionFinished", "This session has finished.")}
                    </Typography>
                  )}
                </Box>
              </SectionCard>

              {isZoom && (
                <InfoCallout icon="mdi:lightbulb-on-outline">
                  {t("adminLiveSessions.overviewHint", "Attendance, recording and transcript appear in their tabs automatically once the meeting ends — or you can sync them manually.")}
                </InfoCallout>
              )}
            </Box>
          )}

          {/* Attendance tab (Zoom only) */}
          {isZoom && tab === 1 && (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <SectionCard>
                <LiveSessionRosterSection liveClassId={activity.id} />
              </SectionCard>
              <SectionCard>
                <ZoomAttendanceSection liveClassId={activity.id} />
              </SectionCard>
            </Box>
          )}

          {/* Recording tab (Zoom only) */}
          {isZoom && tab === 2 && (
            <SectionCard title={t("adminLiveSessions.recording", "Recording")} icon="mdi:play-circle-outline">
              <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
                {hasRecording ? (
                  <Button
                    variant="contained"
                    size="small"
                    startIcon={<IconWrapper icon="mdi:play" size={18} />}
                    onClick={() => setPlayerOpen(true)}
                    sx={{ bgcolor: "var(--accent-indigo)", color: "var(--font-light)", textTransform: "none", alignSelf: "flex-start", "&:hover": { bgcolor: "var(--accent-indigo-dark)" } }}
                  >
                    {t("adminLiveSessions.playRecording", "Play recording")}
                  </Button>
                ) : (
                  <InfoCallout icon="mdi:cloud-clock-outline" color="var(--font-tertiary)">
                    {t("liveSessions.recordingNotAvailable")}
                  </InfoCallout>
                )}
                <Button
                  variant="outlined"
                  size="small"
                  disabled={syncingRecording}
                  onClick={handleSyncRecording}
                  startIcon={syncingRecording ? <CircularProgress size={16} color="inherit" /> : <IconWrapper icon="mdi:cloud-download" size={16} />}
                  sx={{ textTransform: "none", alignSelf: "flex-start" }}
                >
                  {t("adminLiveSessions.syncRecording")}
                </Button>
              </Box>
            </SectionCard>
          )}

          {/* Transcript tab (Zoom only) */}
          {isZoom && tab === 3 && (
            <SectionCard>
              <LiveSessionTranscriptSection liveClassId={activity.id} hasSummary={Boolean(activity.zoom_ai_summary?.trim())} />
            </SectionCard>
          )}
        </Box>
      ) : null}

      <Dialog open={endMeetingConfirmOpen} onClose={() => setEndMeetingConfirmOpen(false)}>
        <DialogTitle>{t("adminLiveSessions.endMeetingConfirmTitle")}</DialogTitle>
        <DialogContent>
          <DialogContentText>{t("adminLiveSessions.endMeetingConfirmDesc")}</DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEndMeetingConfirmOpen(false)}>{t("adminLiveSessions.cancel")}</Button>
          <Button onClick={handleEndMeetingConfirm} color="error" variant="contained" disabled={endingMeeting}>
            {t("adminLiveSessions.endMeeting")}
          </Button>
        </DialogActions>
      </Dialog>

      <RecordingPlayerDialog
        open={playerOpen}
        liveClassId={activity?.id ?? null}
        title={activity?.topic_name ?? undefined}
        onClose={() => setPlayerOpen(false)}
      />
    </Drawer>
  );
}
