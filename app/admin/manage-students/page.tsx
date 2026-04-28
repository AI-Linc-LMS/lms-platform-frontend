"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { Box, Collapse, IconButton, Paper, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";
import { MainLayout } from "@/components/layout/MainLayout";
import { useToast } from "@/components/common/Toast";
import { IconWrapper } from "@/components/common/IconWrapper";
import {
  adminStudentService,
  Student,
  CourseCompletionStats,
  ManageStudentsResponse,
} from "@/lib/services/admin/admin-student.service";
import { adminCoursesService } from "@/lib/services/admin/admin-courses.service";
import { useAuth } from "@/lib/auth/auth-context";
import {
  isClientOrgAdminRole,
  isCourseManagerRole,
} from "@/lib/auth/role-utils";
import { ManageStudentsHeader } from "../../../components/admin/manage-students/ManageStudentsHeader";
import { StudentsFilters } from "../../../components/admin/manage-students/StudentsFilters";
import { StudentsTable } from "../../../components/admin/manage-students/StudentsTable";
import { StudentsPagination } from "../../../components/admin/manage-students/StudentsPagination";
import { BulkEnrollmentDialog } from "../../../components/admin/manage-students/BulkEnrollmentDialog";
import { EnrollmentJobHistory } from "../../../components/admin/manage-students/EnrollmentJobHistory";

type SortOption =
  | "name"
  | "marks"
  | "last_activity"
  | "time_spent"
  | "streak"
  | "completion_pct"
  | "attendance_pct"
  | "saved_resume";
type SortOrder = "asc" | "desc";

function apiErrorMessage(error: unknown): string | null {
  if (!error || typeof error !== "object") return null;
  const data = (error as { response?: { data?: { detail?: unknown; error?: unknown } } })
    .response?.data;
  if (!data) return null;
  if (typeof data.detail === "string") return data.detail;
  if (typeof data.error === "string") return data.error;
  return null;
}

function statsMapFromCompletionRows(
  rows: CourseCompletionStats[]
): Record<number, CourseCompletionStats> {
  const statsMap: Record<number, CourseCompletionStats> = {};
  for (const row of rows) {
    statsMap[row.student_id] = row;
  }
  return statsMap;
}

