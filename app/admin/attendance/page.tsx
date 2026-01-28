"use client";

import { useState, useEffect } from "react";
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
import { IconWrapper } from "@/components/common/IconWrapper";
import {
  adminAttendanceService,
  AttendanceActivity,
} from "@/lib/services/admin/admin-attendance.service";
import { ViewActivityPanel } from "@/components/admin/attendance/ViewActivityPanel";
import { CreateActivityDialog } from "@/components/admin/attendance/CreateActivityDialog";

export default function AttendancePage() {
  const { showToast } = useToast();
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

  useEffect(() => {
    loadActivities();
  }, [page, limit]);

  const loadActivities = async () => {
    try {
      setLoading(true);
      const data = await adminAttendanceService.getAttendanceActivities({
        page,
        limit,
      });
      setActivities(Array.isArray(data) ? data : []);
      const estimatedTotal = Array.isArray(data) ? data.length : 0;
      setTotalPages(Math.max(1, Math.ceil(estimatedTotal / limit)));
    } catch (error: any) {
      showToast(
        error?.response?.data?.detail || "Failed to load attendance activities",
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

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
      const updated = await adminAttendanceService.getAttendanceActivity(
        selectedActivity.id
      );
      setSelectedActivity(updated);
      loadActivities();
    } catch (error: any) {
      showToast(
        error?.response?.data?.detail || "Failed to update activity",
        "error"
      );
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };


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
          <Typography
            variant="h4"
            sx={{
              fontWeight: 700,
              color: "#111827",
              fontSize: { xs: "1.5rem", sm: "2rem" },
            }}
          >
            Attendance Management
          </Typography>
          <Button
            variant="contained"
            startIcon={<IconWrapper icon="mdi:plus" size={20} />}
            onClick={() => setCreateDialogOpen(true)}
            sx={{ bgcolor: "#6366f1" }}
          >
            Create Activity
          </Button>
        </Box>

        {/* Table */}
        <Paper
          sx={{
            borderRadius: 2,
            boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
            overflow: "hidden",
          }}
        >
          <TableContainer
            sx={{
              overflowX: "auto",
              "&::-webkit-scrollbar": {
                height: 8,
              },
              "&::-webkit-scrollbar-track": {
                backgroundColor: "#f1f1f1",
                borderRadius: 4,
              },
              "&::-webkit-scrollbar-thumb": {
                backgroundColor: "#c1c1c1",
                borderRadius: 4,
                "&:hover": {
                  backgroundColor: "#a8a8a8",
                },
              },
            }}
          >
            <Table>
              <TableHead>
                <TableRow sx={{ backgroundColor: "#f9fafb" }}>
                  <TableCell
                    sx={{
                      fontWeight: 600,
                      color: "#374151",
                      fontSize: { xs: "0.75rem", sm: "0.875rem" },
                      py: { xs: 1, sm: 1.5 },
                    }}
                  >
                    Name
                  </TableCell>
                  <TableCell
                    sx={{
                      fontWeight: 600,
                      color: "#374151",
                      fontSize: { xs: "0.75rem", sm: "0.875rem" },
                      py: { xs: 1, sm: 1.5 },
                      display: { xs: "none", sm: "table-cell" },
                    }}
                  >
                    Code
                  </TableCell>
                  <TableCell
                    sx={{
                      fontWeight: 600,
                      color: "#374151",
                      fontSize: { xs: "0.75rem", sm: "0.875rem" },
                      py: { xs: 1, sm: 1.5 },
                    }}
                  >
                    Duration
                  </TableCell>
                  <TableCell
                    sx={{
                      fontWeight: 600,
                      color: "#374151",
                      fontSize: { xs: "0.75rem", sm: "0.875rem" },
                      py: { xs: 1, sm: 1.5 },
                    }}
                  >
                    Status
                  </TableCell>
                  <TableCell
                    sx={{
                      fontWeight: 600,
                      color: "#374151",
                      fontSize: { xs: "0.75rem", sm: "0.875rem" },
                      py: { xs: 1, sm: 1.5 },
                    }}
                  >
                    Attendees
                  </TableCell>
                  <TableCell
                    sx={{
                      fontWeight: 600,
                      color: "#374151",
                      fontSize: { xs: "0.75rem", sm: "0.875rem" },
                      py: { xs: 1, sm: 1.5 },
                      display: { xs: "none", md: "table-cell" },
                    }}
                  >
                    Expires At
                  </TableCell>
                  <TableCell
                    sx={{
                      fontWeight: 600,
                      color: "#374151",
                      fontSize: { xs: "0.75rem", sm: "0.875rem" },
                      py: { xs: 1, sm: 1.5 },
                      display: { xs: "none", lg: "table-cell" },
                    }}
                  >
                    Created By
                  </TableCell>
                  <TableCell
                    sx={{
                      fontWeight: 600,
                      color: "#374151",
                      fontSize: { xs: "0.75rem", sm: "0.875rem" },
                      py: { xs: 1, sm: 1.5 },
                    }}
                  >
                    Actions
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {activities.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} align="center" sx={{ py: 6 }}>
                      <IconWrapper
                        icon="mdi:calendar-blank-outline"
                        size={48}
                        color="#d1d5db"
                      />
                      <Typography
                        variant="body1"
                        sx={{ color: "#6b7280", mt: 2, fontWeight: 500 }}
                      >
                        No attendance activities
                      </Typography>
                      <Typography variant="caption" sx={{ color: "#9ca3af" }}>
                        Create your first attendance activity to get started
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  activities.map((activity) => (
                    <TableRow
                      key={activity.id}
                      sx={{
                        "&:hover": { backgroundColor: "#f9fafb" },
                      }}
                    >
                      <TableCell sx={{ py: { xs: 1.5, sm: 2 } }}>
                        <Box sx={{ minWidth: 0 }}>
                          <Typography
                            variant="body2"
                            sx={{
                              fontWeight: 500,
                              color: "#111827",
                              fontSize: { xs: "0.8125rem", sm: "0.875rem" },
                            }}
                          >
                            {activity.name}
                          </Typography>
                          <Chip
                            label={activity.code}
                            size="small"
                            sx={{
                              bgcolor: "#eef2ff",
                              color: "#6366f1",
                              fontWeight: 600,
                              fontFamily: "monospace",
                              mt: { xs: 0.5, sm: 0 },
                              fontSize: { xs: "0.7rem", sm: "0.75rem" },
                              height: { xs: 20, sm: 24 },
                              display: { xs: "inline-flex", sm: "none" },
                            }}
                          />
                        </Box>
                      </TableCell>
                      <TableCell
                        sx={{
                          py: { xs: 1.5, sm: 2 },
                          display: { xs: "none", sm: "table-cell" },
                        }}
                      >
                        <Chip
                          label={activity.code}
                          size="small"
                          sx={{
                            bgcolor: "#eef2ff",
                            color: "#6366f1",
                            fontWeight: 600,
                            fontFamily: "monospace",
                            fontSize: { xs: "0.7rem", sm: "0.75rem" },
                          }}
                        />
                      </TableCell>
                      <TableCell sx={{ py: { xs: 1.5, sm: 2 } }}>
                        <Typography
                          variant="body2"
                          sx={{
                            color: "#374151",
                            fontSize: { xs: "0.8125rem", sm: "0.875rem" },
                          }}
                        >
                          {activity.duration_minutes} min
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ py: { xs: 1.5, sm: 2 } }}>
                        <Box
                          sx={{ display: "flex", gap: 0.5, flexWrap: "wrap" }}
                        >
                          <Chip
                            label={activity.is_active ? "Active" : "Inactive"}
                            size="small"
                            sx={{
                              bgcolor: activity.is_active
                                ? "#d1fae5"
                                : "#fee2e2",
                              color: activity.is_active ? "#065f46" : "#991b1b",
                              fontWeight: 600,
                              fontSize: { xs: "0.7rem", sm: "0.75rem" },
                              height: { xs: 20, sm: 24 },
                            }}
                          />
                          {activity.is_valid && (
                            <Chip
                              label="Valid"
                              size="small"
                              sx={{
                                bgcolor: "#dbeafe",
                                color: "#1e40af",
                                fontWeight: 600,
                                fontSize: { xs: "0.7rem", sm: "0.75rem" },
                                height: { xs: 20, sm: 24 },
                              }}
                            />
                          )}
                        </Box>
                      </TableCell>
                      <TableCell sx={{ py: { xs: 1.5, sm: 2 } }}>
                        <Typography
                          variant="body2"
                          sx={{
                            color: "#374151",
                            fontSize: { xs: "0.8125rem", sm: "0.875rem" },
                          }}
                        >
                          {activity.attendees_count}
                        </Typography>
                      </TableCell>
                      <TableCell
                        sx={{
                          py: { xs: 1.5, sm: 2 },
                          display: { xs: "none", md: "table-cell" },
                        }}
                      >
                        <Typography
                          variant="body2"
                          sx={{
                            color: "#374151",
                            fontSize: { xs: "0.8125rem", sm: "0.875rem" },
                          }}
                        >
                          {formatDate(activity.expires_at)}
                        </Typography>
                      </TableCell>
                      <TableCell
                        sx={{
                          py: { xs: 1.5, sm: 2 },
                          display: { xs: "none", lg: "table-cell" },
                        }}
                      >
                        <Typography
                          variant="body2"
                          sx={{
                            color: "#374151",
                            fontSize: { xs: "0.8125rem", sm: "0.875rem" },
                          }}
                        >
                          {activity.created_by_name}
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ py: { xs: 1.5, sm: 2 } }}>
                        <IconButton
                          size="small"
                          onClick={() => handleViewActivity(activity.id)}
                          sx={{
                            color: "#6366f1",
                            "& .MuiSvgIcon-root": {
                              fontSize: { xs: "18px", sm: "20px" },
                            },
                          }}
                        >
                          <IconWrapper icon="mdi:eye" size={20} />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>

          {/* Pagination */}
          {activities.length > 0 && (
            <Box
              sx={{
                p: { xs: 1.5, sm: 2 },
                borderTop: "1px solid #e5e7eb",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexDirection: { xs: "column", sm: "row" },
                gap: { xs: 1.5, sm: 2 },
              }}
            >
              <FormControl
                size="small"
                sx={{
                  minWidth: { xs: 100, sm: 120 },
                  width: { xs: "100%", sm: "auto" },
                  "& .MuiInputBase-root": {
                    fontSize: { xs: "0.7rem", sm: "0.875rem" },
                  },
                }}
              >
                <Select
                  value={limit}
                  onChange={(e) => {
                    setLimit(Number(e.target.value));
                    setPage(1);
                  }}
                  sx={{
                    fontSize: { xs: "0.7rem", sm: "0.875rem" },
                    "& .MuiSelect-select": {
                      py: { xs: 0.5, sm: 1 },
                      px: { xs: 0.75, sm: 1.5 },
                    },
                  }}
                >
                  <MenuItem
                    value={5}
                    sx={{ fontSize: { xs: "0.7rem", sm: "0.875rem" } }}
                  >
                    5 per page
                  </MenuItem>
                  <MenuItem
                    value={10}
                    sx={{ fontSize: { xs: "0.7rem", sm: "0.875rem" } }}
                  >
                    10 per page
                  </MenuItem>
                  <MenuItem
                    value={25}
                    sx={{ fontSize: { xs: "0.7rem", sm: "0.875rem" } }}
                  >
                    25 per page
                  </MenuItem>
                  <MenuItem
                    value={50}
                    sx={{ fontSize: { xs: "0.7rem", sm: "0.875rem" } }}
                  >
                    50 per page
                  </MenuItem>
                </Select>
              </FormControl>
              <Pagination
                count={totalPages}
                page={page}
                onChange={(_, value) => setPage(value)}
                color="primary"
                size="small"
                showFirstButton={false}
                showLastButton={false}
                sx={{
                  "& .MuiPaginationItem-root": {
                    fontSize: { xs: "0.7rem", sm: "0.875rem" },
                    minWidth: { xs: 28, sm: 32 },
                    height: { xs: 28, sm: 32 },
                  },
                  "& .MuiPagination-ul": {
                    justifyContent: { xs: "center", sm: "flex-end" },
                  },
                  width: { xs: "100%", sm: "auto" },
                  display: { xs: "flex", sm: "block" },
                  justifyContent: { xs: "center", sm: "flex-end" },
                  "& .MuiPaginationItem-firstLast": {
                    display: { xs: "none", sm: "inline-flex" },
                  },
                }}
              />
            </Box>
          )}
        </Paper>

        {/* View Activity Side Panel */}
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
            loadActivities();
          }}
        />
      </Box>
    </MainLayout>
  );
}
