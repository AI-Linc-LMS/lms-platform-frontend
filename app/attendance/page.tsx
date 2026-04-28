"use client";

import { useEffect, useState, useRef } from "react";
import { useTranslation } from "react-i18next";
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
  const { t } = useTranslation("common");
  const { showToast } = useToast();

  useEffect(() => {
    loadAttendanceActivities();
  }, []);

  const loadAttendanceActivities = async () => {
    try {
      setLoading(true);
      const data = await activityService.getLiveAttendance();
      setAttendanceActivities(Array.isArray(data) ? data : []);
    } catch (error: any) {
      showToast(
        error?.response?.data?.detail ||
          error?.message ||
          t("attendance.failedToLoad"),
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
      showToast(t("attendance.enterCode"), "error");
      return;
    }

    try {
      setMarkingAttendance(selectedActivityId);
      await activityService.markAttendance(selectedActivityId, codeString);
      showToast(t("attendance.markedSuccess"), "success");
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
    if (minutes <= 0) return t("attendance.expired");
    if (minutes < 60) {
      return `${minutes} min left`;
    }
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m left` : `${hours}h left`;
  };

  const isActivityActive = (activity: LiveAttendanceActivity) => {
    const expiresAtValue = activity.expires_at ?? activity.class_datetime;
    if (!expiresAtValue) return false;
    const expiresAt = new Date(expiresAtValue);
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
              color: "var(--font-primary)",
              mb: 1,
            }}
          >
            {t("nav.attendance")}
          </Typography>
          <Typography variant="body1" sx={{ color: "var(--font-secondary)" }}>
            {t("nav.liveSessions")}
          </Typography>
        </Box>

        {attendanceActivities.length === 0 ? (
          <Paper
            sx={{
              p: 4,
              textAlign: "center",
              borderRadius: 2,
              border: "1px solid var(--border-default)",
              backgroundColor: "var(--card-bg)",
            }}
          >
            <IconWrapper
              icon="mdi:calendar-check-outline"
              size={64}
              color="var(--font-tertiary)"
            />
            <Typography variant="h6" sx={{ color: "var(--font-secondary)", mt: 2, mb: 1 }}>
              No Attendance Activities
            </Typography>
            <Typography variant="body2" sx={{ color: "var(--font-tertiary)" }}>
              There are no live attendance activities available at the moment.
            </Typography>
          </Paper>
        ) : (
          <Paper
            sx={{
              borderRadius: 2,
              border: "1px solid var(--border-default)",
              backgroundColor: "var(--card-bg)",
              overflow: "hidden",
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
                      {t("attendance.name")}
                    </TableCell>
                    <TableCell
                      sx={{
                        fontWeight: 600,
                        color: "var(--font-primary)",
                        fontSize: "0.875rem",
                      }}
                    >
                      {t("attendance.expiresAt")}
                    </TableCell>
                    <TableCell
                      sx={{
                        fontWeight: 600,
                        color: "var(--font-primary)",
                        fontSize: "0.875rem",
                      }}
                    >
                      {t("attendance.timeRemaining")}
                    </TableCell>
                    <TableCell
                      sx={{
                        fontWeight: 600,
                        color: "var(--font-primary)",
                        fontSize: "0.875rem",
                      }}
                      align="right"
                    >
                      {t("attendance.action")}
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
                            backgroundColor: "var(--surface)",
                          },
                        }}
                      >
                        <TableCell>
                          <Typography
                            variant="body2"
                            sx={{
                              fontWeight: 600,
                              color: "var(--font-primary)",
                            }}
                          >
                            {activity.topic_name ?? activity.name ?? "—"}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ color: "var(--font-primary)" }}>
                            {(activity.expires_at ?? activity.class_datetime)
                              ? formatDateTime(
                                  activity.expires_at ?? activity.class_datetime ?? ""
                                )
                              : "—"}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          {activity.time_remaining_minutes <= 0 ? (
                            <Chip
                              label="Expired"
                              size="small"
                              sx={{
                                backgroundColor: "var(--error-500)",
                                color: "var(--font-light)",
                                fontWeight: 600,
                                fontSize: "0.75rem",
                              }}
                            />
                          ) : (
                            <Typography
                              variant="body2"
                              sx={{
                                color: "var(--font-primary)",
                              }}
                            >
                              {formatTimeRemaining(
                                activity.time_remaining_minutes
                              )}
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell align="right">
                          {canMark ? (
                            <Button
                              variant="contained"
                              size="small"
                              onClick={() =>
                                handleMarkAttendanceClick(activity.id)
                              }
                              disabled={markingAttendance === activity.id}
                              startIcon={
                                markingAttendance === activity.id ? (
                                  <CircularProgress size={16} color="inherit" />
                                ) : (
                                  <IconWrapper
                                    icon="mdi:check-circle"
                                    size={18}
                                  />
                                )
                              }
                              sx={{
                                backgroundColor: "var(--success-500)",
                                color: "var(--font-light)",
                                textTransform: "none",
                                fontWeight: 600,
                                fontSize: "0.875rem",
                                px: 2,
                                "&:hover": {
                                  backgroundColor:
                                    "color-mix(in srgb, var(--success-500) 86%, var(--accent-indigo-dark))",
                                },
                                "&:disabled": {
                                  backgroundColor:
                                    "color-mix(in srgb, var(--success-500) 24%, var(--surface) 76%)",
                                  color: "var(--font-secondary)",
                                },
                              }}
                            >
                              Mark Attendance
                            </Button>
                          ) : activity.has_marked_attendance ? (
                            <Chip
                              label={t("attendance.marked")}
                              size="small"
                              sx={{
                                backgroundColor:
                                  "color-mix(in srgb, var(--accent-indigo) 14%, var(--surface) 86%)",
                                color: "var(--accent-indigo)",
                                fontWeight: 600,
                                fontSize: "0.75rem",
                              }}
                              icon={
                                <IconWrapper
                                  icon="mdi:check-circle"
                                  size={14}
                                  color="var(--accent-indigo)"
                                />
                              }
                            />
                          ) : (
                            <Chip
                              label={t("attendance.absent")}
                              size="small"
                              sx={{
                                backgroundColor: "var(--error-500)",
                                color: "var(--font-light)",
                                fontWeight: 600,
                                fontSize: "0.75rem",
                              }}
                            />
                          )}
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
                borderTop: "1px solid var(--border-default)",
                "& .MuiTablePagination-toolbar": {
                  px: 2,
                },
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
              color: "var(--font-primary)",
              pb: 1,
            }}
          >
            Mark Attendance
          </DialogTitle>
          <DialogContent>
            <Typography
              variant="body2"
              sx={{ color: "var(--font-secondary)", mb: 3, textAlign: "center" }}
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
                          ? "var(--success-500)"
                          : "var(--border-default)",
                        borderWidth: 2,
                      },
                      "&:hover fieldset": {
                        borderColor: attendanceCode[index]
                          ? "color-mix(in srgb, var(--success-500) 86%, var(--accent-indigo-dark))"
                          : "color-mix(in srgb, var(--font-secondary) 35%, var(--border-default) 65%)",
                      },
                      "&.Mui-focused fieldset": {
                        borderColor: "var(--success-500)",
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
                borderColor: "var(--border-default)",
                color: "var(--font-secondary)",
                "&:hover": {
                  borderColor:
                    "color-mix(in srgb, var(--font-secondary) 35%, var(--border-default) 65%)",
                  backgroundColor: "var(--surface)",
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
                backgroundColor: "var(--success-500)",
                color: "var(--font-light)",
                textTransform: "none",
                borderRadius: 2,
                px: 3,
                fontWeight: 600,
                "&:hover": {
                  backgroundColor:
                    "color-mix(in srgb, var(--success-500) 86%, var(--accent-indigo-dark))",
                },
                "&:disabled": {
                  backgroundColor:
                    "color-mix(in srgb, var(--success-500) 24%, var(--surface) 76%)",
                  color: "var(--font-secondary)",
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