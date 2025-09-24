import React, { useState, useRef, useEffect } from "react";
import { FiEye, FiEyeOff, FiChevronDown, FiX } from "react-icons/fi";

export interface ColumnConfig {
  key: string;
  label: string;
  defaultVisible: boolean;
}

interface ColumnVisibilityDropdownProps {
  columns: ColumnConfig[];
  visibleColumns: string[];
  onColumnVisibilityChange: (visibleColumns: string[]) => void;
}

export const ColumnVisibilityDropdown: React.FC<
  ColumnVisibilityDropdownProps
> = ({ columns, visibleColumns, onColumnVisibilityChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleColumn = (columnKey: string) => {
    const newVisibleColumns = visibleColumns.includes(columnKey)
      ? visibleColumns.filter((col) => col !== columnKey)
      : [...visibleColumns, columnKey];

    onColumnVisibilityChange(newVisibleColumns);
  };

  const selectAll = () => {
    onColumnVisibilityChange(columns.map((col) => col.key));
  };

  const deselectAll = () => {
    onColumnVisibilityChange([]);
  };

  const visibleCount = visibleColumns.length;
  const totalCount = columns.length;

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:ring-2 focus:ring-[var(--primary-500)] focus:border-transparent outline-none"
      >
        <FiEye className="w-4 h-4" />
        <span className="text-sm font-medium">
          Columns ({visibleCount}/{totalCount})
        </span>
        <FiChevronDown
          className={`w-4 h-4 transition-transform ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 min-w-[280px] max-h-[400px] overflow-y-auto">
          <div className="p-3 border-b border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-gray-900">
                Column Visibility
              </h3>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <FiX className="w-4 h-4" />
              </button>
            </div>
            <div className="flex gap-2">
              <button
                onClick={selectAll}
                className="text-xs px-2 py-1 bg-blue-50 text-blue-700 rounded hover:bg-blue-100"
              >
                Select All
              </button>
              <button
                onClick={deselectAll}
                className="text-xs px-2 py-1 bg-gray-50 text-gray-700 rounded hover:bg-gray-100"
              >
                Deselect All
              </button>
            </div>
          </div>

          <div className="p-2">
            {columns.map((column) => {
              const isVisible = visibleColumns.includes(column.key);
              return (
                <label
                  key={column.key}
                  className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={isVisible}
                    onChange={() => toggleColumn(column.key)}
                    className="w-4 h-4 text-[var(--primary-500)] border-gray-300 rounded focus:ring-[var(--primary-500)]"
                  />
                  <div className="flex items-center gap-2 flex-1">
                    {isVisible ? (
                      <FiEye className="w-4 h-4 text-green-600" />
                    ) : (
                      <FiEyeOff className="w-4 h-4 text-gray-400" />
                    )}
                    <span className="text-sm text-gray-700">
                      {column.label}
                    </span>
                  </div>
                </label>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
