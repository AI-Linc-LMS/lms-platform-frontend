"use client";

import {
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
  Typography,
  Box,
  CircularProgress,
  IconButton,
  Tooltip,
} from "@mui/material";
import { useTranslation } from "react-i18next";
import { IconWrapper } from "@/components/common/IconWrapper";
import type { LiveActivity } from "@/lib/services/admin/admin-live-activities.service";

interface AdminLiveSessionsTableProps {
  sessions: LiveActivity[];
  uniqueAttendanceCounts?: Record<number, number>;
  page: number;
  rowsPerPage: number;
  onPageChange: (event: unknown, newPage: number) => void;
  onRowsPerPageChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  creatingZoomId: number | null;
  watchingRecordingId: number | null;
  onCreateZoom: (liveClassId: number) => void;
  onWatchRecording: (activity: LiveActivity) => void;
  onCopyPassword: (password: string) => void;
  onViewSession: (activity: LiveActivity) => void;
  formatDateTime: (dateString: string) => string;
}

export function AdminLiveSessionsTable({
  sessions,
  uniqueAttendanceCounts = {},
  page,
  rowsPerPage,
  onPageChange,
  onRowsPerPageChange,
  creatingZoomId,
  watchingRecordingId,
  onCreateZoom,
  onWatchRecording,
  onCopyPassword,
  onViewSession,
  formatDateTime,
}: AdminLiveSessionsTableProps) {
  const { t } = useTranslation("common");
  const paginatedSessions = sessions.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  return (
    <Paper
      sx={{
        borderRadius: 2,
        border: "1px solid var(--border-default)",
        overflow: "hidden",
        backgroundColor: "var(--card-bg)",
      }}
    >
      <TableContainer>
        <Table>
          <TableHead>
            <TableRow sx={{ backgroundColor: "var(--surface)" }}>
              <TableCell
                sx={{
                  fontWeight: 600,
                  color: "var(--font-primary)",
                  fontSize: "0.875rem",
                }}
              >
                {t("adminLiveSessions.topic")}
              </TableCell>
              <TableCell
                sx={{
                  fontWeight: 600,
                  color: "var(--font-primary)",
                  fontSize: "0.875rem",
                }}
              >
                {t("adminLiveSessions.classDateTime")}
              </TableCell>
              <TableCell
                sx={{
                  fontWeight: 600,
                  color: "var(--font-primary)",
                  fontSize: "0.875rem",
                }}
              >
                {t("adminLiveSessions.course")}
              </TableCell>
              <TableCell
                sx={{
                  fontWeight: 600,
                  color: "var(--font-primary)",
                  fontSize: "0.875rem",
                }}
              >
                {t("adminLiveSessions.status")}
              </TableCell>
              <TableCell
                sx={{
                  fontWeight: 600,
                  color: "var(--font-primary)",
                  fontSize: "0.875rem",
                }}
              >
                {t("adminLiveSessions.attended")}
              </TableCell>
              <TableCell
                sx={{
                  fontWeight: 600,
                  color: "var(--font-primary)",
                  fontSize: "0.875rem",
                }}
              >
                {t("adminLiveSessions.actions")}
              </TableCell>
              <TableCell
                sx={{
                  fontWeight: 600,
                  color: "var(--font-primary)",
                  fontSize: "0.875rem",
                  width: 48,
                }}
              >
                {t("adminLiveSessions.view")}
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {paginatedSessions.map((activity) => (
              <TableRow
                key={activity.id}
                sx={{
                  "&:hover": { backgroundColor: "var(--surface)" },
                }}
              >
                <TableCell>
                  <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
                    <Box sx={{ display: "flex", gap: 0.5, flexWrap: "wrap", alignItems: "center" }}>
                      {activity.is_google_meet ? (
                        <Chip
                          label={t("adminLiveSessions.platformMeet")}
                          size="small"
                          sx={{
                            bgcolor: "color-mix(in srgb, var(--success-500) 14%, var(--surface) 86%)",
                            color: "var(--success-500)",
                            fontWeight: 600,
                            fontSize: "0.7rem",
                            height: 22,
                          }}
                        />
                      ) : activity.is_zoom || activity.zoom_meeting_id ? (
                        <Chip
                          label={t("adminLiveSessions.platformZoom")}
                          size="small"
                          sx={{
                            bgcolor: "color-mix(in srgb, var(--accent-indigo) 12%, var(--surface) 88%)",
                            color: "var(--accent-indigo)",
                            fontWeight: 600,
                            fontSize: "0.7rem",
                            height: 22,
                          }}
                        />
                      ) : null}
                    </Box>
                    <Typography
                      variant="body2"
                      sx={{ fontWeight: 600, color: "var(--font-primary)" }}
                    >
                      {activity.topic_name ?? "—"}
                    </Typography>
                  </Box>
                </TableCell>
                <TableCell>
                  <Typography variant="body2" sx={{ color: "var(--font-primary)" }}>
                    {activity.class_datetime
                      ? formatDateTime(activity.class_datetime)
                      : "—"}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2" sx={{ color: "var(--font-primary)" }}>
                    {activity.course_detail?.title ?? "—"}
                  </Typography>
                </TableCell>
                <TableCell>
                  {activity.meeting_status === "live" ? (
                    <Chip
                      label={t("liveSessions.live")}
                      size="small"
                      sx={{
                        backgroundColor:
                          "color-mix(in srgb, var(--success-500) 16%, transparent)",
                        color: "var(--success-500)",
                        fontWeight: 600,
                        fontSize: "0.75rem",
                      }}
                    />
                  ) : activity.meeting_status === "ended" ? (
                    <Chip
                      label={t("adminLiveSessions.ended")}
                      size="small"
                      sx={{
                        backgroundColor:
                          "color-mix(in srgb, var(--font-tertiary) 45%, transparent)",
                        color: "var(--font-primary)",
                        fontWeight: 600,
                        fontSize: "0.75rem",
                      }}
                    />
                  ) : activity.meeting_status === "expired" ? (
                    <Chip
                      label={t("liveSessions.expired")}
                      size="small"
                      sx={{
                        backgroundColor:
                          "color-mix(in srgb, var(--warning-500) 18%, transparent)",
                        color: "var(--warning-500)",
                        fontWeight: 600,
                        fontSize: "0.75rem",
                      }}
                    />
                  ) : activity.meeting_status === "scheduled" ? (
                    <Chip
                      label={t("liveSessions.scheduled")}
                      size="small"
                      sx={{
                        backgroundColor:
                          "color-mix(in srgb, var(--accent-indigo) 16%, transparent)",
                        color: "var(--accent-indigo)",
                        fontWeight: 600,
                        fontSize: "0.75rem",
                      }}
                    />
                  ) : (
                    <Typography variant="body2" sx={{ color: "var(--font-primary)" }}>
                      —
                    </Typography>
                  )}
                </TableCell>
                <TableCell>
                  <Typography variant="body2" sx={{ color: "var(--font-primary)" }}>
                    {uniqueAttendanceCounts[activity.id] != null && uniqueAttendanceCounts[activity.id] > 0
                      ? uniqueAttendanceCounts[activity.id]
                      : "—"}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Box
                    sx={{
                      display: "flex",
                      flexDirection: "column",
                      gap: 1,
                    }}
                  >
                    {!activity.is_google_meet &&
                      !activity.zoom_meeting_id &&
                      !activity.zoom_join_url && (
                      <Button
                        variant="outlined"
                        size="small"
                        disabled={creatingZoomId === activity.id}
                        onClick={() => onCreateZoom(activity.id)}
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
                          borderColor: "var(--accent-indigo)",
                          color: "var(--accent-indigo)",
                          "&:hover": {
                            borderColor: "var(--accent-indigo-dark)",
                            backgroundColor:
                              "color-mix(in srgb, var(--accent-indigo) 10%, var(--surface) 90%)",
                          },
                        }}
                      >
                        {t("adminLiveSessions.createZoom")}
                      </Button>
                    )}
                    {(activity.meeting_status === "scheduled" ||
                      activity.meeting_status === "live") &&
                      activity.is_google_meet &&
                      activity.join_link?.trim() && (
                        <Button
                          variant="contained"
                          size="small"
                          onClick={() =>
                            window.open(activity.join_link!.trim(), "_blank")
                          }
                          startIcon={
                            <IconWrapper icon="mdi:video" size={16} />
                          }
                          sx={{
                            textTransform: "none",
                            fontSize: "0.8rem",
                            alignSelf: "flex-start",
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
                      )}
                    {(activity.meeting_status === "scheduled" ||
                      activity.meeting_status === "live") &&
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
                            bgcolor: "var(--accent-indigo)",
                            color: "var(--font-light)",
                            "&:hover": { bgcolor: "var(--accent-indigo-dark)" },
                          }}
                        >
                          {t("adminLiveSessions.startMeeting")}
                        </Button>
                      )}
                    {(activity.meeting_status === "scheduled" ||
                      activity.meeting_status === "live") &&
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
                          {t("adminLiveSessions.openJoinLink")}
                        </Button>
                      )}
                    {(activity.meeting_status === "scheduled" ||
                      activity.meeting_status === "live") &&
                      activity.zoom_password && (
                      <Typography
                        variant="caption"
                        sx={{
                          color: "var(--font-secondary)",
                          display: "flex",
                          alignItems: "center",
                          gap: 0.5,
                        }}
                      >
                        {t("liveSessions.password")}: {activity.zoom_password}
                        <Button
                          size="small"
                          sx={{
                            minWidth: 0,
                            p: 0.25,
                            fontSize: "0.7rem",
                            textTransform: "none",
                          }}
                          onClick={() =>
                            onCopyPassword(activity.zoom_password!)
                          }
                        >
                          {t("liveSessions.copy")}
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
                          onClick={() => onWatchRecording(activity)}
                          sx={{
                            fontSize: "0.75rem",
                            textTransform: "none",
                            color: "var(--accent-indigo)",
                            alignSelf: "flex-start",
                            "&:hover": {
                              backgroundColor:
                                "color-mix(in srgb, var(--accent-indigo) 10%, transparent)",
                            },
                          }}
                        >
                          {t("adminLiveSessions.openRecording")}
                        </Button>
                      ) : (
                        <Tooltip
                          title={t("liveSessions.recordingNotAvailable")}
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
                                color: "var(--font-secondary)",
                                alignSelf: "flex-start",
                                "&.Mui-disabled": {
                                  color: "var(--font-secondary)",
                                  WebkitTextFillColor: "var(--font-secondary)",
                                  opacity: 0.85,
                                },
                              }}
                            >
                              {t("adminLiveSessions.openRecording")}
                            </Button>
                          </span>
                        </Tooltip>
                      ))}
                  </Box>
                </TableCell>
                <TableCell>
                  <IconButton
                    size="small"
                    onClick={() => onViewSession(activity)}
                    aria-label={t("adminLiveSessions.viewSession")}
                  >
                    <IconWrapper icon="mdi:eye" size={20} />
                  </IconButton>
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
        onPageChange={onPageChange}
        rowsPerPage={rowsPerPage}
        onRowsPerPageChange={onRowsPerPageChange}
        rowsPerPageOptions={[5, 10, 25, 50]}
        sx={{
          borderTop: "1px solid var(--border-default)",
          "& .MuiTablePagination-toolbar": { px: 2 },
          "& .MuiTablePagination-selectLabel": {
            fontSize: "0.875rem",
            color: "var(--font-secondary)",
          },
          "& .MuiTablePagination-displayedRows": {
            fontSize: "0.875rem",
            color: "var(--font-secondary)",
          },
          "& .MuiTablePagination-select": {
            fontSize: "0.875rem",
          },
        }}
      />
    </Paper>
  );
}
