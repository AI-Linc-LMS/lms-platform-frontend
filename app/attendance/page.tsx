"use client";

import { useEffect, useState, useRef } from "react";
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
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
} from "@mui/material";
import { MainLayout } from "@/components/layout/MainLayout";
import { useToast } from "@/components/common/Toast";
import { IconWrapper } from "@/components/common/IconWrapper";
import {
  activityService,
  LiveAttendanceActivity,
} from "@/lib/services/activity.service";

export default function AttendancePage() {
  const [attendanceActivities, setAttendanceActivities] = useState<
    LiveAttendanceActivity[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [markingAttendance, setMarkingAttendance] = useState<number | null>(
    null
  );
  const [watchingRecordingId, setWatchingRecordingId] = useState<number | null>(
    null
  );
  const [codeDialogOpen, setCodeDialogOpen] = useState(false);
  const [selectedActivityId, setSelectedActivityId] = useState<number | null>(
    null
  );
  const [attendanceCode, setAttendanceCode] = useState<string[]>([
    "",
    "",
    "",
    "",
    "",
    "",
  ]);
  const codeInputRefs = useRef<(HTMLInputElement | null)[]>(
    Array(6).fill(null)
  );
  const { showToast } = useToast();

  useEffect(() => {
    loadAttendanceActivities();
  }, []);

  const loadAttendanceActivities = async () => {
    try {
      setLoading(true);
      const data = await activityService.getLiveAttendance();
      setAttendanceActivities(data);
    } catch (error: any) {
      showToast(
        error?.response?.data?.detail ||
          error?.message ||
          "Failed to load attendance activities",
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAttendanceClick = (activityId: number) => {
    setSelectedActivityId(activityId);
    setCodeDialogOpen(true);
    setAttendanceCode(["", "", "", "", "", ""]);
  };

  const handleWatchRecording = async (activityId: number) => {
    try {
      setWatchingRecordingId(activityId);
      const data = await activityService.getRecording(activityId);
      if (data.recording_url) {
        window.open(data.recording_url, "_blank");
      }
    } catch (error: any) {
      const msg =
        error?.response?.status === 404
          ? error?.response?.data?.error ||
            "Recording is not available for this session yet."
          : error?.response?.data?.detail ||
            error?.response?.data?.message ||
            "Failed to load recording";
      showToast(typeof msg === "string" ? msg : JSON.stringify(msg), "error");
    } finally {
      setWatchingRecordingId(null);
    }
  };

  const handleCopyPassword = (password: string) => {
    navigator.clipboard.writeText(password).then(
      () => showToast("Password copied", "success"),
      () => showToast("Failed to copy", "error")
    );
  };

  const handleCodeDialogClose = () => {
    setCodeDialogOpen(false);
    setSelectedActivityId(null);
    setAttendanceCode(["", "", "", "", "", ""]);
  };

  const handleCodeChange = (index: number, value: string) => {
    // Only allow single character
    if (value.length > 1) return;

    const newCode = [...attendanceCode];
    newCode[index] = value;
    setAttendanceCode(newCode);

    // Auto-focus next input if value entered
    if (value && index < 5) {
      codeInputRefs.current[index + 1]?.focus();
    }
  };

  const handleCodeKeyDown = (
    index: number,
    e: React.KeyboardEvent<HTMLDivElement>
  ) => {
    // Handle backspace to go to previous input
    if (e.key === "Backspace" && !attendanceCode[index] && index > 0) {
      codeInputRefs.current[index - 1]?.focus();
    }
  };

  const handleCodePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").slice(0, 6);
    const newCode = [...attendanceCode];
    for (let i = 0; i < 6; i++) {
      newCode[i] = pastedData[i] || "";
    }
    setAttendanceCode(newCode);
    // Focus the last filled input or the last input
    const lastFilledIndex = Math.min(pastedData.length - 1, 5);
    codeInputRefs.current[lastFilledIndex]?.focus();
  };

  const handleMarkAttendance = async () => {
    if (!selectedActivityId) return;

    const codeString = attendanceCode.join("");
    if (!codeString.trim() || codeString.length !== 6) {
      showToast("Please enter the complete 6-digit attendance code", "error");
      return;
    }

    try {
      setMarkingAttendance(selectedActivityId);
      await activityService.markAttendance(selectedActivityId, codeString);
      showToast("Attendance marked successfully!", "success");
      handleCodeDialogClose();
      // Reload activities to update the status
      await loadAttendanceActivities();
    } catch (error: any) {
      showToast(
        error?.response?.data?.detail ||
          error?.message ||
          "Failed to mark attendance",
        "error"
      );
    } finally {
      setMarkingAttendance(null);
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
    if (minutes < 60) {
      return `${minutes} min left`;
    }
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m left` : `${hours}h left`;
  };

  const isActivityActive = (activity: LiveAttendanceActivity) => {
    const expiresAt = new Date(activity.expires_at);
    const now = new Date();
    return now < expiresAt && activity.time_remaining_minutes > 0;
  };


  const paginatedActivities = attendanceActivities.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  return (
    <MainLayout>
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box sx={{ mb: 4 }}>
          <Typography
            variant="h4"
            sx={{
              fontWeight: 700,
              color: "#111827",
              mb: 1,
            }}
          >
            Attendance
          </Typography>
          <Typography variant="body1" sx={{ color: "#6b7280" }}>
            Mark your attendance by entering the code provided by your
            instructor
          </Typography>
        </Box>

        {attendanceActivities.length === 0 ? (
          <Paper
            sx={{
              p: 4,
              textAlign: "center",
              borderRadius: 2,
              border: "1px solid #e5e7eb",
            }}
          >
            <IconWrapper
              icon="mdi:calendar-check-outline"
              size={64}
              color="#9ca3af"
            />
            <Typography variant="h6" sx={{ color: "#6b7280", mt: 2, mb: 1 }}>
              No Attendance Activities
            </Typography>
            <Typography variant="body2" sx={{ color: "#9ca3af" }}>
              There are no live attendance activities available at the moment.
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
                  {paginatedActivities.map((activity) => {
                    const isActive = isActivityActive(activity);
                    const canMark = isActive && !activity.has_marked_attendance;

                    return (
                      <TableRow
                        key={activity.id}
                        sx={{
                          "&:hover": {
                            backgroundColor: "#f9fafb",
                          },
                        }}
                      >
                        <TableCell>
                          <Typography
                            variant="body2"
                            sx={{
                              fontWeight: 600,
                              color: "#111827",
                            }}
                          >
                            {activity.name}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ color: "#374151" }}>
                            {formatDateTime(activity.expires_at)}
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
                            activity.is_zoom &&
                            activity.zoom_join_url ? (
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
                            ) : activity.meeting_status === "live" &&
                              !activity.has_marked_attendance ? (
                              <Button
                                variant="contained"
                                size="small"
                                onClick={() =>
                                  handleMarkAttendanceClick(activity.id)
                                }
                                disabled={markingAttendance === activity.id}
                                startIcon={
                                  markingAttendance === activity.id ? (
                                    <CircularProgress
                                      size={16}
                                      color="inherit"
                                    />
                                  ) : (
                                    <IconWrapper
                                      icon="mdi:check-circle"
                                      size={18}
                                    />
                                  )
                                }
                                sx={{
                                  backgroundColor: "#10b981",
                                  color: "#ffffff",
                                  textTransform: "none",
                                  fontWeight: 600,
                                  fontSize: "0.875rem",
                                  px: 2,
                                  "&:hover": {
                                    backgroundColor: "#059669",
                                  },
                                  "&:disabled": {
                                    backgroundColor: "#d1d5db",
                                    color: "#9ca3af",
                                  },
                                }}
                              >
                                Mark Attendance
                              </Button>
                            ) : canMark ? (
                              <Button
                                variant="contained"
                                size="small"
                                onClick={() =>
                                  handleMarkAttendanceClick(activity.id)
                                }
                                disabled={markingAttendance === activity.id}
                                startIcon={
                                  markingAttendance === activity.id ? (
                                    <CircularProgress
                                      size={16}
                                      color="inherit"
                                    />
                                  ) : (
                                    <IconWrapper
                                      icon="mdi:check-circle"
                                      size={18}
                                    />
                                  )
                                }
                                sx={{
                                  backgroundColor: "#10b981",
                                  color: "#ffffff",
                                  textTransform: "none",
                                  fontWeight: 600,
                                  fontSize: "0.875rem",
                                  px: 2,
                                  "&:hover": {
                                    backgroundColor: "#059669",
                                  },
                                  "&:disabled": {
                                    backgroundColor: "#d1d5db",
                                    color: "#9ca3af",
                                  },
                                }}
                              >
                                Mark Attendance
                              </Button>
                            ) : activity.has_marked_attendance ? (
                              <Chip
                                label="Marked"
                                size="small"
                                sx={{
                                  backgroundColor: "#dbeafe",
                                  color: "#1e40af",
                                  fontWeight: 600,
                                  fontSize: "0.75rem",
                                }}
                                icon={
                                  <IconWrapper
                                    icon="mdi:check-circle"
                                    size={14}
                                    color="#2563eb"
                                  />
                                }
                              />
                            ) : (activity.meeting_status === "ended" ||
                                activity.meeting_status === "expired") ? (
                              <Chip
                                label={
                                  activity.meeting_status === "ended"
                                    ? "Class Ended"
                                    : "Expired"
                                }
                                size="small"
                                sx={{
                                  backgroundColor:
                                    activity.meeting_status === "ended"
                                      ? "#9ca3af"
                                      : "#ed4545",
                                  color: "#ffffff",
                                  fontWeight: 600,
                                  fontSize: "0.75rem",
                                }}
                              />
                            ) : (
                              <Chip
                                label="Absent"
                                size="small"
                                sx={{
                                  backgroundColor: "#ed4545",
                                  color: "#ffffff",
                                  fontWeight: 600,
                                  fontSize: "0.75rem",
                                }}
                              />
                            )}
                            {(activity.meeting_status === "ended" ||
                              activity.meeting_status === "expired" ||
                              activity.has_marked_attendance) && (
                              <Button
                                variant="text"
                                size="small"
                                disabled={watchingRecordingId === activity.id}
                                startIcon={
                                  watchingRecordingId === activity.id ? (
                                    <CircularProgress
                                      size={14}
                                      color="inherit"
                                    />
                                  ) : (
                                    <IconWrapper
                                      icon="mdi:play-circle-outline"
                                      size={16}
                                    />
                                  )
                                }
                                onClick={() =>
                                  handleWatchRecording(activity.id)
                                }
                                sx={{
                                  fontSize: "0.75rem",
                                  textTransform: "none",
                                  color: "#6366f1",
                                }}
                              >
                                Watch Recording
                              </Button>
                            )}
                          </Box>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
            <TablePagination
              component="div"
              count={attendanceActivities.length}
              page={page}
              onPageChange={(event, newPage) => setPage(newPage)}
              rowsPerPage={rowsPerPage}
              onRowsPerPageChange={(event) => {
                setRowsPerPage(parseInt(event.target.value, 10));
                setPage(0);
              }}
              rowsPerPageOptions={[5, 10, 25, 50]}
              sx={{
                borderTop: "1px solid #e5e7eb",
                "& .MuiTablePagination-toolbar": {
                  px: 2,
                },
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

        {/* Attendance Code Dialog */}
        <Dialog
          open={codeDialogOpen}
          onClose={handleCodeDialogClose}
          maxWidth="sm"
          fullWidth
          PaperProps={{
            sx: {
              borderRadius: 2,
            },
          }}
        >
          <DialogTitle
            sx={{
              fontWeight: 600,
              color: "#111827",
              pb: 1,
            }}
          >
            Mark Attendance
          </DialogTitle>
          <DialogContent>
            <Typography
              variant="body2"
              sx={{ color: "#6b7280", mb: 3, textAlign: "center" }}
            >
              Please enter the 6-digit attendance code to mark your attendance.
            </Typography>
            <Box
              sx={{
                display: "flex",
                justifyContent: "center",
                gap: 1.5,
                mb: 2,
              }}
            >
              {attendanceCode.map((digit, index) => (
                <TextField
                  key={index}
                  inputRef={(el) => {
                    codeInputRefs.current[index] = el;
                  }}
                  value={digit}
                  onChange={(e) => handleCodeChange(index, e.target.value)}
                  onKeyDown={(e) => handleCodeKeyDown(index, e)}
                  onPaste={index === 0 ? handleCodePaste : undefined}
                  inputProps={{
                    maxLength: 1,
                    style: {
                      textAlign: "center",
                      fontSize: "1.5rem",
                      fontWeight: 600,
                      padding: "12px",
                    },
                  }}
                  sx={{
                    width: 56,
                    "& .MuiOutlinedInput-root": {
                      borderRadius: 2,
                      "& fieldset": {
                        borderColor: attendanceCode[index]
                          ? "#10b981"
                          : "#e5e7eb",
                        borderWidth: 2,
                      },
                      "&:hover fieldset": {
                        borderColor: attendanceCode[index]
                          ? "#059669"
                          : "#d1d5db",
                      },
                      "&.Mui-focused fieldset": {
                        borderColor: "#10b981",
                        borderWidth: 2,
                      },
                    },
                  }}
                  autoFocus={index === 0}
                />
              ))}
            </Box>
          </DialogContent>
          <DialogActions
            sx={{
              px: 3,
              pb: 3,
              gap: 2,
            }}
          >
            <Button
              onClick={handleCodeDialogClose}
              variant="outlined"
              sx={{
                textTransform: "none",
                borderRadius: 2,
                px: 3,
                borderColor: "#e5e7eb",
                color: "#6b7280",
                "&:hover": {
                  borderColor: "#d1d5db",
                  backgroundColor: "#f9fafb",
                },
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleMarkAttendance}
              variant="contained"
              disabled={
                markingAttendance !== null ||
                attendanceCode.join("").length !== 6
              }
              sx={{
                backgroundColor: "#10b981",
                color: "#ffffff",
                textTransform: "none",
                borderRadius: 2,
                px: 3,
                fontWeight: 600,
                "&:hover": {
                  backgroundColor: "#059669",
                },
                "&:disabled": {
                  backgroundColor: "#d1d5db",
                  color: "#9ca3af",
                },
              }}
              startIcon={
                markingAttendance !== null ? (
                  <CircularProgress size={16} color="inherit" />
                ) : (
                  <IconWrapper icon="mdi:check-circle" size={18} />
                )
              }
            >
              Submit
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </MainLayout>
  );
}
