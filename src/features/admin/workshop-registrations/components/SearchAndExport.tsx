import React, { useState } from "react";
import { FiX } from "react-icons/fi";
import { CSVUploadButton } from "./CSVUploadButton";
import {
  ColumnVisibilityDropdown,
  ColumnConfig,
} from "./ColumnVisibilityDropdown";
import { useRole } from "../../../../hooks/useRole";

interface SearchAndExportProps {
  search: string;
  onSearchChange: (value: string) => void;
  onExport: () => void;
  hasActiveFilters: boolean;
  onClearAllFilters: () => void;
  clientId: string;
  columnConfigs: ColumnConfig[];
  visibleColumns: string[];
  onColumnVisibilityChange: (visibleColumns: string[]) => void;
}

export const SearchAndExport: React.FC<SearchAndExportProps> = ({
  search,
  onSearchChange,
  onExport,
  hasActiveFilters,
  onClearAllFilters,
  clientId,
  columnConfigs,
  visibleColumns,
  onColumnVisibilityChange,
}) => {
  const { isSuperAdmin } = useRole();
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const handleSuccess = (message: string) => {
    setMessage({ type: "success", text: message });
    setTimeout(() => setMessage(null), 5000);
  };

  const handleError = (error: string) => {
    setMessage({ type: "error", text: error });
    setTimeout(() => setMessage(null), 5000);
  };

  return (
    <div className="space-y-4">
      {/* Message display */}
      {message && (
        <div
          className={`p-3 rounded text-sm ${
            message.type === "success"
              ? "bg-green-100 text-green-800 border border-green-200"
              : "bg-red-100 text-red-800 border border-red-200"
          }`}
        >
          {message.text}
        </div>
      )}

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
        <div className="flex gap-2">
          <ColumnVisibilityDropdown
            columns={columnConfigs}
            visibleColumns={visibleColumns}
            onColumnVisibilityChange={onColumnVisibilityChange}
          />
          <CSVUploadButton
            clientId={clientId}
            onSuccess={handleSuccess}
            onError={handleError}
          />
          {isSuperAdmin && <button
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
          </button>}
        </div>
      </div>
    </div>
  );
};
