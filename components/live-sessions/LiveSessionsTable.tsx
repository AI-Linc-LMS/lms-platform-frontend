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
  Tooltip,
} from "@mui/material";
import { IconWrapper } from "@/components/common/IconWrapper";
import { RECORDING_NOT_AVAILABLE_FRIENDLY_MESSAGE } from "@/lib/utils/live-session-errors";
import type { StudentLiveSession } from "@/lib/services/live-sessions";

interface LiveSessionsTableProps {
  sessions: StudentLiveSession[];
  page: number;
  rowsPerPage: number;
  onPageChange: (event: unknown, newPage: number) => void;
  onRowsPerPageChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onCopyPassword: (password: string) => void;
  onWatchRecording: (activity: StudentLiveSession) => void;
  watchingRecordingId: number | null;
  formatDateTime: (dateString: string) => string;
  formatTimeRemaining: (minutes: number) => string;
}

export function LiveSessionsTable({
  sessions,
  page,
  rowsPerPage,
  onPageChange,
  onRowsPerPageChange,
  onCopyPassword,
  onWatchRecording,
  watchingRecordingId,
  formatDateTime,
  formatTimeRemaining,
}: LiveSessionsTableProps) {
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
                sx={{ "&:hover": { backgroundColor: "#f9fafb" } }}
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
                    <Typography variant="body2" sx={{ color: "#374151" }}>
                      {formatTimeRemaining(activity.time_remaining_minutes)}
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
                              window.open(activity.zoom_join_url!, "_blank")
                            }
                            startIcon={
                              <IconWrapper icon="mdi:video" size={18} />
                            }
                            sx={{
                              backgroundColor: "#6366f1",
                              color: "#ffffff",
                              textTransform: "none",
                              fontWeight: 600,
                              fontSize: "0.875rem",
                              px: 2,
                              "&:hover": { backgroundColor: "#4f46e5" },
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
                                  onCopyPassword(activity.zoom_password!)
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
                          onClick={() => onWatchRecording(activity)}
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
          "& .MuiTablePagination-select": { fontSize: "0.875rem" },
        }}
      />
    </Paper>
  );
}
