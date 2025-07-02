import React from "react";
import { FiX } from "react-icons/fi";

interface SearchAndExportProps {
  search: string;
  onSearchChange: (value: string) => void;
  onExport: () => void;
  hasActiveFilters: boolean;
  onClearAllFilters: () => void;
}

export const SearchAndExport: React.FC<SearchAndExportProps> = ({
  search,
  onSearchChange,
  onExport,
  hasActiveFilters,
  onClearAllFilters,
}) => {
  return (
    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
      <div className="flex flex-col sm:flex-row gap-4 flex-1">
        <input
          type="text"
          placeholder="Search by Name, Email"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="p-2 border rounded w-full sm:max-w-sm"
        />
        {hasActiveFilters && (
          <button
            onClick={onClearAllFilters}
            className="flex items-center gap-2 bg-gray-600 text-white px-4 py-2 rounded text-sm hover:bg-gray-700 transition-colors"
          >
            <FiX className="w-4 h-4" />
            Clear All Filters
          </button>
        )}
      </div>
      <button
        onClick={onExport}
        className="flex items-center gap-2 bg-[#5FA564] text-white px-4 py-2 rounded text-sm max-w-[120px]"
        title="Export to Excel"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="w-5 h-5 text-white"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5m0 0l5-5m-5 5V4"
          />
        </svg>
        <span className="inline text-white">Export</span>
      </button>
    </div>
  );
};
