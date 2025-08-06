import React, { useState, useEffect, useRef } from "react";
import {
  FiX,
  FiMail,
  FiCheckSquare,
  FiSquare,
  FiLock,
  FiFilter,
} from "react-icons/fi";
import { CSVUploadButton } from "./CSVUploadButton";
import {
  ColumnVisibilityDropdown,
  ColumnConfig,
} from "./ColumnVisibilityDropdown";
import { useRole } from "../../../../hooks/useRole";

interface FreezeColumnOption {
  key: string;
  label: string;
  required: boolean;
}

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
  onSendEmail?: () => void;
  showSelection?: boolean;
  onToggleSelection?: () => void;
  selectedCount?: number;
  freezeColumns?: string[];
  freezeColumnOptions?: FreezeColumnOption[];
  onFreezeColumnChange?: (columnKey: string, selected: boolean) => void;
  handleSort: () => void;
  sortAscending: boolean;
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
  onSendEmail,
  showSelection = false,
  onToggleSelection,
  selectedCount = 0,
  freezeColumns = [],
  freezeColumnOptions = [],
  onFreezeColumnChange,
  handleSort,
  sortAscending,
}) => {
  const { isSuperAdmin } = useRole();
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [showFreezeDropdown, setShowFreezeDropdown] = useState(false);
  const freezeDropdownRef = useRef<HTMLDivElement>(null);

  // Click outside handler for freeze dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        freezeDropdownRef.current &&
        !freezeDropdownRef.current.contains(event.target as Node)
      ) {
        setShowFreezeDropdown(false);
      }
    };

    if (showFreezeDropdown) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showFreezeDropdown]);

  const handleSuccess = (message: string) => {
    setMessage({ type: "success", text: message });
    setTimeout(() => setMessage(null), 5000);
  };

  const handleError = (error: string) => {
    setMessage({ type: "error", text: error });
    setTimeout(() => setMessage(null), 5000);
  };

  const handleFreezeColumnToggle = (columnKey: string) => {
    if (onFreezeColumnChange) {
      const isCurrentlyFrozen = freezeColumns.includes(columnKey);
      onFreezeColumnChange(columnKey, !isCurrentlyFrozen);
    }
  };

  return (
    <div className="space-y-4 flex-grow">
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

      <div className="flex flex-col">
        <div className="flex justify-between items-center gap-4 mb-3">
          <div className="flex flex-row gap-4 flex-1">
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
            {/* Freeze Columns Dropdown */}
            {onFreezeColumnChange && (
              <div className="relative">
                <button
                  onClick={() => setShowFreezeDropdown(!showFreezeDropdown)}
                  className="flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded text-sm hover:bg-purple-700 transition-colors"
                  title="Freeze Columns"
                >
                  <FiLock className="w-4 h-4" />
                  <span className="hidden sm:inline">Freeze Columns</span>
                  {freezeColumns.length > 0 && (
                    <span className="bg-white text-purple-600 text-xs px-1.5 py-0.5 rounded-full">
                      {freezeColumns.length}
                    </span>
                  )}
                </button>

                {showFreezeDropdown && (
                  <div
                    className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 min-w-48"
                    ref={freezeDropdownRef}
                  >
                    <div className="p-3 border-b border-gray-200">
                      <h3 className="text-sm font-medium text-gray-700">
                        Freeze Columns
                      </h3>
                      <p className="text-xs text-gray-500 mt-1">
                        Select columns to freeze (sticky)
                      </p>
                    </div>
                    <div className="p-2">
                      {freezeColumnOptions.map((option) => (
                        <label
                          key={option.key}
                          className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={freezeColumns.includes(option.key)}
                            onChange={() =>
                              handleFreezeColumnToggle(option.key)
                            }
                            disabled={option.required}
                            className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                          />
                          <span className="text-sm text-gray-700 flex-1">
                            {option.label}
                            {option.required && (
                              <span className="text-xs text-gray-500 ml-1">
                                (Required)
                              </span>
                            )}
                          </span>
                          {freezeColumns.includes(option.key) && (
                            <FiLock className="w-3 h-3 text-purple-600" />
                          )}
                        </label>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

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
            {isSuperAdmin && onToggleSelection && (
              <button
                onClick={onToggleSelection}
                className={`flex items-center gap-2 px-4 py-2 rounded text-sm transition-colors ${
                  showSelection
                    ? "bg-blue-600 text-white hover:bg-blue-700"
                    : "bg-gray-600 text-white hover:bg-gray-700"
                }`}
                title={
                  showSelection ? "Exit Selection Mode" : "Enter Selection Mode"
                }
              >
                {showSelection ? (
                  <FiCheckSquare className="w-4 h-4" />
                ) : (
                  <FiSquare className="w-4 h-4" />
                )}
                <span className="hidden sm:inline">
                  {showSelection ? "Selection Mode" : "Select"}
                </span>
              </button>
            )}
            {isSuperAdmin &&
              onSendEmail &&
              showSelection &&
              selectedCount > 0 && (
                <button
                  onClick={onSendEmail}
                  className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded text-sm hover:bg-green-700 transition-colors"
                  title={`Send Email to ${selectedCount} selected recipients`}
                >
                  <FiMail className="w-4 h-4" />
                  <span className="hidden sm:inline">
                    Send Email ({selectedCount})
                  </span>
                </button>
              )}
            {isSuperAdmin && (
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
            )}
          </div>
        </div>
        <div className="flex flex-row gap-4 justify-end">
          <button
            onClick={handleSort}
            className={`flex items-center gap-2 
          ${
            sortAscending
              ? "bg-blue-600 text-white hover:bg-blue-700"
              : "bg-gray-600 text-white hover:bg-gray-700"
          }
          px-4 py-2 rounded text-sm transition-colors`}
            title={
              sortAscending
                ? "Sort by ID (Ascending)"
                : "Sort by ID (Descending)"
            }
          >
            <FiFilter className="w-4 h-4" />
            <span className="hidden sm:inline">
              {sortAscending ? "ID ↑" : "ID ↓"}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
