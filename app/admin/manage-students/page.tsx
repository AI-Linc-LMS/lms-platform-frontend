"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { Box, Collapse, IconButton, Paper, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";
import { MainLayout } from "@/components/layout/MainLayout";
import { useToast } from "@/components/common/Toast";
import { IconWrapper } from "@/components/common/IconWrapper";
import {
  adminStudentService,
  Student,
  CourseCompletionStats,
} from "@/lib/services/admin/admin-student.service";
import { adminCoursesService } from "@/lib/services/admin/admin-courses.service";
import { ManageStudentsHeader } from "../../../components/admin/manage-students/ManageStudentsHeader";
import { StudentsFilters } from "../../../components/admin/manage-students/StudentsFilters";
import { StudentsTable } from "../../../components/admin/manage-students/StudentsTable";
import { StudentsPagination } from "../../../components/admin/manage-students/StudentsPagination";
import { BulkEnrollmentDialog } from "../../../components/admin/manage-students/BulkEnrollmentDialog";
import { EnrollmentJobHistory } from "../../../components/admin/manage-students/EnrollmentJobHistory";

type SortOption = "name" | "marks" | "last_activity" | "time_spent" | "streak" | "completion_pct" | "attendance_pct";
type SortOrder = "asc" | "desc";

export default function ManageStudentsPage() {
  const { showToast } = useToast();
  const { t } = useTranslation("common");

  // State - Original data from API
  const [allStudents, setAllStudents] = useState<Student[]>([]);
  const [completionStats, setCompletionStats] = useState<
    Record<number, CourseCompletionStats>
  >({});
  const [courses, setCourses] = useState<Array<{ id: number; title: string }>>(
    []
  );
  const [loading, setLoading] = useState(false);
  const [loadingStats, setLoadingStats] = useState(false);

  // Filters
  const [selectedCourses, setSelectedCourses] = useState<string[]>([]);
  const [status, setStatus] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState<string>("");

  // Pagination & Sorting
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [sortBy, setSortBy] = useState<SortOption>("name");
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc");

  // Bulk Enrollment
  const [bulkEnrollDialogOpen, setBulkEnrollDialogOpen] = useState(false);
  const [showJobHistory, setShowJobHistory] = useState(false);

  // Load courses for filter
  useEffect(() => {
    const loadCourses = async () => {
      try {
        const coursesData =await adminCoursesService.getCourses();
        setCourses(
          coursesData.map((c: any) => ({
            id: c.id,
            title: c.title,
          }))
        );
      } catch (error) {
        // Silently fail - courses filter is optional
      }
    };
    loadCourses();
  }, []);

  // Load students from API - only when course filter changes or initial load
  // All filtering, sorting, and pagination is done client-side to reduce API calls
  const loadStudents = useCallback(async () => {
    if (selectedCourses.length === 0) {
      setAllStudents([]);
      setCompletionStats({});
      setLoading(false);
      setLoadingStats(false);
      return;
    }

    try {
      setLoading(true);
      const selectedCourseIds = selectedCourses.map(Number).filter(Number.isFinite);

      const studentResponses = await Promise.all(
        selectedCourseIds.map((courseId) =>
          adminStudentService.getManageStudents({
            course_id: courseId,
            page: 1,
            limit: 10000,
            sort_by: "name",
            sort_order: "asc",
          })
        )
      );

      const studentMap = new Map<number, Student>();
      studentResponses.forEach((response) => {
        (response?.students ?? []).forEach((student) => {
          const key = student.user_id || student.id;
          const existing = studentMap.get(key);
          if (!existing) {
            studentMap.set(key, student);
          } else {
            studentMap.set(key, {
              ...existing,
              enrollment_count: Math.max(
                existing.enrollment_count ?? 0,
                student.enrollment_count ?? 0
              ),
            });
          }
        });
      });

      setAllStudents(Array.from(studentMap.values()));

      setLoadingStats(true);
      try {
        const statsResults = await Promise.all(
          selectedCourseIds.map((courseId) =>
            adminStudentService.getCourseCompletionStats(courseId)
          )
        );
        const stats = statsResults.flat();
        let statsMap: Record<number, CourseCompletionStats> = {};
        const studentStatsMap: Record<
          number,
          {
            total_completed: number;
            total_total: number;
            total_attended: number;
            total_attendance_activities: number;
          }
        > = {};

        stats.forEach((stat) => {
          if (!studentStatsMap[stat.student_id]) {
            studentStatsMap[stat.student_id] = {
              total_completed: 0,
              total_total: 0,
              total_attended: 0,
              total_attendance_activities: 0,
            };
          }
          studentStatsMap[stat.student_id].total_completed += stat.completed_contents;
          studentStatsMap[stat.student_id].total_total += stat.total_contents;
          studentStatsMap[stat.student_id].total_attended += stat.attended_activities;
          studentStatsMap[stat.student_id].total_attendance_activities +=
            stat.total_attendance_activities;
        });

        Object.entries(studentStatsMap).forEach(([studentId, aggregated]) => {
          const completionPercentage =
            aggregated.total_total > 0
              ? (aggregated.total_completed / aggregated.total_total) * 100
              : 0;
          const attendancePercentage =
            aggregated.total_attendance_activities > 0
              ? (aggregated.total_attended /
                  aggregated.total_attendance_activities) *
                100
              : 0;

          const firstStat = stats.find((s) => s.student_id === Number(studentId));
          if (firstStat) {
            const mappedStat: CourseCompletionStats = {
              ...firstStat,
              completed_contents: aggregated.total_completed,
              total_contents: aggregated.total_total,
              completion_percentage: completionPercentage,
              attended_activities: aggregated.total_attended,
              total_attendance_activities: aggregated.total_attendance_activities,
              attendance_percentage: attendancePercentage,
            };
            statsMap[Number(studentId)] = mappedStat;
          }
        });

        setCompletionStats(statsMap);
      } catch (error) {
      } finally {
        setLoadingStats(false);
      }
    } catch (error: any) {
      showToast(
        error?.response?.data?.detail || t("adminManageStudents.failedToLoadStudents"),
        "error"
      );
      setAllStudents([]);
    } finally {
      setLoading(false);
    }
  }, [selectedCourses, showToast, t]);

  // Load students when course filter changes or on mount
  useEffect(() => {
    loadStudents();
  }, [loadStudents]);

  // Client-side filtering, sorting, and pagination
  // This runs entirely in the browser - no API calls for search, status, sort, or pagination changes
  const hasFilter = Boolean(
    selectedCourses.length > 0 || status !== "all" || (searchTerm && searchTerm.trim())
  );
  const { filteredStudents, paginatedStudents, totalCount, totalPages } =
    useMemo(() => {
      // Step 1: Filter by search term (name or email)
      let filtered = allStudents;
      if (searchTerm && searchTerm.trim()) {
        const searchLower = searchTerm.toLowerCase().trim();
        filtered = allStudents.filter(
          (student) =>
            (student.name || "").toLowerCase().includes(searchLower) ||
            (student.email || "").toLowerCase().includes(searchLower)
        );
      }

      // Step 2: Filter by status
      if (status === "active") {
        filtered = filtered.filter((s) => s.is_active);
      } else if (status === "inactive") {
        filtered = filtered.filter((s) => !s.is_active);
      }

      // Step 3: Sort (completion_pct and attendance_pct use completionStats)
      const sorted = [...filtered].sort((a, b) => {
        let aValue: any;
        let bValue: any;

        switch (sortBy) {
          case "name":
            aValue = (a.name || "").toLowerCase();
            bValue = (b.name || "").toLowerCase();
            break;
          case "marks":
            aValue = a.total_marks;
            bValue = b.total_marks;
            break;
          case "last_activity":
            aValue = a.last_activity_date
              ? new Date(a.last_activity_date).getTime()
              : 0;
            bValue = b.last_activity_date
              ? new Date(b.last_activity_date).getTime()
              : 0;
            break;
          case "time_spent":
            aValue = a.total_time_spent?.value || 0;
            bValue = b.total_time_spent?.value || 0;
            break;
          case "streak":
            aValue = a.current_streak;
            bValue = b.current_streak;
            break;
          case "completion_pct": {
            const statsA = completionStats[a.user_id] ?? completionStats[a.id];
            const statsB = completionStats[b.user_id] ?? completionStats[b.id];
            aValue = statsA?.completion_percentage ?? 0;
            bValue = statsB?.completion_percentage ?? 0;
            break;
          }
          case "attendance_pct": {
            const statsA = completionStats[a.user_id] ?? completionStats[a.id];
            const statsB = completionStats[b.user_id] ?? completionStats[b.id];
            aValue = statsA?.attendance_percentage ?? 0;
            bValue = statsB?.attendance_percentage ?? 0;
            break;
          }
          default:
            return 0;
        }

        if (aValue < bValue) return sortOrder === "asc" ? -1 : 1;
        if (aValue > bValue) return sortOrder === "asc" ? 1 : -1;
        return 0;
      });

      // Step 4: Paginate
      const total = sorted.length;
      const totalPagesCount = Math.ceil(total / limit);
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      const paginated = sorted.slice(startIndex, endIndex);

      return {
        filteredStudents: sorted,
        paginatedStudents: paginated,
        totalCount: total,
        totalPages: totalPagesCount,
      };
    }, [allStudents, completionStats, searchTerm, status, sortBy, sortOrder, page, limit]);

  const handleSort = (field: SortOption) => {
    const isPctColumn = field === "completion_pct" || field === "attendance_pct";
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      // When any filter is selected and sorting by completion/attendance %, default to DESC
      if (isPctColumn && hasFilter) {
        setSortOrder("desc");
      } else {
        setSortOrder("asc");
      }
    }
    setPage(1);
  };

  const handleCourseChange = (values: string[]) => {
    setSelectedCourses(values);
    setPage(1);
    // This will trigger API call via useEffect
  };

  const handleStatusChange = (value: string) => {
    setStatus(value);
    setPage(1);
    // Client-side filter, no API call
  };

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    setPage(1);
    // Client-side filter, no API call
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    // Client-side pagination - no API call
  };

  const handleLimitChange = (newLimit: number) => {
    setLimit(newLimit);
    setPage(1);
    // Client-side pagination - no API call
  };

  const handleBulkEnrollSuccess = () => {
    // Refresh student list after successful enrollment
    loadStudents();
    setShowJobHistory(true); // Show job history after successful enrollment
  };

  const escapeCsvValue = (value: string | number): string => {
    const str = String(value ?? "");
    if (str.includes('"') || str.includes(",") || str.includes("\n") || str.includes("\r")) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const handleDownloadCsv = () => {
    const headers = [
      t("adminManageStudents.csvHeaderName"),
      t("adminManageStudents.csvHeaderEmail"),
      t("adminManageStudents.csvHeaderStatus"),
      t("adminManageStudents.csvHeaderEnrollmentCount"),
      t("adminManageStudents.csvHeaderMostActiveCourse"),
      t("adminManageStudents.csvHeaderCompletionPct"),
      t("adminManageStudents.csvHeaderAttendancePct"),
    ];
    const rows = filteredStudents.map((student) => {
      const stats = completionStats[student.user_id] ?? completionStats[student.id];
      return [
        escapeCsvValue(student.name ?? ""),
        escapeCsvValue(student.email ?? ""),
        student.is_active ? t("adminManageStudents.active") : t("adminManageStudents.inactive"),
        escapeCsvValue(student.enrollment_count ?? 0),
        escapeCsvValue(student.most_active_course ?? t("adminManageStudents.noActivity")),
        stats ? escapeCsvValue(stats.completion_percentage.toFixed(1)) : t("adminManageStudents.na"),
        stats ? escapeCsvValue(stats.attendance_percentage.toFixed(1)) : t("adminManageStudents.na"),
      ];
    });
    const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\r\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `students${
      selectedCourses.length > 0 ? `-courses-${selectedCourses.join("-")}` : ""
    }.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <MainLayout>
      <Box sx={{ p: { xs: 2, sm: 3, md: 4 } }}>
        <ManageStudentsHeader
          totalCount={totalCount}
          onBulkEnrollClick={() => setBulkEnrollDialogOpen(true)}
          onDownloadCsv={selectedCourses.length > 0 ? handleDownloadCsv : undefined}
        />

        <StudentsFilters
          courses={courses}
          selectedCourses={selectedCourses}
          status={status}
          searchTerm={searchTerm}
          onCourseChange={handleCourseChange}
          onStatusChange={handleStatusChange}
          onSearchChange={handleSearchChange}
        />

        <Box sx={{ mb: 4 }}>
          <Paper
            sx={{
              p: 2,
              mb: 2,
              cursor: "pointer",
              "&:hover": {
                backgroundColor: "#f9fafb",
              },
            }}
            onClick={() => setShowJobHistory(!showJobHistory)}
          >
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <Typography variant="h6" fontWeight={600}>
                {t("adminManageStudents.enrollmentJobHistory")}
              </Typography>
              <IconButton size="small">
                <IconWrapper
                  icon={showJobHistory ? "mdi:chevron-up" : "mdi:chevron-down"}
                  size={20}
                />
              </IconButton>
            </Box>
          </Paper>
          <Collapse in={showJobHistory}>
            <EnrollmentJobHistory />
          </Collapse>
        </Box>

        <Box>
          <StudentsTable
            students={paginatedStudents}
            completionStats={completionStats}
            selectedCourse={selectedCourses[0] ?? ""}
            loading={loading}
            loadingStats={loadingStats}
            sortBy={sortBy}
            sortOrder={sortOrder}
            onSort={handleSort}
          />
          <StudentsPagination
            totalPages={totalPages}
            page={page}
            totalCount={totalCount}
            limit={limit}
            onPageChange={handlePageChange}
            onLimitChange={handleLimitChange}
          />
        </Box>

        <BulkEnrollmentDialog
          open={bulkEnrollDialogOpen}
          onClose={() => setBulkEnrollDialogOpen(false)}
          onSuccess={handleBulkEnrollSuccess}
        />
      </Box>
    </MainLayout>
  );
}
