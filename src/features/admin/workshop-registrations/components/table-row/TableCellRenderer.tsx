import React from "react";
import { WorkshopRegistrationData } from "../../types";
import { FiCopy, FiCheck, FiEdit2 } from "react-icons/fi";
import { isValidReferralCode } from "../../../../../utils/referralUtils";

interface TableCellRendererProps {
  columnKey: string;
  entry: WorkshopRegistrationData;
  firstCallStatus: string;
  firstCallComment: string;
  secondCallStatus: string;
  secondCallComment: string;
  followUpComment: string;
  offeredAmount: string;
  copiedCode: string | null;
  setCopiedCode: (code: string | null) => void;
  handleCommentClick: (
    comment: string,
    type: "first_call" | "second_call" | "follow_up"
  ) => void;
  truncateComment: (comment: string, maxLength?: number) => string;
  renderStatusDropdown: (
    value: string,
    options: { value: string; color: string }[],
    field: "first_call_status" | "second_call_status"
  ) => React.ReactNode;
  getStatusBadgeClass: (
    status: string,
    type: "true/false" | "call" | "payment"
  ) => string;
  getAmountColor: (amount: string | number | null | undefined) => string;
  formatDate: (dateString: string) => string;
  openOfferedAmountModal: () => void;
  handleEditFollowUpDate: (entry: WorkshopRegistrationData) => void;
  FIRST_CALL_STATUS_OPTIONS: { value: string; color: string }[];
  SECOND_CALL_STATUS_OPTIONS: { value: string; color: string }[];
  visibleColumns?: string[];
  permanentColumns?: string[];
  stickyStyle?: React.CSSProperties;
}