export default function ManageStudentsPage() {
  const { showToast } = useToast();
  const { t } = useTranslation("common");
  const { user } = useAuth();
  const showOrgAdminEnrollmentTools = isClientOrgAdminRole(user?.role);
  const courseManagerUser = isCourseManagerRole(user?.role);

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
  /** all | yes | no — filter by has_saved_resume */
  const [resumeFilter, setResumeFilter] = useState<"all" | "yes" | "no">("all");
  const [searchTerm, setSearchTerm] = useState<string>("");

  // Pagination & Sorting
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [sortBy, setSortBy] = useState<SortOption>("name");
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc");

  // Bulk Enrollment
  const [bulkEnrollDialogOpen, setBulkEnrollDialogOpen] = useState(false);
  const [showJobHistory, setShowJobHistory] = useState(false);
  const loadStudentsSeqRef = useRef(0);

  // Load courses for filter
  useEffect(() => {
    const loadCourses = async () => {
      try {
        const coursesData = await adminCoursesService.getCourses();
        const normalizedCourses = Array.isArray(coursesData)
          ? coursesData
          : Array.isArray((coursesData as { results?: unknown[] })?.results)
            ? ((coursesData as { results: unknown[] }).results as unknown[])
            : [];
        setCourses(
          normalizedCourses
            .map((c) => {
              const course = c as { id?: number; title?: string };
              if (typeof course.id !== "number" || !course.title) return null;
              return { id: course.id, title: course.title };
            })
            .filter((c): c is { id: number; title: string } => Boolean(c))
        );
      } catch {
        // Silently fail - courses filter is optional
      }
    };
    loadCourses();
  }, []);

  // Load students from API - only when course filter changes or initial load
  // All filtering, sorting, and pagination is done client-side to reduce API calls
  const loadStudents = useCallback(async () => {
    const seq = ++loadStudentsSeqRef.current;
    const courseManager = courseManagerUser;

    // Course managers: empty course filter = load all students the API allows (scoped server-side).
    // Admins: keep original behavior — require at least one selected course before loading.
    if (selectedCourses.length === 0) {
      if (!courseManager) {
        setAllStudents([]);
        setCompletionStats({});
        setLoading(false);
        setLoadingStats(false);
        return;
      }
      try {
        setLoading(true);
        const response = await adminStudentService.getManageStudents({
          page: 1,
          limit: 10000,
          sort_by: "name",
          sort_order: "asc",
        });
        if (seq !== loadStudentsSeqRef.current) return;
        setAllStudents(response?.students ?? []);

        setLoadingStats(true);
        try {
          const statsRows = await adminStudentService.getCourseCompletionStats();
          if (seq !== loadStudentsSeqRef.current) return;
          setCompletionStats(
            statsMapFromCompletionRows(Array.isArray(statsRows) ? statsRows : [])
          );
        } catch {
          if (seq === loadStudentsSeqRef.current) {
            setCompletionStats({});
          }
        } finally {
          if (seq === loadStudentsSeqRef.current) {
            setLoadingStats(false);
          }
        }
      } catch (error: unknown) {
        if (seq !== loadStudentsSeqRef.current) return;
        showToast(
          apiErrorMessage(error) || t("adminManageStudents.failedToLoadStudents"),
          "error"
        );
        setAllStudents([]);
        setCompletionStats({});
      } finally {
        if (seq === loadStudentsSeqRef.current) {
          setLoading(false);
        }
      }
      return;
    }

    try {
      setLoading(true);
      const selectedCourseIds = selectedCourses.map(Number).filter(Number.isFinite);

      const mergeStudentResponsesIntoMap = (
        responses: Array<{ students?: Student[] } | undefined>
      ) => {
        const studentMap = new Map<number, Student>();
        responses.forEach((response) => {
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
                has_saved_resume: Boolean(
                  existing.has_saved_resume || student.has_saved_resume
                ),
              });
            }
          });
        });
        return studentMap;
      };

      const aggregateStatsFromRows = (stats: CourseCompletionStats[]) => {
        const statsMap: Record<number, CourseCompletionStats> = {};
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
      };

      if (courseManager) {
        const studentSettled = await Promise.allSettled(
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

        if (seq !== loadStudentsSeqRef.current) return;

        const studentFailures = studentSettled.filter(
          (r): r is PromiseRejectedResult => r.status === "rejected"
        );
        const allStudentRequestsFailed =
          studentSettled.length > 0 &&
          studentFailures.length === studentSettled.length;

        if (allStudentRequestsFailed) {
          const detail = apiErrorMessage(studentFailures[0].reason);
          showToast(
            detail || t("adminManageStudents.failedToLoadStudents"),
            "error"
          );
          setAllStudents([]);
          setCompletionStats({});
        } else {
          const fulfilledResponses = studentSettled
            .filter(
              (r): r is PromiseFulfilledResult<ManageStudentsResponse> =>
                r.status === "fulfilled"
            )
            .map((r) => r.value);
          setAllStudents(
            Array.from(mergeStudentResponsesIntoMap(fulfilledResponses).values())
          );

          setLoadingStats(true);
          try {
            const statsSettled = await Promise.allSettled(
              selectedCourseIds.map((courseId) =>
                adminStudentService.getCourseCompletionStats(courseId)
              )
            );
            if (seq !== loadStudentsSeqRef.current) return;
            const stats = statsSettled.flatMap((r) =>
              r.status === "fulfilled" ? r.value : []
            );
            aggregateStatsFromRows(stats);
          } catch {
          } finally {
            if (seq === loadStudentsSeqRef.current) {
              setLoadingStats(false);
            }
          }
        }
      } else {
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

        if (seq !== loadStudentsSeqRef.current) return;

        setAllStudents(
          Array.from(mergeStudentResponsesIntoMap(studentResponses).values())
        );

        setLoadingStats(true);
        try {
          const statsResults = await Promise.all(
            selectedCourseIds.map((courseId) =>
              adminStudentService.getCourseCompletionStats(courseId)
            )
          );
          if (seq !== loadStudentsSeqRef.current) return;
          aggregateStatsFromRows(statsResults.flat());
        } catch {
        } finally {
          if (seq === loadStudentsSeqRef.current) {
            setLoadingStats(false);
          }
        }
      }
    } catch (error: unknown) {
      if (seq !== loadStudentsSeqRef.current) return;
      showToast(
        apiErrorMessage(error) || t("adminManageStudents.failedToLoadStudents"),
        "error"
      );
      setAllStudents([]);
    } finally {
      if (seq === loadStudentsSeqRef.current) {
        setLoading(false);
      }
    }
  }, [selectedCourses, showToast, t, courseManagerUser]);

  // Load students when course filter changes or on mount
  useEffect(() => {
    loadStudents();
  }, [loadStudents]);

  // Client-side filtering, sorting, and pagination
  // This runs entirely in the browser - no API calls for search, status, sort, or pagination changes
  const hasFilter = Boolean(
    selectedCourses.length > 0 ||
      status !== "all" ||
      resumeFilter !== "all" ||
      (searchTerm && searchTerm.trim())
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

      // Step 2b: Filter by saved resume
      if (resumeFilter === "yes") {
        filtered = filtered.filter((s) => s.has_saved_resume === true);
      } else if (resumeFilter === "no") {
        filtered = filtered.filter((s) => !s.has_saved_resume);
      }

      // Step 3: Sort (completion_pct and attendance_pct use completionStats)
      const sorted = [...filtered].sort((a, b) => {
        let aValue: string | number = 0;
        let bValue: string | number = 0;

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
          case "saved_resume":
            aValue = a.has_saved_resume ? 1 : 0;
            bValue = b.has_saved_resume ? 1 : 0;
            break;
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
    }, [
      allStudents,
      completionStats,
      searchTerm,
      status,
      resumeFilter,
      sortBy,
      sortOrder,
      page,
      limit,
    ]);

  const handleSort = (field: SortOption) => {
    const isPctColumn =
      field === "completion_pct" || field === "attendance_pct" || field === "saved_resume";
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

  const handleResumeFilterChange = (value: "all" | "yes" | "no") => {
    setResumeFilter(value);
    setPage(1);
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
      t("adminManageStudents.csvHeaderSavedResume"),
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
        student.has_saved_resume
          ? t("adminManageStudents.resumeYes")
          : t("adminManageStudents.resumeNo"),
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
          onBulkEnrollClick={
            showOrgAdminEnrollmentTools
              ? () => setBulkEnrollDialogOpen(true)
              : undefined
          }
          onDownloadCsv={
            allStudents.length > 0 &&
            (courseManagerUser || selectedCourses.length > 0)
              ? handleDownloadCsv
              : undefined
          }
        />

        <StudentsFilters
          courses={courses}
          selectedCourses={selectedCourses}
          emptySelectionMeansAllCourses={courseManagerUser}
          status={status}
          resumeFilter={resumeFilter}
          searchTerm={searchTerm}
          onCourseChange={handleCourseChange}
          onStatusChange={handleStatusChange}
          onResumeFilterChange={handleResumeFilterChange}
          onSearchChange={handleSearchChange}
        />

        {showOrgAdminEnrollmentTools ? (
          <Box sx={{ mb: 4 }}>
            <Paper
              sx={{
                p: 2,
                mb: 2,
                cursor: "pointer",
                "&:hover": {
                  backgroundColor:
                    "color-mix(in srgb, var(--surface) 80%, var(--background) 20%)",
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
        ) : null}

        <Box>
          <StudentsTable
            students={paginatedStudents}
            completionStats={completionStats}
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
