import React from "react";
import { WorkshopRegistrationData } from "../types";
import { FiCopy, FiCheck } from "react-icons/fi";

interface WorkshopTableRowProps {
  entry: WorkshopRegistrationData;
}

export const WorkshopTableRow: React.FC<WorkshopTableRowProps> = ({
  entry,
}) => {
  const [copiedCode, setCopiedCode] = React.useState<string | null>(null);

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
      if (status === "completed") return "bg-green-100 text-green-800";
      if (status === "pending") return "bg-yellow-100 text-yellow-800";
      return "bg-gray-100 text-gray-600";
    }

    return "bg-gray-100 text-gray-600";
  };

  const handleCopyReferralCode = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCode(code);
      setTimeout(() => setCopiedCode(null), 2000);
    } catch (err) {
      console.error('Failed to copy referral code:', err);
    }
  };

  return (
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
          <div className="flex items-center gap-2">
            <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded-full text-xs font-medium font-mono">
              {entry.referal_code}
            </span>
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
          </div>
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
      <td className="p-3">
        <span
          className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadgeClass(
            entry.first_call_status,
            "call"
          )}`}
        >
          {entry.first_call_status || "N/A"}
        </span>
      </td>
      <td className="p-3">
        <div className="relative group">
          <span className="text-sm text-gray-700 cursor-help">
            {truncateComment(entry.fist_call_comment)}
          </span>
          {entry.fist_call_comment && entry.fist_call_comment.length > 25 && (
            <div className="absolute bottom-full left-0 -top-20 mb-2 h-[90px] w-[300px] px-4 py-2 bg-white text-gray-800 text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-normal max-w-md z-50 border border-gray-200 shadow-lg">
              {entry.fist_call_comment}
            </div>
          )}
        </div>
      </td>
      <td className="p-3">
        <span
          className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadgeClass(
            entry.second_call_status,
            "call"
          )}`}
        >
          {entry.second_call_status || "N/A"}
        </span>
      </td>
      <td className="p-3">
        <div className="relative group">
          <span className="text-sm text-gray-700 cursor-help">
            {truncateComment(entry.second_call_comment)}
          </span>
          {entry.second_call_comment &&
            entry.second_call_comment.length > 25 && (
              <div className="absolute bottom-full left-0 mb-2 h-[100px] w-[300px] px-4 py-2 bg-white text-gray-800 text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-normal max-w-md z-50 border border-gray-200 shadow-lg">
                {entry.second_call_comment}
              </div>
            )}
        </div>
      </td>
      <td className="p-3">
        <span className="text-xs font-medium">
          {entry.amount_paid || "N/A"}
        </span>
      </td>

      <td className="p-3">{formatDate(entry.registered_at)}</td>
    </tr>
  );
};
