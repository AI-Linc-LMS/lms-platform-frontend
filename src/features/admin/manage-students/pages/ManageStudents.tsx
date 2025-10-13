import { useMemo, useState } from "react";
// import { useNavigate } from "react-router-dom";
import { FiSearch, FiFilter, FiEdit2 } from "react-icons/fi";
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
} from "../../../../services/admin/studentApis";
// import { useToast } from "../../../../contexts/ToastContext";
import StudentDetailDrawer from "../components/StudentDetailDrawer";

type CourseOption = { id: number; title: string };

const ManageStudents = () => {
  //   const navigate = useNavigate();
  // search term lives inside filters
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [filters, setFilters] = useState<FilterCriteria>({
    courseId: undefined,
    isActive: undefined,
    searchTerm: "",
  });
  const [sortBy, setSortBy] = useState<ManageStudentsParams["sort_by"]>(
    "name"
  );
  const [sortOrder, setSortOrder] = useState<ManageStudentsParams["sort_order"]>(
    "asc"
  );
  const [page, setPage] = useState<number>(1);
  const [limit, setLimit] = useState<number>(10);
  const clientId = import.meta.env.VITE_CLIENT_ID;
  // const { success, error: showError } = useToast();
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState<number | undefined>(undefined);

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
  const { data: studentsData, refetch, isFetching } = useQuery<ManageStudentsResponse>({
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

  const students: StudentListItem[] = useMemo(() => {
    if (!studentsData) return [];
    return studentsData.students || [];
  }, [studentsData]);

  const totalCount: number = useMemo(() => {
    if (!studentsData) return 0;
    return studentsData.pagination?.total_students ?? students.length;
  }, [studentsData, students.length]);
  const currentPage = studentsData?.pagination?.current_page ?? page;
  const totalPages = studentsData?.pagination?.total_pages ?? Math.max(1, Math.ceil(totalCount / (limit || 1)));
  const hasNext = studentsData?.pagination?.has_next ?? page < totalPages;
  const hasPrev = studentsData?.pagination?.has_previous ?? page > 1;

  //   const handleBackToMain = () => {
  //     navigate("/");
  //   };

  const handleEditStudent = (id: number) => {
    setSelectedStudentId(id);
    setIsDetailOpen(true);
  };

  // Row-level mutations removed; actions now live inside StudentDetailDrawer

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
    <div className="min-h-screen  p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div className="flex flex-col gap-4">
            {/* <button
              onClick={handleBackToMain}
              className="w-fit flex items-center gap-2 px-4 py-2 bg-[var(--primary-500)] text-[var(--font-light)] rounded-lg hover:bg-[var(--primary-600)] transition-colors duration-200 shadow-md hover:shadow-lg"
            >
              <svg 
                width="20" 
                height="20" 
                viewBox="0 0 24 24" 
                fill="none" 
                xmlns="http://www.w3.org/2000/svg"
              >
                <path 
                  d="M19 12H5M12 19l-7-7 7-7" 
                  stroke="currentColor" 
                  strokeWidth="2" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                />
              </svg>
              Back to Main
            </button> */}
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Manage Students
              </h1>
            </div>
          </div>
        </div>

        {/* Search and Filter Bar */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex justify-between items-center gap-4">
            {/* Search Input */}
            <div className="relative flex-1 max-w-md">
              <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search by Name, Email"
                value={filters.searchTerm}
                onChange={(e) => setFilters((f) => ({ ...f, searchTerm: e.target.value }))}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary-500)] focus:border-transparent outline-none"
              />
            </div>

            {/* Filter and Controls */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsFilterModalOpen(true)}
                className={`flex items-center gap-2 px-4 py-2 border rounded-lg transition-colors ${
                  hasActiveFilters
                    ? "border-[var(--primary-500)] bg-[var(--primary-500)] text-[var(--font-light)]"
                    : "border-gray-300 hover:bg-gray-50"
                }`}
              >
                <FiFilter className="w-4 h-4" />
                Filter
              </button>
              {/* Sorting */}
              <select
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as ManageStudentsParams["sort_by"])}
              >
                <option value="name">Sort by Name</option>
                <option value="marks">Sort by Marks</option>
                <option value="last_activity">Last Activity</option>
                <option value="time_spent">Time Spent</option>
                <option value="streak">Streak</option>
              </select>
              <select
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value as ManageStudentsParams["sort_order"])}
              >
                <option value="asc">Asc</option>
                <option value="desc">Desc</option>
              </select>
            </div>
          </div>

          {/* Active Filters Display */}
          {hasActiveFilters && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm text-gray-600">Active filters:</span>
                {filters.courseId !== undefined && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[var(--primary-500)] text-[var(--font-light)]">
                    Course: {availableCourses.find((c) => c.id === filters.courseId)?.title || filters.courseId}
                    <button
                      onClick={() => setFilters((f) => ({ ...f, courseId: undefined }))}
                      className="ml-1 text-[var(--font-light)] hover:text-gray-200"
                    >
                      ×
                    </button>
                  </span>
                )}
                {filters.isActive !== undefined && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[var(--primary-500)] text-[var(--font-light)]">
                    {filters.isActive ? "Active" : "Inactive"}
                    <button
                      onClick={() => setFilters((f) => ({ ...f, isActive: undefined }))}
                      className="ml-1 text-[var(--font-light)] hover:text-gray-200"
                    >
                      ×
                    </button>
                  </span>
                )}
                <button
                  onClick={() => setFilters({ courseId: undefined, isActive: undefined, searchTerm: "" })}
                  className="text-xs text-gray-500 hover:text-gray-700 underline"
                >
                  Clear all
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Students Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left py-4 px-6 text-sm font-medium text-gray-700 uppercase tracking-wider">
                    <input
                      type="checkbox"
                      className="rounded border-gray-300"
                    />
                  </th>
                  <th className="text-left py-4 px-6 text-sm font-medium text-gray-700 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="text-left py-4 px-6 text-sm font-medium text-gray-700 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="text-left py-4 px-6 text-sm font-medium text-gray-700 uppercase tracking-wider">
                    Enrollments
                  </th>
                  <th className="text-left py-4 px-6 text-sm font-medium text-gray-700 uppercase tracking-wider">
                    Most Active Course
                  </th>
                  <th className="text-left py-4 px-6 text-sm font-medium text-gray-700 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {students.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="py-8 px-6 text-center text-gray-500"
                    >
                      {filters.searchTerm || hasActiveFilters
                        ? "No students found matching your criteria."
                        : "No students found."}
                    </td>
                  </tr>
                ) : (
                  students.map((student) => (
                    <tr
                      key={student.id}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="py-4 px-6">
                        <input
                          type="checkbox"
                          className="rounded border-gray-300"
                        />
                      </td>
                      <td className="py-4 px-6 text-sm text-gray-900">
                        {student.name || `${student.first_name ?? ""} ${student.last_name ?? ""}`.trim() || student.email}
                      </td>
                      <td className="py-4 px-6 text-sm text-gray-900">
                        {student.email}
                      </td>
                      <td className="py-4 px-6 text-sm text-gray-900">
                        {student.enrollment_count ?? 0}
                      </td>
                      <td className="py-4 px-6 text-sm text-gray-900">
                        {student.most_active_course || "-"}
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleEditStudent(student.id)}
                            className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                            title="View Student"
                          >
                            <FiEdit2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          {/* Pagination */}
          <div className="flex items-center justify-between p-4 border-t border-gray-200 bg-gray-50">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <span>
                Page {currentPage} of {isNaN(totalPages) ? 1 : totalPages}
              </span>
              <span className="mx-2">•</span>
              <label className="flex items-center gap-2">
                <span>Rows:</span>
                <select
                  className="border border-gray-300 rounded px-2 py-1"
                  value={limit}
                  onChange={(e) => {
                    setLimit(Number(e.target.value));
                    setPage(1);
                  }}
                >
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                </select>
              </label>
              {isFetching && <span className="ml-2">Loading…</span>}
            </div>
            <div className="flex items-center gap-2">
              <button
                disabled={!hasPrev}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className={`px-3 py-1 rounded border ${page <= 1 ? "text-gray-300 border-gray-200" : "text-gray-700 border-gray-300 hover:bg-gray-100"}`}
              >
                Prev
              </button>
              <button
                disabled={!hasNext}
                onClick={() => setPage((p) => p + 1)}
                className={`px-3 py-1 rounded border ${page >= totalPages ? "text-gray-300 border-gray-200" : "text-gray-700 border-gray-300 hover:bg-gray-100"}`}
              >
                Next
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

        {/* Student Detail Drawer */}
        <StudentDetailDrawer
          isOpen={isDetailOpen}
          onClose={() => setIsDetailOpen(false)}
          clientId={Number(clientId)}
          studentId={selectedStudentId}
          availableCourses={availableCourses}
          onChanged={() => refetch()}
        />
      </div>
    </div>
  );
};

export default ManageStudents;
