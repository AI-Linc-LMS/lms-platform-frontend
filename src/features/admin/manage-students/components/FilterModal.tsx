import { useState } from "react";
import { FiX } from "react-icons/fi";

type CourseOption = { id: number; title: string };

interface FilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyFilters: (filters: FilterCriteria) => void;
  currentFilters: FilterCriteria;
  availableCourses?: CourseOption[];
}

export interface FilterCriteria {
  courseId?: number;
  isActive?: boolean;
  searchTerm: string;
}

const FilterModal: React.FC<FilterModalProps> = ({
  isOpen,
  onClose,
  onApplyFilters,
  currentFilters,
  availableCourses,
}) => {
  const [filters, setFilters] = useState<FilterCriteria>(currentFilters);
  const fallbackCourses: CourseOption[] = [
    { id: -1, title: "Sample Course" },
  ];
  const coursesToShow =
    availableCourses && availableCourses.length > 0
      ? availableCourses
      : fallbackCourses;
  const handleCourseSelect = (courseId: number | undefined) => {
    setFilters((prev) => ({ ...prev, courseId }));
  };

  const handleApply = () => {
    onApplyFilters(filters);
    onClose();
  };

  const handleClear = () => {
    const clearedFilters: FilterCriteria = {
      courseId: undefined,
      isActive: undefined,
      searchTerm: "",
    };
    setFilters(clearedFilters);
    onApplyFilters(clearedFilters);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/20 backdrop-blur-[2px] flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            Filter Students
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <FiX className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Filter by Enrolled Course
            </label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary-500)] focus:border-transparent outline-none"
              value={filters.courseId ?? ""}
              onChange={(e) => {
                const val = e.target.value;
                handleCourseSelect(val === "" ? undefined : Number(val));
              }}
            >
              <option value="">All Courses</option>
              {coursesToShow.map((course) => (
                <option key={course.id} value={course.id}>
                  {course.title}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Status
            </label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary-500)] focus:border-transparent outline-none"
              value={
                filters.isActive === undefined
                  ? "all"
                  : filters.isActive
                  ? "active"
                  : "inactive"
              }
              onChange={(e) => {
                const val = e.target.value;
                setFilters((prev) => ({
                  ...prev,
                  isActive:
                    val === "all" ? undefined : val === "active" ? true : false,
                }));
              }}
            >
              <option value="all">All</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>

          <div>
            <label
              htmlFor="filterSearch"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Search Term
            </label>
            <input
              type="text"
              id="filterSearch"
              value={filters.searchTerm}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, searchTerm: e.target.value }))
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary-500)] focus:border-transparent outline-none"
              placeholder="Search by name or email..."
            />
          </div>
        </div>

        <div className="flex justify-between p-6 border-t border-gray-200">
          <button
            onClick={handleClear}
            className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
          >
            Clear All
          </button>
          <div className="flex space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleApply}
              className="px-4 py-2 bg-[var(--primary-500)] text-[var(--font-light)] rounded-lg hover:bg-[var(--primary-600)] transition-colors"
            >
              Apply Filters
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FilterModal;
