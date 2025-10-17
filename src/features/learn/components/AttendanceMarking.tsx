import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getLiveAttendanceActivities,
  markAttendance,
} from "../../../services/attendanceApis";
import AttendanceDialog from "./AttendanceDialog";
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
} from "@mui/material";

interface AttendanceMarkingProps {
  activityId?: number; // Optional for future use
}

const AttendanceMarking: React.FC<AttendanceMarkingProps> = () => {
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

  // Fetch live attendance activities
  const { data: liveActivities, isLoading: isLoadingActivities } = useQuery({
    queryKey: ["live-attendance"],
    queryFn: () => getLiveAttendanceActivities(clientId),
    refetchInterval: 60000, // Refetch every 60 seconds
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
    onSuccess: (response) => {
      setMessage({ type: "success", text: response.message });
      setCode("");
      setSelectedActivityId(null);
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
        text: error.response?.data?.message || "Invalid or expired code",
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
      setMessage({ type: "error", text: "Please select an activity" });
      return;
    }

    if (!code.trim()) {
      setMessage({ type: "error", text: "Please enter the attendance code" });
      return;
    }

    if (code.length !== 6) {
      setMessage({ type: "error", text: "Code must be 6 digits" });
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
    <div className="max-w-6xl mx-auto p-6">
      {/* Live Attendance Activities */}
      <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
        <h2 className="text-2xl font-bold text-[var(--primary-500)] mb-6">
          Live Attendance Sessions
        </h2>

        {liveActivities && liveActivities.length > 0 ? (
          <Paper sx={{ width: "100%", overflow: "hidden" }}>
            <TableContainer sx={{ maxHeight: 600 }}>
              <Table stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell>
                      <strong>Name</strong>
                    </TableCell>
                    <TableCell>
                      <strong>Expires At</strong>
                    </TableCell>
                    <TableCell>
                      <strong>Time Remaining</strong>
                    </TableCell>
                    <TableCell align="center">
                      <strong>Action</strong>
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

                      return (
                        <TableRow key={activity.id} hover>
                          <TableCell>{activity.name}</TableCell>
                          <TableCell>
                            {new Date(activity.expires_at).toLocaleString(
                              "en-IN",
                              {
                                dateStyle: "short",
                                timeStyle: "short",
                              }
                            )}
                          </TableCell>
                          <TableCell>
                            {timeRemaining !== undefined ? (
                              <Chip
                                label={
                                  isExpired
                                    ? "Expired"
                                    : `${timeRemaining} min${
                                        timeRemaining !== 1 ? "s" : ""
                                      } left`
                                }
                                color={
                                  isExpired
                                    ? "default"
                                    : isUrgent
                                    ? "error"
                                    : "success"
                                }
                                size="small"
                              />
                            ) : (
                              "-"
                            )}
                          </TableCell>
                          <TableCell align="center">
                            <Button
                              variant="contained"
                              color="primary"
                              size="small"
                              onClick={() => handleActivitySelect(activity.id)}
                              disabled={isExpired}
                            >
                              Mark Attendance
                            </Button>
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
            />
          </Paper>
        ) : (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📋</div>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">
              No Active Attendance Sessions
            </h3>
            <p className="text-gray-500">
              Your instructor hasn't started an attendance session yet. Check
              back later!
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
    </div>
  );
};

export default AttendanceMarking;
