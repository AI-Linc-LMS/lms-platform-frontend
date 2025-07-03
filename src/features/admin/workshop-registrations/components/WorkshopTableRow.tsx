import React, { useState, useEffect } from "react";
import { WorkshopRegistrationData } from "../types";
import { FiChevronDown, FiCheck, FiEdit2, FiX } from "react-icons/fi";

const FIRST_CALL_STATUS_OPTIONS = [
  { value: "Connected, scheduled interview", color: "bg-green-500" },
  { value: "Connected, denied interview", color: "bg-red-500" },
  { value: "Couldn't Connect", color: "bg-yellow-400" },
  { value: "Call back requested", color: "bg-green-500" },
];
const SECOND_CALL_STATUS_OPTIONS = [
  { value: "Converted", color: "bg-green-500" },
  { value: "Follow-up needed", color: "bg-yellow-400" },
  { value: "Denied", color: "bg-red-500" },
];

interface WorkshopTableRowProps {
  entry: WorkshopRegistrationData;
}

export const WorkshopTableRow: React.FC<WorkshopTableRowProps> = ({
  entry,
}) => {
  // Local state for the 4 editable fields
  const [firstCallStatus, setFirstCallStatus] = useState(
    entry.first_call_status
  );
  const [firstCallComment, setFirstCallComment] = useState(
    entry.fist_call_comment
  );
  const [secondCallStatus, setSecondCallStatus] = useState(
    entry.second_call_status
  );
  const [secondCallComment, setSecondCallComment] = useState(
    entry.second_call_comment
  );

  // Cooldown state for each status field
  const [cooldown, setCooldown] = useState<{ [key: string]: boolean }>({});
  const [quickStatusDropdown, setQuickStatusDropdown] = useState<
    null | "first_call_status" | "second_call_status"
  >(null);
  const [modalOpen, setModalOpen] = useState(false);

  // Modal edit state
  const [modalFirstCallStatus, setModalFirstCallStatus] =
    useState(firstCallStatus);
  const [modalFirstCallComment, setModalFirstCallComment] =
    useState(firstCallComment);
  const [modalSecondCallStatus, setModalSecondCallStatus] =
    useState(secondCallStatus);
  const [modalSecondCallComment, setModalSecondCallComment] =
    useState(secondCallComment);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString(undefined, {
      year: "numeric",
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  const truncateComment = (comment: string, maxLength: number = 25) => {
    if (!comment) return "N/A";
    return comment.length > maxLength
      ? `${comment.substring(0, maxLength)}...`
      : comment;
  };

  const getStatusBadgeClass = (status: string, type: "yes/no" | "call") => {
    if (type === "yes/no") {
      return status === "yes"
        ? "bg-green-100 text-green-800"
        : "bg-gray-100 text-gray-600";
    }
    if (type === "call") {
      if (
        status === "Connected, scheduled interview" ||
        status === "Call back requested" ||
        status === "Converted"
      )
        return "bg-green-100 text-green-800";
      if (status === "Couldn't Connect" || status === "Follow-up needed")
        return "bg-yellow-100 text-yellow-800";
      if (status === "Connected, denied interview" || status === "Denied")
        return "bg-red-100 text-red-800";
      return "bg-gray-100 text-gray-600";
    }
    return "bg-gray-100 text-gray-600";
  };

  // Helper to get color for a status value
  const getStatusColor = (value: string, type: "first" | "second") => {
    const options =
      type === "first" ? FIRST_CALL_STATUS_OPTIONS : SECOND_CALL_STATUS_OPTIONS;
    const found = options.find((opt) => opt.value === value);
    return found ? found.color : "bg-gray-300";
  };

  // Quick status change dropdown
  const renderStatusDropdown = (
    value: string,
    options: { value: string; color: string }[],
    field: "first_call_status" | "second_call_status"
  ) => (
    <div className="relative inline-block w-[170px]">
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
          className={`inline-block w-3 h-3 rounded-full mt-1 ${getStatusColor(
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
                if (field === "first_call_status")
                  setFirstCallStatus(opt.value);
                if (field === "second_call_status")
                  setSecondCallStatus(opt.value);
                console.log("Status changed:", {
                  field,
                  value: opt.value,
                  id: entry.id,
                });
                setQuickStatusDropdown(null);
                setCooldown((prev) => ({ ...prev, [field]: true }));
                setTimeout(
                  () => setCooldown((prev) => ({ ...prev, [field]: false })),
                  5000
                );
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

  // Modal for editing all 4 fields
  const renderEditModal = () => (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-opacity-50 backdrop-blur-xs">
      <div className="bg-white rounded-xl shadow-2xl p-8 w-full max-w-md relative border border-blue-100">
        <button
          className="absolute top-3 right-3 text-gray-400 hover:text-gray-600"
          onClick={() => setModalOpen(false)}
        >
          <FiX className="w-6 h-6" />
        </button>
        <h2 className="text-2xl font-bold mb-6">Edit Call Status & Comments</h2>
        <div className="space-y-5">
          <div>
            <label className="block text-sm font-semibold mb-1">
              1st Call Status <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <select
                className="w-full p-3 border rounded text-base bg-gray-50 border-gray-300 focus:ring-2 focus:ring-blue-200"
                value={modalFirstCallStatus}
                onChange={(e) => setModalFirstCallStatus(e.target.value)}
                required
              >
                <option value="">Select status</option>
                {FIRST_CALL_STATUS_OPTIONS.map((opt) => (
                  <option
                    key={opt.value}
                    value={opt.value}
                    className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full"
                  >
                    {opt.value}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold mb-1">
              1st Call Comment
            </label>
            <textarea
              className="w-full p-3 border rounded text-base bg-gray-50 border-gray-300 focus:ring-2 focus:ring-blue-200"
              value={modalFirstCallComment}
              onChange={(e) => setModalFirstCallComment(e.target.value)}
              placeholder="Enter comment"
              rows={2}
            />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-1">
              2nd Call Status <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <select
                className="w-full p-3 border rounded text-base bg-gray-50 border-gray-300 focus:ring-2 focus:ring-blue-200"
                value={modalSecondCallStatus}
                onChange={(e) => setModalSecondCallStatus(e.target.value)}
                required
              >
                <option value="">Select status</option>
                {SECOND_CALL_STATUS_OPTIONS.map((opt) => (
                  <option
                    key={opt.value}
                    value={opt.value}
                    className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full"
                  >
                    {opt.value}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold mb-1">
              2nd Call Comment
            </label>
            <textarea
              className="w-full p-3 border rounded text-base bg-gray-50 border-gray-300 focus:ring-2 focus:ring-blue-200"
              value={modalSecondCallComment}
              onChange={(e) => setModalSecondCallComment(e.target.value)}
              placeholder="Enter comment"
              rows={2}
            />
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-8">
          <button
            className="px-5 py-2 rounded bg-gray-200 text-gray-700 hover:bg-gray-300 font-semibold"
            onClick={() => setModalOpen(false)}
          >
            Cancel
          </button>
          <button
            className="px-5 py-2 rounded bg-blue-600 text-white hover:bg-blue-700 font-semibold"
            onClick={() => {
              setFirstCallStatus(modalFirstCallStatus);
              setFirstCallComment(modalFirstCallComment);
              setSecondCallStatus(modalSecondCallStatus);
              setSecondCallComment(modalSecondCallComment);
              setModalOpen(false);
              console.log("Modal Save:", {
                id: entry.id,
                first_call_status: modalFirstCallStatus,
                fist_call_comment: modalFirstCallComment,
                second_call_status: modalSecondCallStatus,
                second_call_comment: modalSecondCallComment,
              });
            }}
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );

  useEffect(() => {
    if (modalOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [modalOpen]);

  return (
    <>
      {modalOpen && renderEditModal()}
      <tr className="border-t">
        <td className="p-3">{entry.name}</td>
        <td className="p-3">{entry.email}</td>
        <td className="p-3">{entry.phone_number}</td>
        <td className="p-3">
          <span className="text-xs text-[10px]">{entry.workshop_name}</span>
        </td>
        <td className="p-3">
          <span className="bg-green-100 items-center justify-center text-center text-green-800 px-2 py-1 rounded-full text-xs font-medium">
            {entry.session_number || 1}
          </span>
        </td>
        <td className="p-3">
          {entry.referal_code ? (
            <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded-full text-xs font-medium">
              {entry.referal_code}
            </span>
          ) : (
            <span className="text-gray-400 text-xs">N/A</span>
          )}
        </td>
        <td className="p-3">
          <span
            className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadgeClass(
              entry.attended_webinars,
              "yes/no"
            )}`}
          >
            {entry.attended_webinars || "N/A"}
          </span>
        </td>
        <td className="p-3">
          <span
            className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadgeClass(
              entry.is_assessment_attempted,
              "yes/no"
            )}`}
          >
            {entry.is_assessment_attempted || "N/A"}
          </span>
        </td>
        <td className="p-3">
          <span
            className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadgeClass(
              entry.is_certificate_amount_paid,
              "yes/no"
            )}`}
          >
            {entry.is_certificate_amount_paid || "N/A"}
          </span>
        </td>
        <td className="p-3">
          <span
            className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadgeClass(
              entry.is_prebooking_amount_paid,
              "yes/no"
            )}`}
          >
            {entry.is_prebooking_amount_paid || "N/A"}
          </span>
        </td>
        <td className="p-3">
          <span
            className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadgeClass(
              entry.is_course_amount_paid,
              "yes/no"
            )}`}
          >
            {entry.is_course_amount_paid || "N/A"}
          </span>
        </td>
        {/* 1st Call Status */}
        <td className="p-3">
          {renderStatusDropdown(
            firstCallStatus,
            FIRST_CALL_STATUS_OPTIONS,
            "first_call_status"
          )}
        </td>
        {/* 1st Call Comment */}
        <td className="p-3">
          <span className="text-sm text-gray-700 cursor-help">
            {truncateComment(firstCallComment)}
          </span>
        </td>
        {/* 2nd Call Status */}
        <td className="p-3">
          {renderStatusDropdown(
            secondCallStatus,
            SECOND_CALL_STATUS_OPTIONS,
            "second_call_status"
          )}
        </td>
        {/* 2nd Call Comment */}
        <td className="p-3">
          <span className="text-sm text-gray-700 cursor-help">
            {truncateComment(secondCallComment)}
          </span>
        </td>
        <td className="p-3">
          <span className="text-xs font-medium">
            {entry.amount_paid || "N/A"}
          </span>
        </td>
        <td className="p-3">{formatDate(entry.registered_at)}</td>
        {/* Edit icon at rightmost */}
        <td className="p-3 text-center w-[80px] min-w-[80px]">
          <button
            className="text-gray-400 hover:text-blue-600"
            onClick={() => {
              setModalFirstCallStatus(firstCallStatus);
              setModalFirstCallComment(firstCallComment);
              setModalSecondCallStatus(secondCallStatus);
              setModalSecondCallComment(secondCallComment);
              setModalOpen(true);
            }}
            type="button"
          >
            <FiEdit2 className="w-5 h-5 mx-auto" />
          </button>
        </td>
      </tr>
    </>
  );
};
