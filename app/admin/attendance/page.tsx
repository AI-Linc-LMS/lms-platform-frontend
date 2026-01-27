"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Box,
  Typography,
  Paper,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Pagination,
  Select,
  MenuItem,
  FormControl,
  IconButton,
} from "@mui/material";
import { MainLayout } from "@/components/layout/MainLayout";
import { useToast } from "@/components/common/Toast";
import { Loading } from "@/components/common/Loading";
import { IconWrapper } from "@/components/common/IconWrapper";
import {
  adminAttendanceService,
  AttendanceActivity,
} from "@/lib/services/admin/admin-attendance.service";
import { ViewActivityPanel } from "@/components/admin/attendance/ViewActivityPanel";
import { CreateActivityDialog } from "@/components/admin/attendance/CreateActivityDialog";

export default function AttendancePage() {
  const { showToast } = useToast();

  const [allActivities, setAllActivities] = useState<AttendanceActivity[]>([]);
  const [activities, setActivities] = useState<AttendanceActivity[]>([]);
  const [loading, setLoading] = useState(true);

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);

  const [selectedActivity, setSelectedActivity] =
    useState<AttendanceActivity | null>(null);
  const [viewPanelOpen, setViewPanelOpen] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  const [studentsPage, setStudentsPage] = useState(1);
  const [studentsLimit, setStudentsLimit] = useState(10);

  // 🔥 FETCH ALL DATA ONCE
  useEffect(() => {
    fetchAllActivities();
  }, []);

  const fetchAllActivities = async () => {
    try {
      setLoading(true);

      const data = await adminAttendanceService.getAttendanceActivities({
        page: 1,
        limit: 10000, // big number
      });

      const list = Array.isArray(data) ? data : [];
      setAllActivities(list);
    } catch (error: any) {
      showToast(
        error?.response?.data?.detail || "Failed to load attendance activities",
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  // 🔥 FRONTEND PAGINATION LOGIC
  useEffect(() => {
    const start = (page - 1) * limit;
    const end = start + limit;

    setActivities(allActivities.slice(start, end));
    setTotalPages(Math.max(1, Math.ceil(allActivities.length / limit)));
  }, [allActivities, page, limit]);

  const handleViewActivity = async (activityId: number) => {
    try {
      const activity = await adminAttendanceService.getAttendanceActivity(
        activityId
      );
      setSelectedActivity(activity);
      setViewPanelOpen(true);
      setStudentsPage(1);
    } catch (error: any) {
      showToast(
        error?.response?.data?.detail || "Failed to load activity details",
        "error"
      );
    }
  };

  const handleUpdateActivity = async (data: {
    title?: string;
    topic_covered?: string;
    assignments_given?: string;
    hands_on_coding?: string;
    additional_comments?: string;
  }) => {
    if (!selectedActivity) return;
    try {
      await adminAttendanceService.updateAttendanceActivity(
        selectedActivity.id,
        data
      );
      showToast("Activity updated successfully", "success");
      fetchAllActivities();
    } catch (error: any) {
      showToast(
        error?.response?.data?.detail || "Failed to update activity",
        "error"
      );
    }
  };

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  if (loading && allActivities.length === 0) {
    return (
      <MainLayout>
        <Loading fullScreen />
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <Box sx={{ p: { xs: 2, sm: 3, md: 4 } }}>
        {/* Header */}
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 3,
            flexWrap: "wrap",
            gap: 2,
          }}
        >
          <Typography variant="h4" fontWeight={700}>
            Attendance Management
          </Typography>
          <Button
            variant="contained"
            startIcon={<IconWrapper icon="mdi:plus" size={20} />}
            onClick={() => setCreateDialogOpen(true)}
          >
            Create Activity
          </Button>
        </Box>

        {/* Table */}
        <Paper sx={{ borderRadius: 2, overflow: "hidden" }}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Code</TableCell>
                  <TableCell>Duration</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Attendees</TableCell>
                  <TableCell>Expires</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>

              <TableBody>
                {activities.map((activity) => (
                  <TableRow key={activity.id}>
                    <TableCell>{activity.name}</TableCell>
                    <TableCell>
                      <Chip label={activity.code} size="small" />
                    </TableCell>
                    <TableCell>{activity.duration_minutes} min</TableCell>
                    <TableCell>
                      <Chip
                        label={activity.is_active ? "Active" : "Inactive"}
                        color={activity.is_active ? "success" : "error"}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>{activity.attendees_count}</TableCell>
                    <TableCell>
                      {formatDate(activity.expires_at)}
                    </TableCell>
                    <TableCell>
                      <IconButton
                        onClick={() => handleViewActivity(activity.id)}
                      >
                        <IconWrapper icon="mdi:eye" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          {/* Pagination */}
          {allActivities.length > 0 && (
            <Box
              sx={{
                p: 2,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: 2,
              }}
            >
              <FormControl size="small">
                <Select
                  value={limit}
                  onChange={(e) => {
                    setLimit(Number(e.target.value));
                    setPage(1);
                  }}
                >
                  <MenuItem value={5}>5</MenuItem>
                  <MenuItem value={10}>10</MenuItem>
                  <MenuItem value={25}>25</MenuItem>
                  <MenuItem value={50}>50</MenuItem>
                </Select>
              </FormControl>

              <Pagination
                count={totalPages}
                page={page}
                onChange={(_, value) => setPage(value)}
                color="primary"
              />
            </Box>
          )}
        </Paper>

        {/* Side Panel */}
        {selectedActivity && (
          <ViewActivityPanel
            open={viewPanelOpen}
            activity={selectedActivity}
            onClose={() => {
              setViewPanelOpen(false);
              setSelectedActivity(null);
            }}
            onSave={handleUpdateActivity}
            studentsPage={studentsPage}
            studentsLimit={studentsLimit}
            onStudentsPageChange={setStudentsPage}
            onStudentsLimitChange={setStudentsLimit}
          />
        )}

        {/* Create Dialog */}
        <CreateActivityDialog
          open={createDialogOpen}
          onClose={() => setCreateDialogOpen(false)}
          onSuccess={() => {
            setCreateDialogOpen(false);
            fetchAllActivities();
          }}
        />
      </Box>
    </MainLayout>
  );
}
