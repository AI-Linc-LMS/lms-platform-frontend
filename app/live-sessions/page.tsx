"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Container,
  Typography,
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Button,
  Chip,
  CircularProgress,
  Tooltip,
} from "@mui/material";
import { MainLayout } from "@/components/layout/MainLayout";
import { useToast } from "@/components/common/Toast";
import { IconWrapper } from "@/components/common/IconWrapper";
import { useClientInfo } from "@/lib/contexts/ClientInfoContext";
import {
  activityService,
  LiveAttendanceActivity,
} from "@/lib/services/activity.service";
import {
  getLiveSessionErrorMessage,
  RECORDING_NOT_AVAILABLE_FRIENDLY_MESSAGE,
  copyToClipboard,
} from "@/lib/utils/live-session-errors";

const LIVE_SESSIONS_FEATURE = "live_sessions";

function isZoomSession(activity: LiveAttendanceActivity): boolean {
  return activity.is_zoom === true || Boolean(activity.zoom_join_url?.trim());
}

export default function LiveSessionsPage() {
  const { clientInfo, loading: loadingClientInfo } = useClientInfo();
  const [sessions, setSessions] = useState<LiveAttendanceActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [watchingRecordingId, setWatchingRecordingId] = useState<number | null>(
    null
  );
  const { showToast } = useToast();

  const enabledFeatureNames = new Set(
    clientInfo?.features?.map((f) => f.name) ?? []
  );
  const hasLiveSessionsFeature =
    enabledFeatureNames.size === 0 ||
    enabledFeatureNames.has(LIVE_SESSIONS_FEATURE);

  useEffect(() => {
    if (loadingClientInfo || !hasLiveSessionsFeature) return;
    loadSessions();
  }, [loadingClientInfo, hasLiveSessionsFeature]);

  const loadSessions = async () => {
    try {
      setLoading(true);
      const data = await activityService.getLiveAttendance();
      const list = Array.isArray(data) ? data : [];
      setSessions(list.filter(isZoomSession));
    } catch (error: unknown) {
      showToast(getLiveSessionErrorMessage(error), "error");
    } finally {
      setLoading(false);
    }
  };

  const handleCopyPassword = (password: string) => {
    copyToClipboard(password, showToast, "Password copied");
  };

  const handleWatchRecording = async (activity: LiveAttendanceActivity) => {
    if (activity.zoom_recording_url?.trim()) {
      window.open(activity.zoom_recording_url, "_blank");
      return;
    }
    try {
      setWatchingRecordingId(activity.id);
      const data = await activityService.getRecording(activity.id);
      if (data.recording_url) {
        window.open(data.recording_url, "_blank");
      }
    } catch (error: unknown) {
      showToast(getLiveSessionErrorMessage(error, "recording"), "error");
    } finally {
      setWatchingRecordingId(null);
    }
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatTimeRemaining = (minutes: number) => {
    if (minutes <= 0) return "Expired";
    if (minutes < 60) return `${minutes} min left`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m left` : `${hours}h left`;
  };

  const paginatedSessions = sessions.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  if (loadingClientInfo || (hasLiveSessionsFeature && loading && sessions.length === 0)) {
    return (
      <MainLayout>
        <Container maxWidth="lg" sx={{ py: 4 }}>
          <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
            <CircularProgress />
          </Box>
        </Container>
      </MainLayout>
    );
  }

  if (!hasLiveSessionsFeature) {
    return (
      <MainLayout>
        <Container maxWidth="lg" sx={{ py: 4 }}>
          <Paper
            sx={{
              p: 5,
              textAlign: "center",
              borderRadius: 2,
              border: "1px solid #e5e7eb",
            }}
          >
            <Typography variant="h6" sx={{ color: "#374151", mb: 1 }}>
              Live sessions are not enabled for your organization
            </Typography>
            <Typography variant="body2" sx={{ color: "#6b7280", mb: 2 }}>
              This feature is not available. Contact your administrator if you
              believe this is an error.
            </Typography>
            <Button component={Link} href="/dashboard" variant="contained">
              Back to dashboard
            </Button>
          </Paper>
        </Container>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box sx={{ mb: 4 }}>
          <Typography
            variant="h4"
            sx={{ fontWeight: 700, color: "#111827", mb: 1 }}
          >
            Live Sessions
          </Typography>
          <Typography variant="body1" sx={{ color: "#6b7280" }}>
            Join live Zoom classes and watch recordings
          </Typography>
        </Box>

        {sessions.length === 0 ? (
          <Paper
            sx={{
              p: 5,
              textAlign: "center",
              borderRadius: 2,
              border: "1px solid #e5e7eb",
            }}
          >
            <IconWrapper
              icon="mdi:video-off-outline"
              size={72}
              color="#9ca3af"
            />
            <Typography variant="h6" sx={{ color: "#374151", mt: 2, mb: 1 }}>
              No live sessions at the moment
            </Typography>
            <Typography variant="body2" sx={{ color: "#6b7280" }}>
              There are no Zoom live sessions scheduled. Check back later or
              contact your instructor.
            </Typography>
          </Paper>
        ) : (
          <Paper
            sx={{
              borderRadius: 2,
              border: "1px solid #e5e7eb",
              overflow: "hidden",
            }}
          >
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow sx={{ backgroundColor: "#f9fafb" }}>
                    <TableCell
                      sx={{
                        fontWeight: 600,
                        color: "#374151",
                        fontSize: "0.875rem",
                      }}
                    >
                      Name
                    </TableCell>
                    <TableCell
                      sx={{
                        fontWeight: 600,
                        color: "#374151",
                        fontSize: "0.875rem",
                      }}
                    >
                      Expires At
                    </TableCell>
                    <TableCell
                      sx={{
                        fontWeight: 600,
                        color: "#374151",
                        fontSize: "0.875rem",
                      }}
                    >
                      Time Remaining
                    </TableCell>
                    <TableCell
                      sx={{
                        fontWeight: 600,
                        color: "#374151",
                        fontSize: "0.875rem",
                      }}
                      align="right"
                    >
                      Action
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {paginatedSessions.map((activity) => (
                    <TableRow
                      key={activity.id}
                      sx={{
                        "&:hover": { backgroundColor: "#f9fafb" },
                      }}
                    >
                      <TableCell>
                        <Typography
                          variant="body2"
                          sx={{ fontWeight: 600, color: "#111827" }}
                        >
                          {activity.topic_name ?? activity.name ?? "—"}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ color: "#374151" }}>
                          {formatDateTime(
                            activity.class_datetime ?? activity.expires_at ?? ""
                          )}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        {activity.meeting_status === "live" ? (
                          <Chip
                            label="Live"
                            size="small"
                            sx={{
                              backgroundColor: "#d1fae5",
                              color: "#065f46",
                              fontWeight: 600,
                              fontSize: "0.75rem",
                            }}
                          />
                        ) : activity.meeting_status === "ended" ? (
                          <Chip
                            label="Class Ended"
                            size="small"
                            sx={{
                              backgroundColor: "#9ca3af",
                              color: "#1f2937",
                              fontWeight: 600,
                              fontSize: "0.75rem",
                            }}
                          />
                        ) : activity.meeting_status === "expired" ? (
                          <Chip
                            label="Expired"
                            size="small"
                            sx={{
                              backgroundColor: "#fed7aa",
                              color: "#9a3412",
                              fontWeight: 600,
                              fontSize: "0.75rem",
                            }}
                          />
                        ) : activity.time_remaining_minutes <= 0 ? (
                          <Chip
                            label="Expired"
                            size="small"
                            sx={{
                              backgroundColor: "#ed4545",
                              color: "#ffffff",
                              fontWeight: 600,
                              fontSize: "0.75rem",
                            }}
                          />
                        ) : (
                          <Typography
                            variant="body2"
                            sx={{ color: "#374151" }}
                          >
                            {formatTimeRemaining(
                              activity.time_remaining_minutes
                            )}
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell align="right">
                        <Box
                          sx={{
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "flex-end",
                            gap: 1,
                          }}
                        >
                          {activity.meeting_status === "live" &&
                            activity.zoom_join_url && (
                              <>
                                <Button
                                  variant="contained"
                                  size="small"
                                  onClick={() =>
                                    window.open(
                                      activity.zoom_join_url!,
                                      "_blank"
                                    )
                                  }
                                  startIcon={
                                    <IconWrapper
                                      icon="mdi:video"
                                      size={18}
                                    />
                                  }
                                  sx={{
                                    backgroundColor: "#6366f1",
                                    color: "#ffffff",
                                    textTransform: "none",
                                    fontWeight: 600,
                                    fontSize: "0.875rem",
                                    px: 2,
                                    "&:hover": {
                                      backgroundColor: "#4f46e5",
                                    },
                                  }}
                                >
                                  Join Live Class
                                </Button>
                                {activity.zoom_password && (
                                  <Typography
                                    variant="caption"
                                    sx={{
                                      color: "#6b7280",
                                      display: "flex",
                                      alignItems: "center",
                                      gap: 0.5,
                                    }}
                                  >
                                    Password: {activity.zoom_password}
                                    <Button
                                      size="small"
                                      sx={{
                                        minWidth: 0,
                                        p: 0.25,
                                        fontSize: "0.7rem",
                                        textTransform: "none",
                                      }}
                                      onClick={() =>
                                        handleCopyPassword(
                                          activity.zoom_password!
                                        )
                                      }
                                    >
                                      Copy
                                    </Button>
                                  </Typography>
                                )}
                              </>
                            )}
                          {(activity.meeting_status === "ended" ||
                            activity.meeting_status === "expired") &&
                            (activity.zoom_recording_url?.trim() ? (
                              <Button
                                variant="text"
                                size="small"
                                disabled={watchingRecordingId === activity.id}
                                startIcon={
                                  watchingRecordingId === activity.id ? (
                                    <CircularProgress size={14} color="inherit" />
                                  ) : (
                                    <IconWrapper
                                      icon="mdi:play-circle-outline"
                                      size={16}
                                    />
                                  )
                                }
                                onClick={() =>
                                  handleWatchRecording(activity)
                                }
                                sx={{
                                  fontSize: "0.75rem",
                                  textTransform: "none",
                                  color: "#6366f1",
                                }}
                              >
                                Watch Recording
                              </Button>
                            ) : (
                              <Tooltip
                                title={RECORDING_NOT_AVAILABLE_FRIENDLY_MESSAGE}
                                placement="top"
                              >
                                <span>
                                  <Button
                                    variant="text"
                                    size="small"
                                    disabled
                                    startIcon={
                                      <IconWrapper
                                        icon="mdi:play-circle-outline"
                                        size={16}
                                      />
                                    }
                                    sx={{
                                      fontSize: "0.75rem",
                                      textTransform: "none",
                                      color: "#9ca3af",
                                    }}
                                  >
                                    Watch Recording
                                  </Button>
                                </span>
                              </Tooltip>
                            ))}
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            <TablePagination
              component="div"
              count={sessions.length}
              page={page}
              onPageChange={(_, newPage) => setPage(newPage)}
              rowsPerPage={rowsPerPage}
              onRowsPerPageChange={(e) => {
                setRowsPerPage(parseInt(e.target.value, 10));
                setPage(0);
              }}
              rowsPerPageOptions={[5, 10, 25, 50]}
              sx={{
                borderTop: "1px solid #e5e7eb",
                "& .MuiTablePagination-toolbar": { px: 2 },
                "& .MuiTablePagination-selectLabel": {
                  fontSize: "0.875rem",
                  color: "#6b7280",
                },
                "& .MuiTablePagination-displayedRows": {
                  fontSize: "0.875rem",
                  color: "#6b7280",
                },
                "& .MuiTablePagination-select": {
                  fontSize: "0.875rem",
                },
              }}
            />
          </Paper>
        )}
      </Container>
    </MainLayout>
  );
}
