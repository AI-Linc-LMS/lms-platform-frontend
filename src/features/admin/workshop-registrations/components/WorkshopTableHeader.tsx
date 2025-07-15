import React, { useState, useMemo, useRef, useEffect } from "react";
import { FilterState, WorkshopRegistrationData } from "../types";
import {
  DateFilterDropdown,
  FollowUpDateFilterDropdown,
} from "./FilterDropdown";
import { FiCheck, FiFilter } from "react-icons/fi";

const FIRST_CALL_STATUS_OPTIONS = [
  { value: "Connected scheduled interview", color: "bg-green-500" },
  { value: "Connected denied interview", color: "bg-red-500" },
  { value: "Couldn't Connect", color: "bg-yellow-400" },
  { value: "Call back requested", color: "bg-green-500" },
  { value: "N/A", color: "bg-gray-400" },
];
const SECOND_CALL_STATUS_OPTIONS = [
  { value: "Converted", color: "bg-green-500" },
  { value: "Follow-up needed", color: "bg-yellow-400" },
  { value: "Denied", color: "bg-red-500" },
  { value: "Good to hire", color: "bg-blue-500" },
  { value: "N/A", color: "bg-gray-400" },
];
const ASSESSMENT_ATTEMPTED_OPTIONS = [
  { value: "attempted", color: "bg-green-500" },
  { value: "not_attempted", color: "bg-yellow-400" },
];

interface WorkshopTableHeaderProps {
  filters: FilterState;
  openFilter: keyof FilterState | null;
  filterRefs: {
    [key in keyof FilterState]?: React.RefObject<HTMLDivElement | null>;
  };
  onToggleFilter: (column: keyof FilterState | null) => void;
  onUpdateFilter: (
    column: keyof FilterState,
    value: string | { start: string; end: string }
  ) => void;
  onClearFilter: (column: keyof FilterState) => void;
  data?: WorkshopRegistrationData[];
  visibleColumns?: string[];
  permanentColumns?: string[];
}

