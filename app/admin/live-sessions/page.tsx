"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
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
  IconButton,
  Tooltip,
  LinearProgress,
} from "@mui/material";
import { MainLayout } from "@/components/layout/MainLayout";
import { useToast } from "@/components/common/Toast";
import { IconWrapper } from "@/components/common/IconWrapper";
import { useAuth } from "@/lib/auth/auth-context";
import { useClientInfo } from "@/lib/contexts/ClientInfoContext";
import { activityService } from "@/lib/services/activity.service";
import {
  adminLiveActivitiesService,
  LiveActivity,
} from "@/lib/services/admin/admin-live-activities.service";
import { CreateLiveSessionDialog } from "@/components/admin/live-sessions/CreateLiveSessionDialog";
import { LiveSessionDetailDrawer } from "@/components/admin/live-sessions/LiveSessionDetailDrawer";
import {
  getLiveSessionErrorMessage,
  getZoomApiErrorMessage,
  RECORDING_NOT_AVAILABLE_FRIENDLY_MESSAGE,
  copyToClipboard,
} from "@/lib/utils/live-session-errors";

const ADMIN_LIVE_SESSIONS_FEATURE = "admin_live_sessions";

export default function AdminLiveSessionsPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { clientInfo, loading: loadingClientInfo } = useClientInfo();
  const [sessions, setSessions] = useState<LiveActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [watchingRecordingId, setWatchingRecordingId] = useState<number | null>(
    null
  );
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [detailDrawerOpen, setDetailDrawerOpen] = useState(false);
  const [selectedLiveClassId, setSelectedLiveClassId] = useState<number | null>(
    null
  );
  const [creatingZoomId, setCreatingZoomId] = useState<number | null>(null);
  const { showToast } = useToast();

  const isAdminOrInstructor =
    user?.role === "admin" || user?.role === "instructor";
  const isSuperAdmin = user?.role === "superadmin";
  const canAccessAdmin = isAdminOrInstructor || isSuperAdmin;

  const enabledFeatureNames = new Set(
    clientInfo?.features?.map((f) => f.name) ?? []
  );
  const hasAdminLiveSessionsFeature =
    enabledFeatureNames.size === 0 ||
    enabledFeatureNames.has(ADMIN_LIVE_SESSIONS_FEATURE);

  useEffect(() => {
    if (!authLoading && !canAccessAdmin) {
      router.replace("/dashboard");
      return;
    }
    if (canAccessAdmin && hasAdminLiveSessionsFeature && !loadingClientInfo) {
      loadSessions();
    }
  }, [authLoading, canAccessAdmin, hasAdminLiveSessionsFeature, loadingClientInfo, router]);

  const loadSessions = async () => {
    if (!canAccessAdmin) return;
    try {
      setLoading(true);
      const data = await adminLiveActivitiesService.getLiveActivities();
      setSessions(Array.isArray(data) ? data : []);
    } catch (error: unknown) {
      showToast(getLiveSessionErrorMessage(error), "error");
    } finally {
      setLoading(false);
    }
  };

  const handleCopyPassword = (password: string) => {
    copyToClipboard(password, showToast, "Password copied");
  };

  const handleCreateZoom = async (liveClassId: number) => {
    try {
      setCreatingZoomId(liveClassId);
      const result = await adminLiveActivitiesService.createZoom(liveClassId);
      if (result.status === "error") {
        showToast(getZoomApiErrorMessage(result.message, "zoom_create"), "error");
        return;
      }
      showToast("Zoom meeting created", "success");
      loadSessions();
    } catch (error: unknown) {
      showToast(getLiveSessionErrorMessage(error, "zoom_create"), "error");
    } finally {
      setCreatingZoomId(null);
    }
  };

  const handleWatchRecording = async (activity: LiveActivity) => {
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

  if (!authLoading && !canAccessAdmin) {
    return null;
  }

  if (loadingClientInfo) {
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

  if (canAccessAdmin && !hasAdminLiveSessionsFeature) {
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
            <Button component={Link} href="/admin/dashboard" variant="contained">
              Back to admin dashboard
            </Button>
          </Paper>
        </Container>
      </MainLayout>
    );
  }

  const paginatedSessions = sessions.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  const sessionsContent =
    sessions.length === 0 ? (
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
          No live sessions yet
        </Typography>
        <Typography variant="body2" sx={{ color: "#6b7280", mb: 1 }}>
          There are no Zoom live sessions at the moment.
        </Typography>
        <Typography variant="body2" sx={{ color: "#9ca3af" }}>
          Create a live session to get started.
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
                  Topic
                </TableCell>
                <TableCell
                  sx={{
                    fontWeight: 600,
                    color: "#374151",
                    fontSize: "0.875rem",
                  }}
                >
                  Class date / time
                </TableCell>
                <TableCell
                  sx={{
                    fontWeight: 600,
                    color: "#374151",
                    fontSize: "0.875rem",
                  }}
                >
                  Status
                </TableCell>
                <TableCell
                  sx={{
                    fontWeight: 600,
                    color: "#374151",
                    fontSize: "0.875rem",
                  }}
                >
                  Actions
                </TableCell>
                <TableCell
                  sx={{
                    fontWeight: 600,
                    color: "#374151",
                    fontSize: "0.875rem",
                    width: 48,
                  }}
                >
                  View
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
                      {activity.topic_name ?? "—"}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ color: "#374151" }}>
                      {activity.class_datetime
                        ? formatDateTime(activity.class_datetime)
                        : "—"}
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
                        label="Ended"
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
                    ) : (
                      <Typography variant="body2" sx={{ color: "#374151" }}>
                        —
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    <Box
                      sx={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 1,
                      }}
                    >
                      {!activity.zoom_meeting_id && !activity.zoom_join_url && (
                        <Button
                          variant="outlined"
                          size="small"
                          disabled={creatingZoomId === activity.id}
                          onClick={() => handleCreateZoom(activity.id)}
                          startIcon={
                            creatingZoomId === activity.id ? (
                              <CircularProgress size={14} color="inherit" />
                            ) : (
                              <IconWrapper icon="mdi:video-plus" size={16} />
                            )
                          }
                          sx={{
                            textTransform: "none",
                            fontSize: "0.8rem",
                            alignSelf: "flex-start",
                            borderColor: "#6366f1",
                            color: "#6366f1",
                          }}
                        >
                          Create Zoom
                        </Button>
                      )}
                      {activity.meeting_status === "live" &&
                        activity.zoom_start_url && (
                          <Button
                            variant="contained"
                            size="small"
                            onClick={() =>
                              window.open(activity.zoom_start_url!, "_blank")
                            }
                            startIcon={
                              <IconWrapper icon="mdi:video" size={16} />
                            }
                            sx={{
                              textTransform: "none",
                              fontSize: "0.8rem",
                              alignSelf: "flex-start",
                              bgcolor: "#6366f1",
                              "&:hover": { bgcolor: "#4f46e5" },
                            }}
                          >
                            Start meeting
                          </Button>
                        )}
                      {activity.meeting_status === "live" &&
                        activity.zoom_join_url && (
                          <Button
                            variant="outlined"
                            size="small"
                            onClick={() =>
                              window.open(activity.zoom_join_url!, "_blank")
                            }
                            startIcon={
                              <IconWrapper icon="mdi:video" size={16} />
                            }
                            sx={{
                              textTransform: "none",
                              fontSize: "0.8rem",
                              alignSelf: "flex-start",
                            }}
                          >
                            Open join link
                          </Button>
                        )}
                      {activity.meeting_status === "live" &&
                        activity.zoom_password && (
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
                              handleCopyPassword(activity.zoom_password!)
                            }
                          >
                            Copy
                          </Button>
                        </Typography>
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
                            onClick={() => handleWatchRecording(activity)}
                            sx={{
                              fontSize: "0.75rem",
                              textTransform: "none",
                              color: "#6366f1",
                              alignSelf: "flex-start",
                            }}
                          >
                            Open recording
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
                                  alignSelf: "flex-start",
                                }}
                              >
                                Open recording
                              </Button>
                            </span>
                          </Tooltip>
                        ))}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <IconButton
                      size="small"
                      onClick={() => {
                        setSelectedLiveClassId(activity.id);
                        setDetailDrawerOpen(true);
                      }}
                      aria-label="View session"
                    >
                      <IconWrapper icon="mdi:eye" size={20} />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
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
        </TableContainer>
        </Paper>
    );

  if (loading && sessions.length === 0) {
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

  return (
    <MainLayout>
      <Container maxWidth="lg" sx={{ py: 4, position: "relative" }}>
        {loading && sessions.length > 0 && (
          <LinearProgress
            sx={{
              position: "absolute",
              left: 0,
              right: 0,
              top: 0,
              zIndex: 1,
            }}
          />
        )}
        <Box
          sx={{
            mb: 4,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            flexWrap: "wrap",
            gap: 2,
          }}
        >
          <Box>
            <Typography
              variant="h4"
              sx={{ fontWeight: 700, color: "#111827", mb: 1 }}
            >
              Live Sessions
            </Typography>
            <Typography variant="body1" sx={{ color: "#6b7280" }}>
              View and verify live sessions. Start meeting (host), open join
              link, sync attendance and recording.
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<IconWrapper icon="mdi:plus" size={20} />}
            onClick={() => setCreateDialogOpen(true)}
            sx={{
              bgcolor: "#6366f1",
              "&:hover": { bgcolor: "#4f46e5" },
            }}
          >
            Create Live Session
          </Button>
        </Box>

        {sessionsContent}

        <CreateLiveSessionDialog
          open={createDialogOpen}
          onClose={() => setCreateDialogOpen(false)}
          onSuccess={() => {
            setCreateDialogOpen(false);
            loadSessions();
          }}
        />

        <LiveSessionDetailDrawer
          liveClassId={selectedLiveClassId}
          open={detailDrawerOpen}
          onClose={() => {
            setDetailDrawerOpen(false);
            setSelectedLiveClassId(null);
          }}
          onUpdated={loadSessions}
        />
      </Container>
    </MainLayout>
  );
}
