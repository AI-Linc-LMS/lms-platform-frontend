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
import { IconWrapper } from "@/components/common/IconWrapper";
import { RECORDING_NOT_AVAILABLE_FRIENDLY_MESSAGE } from "@/lib/utils/live-session-errors";
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
  const paginatedSessions = sessions.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  return (
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
                Course
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
                Attended
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
                  <Typography variant="body2" sx={{ color: "#374151" }}>
                    {activity.course_detail?.title ?? "—"}
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
                  <Typography variant="body2" sx={{ color: "#374151" }}>
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
                    {!activity.zoom_meeting_id && !activity.zoom_join_url && (
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
                            onCopyPassword(activity.zoom_password!)
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
                          onClick={() => onWatchRecording(activity)}
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
                    onClick={() => onViewSession(activity)}
                    aria-label="View session"
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
  );
}
