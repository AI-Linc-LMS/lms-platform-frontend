import React, { useState, useMemo, useEffect } from "react";
import { FiSearch, FiCheck } from "react-icons/fi";
import { FilterState, WorkshopRegistrationData } from "../types";

interface FilterDropdownProps {
  column: keyof FilterState;
  placeholder: string;
  value: string;
  onChange: (column: keyof FilterState, value: string) => void;
  onClear: (column: keyof FilterState) => void;
  filterRef: React.RefObject<HTMLDivElement | null>;
  data?: WorkshopRegistrationData[];
  filterType?: "text" | "select" | "multi-select";
}

export const FilterDropdown: React.FC<FilterDropdownProps> = ({
  column,
  placeholder,
  value,
  onChange,
  onClear,
  filterRef,
  data = [],
  filterType = "text",
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);

  // Sync selectedOptions with value prop
  useEffect(() => {
    if (filterType === "multi-select") {
      setSelectedOptions(
        value
          ? value
              .split(",")
              .map((v) => v.trim())
              .filter(Boolean)
          : []
      );
    }
  }, [value, filterType]);

  // Get unique values for selectable fields
  const uniqueValues = useMemo(() => {
    if (!data || filterType === "text") return [];
    const values = new Set<string>();
    data.forEach((item) => {
      const fieldValue = item[column as keyof WorkshopRegistrationData];
      if (fieldValue && typeof fieldValue === "string") {
        values.add(fieldValue);
      }
    });
    return Array.from(values).sort();
  }, [data, column, filterType]);

  // Calculate selected and non-selected options
  const selectedOptionsInData = selectedOptions.filter((opt) =>
    uniqueValues.includes(opt)
  );
  const nonSelectedOptions = uniqueValues.filter(
    (opt) => !selectedOptions.includes(opt)
  );
  const filteredNonSelected = searchTerm
    ? nonSelectedOptions.filter((value) =>
        value.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : nonSelectedOptions;

  const handleOptionToggle = (option: string) => {
    let newSelected: string[];
    if (selectedOptions.includes(option)) {
      newSelected = selectedOptions.filter((item) => item !== option);
    } else {
      newSelected = [...selectedOptions, option];
    }
    setSelectedOptions(newSelected);
    // Clear search term after selecting an option
    setSearchTerm("");

    const filterValue = newSelected.join(",");
    

    onChange(column, filterValue);
  };

  const handleClear = () => {
    setSelectedOptions([]);
    setSearchTerm("");
    onClear(column);
  };

  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const searchValue = e.target.value;
    setSearchTerm(searchValue);

    // Don't update the filter value when searching - only when selecting options
    // The search is only for filtering the dropdown options, not the actual data
  };

  if (filterType === "text") {
    return (
      <input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(column, e.target.value)}
        className="w-full p-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
      />
    );
  }

  // Multi-select dropdown always visible in filter row
  return (
    <div ref={filterRef} className="relative">
      <div className="relative mb-2">
        <FiSearch className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
        <input
          type="text"
          placeholder="Search options..."
          value={searchTerm}
          onChange={handleSearchChange}
          className="w-full pl-8 pr-2 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>
      <div className="max-h-40 overflow-y-auto space-y-1 bg-white border border-gray-200 rounded shadow-sm">
        {selectedOptionsInData.length > 0 || filteredNonSelected.length > 0 ? (
          <>
            {/* Selected options section - always show if there are selected options */}
            {selectedOptionsInData.length > 0 && (
              <>
                {selectedOptionsInData.map((option) => (
                  <label
                    key={option}
                    className="flex items-center space-x-2 p-2 hover:bg-gray-50 rounded cursor-pointer bg-blue-50 border-l-2 border-blue-500"
                  >
                    <input
                      type="checkbox"
                      checked={selectedOptions.includes(option)}
                      onChange={() => handleOptionToggle(option)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-blue-700 font-medium flex-1 truncate">
                      {option}
                    </span>
                    <FiCheck className="w-4 h-4 text-blue-600" />
                  </label>
                ))}
                {/* Show "All Selected" message when all options are selected */}
                {filteredNonSelected.length === 0 &&
                  selectedOptionsInData.length > 0 && (
                    <div className="px-2 py-1 bg-green-50 border-t border-b border-green-200">
                      <span className="text-xs text-green-600 font-medium">
                        ✓ All options selected
                      </span>
                    </div>
                  )}
                {/* Separator between selected and non-selected */}
                {filteredNonSelected.length > 0 && (
                  <div className="px-2 py-1 bg-gray-100 border-t border-b border-gray-200">
                    <span className="text-xs text-gray-500 font-medium">
                      Other Options
                    </span>
                  </div>
                )}
              </>
            )}

            {/* Non-selected options section */}
            {filteredNonSelected.map((option) => (
              <label
                key={option}
                className="flex items-center space-x-2 p-2 hover:bg-gray-50 rounded cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={selectedOptions.includes(option)}
                  onChange={() => handleOptionToggle(option)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700 flex-1 truncate">
                  {option}
                </span>
              </label>
            ))}
          </>
        ) : (
          <div className="text-sm text-gray-500 p-2 text-center">
            {searchTerm ? "No options found" : "No options available"}
          </div>
        )}
      </div>
      {selectedOptions.length > 0 && (
        <div className="mt-2 flex items-center justify-between">
          <div className="text-xs text-gray-600">
            Selected: {selectedOptions.length}
          </div>
          <button
            onClick={handleClear}
            className="text-xs text-gray-600 hover:text-gray-800 transition-colors"
          >
            Clear all
          </button>
        </div>
      )}
    </div>
  );
};

interface DateFilterDropdownProps {
  column: keyof FilterState;
  value: { start: string; end: string };
  isOpen: boolean;
  onChange: (
    column: keyof FilterState,
    value: { start: string; end: string }
  ) => void;
  onClear: (column: keyof FilterState) => void;
  filterRef: React.RefObject<HTMLDivElement | null>;
}

export const DateFilterDropdown: React.FC<DateFilterDropdownProps> = ({
  column,
  value,
  isOpen,
  onChange,
  onClear,
  filterRef,
}) => {
  if (!isOpen) return null;
  return (
    <div ref={filterRef} className="space-y-2">
      <div>
        <label className="block text-xs text-gray-500 mb-1">From Date</label>
        <input
          type="date"
          value={value.start}
          onChange={(e) =>
            onChange(column, {
              ...value,
              start: e.target.value,
            })
          }
          className="w-full p-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>
      <div>
        <label className="block text-xs text-gray-500 mb-1">To Date</label>
        <input
          type="date"
          value={value.end}
          onChange={(e) =>
            onChange(column, {
              ...value,
              end: e.target.value,
            })
          }
          className="w-full p-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>
      {(value.start || value.end) && (
        <button
          onClick={() => onClear(column)}
          className="text-xs text-gray-600 hover:text-gray-800 transition-colors"
        >
          Clear filter
        </button>
      )}
    </div>
  );
};
