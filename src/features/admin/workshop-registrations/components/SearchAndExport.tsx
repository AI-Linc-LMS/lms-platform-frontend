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
  sortConfigs: Array<{
    field: string;
    direction: "asc" | "desc";
  }>;
  onSortChange: (field: string, direction?: "asc" | "desc") => void;
  onClearSort: (field: string) => void;
  onClearAllSorts: () => void;
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
  sortConfigs,
  onSortChange,
  onClearSort,
  onClearAllSorts,
}) => {
  const { isSuperAdmin } = useRole();
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [showFreezeDropdown, setShowFreezeDropdown] = useState(false);
  const [showSortDropdown, setShowSortDropdown] = useState(false);
  const freezeDropdownRef = useRef<HTMLDivElement>(null);
  const sortDropdownRef = useRef<HTMLDivElement>(null);

  // Click outside handler for dropdowns
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        freezeDropdownRef.current &&
        !freezeDropdownRef.current.contains(event.target as Node)
      ) {
        setShowFreezeDropdown(false);
      }
      if (
        sortDropdownRef.current &&
        !sortDropdownRef.current.contains(event.target as Node)
      ) {
        setShowSortDropdown(false);
      }
    };

    if (showFreezeDropdown || showSortDropdown) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showFreezeDropdown, showSortDropdown]);

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

  // Define sortable fields - PRIORITY ORDER (same as in WorkshopRegistrations)
  const sortableFields = [
    { key: "id", label: "ID" },
    { key: "name", label: "Name" },
    { key: "email", label: "Email" },
    { key: "phone_number", label: "Phone Number" },
    { key: "session_number", label: "Session Number" },
    { key: "session_date", label: "Session Date" },
    { key: "registered_at", label: "Registered Date" },
    { key: "updated_at", label: "Updated Date" },
    { key: "submitted_at", label: "Submitted Date" },
    { key: "follow_up_date", label: "Follow Up Date" },
    { key: "meeting_scheduled_at", label: "Meeting Scheduled Date" },
    { key: "next_payment_date", label: "Next Payment Date" },
    { key: "assignment_submitted_at", label: "Assignment Submitted Date" },
    { key: "amount_paid", label: "Amount Paid" },
    { key: "amount_pending", label: "Amount Pending" },
    { key: "score", label: "Score" },
    { key: "offered_scholarship_percentage", label: "Scholarship %" },
    { key: "offered_amount", label: "Offered Amount" },
    { key: "platform_amount", label: "Platform Amount" },
  ];

  const handleSortAsc = (field: string) => {
    onSortChange(field, "asc");
  };

  const handleSortDesc = (field: string) => {
    onSortChange(field, "desc");
  };

  // Helper function to get sort state for a field
  const getSortState = (field: string) => {
    return sortConfigs.find((config) => config.field === field);
  };

  // Helper function to check if any sorts are active (excluding ID default)
  const hasActiveSorts = () => {
    return (
      sortConfigs.length > 1 ||
      (sortConfigs.length === 1 && sortConfigs[0].field !== "id")
    );
  };

  // Get primary sort (first in array) for button display
  const primarySort = sortConfigs[0] || { field: "id", direction: "desc" };

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
                className="flex items-center gap-2 bg-[var(--success-500)] text-white px-4 py-2 rounded text-sm max-w-[120px]"
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
          {/* Sort Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowSortDropdown(!showSortDropdown)}
              className={`flex items-center gap-2 
            ${
              hasActiveSorts()
                ? "bg-blue-600 text-white hover:bg-blue-700"
                : "bg-gray-600 text-white hover:bg-gray-700"
            }
            px-4 py-2 rounded text-sm transition-colors`}
              title={`Multi-Sort Active: ${sortConfigs.length} field${
                sortConfigs.length === 1 ? "" : "s"
              }`}
            >
              <FiFilter className="w-4 h-4" />
              <span className="hidden sm:inline">
                Sort ({sortConfigs.length}):{" "}
                {sortableFields.find((f) => f.key === primarySort.field)?.label}{" "}
                {primarySort.direction === "asc" ? "↑" : "↓"}
                {sortConfigs.length > 1 && " +" + (sortConfigs.length - 1)}
              </span>
              <span className="sm:hidden">
                {primarySort.direction === "asc" ? "↑" : "↓"}{" "}
                {sortConfigs.length > 1 && "+" + (sortConfigs.length - 1)}
              </span>
            </button>

            {showSortDropdown && (
              <div
                className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 min-w-64 max-h-80 overflow-y-auto"
                ref={sortDropdownRef}
              >
                <div className="p-3 border-b border-gray-200">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="text-sm font-medium text-gray-700">
                        Multi-Field Sort
                      </h3>
                      <p className="text-xs text-gray-500 mt-1">
                        Sort by multiple fields with priority
                      </p>
                    </div>
                    {hasActiveSorts() && (
                      <button
                        onClick={onClearAllSorts}
                        className="text-xs text-red-600 hover:text-red-800 underline"
                        title="Clear all sorts"
                      >
                        Clear All
                      </button>
                    )}
                  </div>
                </div>
                <div className="p-2">
                  {/* Active Sorts Display */}
                  {sortConfigs.length > 0 && (
                    <div className="mb-3 p-2 bg-blue-50 rounded">
                      <div className="text-xs font-medium text-blue-700 mb-1">
                        Active Sorts (by priority):
                      </div>
                      {sortConfigs.map((config, index) => {
                        const fieldLabel =
                          sortableFields.find((f) => f.key === config.field)
                            ?.label || config.field;
                        return (
                          <div
                            key={config.field}
                            className="flex items-center justify-between text-xs text-blue-600 py-1"
                          >
                            <span>
                              {index + 1}. {fieldLabel}{" "}
                              {config.direction === "asc" ? "↑" : "↓"}
                            </span>
                            <button
                              onClick={() => onClearSort(config.field)}
                              className="text-red-500 hover:text-red-700 ml-2"
                              title={`Remove ${fieldLabel} sort`}
                            >
                              ×
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Available Fields */}
                  {sortableFields.map((field) => {
                    const currentSort = getSortState(field.key);
                    const isActive = !!currentSort;

                    return (
                      <div
                        key={field.key}
                        className={`flex items-center gap-2 p-2 rounded ${
                          isActive ? "bg-yellow-50" : ""
                        }`}
                      >
                        <span className="text-sm text-gray-700 flex-1 min-w-0">
                          {field.label}
                          {isActive && (
                            <span className="text-xs text-yellow-600 ml-1">
                              (Priority:{" "}
                              {sortConfigs.findIndex(
                                (c) => c.field === field.key
                              ) + 1}
                              )
                            </span>
                          )}
                        </span>
                        <div className="flex gap-1">
                          <button
                            onClick={() => handleSortAsc(field.key)}
                            className={`px-2 py-1 text-xs rounded ${
                              currentSort?.direction === "asc"
                                ? "bg-blue-600 text-white"
                                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                            }`}
                            title={`Sort ${field.label} Ascending`}
                          >
                            ↑
                          </button>
                          <button
                            onClick={() => handleSortDesc(field.key)}
                            className={`px-2 py-1 text-xs rounded ${
                              currentSort?.direction === "desc"
                                ? "bg-blue-600 text-white"
                                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                            }`}
                            title={`Sort ${field.label} Descending`}
                          >
                            ↓
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
