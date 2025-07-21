import React from "react";
import { FiChevronDown, FiCheck } from "react-icons/fi";
import { getStatusColor } from "./TableRowUtils";

interface StatusDropdownProps {
  value: string;
  options: { value: string; color: string }[];
  field: "first_call_status" | "second_call_status" | "course_name";
  cooldown: { [key: string]: boolean };
  quickStatusDropdown:
    | null
    | "first_call_status"
    | "second_call_status"
    | "course_name";
  setQuickStatusDropdown: (
    value: "first_call_status" | "second_call_status" | "course_name" | null
  ) => void;
  setCooldown: (
    value: React.SetStateAction<{ [key: string]: boolean }>
  ) => void;
  onStatusChange: (
    field: "first_call_status" | "second_call_status" | "course_name",
    value: string
  ) => void;
}

export const StatusDropdown: React.FC<StatusDropdownProps> = ({
  value,
  options,
  field,
  cooldown,
  quickStatusDropdown,
  setQuickStatusDropdown,
  setCooldown,
  onStatusChange,
}) => {
  return (
    <div className="relative inline-block w-[170px] status-dropdown-container">
      <button
        className={`flex items-start gap-2 px-3 py-2 rounded border text-xs font-medium bg-gray-50 border-gray-300 text-gray-800 w-full transition-colors duration-150 items-center"
          ${
            cooldown[field]
              ? "opacity-50 cursor-not-allowed"
              : "hover:border-blue-400"
          }
        `}
        style={{ boxShadow: "none", minHeight: "44px" }}
        onClick={() => {
          if (!cooldown[field])
            setQuickStatusDropdown(
              quickStatusDropdown === field ? null : field
            );
        }}
        type="button"
        disabled={!!cooldown[field]}
      >
        {/* Colored dot */}
        <span
          className={`inline-block w-3 h-3 rounded-full mt-1 flex-shrink-0 ${getStatusColor(
            value,
            field === "first_call_status" ? "first" : "second"
          )}`}
        ></span>
        <span
          className="truncate text-sm font-medium text-left whitespace-pre-line break-words"
          style={{ lineHeight: "1.2", maxWidth: "120px" }}
        >
          {value || "N/A"}
        </span>
        <FiChevronDown className="w-3 h-3 ml-auto mt-1 text-gray-500" />
      </button>
      {quickStatusDropdown === field && !cooldown[field] && (
        <div className="absolute left-0 top-full z-50 mt-1 bg-white border border-gray-200 rounded shadow-lg w-56">
          {options.map((opt) => (
            <button
              key={opt.value}
              className={`flex items-center gap-2 w-full px-3 py-2 text-left hover:bg-gray-100 ${
                value === opt.value ? "bg-blue-50" : ""
              }`}
              onClick={() => {
                setQuickStatusDropdown(null);
                setCooldown((prev) => ({ ...prev, [field]: true }));
                setTimeout(
                  () => setCooldown((prev) => ({ ...prev, [field]: false })),
                  5000
                );

                onStatusChange(field, opt.value);
              }}
              type="button"
            >
              <span
                className={`inline-block w-3 h-3 rounded-full ${opt.color}`}
              ></span>
              <span className="text-sm whitespace-pre-line break-words">
                {opt.value}
              </span>
              {value === opt.value && (
                <FiCheck className="w-4 h-4 text-blue-600 ml-auto" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