export const TableCellRenderer: React.FC<TableCellRendererProps> = ({
  columnKey,
  entry,
  firstCallStatus,
  firstCallComment,
  secondCallStatus,
  secondCallComment,
  followUpComment,
  offeredAmount,
  copiedCode,
  setCopiedCode,
  handleCommentClick,
  truncateComment,
  renderStatusDropdown,
  getStatusBadgeClass,
  getAmountColor,
  formatDate,
  openOfferedAmountModal,
  handleEditFollowUpDate,
  FIRST_CALL_STATUS_OPTIONS,
  SECOND_CALL_STATUS_OPTIONS,
  visibleColumns = [],
  permanentColumns = [],
  stickyStyle,
}) => {
  if (
    !permanentColumns.includes(columnKey) &&
    !visibleColumns.includes(columnKey)
  ) {
    return null;
  }

  const handleCopyReferralCode = async (code: string) => {
    try {
      if (!isValidReferralCode(code)) {
        return;
      }
      await navigator.clipboard.writeText(code);
      setCopiedCode(code);
      setTimeout(() => setCopiedCode(null), 2000);
    } catch {
      // Handle error silently
    }
  };

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

  const formatNumber = (value: number, digits = 2) =>
    typeof value === "number" && !isNaN(value) ? value.toFixed(digits) : "N/A";

  switch (columnKey) {
    case "name":
      return (
        <td key={columnKey} className="p-3 border-r border-b border-t border-gray-300" style={stickyStyle}>
          {entry.name}
        </td>
      );
    case "email":
      return (
        <td key={columnKey} className="p-3 border-r border-gray-300 min-w-[200px]" style={stickyStyle}>
          {entry.email}
        </td>
      );
    case "phone_number":
      return (
        <td key={columnKey} className="p-3 border-r border-gray-300 w-[140px]" style={stickyStyle}>
          {entry.phone_number}
        </td>
      );
    case "workshop_name":
      return (
        <td key={columnKey} className="p-3 border-r border-gray-300" style={stickyStyle}>
          <span className="text-xs text-[10px]">{entry.workshop_name}</span>
        </td>
      );
    case "session_number":
      return (
        <td key={columnKey} className="p-3 border-r border-gray-300" style={stickyStyle}>
          <span className="bg-green-100 items-center justify-center text-center text-green-800 px-2 py-1 rounded-full text-xs font-medium">
            {entry.session_number || 1}
          </span>
        </td>
      );
    case "referal_code":
      return (
        <td key={columnKey} className="p-3 border-r border-gray-300" style={stickyStyle}>
          {renderReferralCode()}
        </td>
      );
    case "attended_webinars":
      return (
        <td key={columnKey} className="p-3 border-r border-gray-300" style={stickyStyle}>
          <span
            className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadgeClass(
              typeof entry.attended_webinars === "boolean"
                ? entry.attended_webinars.toString()
                : entry.attended_webinars || "",
              "true/false"
            )}`}
          >
            {typeof entry.attended_webinars === "boolean"
              ? entry.attended_webinars.toString()
              : entry.attended_webinars || "N/A"}
          </span>
        </td>
      );
    case "is_assessment_attempted":
      return (
        <td key={columnKey} className="p-3 border-r border-gray-300" style={stickyStyle}>
          <span
            className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadgeClass(
              entry.is_assessment_attempted || "not_attempted",
              "true/false"
            )}`}
          >
            {entry.is_assessment_attempted || "not_attempted"}
          </span>
        </td>
      );
    case "is_certificate_amount_paid":
      return (
        <td key={columnKey} className="p-3 border-r border-gray-300" style={stickyStyle}>
          <span
            className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadgeClass(
              entry.is_certificate_amount_paid,
              "payment"
            )}`}
          >
            {entry.is_certificate_amount_paid || "N/A"}
          </span>
        </td>
      );
    case "is_prebooking_amount_paid":
      return (
        <td key={columnKey} className="p-3 border-r border-gray-300" style={stickyStyle}>
          <span
            className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadgeClass(
              entry.is_prebooking_amount_paid,
              "payment"
            )}`}
          >
            {entry.is_prebooking_amount_paid || "N/A"}
          </span>
        </td>
      );
    case "is_course_amount_paid":
      return (
        <td key={columnKey} className="p-3 border-r border-gray-300" style={stickyStyle}>
          <span
            className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadgeClass(
              entry.is_course_amount_paid,
              "payment"
            )}`}
          >
            {entry.is_course_amount_paid || "N/A"}
          </span>
        </td>
      );
    case "amount_paid":
      return (
        <td key={columnKey} className="p-3 border-r border-gray-300" style={stickyStyle}>
          <span
            className={`px-2 py-1 rounded-full text-xs font-medium ${getAmountColor(
              entry.amount_paid
            )}`}
          >
            {formatNumber(entry.amount_paid)}
          </span>
        </td>
      );
    case "amount_pending":
      return (
        <td key={columnKey} className="p-3 border-r border-gray-300" style={stickyStyle}>
          <span
            className={`px-2 py-1 rounded-full text-xs font-medium text-amber-800 bg-amber-100`}
          >
            {formatNumber(Number(entry.amount_pending))}
          </span>
        </td>
      );
    case "score":
      return (
        <td key={columnKey} className="p-3 border-r border-gray-300" style={stickyStyle}>
          <span className="text-xs text-yellow-900 p-2 rounded-full bg-yellow-300 font-medium">
            {entry.score || "N/A"}
          </span>
        </td>
      );
    case "offered_scholarship_percentage":
      return (
        <td key={columnKey} className="p-3 border-r border-gray-300" style={stickyStyle}>
          <span className="text-xs text-green-800 p-2 rounded-full bg-green-100 font-medium">
            {entry.offered_scholarship_percentage || "N/A"}
          </span>
        </td>
      );
    case "offered_amount":
      return (
        <td key={columnKey} className="p-3 border-r border-gray-300" style={stickyStyle}>
          <div className="flex items-center gap-2">
            <span
              className={`px-2 py-1 rounded-full text-xs font-medium ${getAmountColor(
                offeredAmount
              )}`}
            >
              {formatNumber(Number(offeredAmount))}
            </span>
            <button
              className="p-1 rounded-full bg-blue-100 hover:bg-blue-200 text-blue-600 hover:text-blue-700 transition-colors duration-200 flex items-center justify-center"
              onClick={openOfferedAmountModal}
              type="button"
              title="Edit offered amount"
            >
              <svg
                className="w-3 h-3"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                />
              </svg>
            </button>
          </div>
        </td>
      );
    case "platform_amount":
      return (
        <td key={columnKey} className="p-3 border-r border-gray-300" style={stickyStyle}>
          <span
            className={`px-2 py-1 rounded-full text-xs font-medium ${getAmountColor(
              entry.platform_amount
            )}`}
          >
            {formatNumber(Number(entry.platform_amount))}
          </span>
        </td>
      );
    case "assignment_submitted_at":
      return (
        <td key={columnKey} className="p-3 border-r border-gray-300" style={stickyStyle}>
          {entry.assignment_submitted_at && entry.assignment_submitted_at !== ""
            ? formatDate(entry.assignment_submitted_at)
            : "N/A"}
        </td>
      );
    case "referral_code_assessment":
      return (
        <td key={columnKey} className="p-3 border-r border-gray-300" style={stickyStyle}>
          <span className="text-xs font-medium">
            {entry.referral_code_assessment || "N/A"}
          </span>
        </td>
      );
    case "assessment_status":
      return (
        <td key={columnKey} className="p-3 border-r border-gray-300" style={stickyStyle}>
          <span
            className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadgeClass(
              entry.assessment_status || "N/A",
              "true/false"
            )}`}
          >
            {entry.assessment_status || "N/A"}
          </span>
        </td>
      );
    case "first_call_status":
      return (
        <td key={columnKey} className="p-3 border-r border-gray-300" style={stickyStyle}>
          {renderStatusDropdown(
            firstCallStatus || "N/A",
            FIRST_CALL_STATUS_OPTIONS,
            "first_call_status"
          )}
        </td>
      );
    case "first_call_comment":
      return (
        <td key={columnKey} className="p-3 border-r border-gray-300" style={stickyStyle}>
          <div
            className="text-sm text-gray-700 cursor-pointer hover:text-blue-600 transition-colors"
            onClick={() =>
              handleCommentClick(firstCallComment || "", "first_call")
            }
          >
            {truncateComment(firstCallComment || "")}
            {firstCallComment && firstCallComment.length > 25 && (
              <span className="text-blue-600 text-xs ml-1">See more</span>
            )}
          </div>
        </td>
      );
    case "second_call_status":
      return (
        <td key={columnKey} className="p-3 border-r border-gray-300" style={stickyStyle}>
          {renderStatusDropdown(
            secondCallStatus || "N/A",
            SECOND_CALL_STATUS_OPTIONS,
            "second_call_status"
          )}
        </td>
      );
    case "second_call_comment":
      return (
        <td key={columnKey} className="p-3 border-r border-gray-300" style={stickyStyle}>
          <div
            className="text-sm text-gray-700 cursor-pointer hover:text-blue-600 transition-colors"
            onClick={() =>
              handleCommentClick(secondCallComment || "", "second_call")
            }
          >
            {truncateComment(secondCallComment || "")}
            {secondCallComment && secondCallComment.length > 25 && (
              <span className="text-blue-600 text-xs ml-1">See more</span>
            )}
          </div>
        </td>
      );
    case "follow_up_comment":
      return (
        <td key={columnKey} className="p-3 border-r border-gray-300" style={stickyStyle}>
          <div
            className="text-sm text-gray-700 cursor-pointer hover:text-blue-600 transition-colors"
            onClick={() =>
              handleCommentClick(followUpComment || "", "follow_up")
            }
          >
            {truncateComment(followUpComment || "")}
            {followUpComment && followUpComment.length > 25 && (
              <span className="text-blue-600 text-xs ml-1">See more</span>
            )}
          </div>
        </td>
      );
    case "follow_up_date":
      return (
        <td key={columnKey} className="p-3 border-r border-gray-300" style={stickyStyle}>
          <div className="flex items-center justify-center gap-2">
            <div className="flex items-center justify-center gap-2">
              {entry.follow_up_date && entry.follow_up_date !== ""
                ? formatDate(entry.follow_up_date)
                : "N/A"}
            </div>
            <button
              onClick={() => handleEditFollowUpDate(entry)}
              className="text-blue-500 hover:text-blue-700 bg-blue-100 rounded-full p-1"
              title="Edit follow-up date"
            >
              <FiEdit2 className="w-3 h-3" />
            </button>
          </div>
        </td>
      );

    case "registered_at":
      return (
        <td key={columnKey} className="p-3 border-r border-gray-300" style={stickyStyle}>
          {formatDate(entry.registered_at)}
        </td>
      );
    case "updated_at":
      return (
        <td key={columnKey} className="p-3 border-r border-gray-300" style={stickyStyle}>
          {formatDate(entry.updated_at || "N/A")}
        </td>
      );
    case "submitted_at":
      return (
        <td key={columnKey} className="p-3 border-r border-gray-300" style={stickyStyle}>
          {entry.submitted_at && entry.submitted_at !== ""
            ? formatDate(entry.submitted_at)
            : "N/A"}
        </td>
      );
    default:
      return null;
  }
};
