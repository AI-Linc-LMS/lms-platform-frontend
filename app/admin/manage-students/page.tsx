"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { Box } from "@mui/material";
import { MainLayout } from "@/components/layout/MainLayout";
import { useToast } from "@/components/common/Toast";
import {
  adminStudentService,
  Student,
  CourseCompletionStats,
  ManageStudentsResponse,
} from "@/lib/services/admin/admin-student.service";
import { coursesService } from "@/lib/services/courses.service";
import { ManageStudentsHeader } from "../../../components/admin/manage-students/ManageStudentsHeader";
import { StudentsFilters } from "../../../components/admin/manage-students/StudentsFilters";
import { StudentsTable } from "../../../components/admin/manage-students/StudentsTable";
import { StudentsPagination } from "../../../components/admin/manage-students/StudentsPagination";

type SortOption = "name" | "marks" | "last_activity" | "time_spent" | "streak";
type SortOrder = "asc" | "desc";

export default function ManageStudentsPage() {
  const { showToast } = useToast();

  // State - Original data from API
  const [allStudents, setAllStudents] = useState<Student[]>([]);
  const [completionStats, setCompletionStats] = useState<
    Record<number, CourseCompletionStats>
  >({});
  const [courses, setCourses] = useState<Array<{ id: number; title: string }>>(
    []
  );
  const [loading, setLoading] = useState(true);
  const [loadingStats, setLoadingStats] = useState(false);

  // Filters
  const [selectedCourse, setSelectedCourse] = useState<string>("");
  const [status, setStatus] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState<string>("");

  // Pagination & Sorting
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [sortBy, setSortBy] = useState<SortOption>("name");
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc");

  // Load courses for filter
  useEffect(() => {
    const loadCourses = async () => {
      try {
        const coursesData = await coursesService.getCourses();
        setCourses(
          coursesData.map((c) => ({
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
    try {
      setLoading(true);
      const params: {
        course_id?: number;
        page: number;
        limit: number;
        sort_by: string;
        sort_order: "asc" | "desc";
      } = {
        // Only send course_id to API - all other operations (search, status, sort, pagination) are client-side
        course_id: selectedCourse ? Number(selectedCourse) : undefined,
        page: 1,
        limit: 10000, // Load a large batch for client-side operations (pagination, filtering, sorting)
        sort_by: "name",
        sort_order: "asc",
      };

      const response = await adminStudentService.getManageStudents(params);

      // Handle response structure: { students: [], pagination: {}, filters_applied: {} }
      if (!response || !response.students) {
        setAllStudents([]);
        return;
      }

      setAllStudents(response.students);

      // Load completion stats if course is selected
      if (selectedCourse) {
        setLoadingStats(true);
        try {
          const stats = await adminStudentService.getCourseCompletionStats(
            Number(selectedCourse)
          );
          const statsMap: Record<number, CourseCompletionStats> = {};
          stats.forEach((stat) => {
            statsMap[stat.student_id] = stat;
          });
          setCompletionStats(statsMap);
        } catch (error) {
          // Silently fail
        } finally {
          setLoadingStats(false);
        }
      } else {
        setCompletionStats({});
      }
    } catch (error: any) {
      showToast(
        error?.response?.data?.detail || "Failed to load students",
        "error"
      );
      setAllStudents([]);
    } finally {
      setLoading(false);
    }
  }, [selectedCourse, showToast]);

  // Load students when course filter changes or on mount
  useEffect(() => {
    loadStudents();
  }, [selectedCourse]); // Only reload when course changes

  // Client-side filtering, sorting, and pagination
  // This runs entirely in the browser - no API calls for search, status, sort, or pagination changes
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

      // Step 3: Sort
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
    }, [allStudents, searchTerm, status, sortBy, sortOrder, page, limit]);

  const handleSort = (field: SortOption) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortOrder("asc");
    }
    setPage(1);
  };

  const handleCourseChange = (value: string) => {
    setSelectedCourse(value);
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

  return (
    <MainLayout>
      <Box sx={{ p: { xs: 2, sm: 3, md: 4 } }}>
        <ManageStudentsHeader totalCount={totalCount} />

        <StudentsFilters
          courses={courses}
          selectedCourse={selectedCourse}
          status={status}
          searchTerm={searchTerm}
          onCourseChange={handleCourseChange}
          onStatusChange={handleStatusChange}
          onSearchChange={handleSearchChange}
        />

        <Box>
          <StudentsTable
            students={paginatedStudents}
            completionStats={completionStats}
            selectedCourse={selectedCourse}
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
      </Box>
    </MainLayout>
  );
}
