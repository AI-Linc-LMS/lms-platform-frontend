import React, { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getLiveAttendanceActivities,
  markAttendance,
} from "../../../services/attendanceApis";
import AttendanceDialog from "./AttendanceDialog";
import { useTranslation } from "react-i18next";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TablePagination,
  Button,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";

interface AttendanceMarkingProps {
  activityId?: number; // Optional for future use
}

const AttendanceMarking: React.FC<AttendanceMarkingProps> = () => {
  const { t, i18n } = useTranslation();
  const clientId = Number(import.meta.env.VITE_CLIENT_ID);
  const queryClient = useQueryClient();

  const [code, setCode] = useState("");
  const [selectedActivityId, setSelectedActivityId] = useState<number | null>(
    null
  );
  const [message, setMessage] = useState<{
    type: "success" | "error" | "";
    text: string;
  }>({ type: "", text: "" });
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);

  const locale = useMemo(() => {
    switch (i18n.language) {
      case "hi":
        return "hi-IN";
      case "ar":
        return "ar-SA";
      case "fr":
        return "fr-FR";
      default:
        return "en-IN";
    }
  }, [i18n.language]);

  // Fetch live attendance activities - only refetch when tab is visible
  const { data: liveActivities, isLoading: isLoadingActivities } = useQuery({
    queryKey: ["live-attendance"],
    queryFn: () => getLiveAttendanceActivities(clientId),
    refetchInterval: () => {
      // Only refetch if tab is visible
      return !document.hidden ? 60000 : false; // Refetch every 60 seconds when visible
    },
    refetchOnWindowFocus: false, // Disabled to avoid unnecessary refetches
    refetchOnMount: false, // Only refetch if data is stale
    staleTime: 1000 * 60 * 2, // 2 minutes - data is fresh for 2 min
    gcTime: 1000 * 60 * 5, // 5 minutes - keep in cache
  });

  // Mark attendance mutation
  const markAttendanceMutation = useMutation({
    mutationFn: ({
      activityId,
      attendanceCode,
    }: {
      activityId: number;
      attendanceCode: string;
    }) => markAttendance(clientId, activityId, { code: attendanceCode }),
    onSuccess: () => {
      setMessage({ type: "success", text: t("attendance.success") });
      setCode("");
      setSelectedActivityId(null);
      setShowSuccessDialog(true);
      queryClient.invalidateQueries({
        queryKey: ["live-attendance"],
      });

      // Clear success message after 5 seconds
      setTimeout(() => {
        setMessage({ type: "", text: "" });
      }, 5000);
    },
    onError: (error: any) => {
      setMessage({
        type: "error",
        text:
          error?.response?.data?.error || t("attendance.errors.invalidCode"),
      });

      // Clear error message after 5 seconds
      setTimeout(() => {
        setMessage({ type: "", text: "" });
      }, 5000);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedActivityId) {
      setMessage({
        type: "error",
        text: t("attendance.errors.selectActivity"),
      });
      return;
    }

    if (!code.trim()) {
      setMessage({
        type: "error",
        text: t("attendance.errors.enterCode"),
      });
      return;
    }

    if (code.length !== 6) {
      setMessage({
        type: "error",
        text: t("attendance.errors.invalidLength"),
      });
      return;
    }

    markAttendanceMutation.mutate({
      activityId: selectedActivityId,
      attendanceCode: code.trim(),
    });
  };

  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, "").slice(0, 6);
    setCode(value);
  };

  const handleActivitySelect = (activityId: number) => {
    setSelectedActivityId(activityId);
    setCode("");
    setMessage({ type: "", text: "" });
  };

  const handleClose = () => {
    setSelectedActivityId(null);
    setCode("");
    setMessage({ type: "", text: "" });
  };

  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const isPending = markAttendanceMutation.isPending;

  if (isLoadingActivities) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-[var(--primary-500)]"></div>
      </div>
    );
  }

  const selectedActivity = liveActivities?.find(
    (activity) => activity.id === selectedActivityId
  );

  return (
    <div className="max-w-6xl mx-auto p-4">
      {/* Live Attendance Activities */}
      <div className="bg-white rounded-lg shadow-lg p-4 mb-4">
        <h2 className="text-2xl font-bold text-[var(--primary-500)] mb-4">
          {t("attendance.liveSessions")}
        </h2>

        {liveActivities && liveActivities.length > 0 ? (
          <Paper
            sx={{
              width: "100%",
              overflow: "hidden",
              fontFamily:
                'Lato, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
            }}
          >
            <TableContainer sx={{ maxHeight: 600 }}>
              <Table stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontFamily: "inherit" }}>
                      <strong>{t("attendance.headers.name")}</strong>
                    </TableCell>
                    <TableCell sx={{ fontFamily: "inherit" }}>
                      <strong>{t("attendance.headers.expiresAt")}</strong>
                    </TableCell>
                    <TableCell sx={{ fontFamily: "inherit" }}>
                      <strong>{t("attendance.headers.timeRemaining")}</strong>
                    </TableCell>
                    <TableCell align="center" sx={{ fontFamily: "inherit" }}>
                      <strong>{t("attendance.headers.action")}</strong>
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {liveActivities
                    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                    .map((activity) => {
                      const timeRemaining = activity.time_remaining_minutes;
                      const isExpired = timeRemaining === 0;
                      const isUrgent =
                        timeRemaining !== undefined &&
                        timeRemaining < 5 &&
                        timeRemaining > 0;
                      const hasMarked = activity.has_marked_attendance;

                      return (
                        <TableRow key={activity.id} hover>
                          <TableCell sx={{ fontFamily: "inherit" }}>
                            {activity.name}
                          </TableCell>
                          <TableCell sx={{ fontFamily: "inherit" }}>
                            {new Date(activity.expires_at).toLocaleString(
                              locale,
                              {
                                dateStyle: "short",
                                timeStyle: "short",
                              }
                            )}
                          </TableCell>
                          <TableCell sx={{ fontFamily: "inherit" }}>
                            {timeRemaining !== undefined ? (
                              <Chip
                                label={
                                  isExpired
                                    ? t("attendance.labels.expired")
                                    : t("attendance.labels.minutesLeft", {
                                        count: timeRemaining ?? 0,
                                      })
                                }
                                color={
                                  isExpired
                                    ? "error"
                                    : isUrgent
                                    ? "error"
                                    : "success"
                                }
                                size="small"
                                sx={{ fontFamily: "inherit" }}
                              />
                            ) : (
                              "-"
                            )}
                          </TableCell>
                          <TableCell
                            align="center"
                            sx={{ fontFamily: "inherit" }}
                          >
                            {hasMarked ? (
                              <Chip
                                icon={<CheckCircleIcon />}
                                label={t("attendance.status.present")}
                                color="success"
                                size="small"
                                sx={{ fontFamily: "inherit" }}
                              />
                            ) : isExpired && !hasMarked ? (
                              <Chip
                                label={t("attendance.status.absent")}
                                color="error"
                                size="small"
                                sx={{ fontFamily: "inherit" }}
                              />
                            ) : (
                              <Button
                                variant="contained"
                                color="primary"
                                size="small"
                                onClick={() =>
                                  handleActivitySelect(activity.id)
                                }
                                sx={{ fontFamily: "inherit" }}
                              >
                                {t("attendance.actions.mark")}
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                </TableBody>
              </Table>
            </TableContainer>
            <TablePagination
              rowsPerPageOptions={[5, 10, 25]}
              component="div"
              count={liveActivities.length}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={handleChangePage}
              onRowsPerPageChange={handleChangeRowsPerPage}
              labelRowsPerPage={t("attendance.rowsPerPage")}
            />
          </Paper>
        ) : (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📋</div>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">
              {t("attendance.empty.title")}
            </h3>
            <p className="text-gray-500">
              {t("attendance.empty.description")}
            </p>
          </div>
        )}
      </div>

      {/* Attendance Dialog */}
      <AttendanceDialog
        open={!!selectedActivity}
        selectedActivity={selectedActivity}
        code={code}
        message={message}
        isPending={isPending}
        onClose={handleClose}
        onCodeChange={handleCodeChange}
        onSubmit={handleSubmit}
      />

      {/* Success Dialog */}
      <Dialog
        open={showSuccessDialog}
        onClose={() => setShowSuccessDialog(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            fontFamily:
              'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
          },
        }}
      >
        <DialogTitle className="text-center" sx={{ fontFamily: "inherit" }}>
          <div className="flex flex-col items-center gap-2">
            <CheckCircleIcon sx={{ fontSize: 60, color: "success.main" }} />
            <span className="text-2xl font-bold text-green-600">
              {t("common.success")}
            </span>
          </div>
        </DialogTitle>
        <DialogContent sx={{ fontFamily: "inherit" }}>
          <div className="text-center py-4">
            <p className="text-lg text-gray-700">
              {t("attendance.dialog.successMessage")}
            </p>
          </div>
        </DialogContent>
        <DialogActions
          className="justify-center pb-4"
          sx={{ fontFamily: "inherit" }}
        >
          <Button
            onClick={() => setShowSuccessDialog(false)}
            variant="contained"
            color="success"
            size="large"
            sx={{ fontFamily: "inherit" }}
          >
            {t("common.ok")}
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default AttendanceMarking;