// Reusable MultiSelectDropdown component
const MultiSelectDropdown: React.FC<{
  value: string;
  onChange: (value: string) => void;
  data: string[];
  colorMap?: { [value: string]: string };
}> = ({ value, onChange, data, colorMap }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const uniqueOptions = useMemo(() => Array.from(new Set(data)).sort(), [data]);
  const selectedOptions =
    typeof value === "string" && value
      ? value
          .split("|||")
          .map((v) => v.trim())
          .filter(Boolean)
      : [];

  // Calculate selected and non-selected options
  const selectedOptionsInData = selectedOptions.filter((opt) =>
    uniqueOptions.includes(opt)
  );
  const nonSelectedOptions = uniqueOptions.filter(
    (opt) => !selectedOptions.includes(opt)
  );
  const filteredNonSelected = searchTerm
    ? nonSelectedOptions.filter((opt) =>
        opt.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : nonSelectedOptions;

  // On search change, filter dropdown options and table data
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const searchVal = e.target.value;
    setSearchTerm(searchVal);

    // Don't update the filter value when searching - only when selecting options
    // The search is only for filtering the dropdown options, not the actual data
  };

  // On option toggle, update filter state (table data) and clear search
  const handleToggle = (opt: string) => {
    let newSelected: string[];
    if (selectedOptions.map((v) => v.trim()).includes(opt.trim())) {
      newSelected = selectedOptions.filter((o) => o.trim() !== opt.trim());
    } else {
      newSelected = [...selectedOptions, opt];
    }
    // Clear search term after selecting an option
    setSearchTerm("");

    const filterValue = newSelected.join("|||");

    onChange(filterValue);
  };

  const handleClear = () => {
    setSearchTerm("");
    onChange("");
  };

  return (
    <div className="w-44">
      <div className="mb-2">
        <input
          type="text"
          placeholder="Search..."
          value={searchTerm}
          onChange={handleSearchChange}
          className="w-full p-2 border border-gray-300 rounded text-sm"
        />
      </div>
      <div className="max-h-40 overflow-y-auto border border-gray-200 rounded bg-white">
        {selectedOptionsInData.length > 0 || filteredNonSelected.length > 0 ? (
          <>
            {/* Selected options section - always show if there are selected options */}
            {selectedOptionsInData.length > 0 && (
              <>
                {selectedOptionsInData.map((opt) => (
                  <label
                    key={opt}
                    className="flex items-center space-x-2 p-2 hover:bg-gray-50 cursor-pointer bg-blue-50 border-l-2 border-blue-500"
                  >
                    <input
                      type="checkbox"
                      checked={selectedOptions
                        .map((v) => v.trim())
                        .includes(opt.trim())}
                      onChange={() => handleToggle(opt)}
                      className="rounded border-gray-300 text-blue-600"
                    />
                    {colorMap && colorMap[opt] && (
                      <span
                        className={`inline-block w-3 h-3 rounded-full ${colorMap[opt]}`}
                      ></span>
                    )}
                    <span className="text-sm text-blue-700 font-medium flex-1">
                      {opt}
                    </span>
                    {selectedOptions
                      .map((v) => v.trim())
                      .includes(opt.trim()) && (
                      <FiCheck className="w-4 h-4 text-blue-600" />
                    )}
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
            {filteredNonSelected.map((opt) => (
              <label
                key={opt}
                className="flex items-center space-x-2 p-2 hover:bg-gray-50 cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={selectedOptions
                    .map((v) => v.trim())
                    .includes(opt.trim())}
                  onChange={() => handleToggle(opt)}
                  className="rounded border-gray-300 text-blue-600"
                />
                {colorMap && colorMap[opt] && (
                  <span
                    className={`inline-block w-3 h-3 rounded-full ${colorMap[opt]}`}
                  ></span>
                )}
                <span className="text-sm text-gray-700 flex-1">{opt}</span>
                {selectedOptions.map((v) => v.trim()).includes(opt.trim()) && (
                  <FiCheck className="w-4 h-4 text-blue-600" />
                )}
              </label>
            ))}
          </>
        ) : (
          <div className="p-3 text-sm text-gray-500 text-center">
            {searchTerm ? "No options found" : "No options available"}
          </div>
        )}
      </div>
      {selectedOptions.length > 0 && (
        <div className="mt-2 flex items-center justify-between">
          <div className="text-xs text-gray-600">
            {selectedOptions.length} selected
          </div>
          <button
            onClick={handleClear}
            className="text-xs text-red-600 hover:text-red-800"
          >
            Clear all
          </button>
        </div>
      )}
    </div>
  );
};

export const WorkshopTableHeader: React.FC<WorkshopTableHeaderProps> = ({
  filters,
  openFilter,
  filterRefs,
  onToggleFilter,
  onUpdateFilter,
  onClearFilter,
  data = [],
  visibleColumns = [],
  permanentColumns = [],
}) => {
  const filterConfigs = [
    // Personal details
    { column: "name", label: "Name" },
    { column: "email", label: "Email" },
    { column: "phone_number", label: "Mobile Number" },
    { column: "workshop_name", label: "Workshop Name" },
    { column: "session_number", label: "Session" },
    { column: "referal_code", label: "Referral Code" },
    // Call details
    {
      column: "first_call_status",
      label: "1st Call Status",
      enum: FIRST_CALL_STATUS_OPTIONS,
    },
    { column: "first_call_comment", label: "1st Call Comment" },
    {
      column: "second_call_status",
      label: "2nd Call Status",
      enum: SECOND_CALL_STATUS_OPTIONS,
    },
    { column: "second_call_comment", label: "2nd Call Comment" },
    { column: "follow_up_comment", label: "Follow Up Comment" },
    { column: "follow_up_date", label: "Follow Up Date", isDate: true },
    // Assessment details
    { column: "attended_webinars", label: "Attendee" },
    {
      column: "is_assessment_attempted",
      label: "Assessment",
      enum: ASSESSMENT_ATTEMPTED_OPTIONS,
    },
    { column: "score", label: "Score" },
    { column: "offered_scholarship_percentage", label: "Scholarship %" },
    {
      column: "assignment_submitted_at",
      label: "Assignment Submitted At",
      isDate: true,
    },
    { column: "referral_code_assessment", label: "Referral Code Assessment" },
    { column: "assessment_status", label: "Assessment Status" },
    // Payment details
    { column: "is_certificate_amount_paid", label: "Certificate Paid" },
    { column: "is_prebooking_amount_paid", label: "Prebooking Paid" },
    { column: "is_course_amount_paid", label: "Course Paid" },
    { column: "amount_paid", label: "Amount Paid" },
    { column: "amount_pending", label: "Amount Pending" },
    { column: "offered_amount", label: "Offered Amount" },
    { column: "platform_amount", label: "Platform Amount" },
    // Comment and status
    // Dates
    { column: "registered_at", label: "Registered At", isDate: true },
    { column: "updated_at", label: "Updated At", isDate: true },
    { column: "submitted_at", label: "Submitted At", isDate: true },
  ];

  const commentFields = [
    "first_call_comment",
    "second_call_comment",
    "follow_up_comment",
  ];

  // Helper to get all unique values for a field from a filtered dataset
  const getUniqueFieldValues = (
    field: keyof WorkshopRegistrationData,
    filtered: WorkshopRegistrationData[]
  ) => {
    const values = new Set<string>();
    filtered.forEach((item) => {
      const val = item[field];
      if (val && typeof val === "string") values.add(val);
      if (val && typeof val === "number") values.add(val.toString());
    });

    // Special handling for assessment field to include default values
    if (field === "is_assessment_attempted") {
      values.add("not_attempted");
      values.add("attempted");
    }

    return Array.from(values);
  };

  // Click outside handler
  const popoverRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (!openFilter) return;
      const ref = popoverRefs.current[openFilter];
      if (ref && !ref.contains(event.target as Node)) {
        onToggleFilter(null);
      }
    }
    if (openFilter) {
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [openFilter, onToggleFilter]);

  return (
    <thead className="bg-gray-100 sticky top-0 z-10">
      <tr>
        {filterConfigs
          .filter(
            (config) =>
              permanentColumns.includes(config.column) ||
              visibleColumns.includes(config.column)
          )
          .map((config) => (
            <th
              key={config.column}
              className={[
                "p-3 sticky top-0 z-10 bg-gray-100",
                (config.column === "first_call_status" ||
                  config.column === "second_call_status") &&
                  "w-[150px] min-w-[150px]",
              ]
                .filter(Boolean)
                .join(" ")}
            >
              <div className="flex items-center gap-1">
                <span>{config.label}</span>
                {!commentFields.includes(config.column) && (
                  <button
                    type="button"
                    className={`p-1 rounded hover:bg-gray-400 ${
                      openFilter === config.column
                        ? "text-blue-600 bg-blue-200"
                        : "text-black"
                    }`}
                    onClick={() =>
                      onToggleFilter(
                        openFilter === config.column
                          ? null
                          : (config.column as keyof FilterState)
                      )
                    }
                  >
                    <FiFilter className="w-4 h-4" />
                  </button>
                )}
              </div>
              {/* Popover filter UI */}
              {openFilter === config.column &&
                !commentFields.includes(config.column) && (
                  <div
                    ref={(el) => {
                      popoverRefs.current[config.column] = el;
                    }}
                    className="absolute left-0 top-full z-50 mt-2 bg-white border border-gray-200 rounded shadow-lg p-4 min-w-[180px]"
                  >
                    {config.isDate ? (
                      config.column === "follow_up_date" ? (
                        <FollowUpDateFilterDropdown
                          column={config.column as keyof FilterState}
                          value={
                            (filters[config.column as keyof FilterState] as {
                              start: string;
                              end: string;
                            }) || { start: "", end: "" }
                          }
                          isOpen={true}
                          onChange={(column, value) =>
                            onUpdateFilter(column, value)
                          }
                          onClear={onClearFilter}
                          filterRef={
                            filterRefs[config.column as keyof FilterState]!
                          }
                        />
                      ) : (
                        <DateFilterDropdown
                          column={config.column as keyof FilterState}
                          value={
                            (filters[config.column as keyof FilterState] as {
                              start: string;
                              end: string;
                            }) || { start: "", end: "" }
                          }
                          isOpen={true}
                          onChange={(column, value) =>
                            onUpdateFilter(column, value)
                          }
                          onClear={onClearFilter}
                          filterRef={
                            filterRefs[config.column as keyof FilterState]!
                          }
                        />
                      )
                    ) : config.enum ? (
                      <MultiSelectDropdown
                        value={
                          filters[config.column as keyof FilterState] as string
                        }
                        onChange={(value) =>
                          onUpdateFilter(
                            config.column as keyof FilterState,
                            value
                          )
                        }
                        data={config.enum.map((e) => e.value)}
                        colorMap={Object.fromEntries(
                          config.enum.map((e) => [e.value, e.color])
                        )}
                      />
                    ) : (
                      <MultiSelectDropdown
                        value={
                          filters[config.column as keyof FilterState] as string
                        }
                        onChange={(value) =>
                          onUpdateFilter(
                            config.column as keyof FilterState,
                            value
                          )
                        }
                        data={getUniqueFieldValues(
                          config.column as keyof WorkshopRegistrationData,
                          data
                        )}
                      />
                    )}
                  </div>
                )}
            </th>
          ))}
        {/* Action column header */}
        <th className="p-3 text-center w-[80px] min-w-[80px]">Action</th>
      </tr>
    </thead>
  );
};
