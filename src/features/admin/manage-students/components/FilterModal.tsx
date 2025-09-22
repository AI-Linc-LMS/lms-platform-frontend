import { useState } from "react";
import { FiX } from "react-icons/fi";

interface FilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyFilters: (filters: FilterCriteria) => void;
  currentFilters: FilterCriteria;
}

export interface FilterCriteria {
  courses: string[];
  searchTerm: string;
}

const FilterModal: React.FC<FilterModalProps> = ({
  isOpen,
  onClose,
  onApplyFilters,
  currentFilters,
}) => {
  const [filters, setFilters] = useState<FilterCriteria>(currentFilters);

  const availableCourses = [
    "Deployment in ML",
    "Full-Stack Development",
    "Front-End Development",
    "Back-End Development",
    "Data Science",
    "Machine Learning",
    "DevOps",
  ];

  const handleCourseToggle = (course: string) => {
    setFilters((prev) => ({
      ...prev,
      courses: prev.courses.includes(course)
        ? prev.courses.filter((c) => c !== course)
        : [...prev.courses, course],
    }));
  };

  const handleApply = () => {
    onApplyFilters(filters);
    onClose();
  };

  const handleClear = () => {
    const clearedFilters: FilterCriteria = {
      courses: [],
      searchTerm: "",
    };
    setFilters(clearedFilters);
    onApplyFilters(clearedFilters);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
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
              Filter by Enrolled Courses
            </label>
            <div className="space-y-2 max-h-48 overflow-y-auto border border-gray-300 rounded-lg p-3">
              {availableCourses.map((course) => (
                <label
                  key={course}
                  className="flex items-center space-x-2 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={filters.courses.includes(course)}
                    onChange={() => handleCourseToggle(course)}
                    className="rounded border-gray-300 text-[var(--default-primary)] focus:ring-[var(--default-primary)]"
                  />
                  <span className="text-sm text-gray-700">{course}</span>
                </label>
              ))}
            </div>
            {filters.courses.length > 0 && (
              <p className="text-xs text-gray-500 mt-2">
                {filters.courses.length} course
                {filters.courses.length !== 1 ? "s" : ""} selected
              </p>
            )}
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
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--default-primary)] focus:border-transparent outline-none"
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
              className="px-4 py-2 bg-[var(--default-primary)] text-white rounded-lg hover:bg-[#1E4A63] transition-colors"
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
