import React, { useState, useEffect } from "react";
import { WorkshopRegistrationData } from "../types";
import {
  FiCopy,
  FiCheck,
  FiChevronDown,
  FiEdit2,
  FiX,
  FiClock,
} from "react-icons/fi";
import { EditRegistrationData } from "../types";
import { editRegistration } from "../../../../services/admin/workshopRegistrationApis";
import { useMutation } from "@tanstack/react-query";
import { isValidReferralCode } from "../../../../utils/referralUtils";

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
  const [copiedCode, setCopiedCode] = React.useState<string | null>(null);
  const clientId = import.meta.env.VITE_CLIENT_ID;
  const updateMutation = useMutation({
    mutationFn: (data: EditRegistrationData) =>
      editRegistration(clientId, entry.id.toString(), data),
    onSuccess: () => {
      setModalOpen(false);
    },
    onError: () => {
      setModalOpen(false);
    },
  });

  // Local state for the 4 editable fields
  const [firstCallStatus, setFirstCallStatus] = useState(
    entry.first_call_status
  );
  const [firstCallComment, setFirstCallComment] = useState(
    entry.first_call_comment
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

  // Tooltip state
  const [tooltipData, setTooltipData] = useState<{
    show: boolean;
    text: string;
    x: number;
    y: number;
  }>({ show: false, text: "", x: 0, y: 0 });

  // Add state for edit history modal
  const [editHistoryOpen, setEditHistoryOpen] = useState(false);

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

  // Add scroll event listener to close tooltip
  useEffect(() => {
    const handleScroll = () => {
      if (tooltipData.show) {
        setTooltipData({ show: false, text: "", x: 0, y: 0 });
      }
    };

    // Listen for both horizontal and vertical scroll
    window.addEventListener("scroll", handleScroll, true);
    const tableContainer =
      document.querySelector(".table-container") ||
      document.querySelector("table")?.parentElement;
    if (tableContainer) {
      tableContainer.addEventListener("scroll", handleScroll, true);
    }

    return () => {
      window.removeEventListener("scroll", handleScroll, true);
      if (tableContainer) {
        tableContainer.removeEventListener("scroll", handleScroll, true);
      }
    };
  }, [tooltipData.show]);

  const getStatusBadgeClass = (status: string, type: "true/false" | "call") => {
    if (type === "true/false") {
      if (status === "true" || status === "paid" || status === "attempted") {
        return "bg-green-500 text-white";
      }
      if (
        status === "no" ||
        status === "not_paid" ||
        status === "not_attempted"
      ) {
        return "bg-yellow-100 text-yellow-800";
      }
      return "bg-gray-100 text-gray-600";
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

  const handleCopyReferralCode = async (code: string) => {
    try {
      if (!isValidReferralCode(code)) {
        console.warn("Invalid referral code:", code);
        return;
      }
      await navigator.clipboard.writeText(code);
      setCopiedCode(code);
      setTimeout(() => setCopiedCode(null), 2000);
    } catch (err) {
      console.error("Failed to copy referral code:", err);
    }
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

                // Call API to update the status
                updateMutation.mutate({
                  first_call_status:
                    field === "first_call_status" ? opt.value : firstCallStatus,
                  first_call_comment: firstCallComment,
                  second_call_status:
                    field === "second_call_status"
                      ? opt.value
                      : secondCallStatus,
                  second_call_comment: secondCallComment,
                });
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
      <div className="bg-white rounded-xl shadow-2xl p-8 w-full max-w-xl relative border border-blue-100">
        <button
          className="absolute top-3 right-3 text-gray-400 hover:text-gray-600"
          onClick={() => setModalOpen(false)}
        >
          <FiX className="w-6 h-6" />
        </button>
        <h2 className="text-2xl font-bold mb-6">Edit</h2>
        <div className="space-y-5">
          <div className="flex gap-5 w-full">
            <div className="w-full">
              <label className="block text-sm font-semibold mb-1">
                1st Call Status <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <select
                  className="w-full p-3 border rounded text-base bg-gray-50 border-gray-300"
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
            <div className="w-full">
              <label className="block text-sm font-semibold mb-1">
                2nd Call Status <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <select
                  className="w-full p-3 border rounded text-base bg-gray-50 border-gray-300"
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
          </div>
          <div>
            <label className="block text-sm font-semibold mb-1">
              1st Call Comment
            </label>
            <textarea
              className="w-full p-3 h-full border rounded-md text-base bg-gray-50 border-gray-300"
              value={modalFirstCallComment}
              onChange={(e) => setModalFirstCallComment(e.target.value)}
              placeholder="Enter comment"
              rows={3}
            />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-1">
              2nd Call Comment
            </label>
            <textarea
              className="w-full p-3 border rounded-md text-base bg-gray-50 border-gray-300"
              value={modalSecondCallComment}
              onChange={(e) => setModalSecondCallComment(e.target.value)}
              placeholder="Enter comment"
              rows={3}
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
                first_call_comment: modalFirstCallComment,
                second_call_status: modalSecondCallStatus,
                second_call_comment: modalSecondCallComment,
              });
              // Call API to update the data
              updateMutation.mutate({
                first_call_status: modalFirstCallStatus,
                first_call_comment: modalFirstCallComment,
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

  const renderReferralCode = () => {
    if (!entry.referal_code) {
      return <span className="text-gray-400 text-xs">N/A</span>;
    }

    const isValid = isValidReferralCode(entry.referal_code);

    return (
      <div className="flex items-center gap-2">
        <span
          className={`
            px-2 py-1 rounded-full text-xs font-medium font-mono 
            ${
              isValid
                ? "bg-purple-100 text-purple-800"
                : "bg-red-100 text-red-800"
            }
          `}
          title={!isValid ? "Invalid Referral Code" : ""}
        >
          {entry.referal_code}
        </span>
        {isValid && (
          <button
            onClick={() => handleCopyReferralCode(entry.referal_code!)}
            className="p-1 hover:bg-gray-100 rounded transition-colors"
            title="Copy referral code"
          >
            {copiedCode === entry.referal_code ? (
              <FiCheck className="w-3 h-3 text-green-600" />
            ) : (
              <FiCopy className="w-3 h-3 text-gray-500" />
            )}
          </button>
        )}
      </div>
    );
  };

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
        <td className="p-3">{renderReferralCode()}</td>
        <td className="p-3">
          <span
            className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadgeClass(
              entry.attended_webinars,
              "true/false"
            )}`}
          >
            {entry.attended_webinars || "N/A"}
          </span>
        </td>
        <td className="p-3">
          <span
            className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadgeClass(
              entry.is_assessment_attempted,
              "true/false"
            )}`}
          >
            {entry.is_assessment_attempted || "N/A"}
          </span>
        </td>
        <td className="p-3">
          <span
            className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadgeClass(
              entry.is_certificate_amount_paid,
              "true/false"
            )}`}
          >
            {entry.is_certificate_amount_paid || "N/A"}
          </span>
        </td>
        <td className="p-3">
          <span
            className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadgeClass(
              entry.is_prebooking_amount_paid,
              "true/false"
            )}`}
          >
            {entry.is_prebooking_amount_paid || "N/A"}
          </span>
        </td>
        <td className="p-3">
          <span
            className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadgeClass(
              entry.is_course_amount_paid,
              "true/false"
            )}`}
          >
            {entry.is_course_amount_paid || "N/A"}
          </span>
        </td>
        <td className="p-3">
          {renderStatusDropdown(
            firstCallStatus || "N/A",
            FIRST_CALL_STATUS_OPTIONS,
            "first_call_status"
          )}
        </td>
        <td className="p-3">
          <span className="text-sm text-gray-700 cursor-help">
            {truncateComment(entry.first_call_comment || "")}
          </span>
          {entry.first_call_comment && entry.first_call_comment.length > 25 && (
            <div className="absolute bottom-full left-0 -top-20 mb-2 h-[90px] w-[300px] px-4 py-2 bg-white text-gray-800 text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-normal max-w-md z-50 border border-gray-200 shadow-lg">
              {entry.first_call_comment}
            </div>
          )}
        </td>
        <td className="p-3">
          {renderStatusDropdown(
            secondCallStatus || "N/A",
            SECOND_CALL_STATUS_OPTIONS,
            "second_call_status"
          )}
        </td>
        <td className="p-3">
          <span className="text-sm text-gray-700 cursor-help">
            {truncateComment(entry.second_call_comment || "")}
          </span>
          {entry.second_call_comment &&
            entry.second_call_comment.length > 25 && (
              <div className="absolute bottom-full left-0 mb-2 h-[100px] w-[300px] px-4 py-2 bg-white text-gray-800 text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-normal max-w-md z-50 border border-gray-200 shadow-lg">
                {entry.second_call_comment}
              </div>
            )}
        </td>
        <td className="p-3">
          <span className="text-xs font-medium">
            {entry.amount_paid ?? "N/A"}
          </span>
        </td>
        <td className="p-3">
          <span className="text-xs font-medium">
            {entry.amount_pending || "N/A"}
          </span>
        </td>
        <td className="p-3">
          <span className="text-xs font-medium">{entry.score || "N/A"}</span>
        </td>
        <td className="p-3">
          <span className="text-xs font-medium">
            {entry.offered_scholarship_percentage || "N/A"}
          </span>
        </td>
        <td className="p-3">
          <span className="text-xs font-medium">
            {entry.offered_amount || "N/A"}
          </span>
        </td>
        <td className="p-3">
          <span
            className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadgeClass(
              entry.assessment_status || "N/A",
              "true/false"
            )}`}
          >
            {entry.assessment_status || "N/A"}
          </span>
        </td>
        <td className="p-3">{formatDate(entry.registered_at)}</td>
        <td className="p-3">{formatDate(entry.updated_at || "N/A")}</td>
        <td className="p-3">
          {entry.submitted_at && entry.submitted_at !== ""
            ? formatDate(entry.submitted_at)
            : "N/A"}
        </td>
        <td className="p-3 text-center w-[120px] min-w-[120px] flex gap-2 items-center justify-center">
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
            <div className="w-10 h-10 rounded-lg bg-yellow-50 border border-yellow-400 flex items-center justify-center">
              <FiEdit2 className="w-5 h-5 mx-auto text-yellow-700" />
            </div>
          </button>
          <button
            className="text-gray-400 hover:text-green-600"
            onClick={() => setEditHistoryOpen(true)}
            type="button"
            title="View Edit History"
          >
            <div className="w-10 h-10 rounded-lg bg-blue-50 border border-blue-400 flex items-center justify-center">
              <FiClock className="w-5 h-5 mx-auto text-blue-700" />
            </div>
          </button>
        </td>
      </tr>
      {/* Global Tooltip */}
      {tooltipData.show && (
        <div
          className="fixed z-[9999] px-3 py-2 bg-white text-black text-sm rounded-lg shadow-lg max-w-sm whitespace-pre-wrap break-words border border-gray-300"
          style={{
            left: tooltipData.x,
            top: tooltipData.y,
            transform: "translateX(-103%)",
          }}
        >
          {tooltipData.text}
          <div className="absolute top-3 -right-2 w-1 h-1 border-l-6 border-l-gray-300 border-t-6 border-t-transparent border-b-6 border-b-transparent"></div>
        </div>
      )}
      {editHistoryOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-opacity-50 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-2xl p-8 w-full max-w-2xl relative border border-blue-100">
            <button
              className="absolute top-3 right-3 text-gray-400 hover:text-gray-600"
              onClick={() => setEditHistoryOpen(false)}
            >
              <FiX className="w-6 h-6" />
            </button>
            <h2 className="text-2xl font-bold mb-6">Edit History</h2>
            <div className="space-y-4 max-h-[60vh] overflow-y-auto">
              {entry.edithistory &&
              Object.entries(entry.edithistory).length > 0 ? (
                Object.entries(entry.edithistory)
                  .sort(
                    (a, b) =>
                      new Date(b[1].timestamp).getTime() -
                      new Date(a[1].timestamp).getTime()
                  )
                  .map(([key, hist]) => (
                    <div key={key} className="border rounded p-4 bg-gray-50">
                      <div className="text-xs text-gray-500 mb-1">
                        {new Date(hist.timestamp).toLocaleString()}
                      </div>
                      <div className="text-sm font-semibold mb-1">
                        Edited by: {hist.edited_by}
                      </div>
                      <div className="text-xs text-gray-700">
                        {Object.entries(hist.changes).map(([field, value]) => (
                          <div key={field}>
                            <span className="font-medium">{field}:</span>{" "}
                            {value === null ? (
                              <span className="italic text-gray-400">
                                (cleared)
                              </span>
                            ) : (
                              value.toString()
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))
              ) : (
                <div className="text-gray-400 text-center">
                  No edit history available.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
