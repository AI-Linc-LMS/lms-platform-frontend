"use client";

import { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Drawer,
  IconButton,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  CircularProgress,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
} from "@mui/material";
import { IconWrapper } from "@/components/common/IconWrapper";
import { useToast } from "@/components/common/Toast";
import {
  adminLiveActivitiesService,
  LiveActivity,
} from "@/lib/services/admin/admin-live-activities.service";
import {
  MEETING_NOT_FINALIZED_MESSAGE,
  RECORDING_PROCESSING_MESSAGE,
  RECORDING_NOT_AVAILABLE_FRIENDLY_MESSAGE,
  SESSION_NOT_FOUND_MESSAGE,
  getLiveSessionErrorMessage,
  getZoomApiErrorMessage,
} from "@/lib/utils/live-session-errors";
import { formatDurationSeconds } from "@/lib/utils/date-utils";

interface LiveSessionDetailDrawerProps {
  liveClassId: number | null;
  open: boolean;
  onClose: () => void;
  onUpdated?: () => void;
}

export function LiveSessionDetailDrawer({
  liveClassId,
  open,
  onClose,
  onUpdated,
}: LiveSessionDetailDrawerProps) {
  const { showToast } = useToast();
  const [activity, setActivity] = useState<LiveActivity | null>(null);
  const [loading, setLoading] = useState(false);
  const [sessionNotFound, setSessionNotFound] = useState(false);
  const [endMeetingConfirmOpen, setEndMeetingConfirmOpen] = useState(false);
  const [endingMeeting, setEndingMeeting] = useState(false);
  const [syncingRecording, setSyncingRecording] = useState(false);

  useEffect(() => {
    if (open && liveClassId != null) {
      setActivity(null);
      setSessionNotFound(false);
      const fetchDetail = async () => {
        setLoading(true);
        try {
          const data = await adminLiveActivitiesService.getLiveActivity(
            liveClassId
          );
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

  // Poll Zoom status when drawer is open and meeting is live
  useEffect(() => {
    if (!open || liveClassId == null || activity?.meeting_status !== "live") return;
    const interval = setInterval(async () => {
      try {
        const status = await adminLiveActivitiesService.getZoomStatus(liveClassId);
        if (status.meeting_status === "ended" || status.meeting_status === "expired") {
          await refreshDetail();
        }
      } catch (_) {}
    }, 45000);
    return () => clearInterval(interval);
  }, [open, liveClassId, activity?.meeting_status]);

  const refreshDetail = async () => {
    if (liveClassId == null) return;
    try {
      const data = await adminLiveActivitiesService.getLiveActivity(
        liveClassId
      );
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
      const result = await adminLiveActivitiesService.syncRecording(
        liveClassId
      );
      if (result.status === "error") {
        const msg = getZoomApiErrorMessage(result.message, "sync_recording");
        if (msg === RECORDING_PROCESSING_MESSAGE) {
          showToast(msg, "info");
        } else {
          showToast(msg || "Failed to sync recording", "error");
        }
        return;
      }
      if (
        result.message &&
        (result.message.toLowerCase().includes("processing") ||
          result.message.toLowerCase().includes("still"))
      ) {
        showToast(RECORDING_PROCESSING_MESSAGE, "info");
      } else {
        showToast(result.message || "Recording synced", "success");
      }
      await refreshDetail();
    } catch (error: unknown) {
      const msg = getLiveSessionErrorMessage(error, "sync_recording");
      if (msg === RECORDING_PROCESSING_MESSAGE) {
        showToast(msg, "info");
      } else {
        showToast(msg || "Failed to sync recording", "error");
      }
    } finally {
      setSyncingRecording(false);
    }
  };

  const formatDateTime = (s: string | null | undefined) => {
    if (!s) return "—";
    return new Date(s).toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  /** Shorter date/time for table cells so everything fits without horizontal scroll */
  const formatDateTimeShort = (s: string | null | undefined) => {
    if (!s) return "—";
    return new Date(s).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const tableCellSx = {
    fontSize: "0.75rem",
    verticalAlign: "middle",
  } as const;

  const colWidths = {
    name: "24%",
    email: "24%",
    join: "18%",
    leave: "18%",
    duration: "16%",
  };

  const participants = activity?.zoom_participants ?? [];
  const hasRecording = Boolean(activity?.zoom_recording_url?.trim());

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: {
          width: { xs: "100%", sm: 520, md: 600 },
          maxWidth: "100%",
        },
      }}
    >
      <Box sx={{ p: 2, display: "flex", alignItems: "center", gap: 1 }}>
        <IconButton onClick={onClose} size="small" aria-label="Close drawer">
          <IconWrapper icon="mdi:close" size={24} />
        </IconButton>
        <Typography variant="h6" sx={{ fontWeight: 600, flex: 1 }}>
          Live Session
        </Typography>
      </Box>

      {loading && !activity ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
          <CircularProgress />
        </Box>
      ) : sessionNotFound ? (
        <Box sx={{ px: 2, py: 4, textAlign: "center" }}>
          <Typography variant="body1" sx={{ color: "#6b7280", mb: 2 }}>
            {SESSION_NOT_FOUND_MESSAGE}
          </Typography>
          <Button variant="contained" onClick={onClose}>
            Close
          </Button>
        </Box>
      ) : activity ? (
        <Box sx={{ px: 2, pb: 4 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
            {activity.topic_name ?? "—"}
          </Typography>
          <Typography variant="body2" sx={{ color: "#6b7280", mb: 2 }}>
            {formatDateTime(activity.class_datetime)} · {activity.duration_minutes} min
          </Typography>

          <Chip
            label={
              activity.meeting_status === "live"
                ? "Live"
                : activity.meeting_status === "ended"
                  ? "Ended"
                  : activity.meeting_status === "expired"
                    ? "Expired"
                    : "—"
            }
            size="small"
            sx={{
              mb: 2,
              bgcolor:
                activity.meeting_status === "live"
                  ? "#d1fae5"
                  : activity.meeting_status === "ended"
                    ? "#9ca3af"
                    : "#fed7aa",
              color:
                activity.meeting_status === "live"
                  ? "#065f46"
                  : activity.meeting_status === "expired"
                    ? "#9a3412"
                    : "#1f2937",
              fontWeight: 600,
              fontSize: "0.75rem",
            }}
          />

          <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5, mb: 3 }}>
            {activity.meeting_status === "live" && activity.zoom_start_url && (
              <Button
                variant="contained"
                size="small"
                startIcon={<IconWrapper icon="mdi:video" size={18} />}
                onClick={() => window.open(activity.zoom_start_url!, "_blank")}
                sx={{
                  bgcolor: "#6366f1",
                  "&:hover": { bgcolor: "#4f46e5" },
                  textTransform: "none",
                }}
              >
                Start meeting
              </Button>
            )}
            {activity.zoom_password && (
              <Typography variant="body2" sx={{ color: "#6b7280" }}>
                Password: {activity.zoom_password}
              </Typography>
            )}
          </Box>

          <Typography
            variant="subtitle2"
            sx={{ fontWeight: 600, mb: 1, color: "#374151" }}
          >
            Recording &amp; sync
          </Typography>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5, mb: 3 }}>
            {hasRecording ? (
              <Button
                variant="outlined"
                size="small"
                startIcon={
                  <IconWrapper icon="mdi:play-circle-outline" size={18} />
                }
                onClick={() =>
                  window.open(activity!.zoom_recording_url!, "_blank")
                }
                sx={{ textTransform: "none", alignSelf: "flex-start" }}
              >
                Open recording
              </Button>
            ) : (
              <>
                <Button
                  variant="outlined"
                  size="small"
                  disabled
                  startIcon={
                    <IconWrapper icon="mdi:play-circle-outline" size={18} />
                  }
                  sx={{ textTransform: "none", alignSelf: "flex-start" }}
                >
                  Open recording
                </Button>
                <Typography
                  variant="caption"
                  sx={{ color: "#6b7280", maxWidth: 360 }}
                >
                  {RECORDING_NOT_AVAILABLE_FRIENDLY_MESSAGE}
                </Typography>
              </>
            )}
          </Box>

          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mb: 3 }}>
            {activity.meeting_status === "live" && (
              <>
                <Button
                  variant="outlined"
                  size="small"
                  disabled={endingMeeting}
                  onClick={() => setEndMeetingConfirmOpen(true)}
                  startIcon={
                    endingMeeting ? (
                      <CircularProgress size={16} color="inherit" />
                    ) : (
                      <IconWrapper icon="mdi:video-off" size={16} />
                    )
                  }
                  sx={{ textTransform: "none" }}
                >
                  End meeting
                </Button>
                <Dialog
                  open={endMeetingConfirmOpen}
                  onClose={() => setEndMeetingConfirmOpen(false)}
                  aria-labelledby="end-meeting-dialog-title"
                  aria-describedby="end-meeting-dialog-description"
                >
                  <DialogTitle id="end-meeting-dialog-title">
                    End this meeting?
                  </DialogTitle>
                  <DialogContent>
                    <DialogContentText id="end-meeting-dialog-description">
                      All participants will be disconnected. This cannot be undone.
                    </DialogContentText>
                  </DialogContent>
                  <DialogActions>
                    <Button onClick={() => setEndMeetingConfirmOpen(false)}>
                      Cancel
                    </Button>
                    <Button
                      onClick={handleEndMeetingConfirm}
                      color="error"
                      variant="contained"
                      disabled={endingMeeting}
                    >
                      End meeting
                    </Button>
                  </DialogActions>
                </Dialog>
              </>
            )}
            <Button
              variant="outlined"
              size="small"
              disabled={syncingRecording}
              onClick={handleSyncRecording}
              startIcon={
                syncingRecording ? (
                  <CircularProgress size={16} color="inherit" />
                ) : (
                  <IconWrapper icon="mdi:cloud-download" size={16} />
                )
              }
              sx={{ textTransform: "none" }}
            >
              Sync recording
            </Button>
          </Box>

          {participants.length > 0 && (
            <>
              <Typography
                variant="subtitle2"
                sx={{ fontWeight: 600, mb: 1, color: "#374151" }}
              >
                Zoom participants
              </Typography>
              <TableContainer
                component={Paper}
                variant="outlined"
                sx={{ mb: 2, overflow: "hidden" }}
              >
                <Table
                  size="small"
                  sx={{ tableLayout: "fixed", width: "100%" }}
                >
                  <TableHead>
                    <TableRow sx={{ bgcolor: "#f9fafb" }}>
                      <TableCell
                        sx={{
                          fontWeight: 600,
                          ...tableCellSx,
                          width: colWidths.name,
                          maxWidth: 0,
                        }}
                      >
                        Name
                      </TableCell>
                      <TableCell
                        sx={{
                          fontWeight: 600,
                          ...tableCellSx,
                          width: colWidths.email,
                          maxWidth: 0,
                        }}
                      >
                        Email
                      </TableCell>
                      <TableCell
                        sx={{
                          fontWeight: 600,
                          ...tableCellSx,
                          width: colWidths.join,
                        }}
                      >
                        Join
                      </TableCell>
                      <TableCell
                        sx={{
                          fontWeight: 600,
                          ...tableCellSx,
                          width: colWidths.leave,
                        }}
                      >
                        Leave
                      </TableCell>
                      <TableCell
                        sx={{
                          fontWeight: 600,
                          ...tableCellSx,
                          width: colWidths.duration,
                          whiteSpace: "nowrap",
                        }}
                      >
                        Duration
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {participants.map((p, idx) => (
                      <TableRow
                        key={
                          p.id != null && String(p.id).trim() !== ""
                            ? p.id
                            : `participant-${idx}`
                        }
                      >
                        <TableCell
                          sx={{
                            ...tableCellSx,
                            maxWidth: 0,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                          title={p.name ?? undefined}
                        >
                          {p.name ?? "—"}
                        </TableCell>
                        <TableCell
                          sx={{
                            ...tableCellSx,
                            maxWidth: 0,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                          title={
                            p.user_email?.trim() || p.email?.trim() || undefined
                          }
                        >
                          {p.user_email?.trim() || p.email?.trim() || "—"}
                        </TableCell>
                        <TableCell
                          sx={{ ...tableCellSx, whiteSpace: "nowrap" }}
                        >
                          {formatDateTimeShort(p.join_time)}
                        </TableCell>
                        <TableCell
                          sx={{ ...tableCellSx, whiteSpace: "nowrap" }}
                        >
                          {formatDateTimeShort(p.leave_time)}
                        </TableCell>
                        <TableCell
                          sx={{
                            ...tableCellSx,
                            whiteSpace: "nowrap",
                          }}
                        >
                          {formatDurationSeconds(p.duration)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </>
          )}
          {participants.length === 0 && activity.is_zoom && (
            <Typography variant="body2" sx={{ color: "#9ca3af" }}>
              No Zoom participants in this session.
            </Typography>
          )}
        </Box>
      ) : null}
    </Drawer>
  );
}
