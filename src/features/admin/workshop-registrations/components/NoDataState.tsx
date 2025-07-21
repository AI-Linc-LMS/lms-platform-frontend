import React from "react";

interface NoDataStateProps {
  hasActiveFilters: boolean;
}

export const NoDataState: React.FC<NoDataStateProps> = ({
  hasActiveFilters,
}) => {
  return (
    <tr>
      <td colSpan={17} className="p-8 text-center justify-center items-center align-middle">
        <div className="flex flex-col items-center justify-center text-center space-y-3">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
            <svg
              className="w-8 h-8 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-medium text-gray-900">No data found</h3>
            <p className="text-gray-500 mt-1">
              {hasActiveFilters
                ? "Try adjusting your filters or search terms"
                : "No workshop registrations available"}
            </p>
          </div>
        </div>
      </td>
    </tr>
  );
};