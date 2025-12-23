import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FiSearch,
  FiFilter,
  FiEdit2,
  FiUsers,
  FiArrowUp,
  FiArrowDown,
  FiChevronLeft,
  FiChevronRight,
  FiBookOpen,
  FiX,
  FiUser,
  FiBarChart2,
  FiTarget,
  FiSettings,
  FiCheckCircle,
  FiXCircle,
} from "react-icons/fi";
import FilterModal, { FilterCriteria } from "../components/FilterModal";
import AccessDenied from "../../../../components/AccessDenied";
import { useRole } from "../../../../hooks/useRole";
import { useQuery } from "@tanstack/react-query";
import { getCourses } from "../../../../services/admin/courseApis";
import {
  getManageStudents,
  StudentListItem,
  ManageStudentsParams,
  ManageStudentsResponse,
  getCourseCompletionStats,
  CourseCompletionStats,
} from "../../../../services/admin/studentApis";
// import { useToast } from "../../../../contexts/ToastContext";

type CourseOption = { id: number; title: string };

const ManageStudents = () => {
  const navigate = useNavigate();
  // search term lives inside filters
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [filters, setFilters] = useState<FilterCriteria>({
    courseId: undefined,
    isActive: undefined,
    searchTerm: "",
  });
  const [sortBy, setSortBy] = useState<ManageStudentsParams["sort_by"]>("name");
  const [sortOrder, setSortOrder] =
    useState<ManageStudentsParams["sort_order"]>("asc");
  const [page, setPage] = useState<number>(1);
  const [limit, setLimit] = useState<number>(100);
  const clientId = import.meta.env.VITE_CLIENT_ID;
  // const { success, error: showError } = useToast();

  // Load available courses for filters and modal
  const { data: coursesData } = useQuery({
    queryKey: ["admin-courses", clientId],
    queryFn: () => getCourses(clientId),
  });
  const availableCourses = useMemo<CourseOption[]>(() => {
    if (!coursesData) return [];
    const arr = (coursesData as Array<{ id: number; title: string }>) || [];
    return arr.map((c) => ({ id: c.id, title: c.title }));
  }, [coursesData]);

  // Fetch students with filters
  const { data: studentsData, isFetching } = useQuery<ManageStudentsResponse>({
    queryKey: [
      "admin-students",
      clientId,
      filters.courseId,
      filters.isActive,
      filters.searchTerm,
      sortBy,
      sortOrder,
      page,
      limit,
    ],
    queryFn: () =>
      getManageStudents(clientId, {
        course_id: filters.courseId,
        is_active: filters.isActive,
        search: filters.searchTerm || undefined,
        sort_by: sortBy,
        sort_order: sortOrder,
        page,
        limit,
      }),
    refetchOnWindowFocus: false,
    // keepPreviousData is v3 option; if using v5, it's removed.
  });

  // Fetch course completion stats (with or without course filter)
  const { data: courseCompletionData } = useQuery<CourseCompletionStats[]>({
    queryKey: ["course-completion-stats", clientId, filters.courseId ?? null],
    queryFn: () => getCourseCompletionStats(clientId, filters.courseId),
    enabled: true,
    refetchOnWindowFocus: false,
  });

  const students: StudentListItem[] = useMemo(() => {
    if (!studentsData) return [];
    const baseStudents = studentsData.students || [];

    if (!courseCompletionData || courseCompletionData.length === 0) {
      return baseStudents;
    }

    // Helper to pick best stat when no course filter
    const pickStatForStudent = (statsForStudent: CourseCompletionStats[]) => {
      if (filters.courseId) {
        // When filtered by course, stats returned should already correspond,
        // but fallback to first item just in case
        return statsForStudent.find(
          (s) => s.course_id === filters.courseId
        ) || statsForStudent[0];
      }
      // No filter: try matching most_active_course; else highest completion %
      return (
        statsForStudent.find(
          (s) => s.course_title === (statsByStudentIdMostActive[studentIdKey(s.student_id)] ?? "")
        ) ||
        statsForStudent.reduce((best, cur) =>
          (best?.completion_percentage ?? -1) >= cur.completion_percentage ? best : cur
        , undefined as CourseCompletionStats | undefined) ||
        statsForStudent[0]
      );
    };

    // Build a map from student id to their most active course title (from base data)
    const statsByStudentIdMostActive: Record<string, string> = {};
    baseStudents.forEach((st) => {
      if (st.id != null && st.most_active_course) {
        statsByStudentIdMostActive[String(st.id)] = st.most_active_course;
      }
    });
    const studentIdKey = (id: number) => String(id);

    // Group stats by student id for quick lookup
    const byStudent: Record<string, CourseCompletionStats[]> = {};
    for (const stat of courseCompletionData) {
      const key = studentIdKey(stat.student_id);
      if (!byStudent[key]) byStudent[key] = [];
      byStudent[key].push(stat);
    }

    return baseStudents.map((student) => {
      const sKey = studentIdKey(student.id);
      const arr = byStudent[sKey];
      if (!arr || arr.length === 0) {
        return student;
      }
      const chosen = pickStatForStudent(arr);
      return {
        ...student,
        course_progress: chosen?.completion_percentage,
        course_marks: chosen?.completed_contents,
        attendance_percentage: chosen?.attendance_percentage,
      };
    });
  }, [studentsData, filters.courseId, courseCompletionData]);

  const totalCount: number = useMemo(() => {
    if (!studentsData) return 0;
    return studentsData.pagination?.total_students ?? students.length;
  }, [studentsData, students.length]);
  const currentPage = studentsData?.pagination?.current_page ?? page;
  const totalPages =
    studentsData?.pagination?.total_pages ??
    Math.max(1, Math.ceil(totalCount / (limit || 1)));
  const hasNext = studentsData?.pagination?.has_next ?? page < totalPages;
  const hasPrev = studentsData?.pagination?.has_previous ?? page > 1;

  const handleEditStudent = (id: number) => {
    navigate(`/admin/manage-students/${id}`);
  };

  // Row-level mutations removed; actions now live inside StudentDetailPage

  const handleApplyFilters = (newFilters: FilterCriteria) => {
    setFilters(newFilters);
    setPage(1); // reset to first page on filter change
  };

  const hasActiveFilters = Boolean(
    filters.courseId !== undefined || filters.isActive !== undefined
  );

  const { isSuperAdmin } = useRole();

  if (!isSuperAdmin) {
    return <AccessDenied />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 sm:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header Section */}
        <div>
          <div className="bg-gradient-to-r from-[var(--primary-500)] to-[var(--primary-600)] rounded-2xl shadow-md p-6 sm:p-7 text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                  <FiUsers className="w-8 h-8" />
                </div>
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold mb-1">Manage Students</h1>
                  <p className="text-white/85 text-sm">
                    View, manage and track student progress
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-6">
                <div className="text-center">
                  <div className="text-2xl sm:text-3xl font-bold">{totalCount}</div>
                  <div className="text-sm text-white/80">Total Students</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filter Bar */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-start">
            {/* Search Input */}
            <div className="relative lg:col-span-1">
              <FiSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search by name or email..."
                value={filters.searchTerm}
                onChange={(e) =>
                  setFilters((f) => ({ ...f, searchTerm: e.target.value }))
                }
                className="w-full pl-12 pr-4 py-3 border border-[var(--neutral-200)] rounded-xl focus:ring-2 focus:ring-[var(--primary-500)] focus:border-[var(--primary-500)] outline-none transition-all shadow-sm bg-white text-[var(--font-primary)]"
              />
            </div>

            {/* Filter and Controls */}
            <div className="flex items-center gap-3 flex-wrap lg:justify-end lg:col-span-2">
              <button
                onClick={() => setIsFilterModalOpen(true)}
                className={`flex items-center gap-2 px-4 py-2.5 border rounded-xl transition-all font-medium shadow-sm ${
                  hasActiveFilters
                    ? "border-[var(--primary-500)] bg-[var(--primary-500)] text-white"
                    : "border-gray-200 hover:bg-gray-50"
                }`}
              >
                <FiFilter className="w-4 h-4" />
                Filter
                {hasActiveFilters && (
                  <span className="ml-1 px-2 py-0.5 bg-white/20 rounded-full text-xs">
                    {(filters.courseId !== undefined ? 1 : 0) +
                      (filters.isActive !== undefined ? 1 : 0)}
                  </span>
                )}
              </button>

              {/* Sorting */}
              <div className="flex items-center gap-2">
                <select
                  className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm font-medium focus:ring-2 focus:ring-[var(--primary-500)] focus:border-transparent outline-none transition-all shadow-sm"
                  value={sortBy}
                  onChange={(e) =>
                    setSortBy(e.target.value as ManageStudentsParams["sort_by"])
                  }
                >
                  <option value="name">Name</option>
                  <option value="marks">Marks</option>
                  <option value="last_activity">Last Activity</option>
                  <option value="time_spent">Time Spent</option>
                  <option value="streak">Streak</option>
                </select>
                <button
                  onClick={() =>
                    setSortOrder(sortOrder === "asc" ? "desc" : "asc")
                  }
                  className="p-2.5 border border-gray-200 rounded-xl hover:bg-gray-50 transition-all shadow-sm"
                  title={sortOrder === "asc" ? "Ascending" : "Descending"}
                >
                  {sortOrder === "asc" ? (
                    <FiArrowUp className="w-4 h-4" />
                  ) : (
                    <FiArrowDown className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Active Filters Display */}
          {hasActiveFilters && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-medium text-gray-600 flex items-center gap-1">
                  <FiFilter className="w-4 h-4" />
                  Active filters:
                </span>
                {filters.courseId !== undefined && (
                  <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium bg-gradient-to-r from-[var(--primary-500)] to-[var(--primary-600)] text-white shadow-sm">
                    <FiBookOpen className="w-3 h-3" />
                    {availableCourses.find((c) => c.id === filters.courseId)
                      ?.title || filters.courseId}
                    <button
                      onClick={() =>
                        setFilters((f) => ({ ...f, courseId: undefined }))
                      }
                      className="ml-1 hover:bg-white/20 rounded-full p-0.5 transition-colors"
                    >
                      <FiX className="w-3 h-3" />
                    </button>
                  </span>
                )}
                {filters.isActive !== undefined && (
                  <span
                    className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium shadow-sm ${
                      filters.isActive
                        ? "bg-green-100 text-green-700"
                        : "bg-red-100 text-red-700"
                    }`}
                  >
                    {filters.isActive ? (
                      <>
                        <FiCheckCircle className="w-3 h-3" />
                        Active
                      </>
                    ) : (
                      <>
                        <FiXCircle className="w-3 h-3" />
                        Inactive
                      </>
                    )}
                    <button
                      onClick={() =>
                        setFilters((f) => ({ ...f, isActive: undefined }))
                      }
                      className="ml-1 hover:bg-white/30 rounded-full p-0.5 transition-colors"
                    >
                      <FiX className="w-3 h-3" />
                    </button>
                  </span>
                )}
                <button
                  onClick={() =>
                    setFilters({
                      courseId: undefined,
                      isActive: undefined,
                      searchTerm: "",
                    })
                  }
                  className="text-sm text-[var(--primary-500)] hover:text-[var(--primary-600)] font-medium underline"
                >
                  Clear all filters
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Students Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full table-fixed">
              <colgroup>
                <col style={{ width: "30%" }} />
                <col style={{ width: "10%" }} />
                <col style={{ width: "22%" }} />
                <col style={{ width: "18%" }} />
                <col style={{ width: "18%" }} />
                <col style={{ width: "12%" }} />
              </colgroup>
              <thead className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200 sticky top-0 z-10 backdrop-blur supports-[backdrop-filter]:bg-white/70">
                <tr>
                  <th className="text-left py-3 px-4 text-[11px] font-bold text-gray-700 uppercase tracking-wider">
                    <div className="flex items-center gap-2">
                      <FiUser className="w-4 h-4" />
                      Name
                    </div>
                  </th>
                  <th className="text-left py-3 px-4 text-[11px] font-bold text-gray-700 uppercase tracking-wider hidden sm:table-cell">
                    <div className="flex items-center gap-2">
                      <FiBookOpen className="w-4 h-4" />
                      Enroll.
                    </div>
                  </th>
                  <th className="text-left py-3 px-4 text-[11px] font-bold text-gray-700 uppercase tracking-wider hidden md:table-cell">
                    <div className="flex items-center gap-2">
                      <FiTarget className="w-4 h-4" />
                      Most Active
                    </div>
                  </th>
                  <th className="text-left py-3 px-4 text-[11px] font-bold text-gray-700 uppercase tracking-wider">
                    <div className="flex items-center gap-2">
                      <FiBarChart2 className="w-4 h-4" />
                      Completion %
                    </div>
                  </th>
                  <th className="text-left py-3 px-4 text-[11px] font-bold text-gray-700 uppercase tracking-wider">
                    <div className="flex items-center gap-2">
                      <FiBarChart2 className="w-4 h-4" />
                      Attendance %
                    </div>
                  </th>
                  <th className="text-left py-3 px-4 text-[11px] font-bold text-gray-700 uppercase tracking-wider">
                    <div className="flex items-center gap-2">
                      <FiSettings className="w-4 h-4" />
                      Actions
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {isFetching ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="py-10 px-4"
                    >
                      <div className="flex flex-col items-center justify-center gap-3">
                        <div className="w-12 h-12 border-4 border-[var(--primary-200)] border-t-[var(--primary-500)] rounded-full animate-spin"></div>
                        <p className="text-gray-500 text-sm">
                          Loading students...
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : students.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="py-10 px-4 text-center"
                    >
                      <div className="flex flex-col items-center gap-3">
                        <FiUsers className="w-16 h-16 text-gray-300" />
                        <p className="text-gray-500 font-medium">
                          {filters.searchTerm || hasActiveFilters
                            ? "No students found matching your criteria."
                            : "No students found."}
                        </p>
                        {(filters.searchTerm || hasActiveFilters) && (
                          <button
                            onClick={() =>
                              setFilters({
                                courseId: undefined,
                                isActive: undefined,
                                searchTerm: "",
                              })
                            }
                            className="text-sm text-[var(--primary-500)] hover:text-[var(--primary-600)] font-medium underline"
                          >
                            Clear filters
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ) : (
                  students.map((student) => (
                    <tr
                      key={student.id}
                      className="even:bg-gray-50 hover:bg-[var(--primary-50)]/50 transition-colors duration-150 group"
                    >
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="shrink-0 relative">
                            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-[var(--primary-500)] to-[var(--primary-600)] text-white flex items-center justify-center shadow-md ring-2 ring-white ring-offset-2 ring-offset-gray-100">
                              <span className="font-semibold text-sm leading-none">
                                {(student.name ||
                                  student.first_name ||
                                  student.email)[0].toUpperCase()}
                              </span>
                            </div>
                          </div>
                          <div>
                            <div className="font-medium text-gray-900 truncate max-w-[260px]" title={student.name || `${student.first_name ?? ""} ${student.last_name ?? ""}`.trim() || student.email}>
                              {student.name ||
                                `${student.first_name ?? ""} ${
                                  student.last_name ?? ""
                                }`.trim() ||
                                student.email}
                            </div>
                            <div className="text-xs text-gray-500 truncate max-w-[260px]" title={student.email}>
                              {student.email}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 hidden sm:table-cell">
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                          <FiBookOpen className="w-3 h-3" />
                          {student.enrollment_count ?? 0}
                        </span>
                      </td>
                      <td className="py-3 px-4 hidden md:table-cell">
                        <span className="text-sm text-gray-700 truncate block max-w-[200px]" title={student.most_active_course || "-"}>
                          {student.most_active_course || "-"}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        {student.course_progress !== undefined ? (
                          <div className="flex items-center gap-3">
                            <div className="flex-1 bg-gray-200 rounded-full h-2 max-w-[120px] overflow-hidden shadow-inner">
                              <div
                                className="h-full bg-gradient-to-r from-[var(--primary-500)] to-[var(--primary-600)] rounded-full transition-all duration-500"
                                style={{
                                  width: `${student.course_progress}%`,
                                }}
                              ></div>
                            </div>
                            <span className="text-xs sm:text-sm font-semibold text-gray-700 min-w-[45px]">
                              {student.course_progress.toFixed(2)}%
                            </span>
                          </div>
                        ) : (
                          <span className="text-gray-400 text-xs italic">—</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        {student.attendance_percentage !== undefined ? (
                          <div className="flex items-center gap-3">
                            <div className="flex-1 bg-gray-200 rounded-full h-2 max-w-[120px] overflow-hidden shadow-inner">
                              <div
                                className="h-full bg-gradient-to-r from-[var(--primary-500)] to-[var(--primary-600)] rounded-full transition-all duration-500"
                                style={{
                                  width: `${student.attendance_percentage}%`,
                                }}
                              ></div>
                            </div>
                            <span className="text-xs sm:text-sm font-semibold text-gray-700 min-w-[45px]">
                              {student.attendance_percentage.toFixed(2)}%
                            </span>
                          </div>
                        ) : (
                          <span className="text-gray-400 text-xs italic">—</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <button
                          onClick={() => handleEditStudent(student.id)}
                          className="inline-flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-[var(--primary-500)] to-[var(--primary-600)] text-white rounded-md hover:shadow-lg transition-all duration-200 font-medium text-sm group-hover:scale-105"
                          title="View Student Details"
                        >
                          <FiEdit2 className="w-4 h-4" />
                          <span className="hidden sm:inline">View</span>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-6 border-t-2 border-gray-200 bg-gradient-to-r from-gray-50 to-white">
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-2 text-gray-700">
                <span className="font-medium">Page</span>
                <span className="px-3 py-1 bg-[var(--primary-100)] text-[var(--primary-700)] rounded-lg font-bold">
                  {currentPage}
                </span>
                <span className="text-gray-500">of</span>
                <span className="font-semibold">
                  {isNaN(totalPages) ? 1 : totalPages}
                </span>
              </div>
              <span className="text-gray-300">•</span>
              <div className="flex items-center gap-2">
                <label className="text-gray-700 font-medium">
                  Rows per page:
                </label>
                <select
                  className="border-2 border-gray-300 rounded-lg px-3 py-1.5 font-medium focus:ring-2 focus:ring-[var(--primary-500)] focus:border-transparent outline-none transition-all"
                  value={limit}
                  onChange={(e) => {
                    setLimit(Number(e.target.value));
                    setPage(1);
                  }}
                >
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
              </div>
              {isFetching && (
                <div className="flex items-center gap-2 text-[var(--primary-500)]">
                  <div className="w-4 h-4 border-2 border-[var(--primary-200)] border-t-[var(--primary-500)] rounded-full animate-spin"></div>
                  <span className="text-sm font-medium">Loading...</span>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                disabled={!hasPrev}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg border-2 font-medium transition-all ${
                  !hasPrev
                    ? "text-gray-300 border-gray-200 cursor-not-allowed"
                    : "text-gray-700 border-gray-300 hover:bg-[var(--primary-50)] hover:border-[var(--primary-500)] hover:text-[var(--primary-700)]"
                }`}
              >
                <FiChevronLeft className="w-4 h-4" />
                Previous
              </button>
              <button
                disabled={!hasNext}
                onClick={() => setPage((p) => p + 1)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg border-2 font-medium transition-all ${
                  !hasNext
                    ? "text-gray-300 border-gray-200 cursor-not-allowed"
                    : "text-gray-700 border-gray-300 hover:bg-[var(--primary-50)] hover:border-[var(--primary-500)] hover:text-[var(--primary-700)]"
                }`}
              >
                Next
                <FiChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Filter Modal */}
        <FilterModal
          isOpen={isFilterModalOpen}
          onClose={() => setIsFilterModalOpen(false)}
          onApplyFilters={handleApplyFilters}
          currentFilters={filters}
          availableCourses={availableCourses}
        />
      </div>
    </div>
  );
};

export default ManageStudents;
