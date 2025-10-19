import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSelector } from "react-redux";
import { RootState } from "../../../redux/store";
import {
  getAttendanceActivities,
  getAttendanceActivityDetail,
  createAttendanceActivity,
  AttendanceActivity,
  AttendanceActivityDetail,
} from "../../../services/attendanceApis";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TablePagination,
} from "@mui/material";
import CreateAttendanceDialog from "./CreateAttendanceDialog";
import AttendanceRecordsDialog from "./AttendanceRecordsDialog";
import ActivityTableRow from "./ActivityTableRow";

interface AttendanceManagementProps {
  courseId?: number; // Optional for future use
}

const AttendanceManagement: React.FC<AttendanceManagementProps> = () => {
  const clientId = Number(import.meta.env.VITE_CLIENT_ID);
  const queryClient = useQueryClient();
  const clientInfo = useSelector((state: RootState) => state.clientInfo);

  const [selectedActivity, setSelectedActivity] =
    useState<AttendanceActivity | null>(null);
  const [activityDetail, setActivityDetail] =
    useState<AttendanceActivityDetail | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showRecordsModal, setShowRecordsModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Form state
  const [name, setName] = useState("");
  const [durationMinutes, setDurationMinutes] = useState("30");
  const [formErrors, setFormErrors] = useState<{
    name?: string[];
    duration_minutes?: string[];
  }>({});

  // Generate default name based on client info
  useEffect(() => {
    if (clientInfo?.data?.name && showCreateModal) {
      const clientName = clientInfo.data.name;
      // Extract initials (e.g., "Kakatiya University" -> "KU")
      const initials = clientName
        .split(" ")
        .map((word) => word.charAt(0).toUpperCase())
        .join("");

      // Get current time in 12-hour format

      // Generate name: e.g., "KU-Classroom-10AM" or "KU-Classroom-10:30AM"
      const generatedName = `${initials}-Classroom`;
      setName(generatedName);
    }
  }, [clientInfo, showCreateModal]);

  // Fetch attendance activities
  const { data: activities, isLoading } = useQuery({
    queryKey: ["attendance-activities"],
    queryFn: () => getAttendanceActivities(clientId),
  });

  // Create attendance activity mutation
  const createMutation = useMutation({
    mutationFn: (data: { name: string; duration_minutes: number }) =>
      createAttendanceActivity(clientId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["attendance-activities"],
      });
      setShowCreateModal(false);
      setErrorMessage("");
      setName("");
      setDurationMinutes("30");
      setFormErrors({});
    },
    onError: (error: any) => {
      const errors = error.response?.data;
      if (errors) {
        setFormErrors(errors);
      } else {
        setErrorMessage(
          error.response?.data?.message ||
            "Failed to create attendance activity"
        );
      }
    },
  });

  const handleViewRecords = async (activity: AttendanceActivity) => {
    const detail = await getAttendanceActivityDetail(clientId, activity.id);
    setActivityDetail(detail);
    setSelectedActivity(activity);
    setShowRecordsModal(true);
  };

  const handleCreateActivity = () => {
    setShowCreateModal(true);
  };

  const handleSubmitCreate = () => {
    // Reset errors
    setFormErrors({});

    // Validate
    const errors: any = {};
    if (!name.trim()) {
      errors.name = ["This field is required."];
    }
    if (
      !durationMinutes ||
      isNaN(Number(durationMinutes)) ||
      Number(durationMinutes) <= 0
    ) {
      errors.duration_minutes = [
        "This field is required and must be a positive number.",
      ];
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    createMutation.mutate({
      name: name.trim(),
      duration_minutes: Number(durationMinutes),
    });
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

  const copyCodeToClipboard = (code: string) => {
    navigator.clipboard.writeText(code);
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-[var(--primary-500)]">
            Attendance Activities
          </h2>
          <p className="text-gray-600 mt-1">
            Create and manage attendance activities
          </p>
        </div>
        <button
          onClick={handleCreateActivity}
          disabled={createMutation.isPending}
          className="px-6 py-2 bg-[var(--primary-500)] text-white rounded-lg hover:bg-[#1a4a5f] transition disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          Generate New Code
        </button>
      </div>

      {/* Error Message */}
      {errorMessage && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center gap-2 text-red-800">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clipRule="evenodd"
              />
            </svg>
            <span className="font-medium">{errorMessage}</span>
          </div>
        </div>
      )}

      {/* MUI Table */}
      {isLoading ? (
        <div className="flex items-center justify-center p-8">
          <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-[var(--primary-500)]"></div>
        </div>
      ) : (
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
                    <strong>Name</strong>
                  </TableCell>
                  <TableCell sx={{ fontFamily: "inherit" }}>
                    <strong>Code</strong>
                  </TableCell>
                  <TableCell sx={{ fontFamily: "inherit" }}>
                    <strong>Duration (min)</strong>
                  </TableCell>
                  <TableCell sx={{ fontFamily: "inherit" }}>
                    <strong>Status</strong>
                  </TableCell>
                  <TableCell sx={{ fontFamily: "inherit" }}>
                    <strong>Validity</strong>
                  </TableCell>
                  <TableCell sx={{ fontFamily: "inherit" }}>
                    <strong>Created By</strong>
                  </TableCell>
                  <TableCell sx={{ fontFamily: "inherit" }}>
                    <strong>Created At</strong>
                  </TableCell>
                  <TableCell sx={{ fontFamily: "inherit" }}>
                    <strong>Expires At</strong>
                  </TableCell>
                  <TableCell sx={{ fontFamily: "inherit" }}>
                    <strong>Attendees</strong>
                  </TableCell>
                  <TableCell align="center" sx={{ fontFamily: "inherit" }}>
                    <strong>Actions</strong>
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {activities && activities.length > 0 ? (
                  activities
                    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                    .map((activity) => (
                      <ActivityTableRow
                        key={activity.id}
                        activity={activity}
                        onViewRecords={handleViewRecords}
                        onCopyCode={copyCodeToClipboard}
                      />
                    ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={9} align="center">
                      <div className="py-8 text-gray-500">
                        No attendance activities found.
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
          {activities && activities.length > 0 && (
            <TablePagination
              rowsPerPageOptions={[5, 10, 25, 50]}
              component="div"
              count={activities.length}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={handleChangePage}
              onRowsPerPageChange={handleChangeRowsPerPage}
            />
          )}
        </Paper>
      )}

      {/* Create Modal */}
      <CreateAttendanceDialog
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSubmit={handleSubmitCreate}
        name={name}
        durationMinutes={durationMinutes}
        onNameChange={setName}
        onDurationChange={setDurationMinutes}
        formErrors={formErrors}
        isCreating={createMutation.isPending}
      />

      {/* Records Modal */}
      {showRecordsModal && activityDetail && selectedActivity && (
        <AttendanceRecordsDialog
          open={true}
          activity={selectedActivity}
          records={activityDetail.attendees}
          onClose={() => {
            setShowRecordsModal(false);
            setActivityDetail(null);
            setSelectedActivity(null);
          }}
        />
      )}
    </div>
  );
};

export default AttendanceManagement;
