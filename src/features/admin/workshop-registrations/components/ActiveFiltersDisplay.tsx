import React from "react";
import { FiX } from "react-icons/fi";
import { FilterState } from "../types";

interface ActiveFiltersDisplayProps {
  filters: FilterState;
  onClearFilter: (column: keyof FilterState) => void;
  onClearAllFilters: () => void;
}

export const ActiveFiltersDisplay: React.FC<ActiveFiltersDisplayProps> = ({
  filters,
  onClearFilter,
}) => {
  // Get active filters
  const activeFilters = Object.entries(filters).filter(([, value]) => {
    if (typeof value === "string") return value !== "";
    if (typeof value === "object" && value !== null) {
      return value.start !== "" || value.end !== "";
    }
    return false;
  });

  if (activeFilters.length === 0) return null;

  // Helper function to format filter value for display
  const formatFilterValue = (
    value: string | { start: string; end: string }
  ) => {
    if (typeof value === "string") {
      return value;
    }

    // Handle date range filters
    if (value.start && value.end) {
      return `${value.start} to ${value.end}`;
    } else if (value.start) {
      return `From ${value.start}`;
    } else if (value.end) {
      return `Until ${value.end}`;
    }

    return "";
  };

  // Helper function to get filter label
  const getFilterLabel = (key: string): string => {
    const labels: Record<string, string> = {
      name: "Name",
      email: "Email",
      phone_number: "Phone",
      workshop_name: "Workshop",
      session_number: "Registered Session",
      referal_code: "Referral Code",
      attended_webinars: "Attended Webinars",
      is_assessment_attempted: "Assessment Attempted",
      is_certificate_amount_paid: "Certificate Paid",
      is_prebooking_amount_paid: "Prebooking Paid",
      is_course_amount_paid: "Course Paid",
      first_call_status: "First Call Status",
      first_call_comment: "First Call Comment",
      second_call_status: "Second Call Status",
      second_call_comment: "Second Call Comment",
      amount_paid: "Amount Paid",
      amount_pending: "Amount Pending",
      score: "Score",
      offered_scholarship_percentage: "Scholarship %",
      offered_amount: "Offered Amount",
      submitted_at: "Submitted Date",
      assessment_status: "Assessment Status",
      registered_at: "Registered Date",
      updated_at: "Updated Date",
    };

    return (
      labels[key] ||
      key.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())
    );
  };

  return (
    <div className="mb-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-medium text-gray-700">Active Filters</h3>
      </div>
      <div className="flex flex-wrap gap-2">
        {activeFilters.map(([key, value]) => {
          const displayValue = formatFilterValue(value);
          if (!displayValue) return null;

          return (
            <div
              key={key}
              className="flex items-center gap-1 bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-xs font-medium"
            >
              <span className="font-semibold">{getFilterLabel(key)}:</span>
              <span className="max-w-[200px] truncate">{displayValue}</span>
              <button
                onClick={() => onClearFilter(key as keyof FilterState)}
                className="ml-1 hover:bg-blue-200 rounded-full p-0.5 transition-colors"
                title={`Remove ${getFilterLabel(key)} filter`}
              >
                <FiX className="w-3 h-3" />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};