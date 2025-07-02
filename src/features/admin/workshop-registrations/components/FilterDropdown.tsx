import React from "react";
import { FiFilter } from "react-icons/fi";
import { FilterState } from "../types";

interface FilterDropdownProps {
  column: keyof FilterState;
  label: string;
  placeholder: string;
  value: string;
  isOpen: boolean;
  isActive: boolean;
  onToggle: (column: keyof FilterState) => void;
  onChange: (column: keyof FilterState, value: string) => void;
  onClear: (column: keyof FilterState) => void;
  filterRef: React.RefObject<HTMLDivElement | null>;
}

export const FilterDropdown: React.FC<FilterDropdownProps> = ({
  column,
  label,
  placeholder,
  value,
  isOpen,
  isActive,
  onToggle,
  onChange,
  onClear,
  filterRef,
}) => {
  return (
    <th className="p-3 relative">
      <div className="flex items-center justify-between">
        <span>{label}</span>
        <button
          onClick={() => onToggle(column)}
          className={`ml-2 p-1 rounded hover:bg-gray-200 ${
            isActive ? "text-blue-600" : "text-gray-400"
          }`}
        >
          <FiFilter className="w-3 h-3" />
        </button>
      </div>
      {isOpen && (
        <div
          ref={filterRef}
          className="absolute z-10 mt-1 bg-white border border-gray-200 rounded-md shadow-sm p-3 min-w-[200px]"
        >
          <input
            type="text"
            placeholder={placeholder}
            value={value}
            onChange={(e) => onChange(column, e.target.value)}
            className="w-full p-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
          />
          {value && (
            <button
              onClick={() => onClear(column)}
              className="mt-2 text-xs text-gray-600 hover:text-gray-800 transition-colors"
            >
              Clear filter
            </button>
          )}
        </div>
      )}
    </th>
  );
};

interface DateFilterDropdownProps {
  column: keyof FilterState;
  label: string;
  value: { start: string; end: string };
  isOpen: boolean;
  isActive: boolean;
  onToggle: (column: keyof FilterState) => void;
  onChange: (
    column: keyof FilterState,
    value: { start: string; end: string }
  ) => void;
  onClear: (column: keyof FilterState) => void;
  filterRef: React.RefObject<HTMLDivElement | null>;
}

export const DateFilterDropdown: React.FC<DateFilterDropdownProps> = ({
  column,
  label,
  value,
  isOpen,
  isActive,
  onToggle,
  onChange,
  onClear,
  filterRef,
}) => {
  return (
    <th className="p-3 relative">
      <div className="flex items-center justify-between">
        <span>{label}</span>
        <button
          onClick={() => onToggle(column)}
          className={`ml-2 p-1 rounded hover:bg-gray-200 ${
            isActive ? "text-blue-600" : "text-gray-400"
          }`}
        >
          <FiFilter className="w-3 h-3" />
        </button>
      </div>
      {isOpen && (
        <div
          ref={filterRef}
          className="absolute z-100 mt-1 left-1/4 transform -translate-x-1/2 bg-white border border-gray-200 rounded-md shadow-sm p-3 min-w-[200px]"
        >
          <div className="space-y-2">
            <div>
              <label className="block text-xs text-gray-500 mb-1">
                From Date
              </label>
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
              <label className="block text-xs text-gray-500 mb-1">
                To Date
              </label>
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
        </div>
      )}
    </th>
  );
};
