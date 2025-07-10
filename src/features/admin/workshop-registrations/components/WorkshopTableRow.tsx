import React, { useState, useEffect } from "react";
import { WorkshopRegistrationData } from "../types";
import {
  FiCopy,
  FiCheck,
  FiChevronDown,
  FiEdit2,
  FiClock,
} from "react-icons/fi";
import { EditRegistrationData } from "../types";
import { editRegistration } from "../../../../services/admin/workshopRegistrationApis";
import { useMutation } from "@tanstack/react-query";
import { isValidReferralCode } from "../../../../utils/referralUtils";
import {
  EditHistoryModal,
  CommentModal,
  EditModal,
  EditOfferedAmountModal,
  PaymentHistoryModal,
} from "./modals";
import { FiCreditCard } from "react-icons/fi";

const FIRST_CALL_STATUS_OPTIONS = [
  { value: "Connected, scheduled interview", color: "bg-green-500" },
  { value: "Connected, denied interview", color: "bg-red-500" },
  { value: "Couldn't Connect", color: "bg-yellow-400" },
  { value: "Call back requested", color: "bg-green-500" },
  { value: "N/A", color: "bg-gray-400" },
];
const SECOND_CALL_STATUS_OPTIONS = [
  { value: "Converted", color: "bg-green-500" },
  { value: "Follow-up needed", color: "bg-yellow-400" },
  { value: "Denied", color: "bg-red-500" },
  { value: "N/A", color: "bg-gray-400" },
];

interface WorkshopTableRowProps {
  entry: WorkshopRegistrationData;
  visibleColumns?: string[];
  permanentColumns?: string[];
}

export const WorkshopTableRow: React.FC<WorkshopTableRowProps> = ({
  entry,
  visibleColumns = [],
  permanentColumns = [],
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

  // Local state for all editable fields
  const [firstCallStatus, setFirstCallStatus] = useState(
    entry.first_call_status || ""
  );
  const [firstCallComment, setFirstCallComment] = useState(
    entry.first_call_comment || ""
  );
  const [secondCallStatus, setSecondCallStatus] = useState(
    entry.second_call_status || ""
  );
  const [secondCallComment, setSecondCallComment] = useState(
    entry.second_call_comment || ""
  );
  const [followUpComment, setFollowUpComment] = useState(
    entry.follow_up_comment || ""
  );
  const [offeredAmount, setOfferedAmount] = useState(
    entry.offered_amount || ""
  );

  // Cooldown state for each status field
  const [cooldown, setCooldown] = useState<{ [key: string]: boolean }>({});
  const [quickStatusDropdown, setQuickStatusDropdown] = useState<
    null | "first_call_status" | "second_call_status"
  >(null);
  const [modalOpen, setModalOpen] = useState(false);

  // Modal edit state (initialized from local state)
  const [modalFirstCallStatus, setModalFirstCallStatus] =
    useState(firstCallStatus);
  const [modalFirstCallComment, setModalFirstCallComment] =
    useState(firstCallComment);
  const [modalSecondCallStatus, setModalSecondCallStatus] =
    useState(secondCallStatus);
  const [modalSecondCallComment, setModalSecondCallComment] =
    useState(secondCallComment);
  const [modalFollowUpComment, setModalFollowUpComment] =
    useState(followUpComment);
  const [modalOfferedAmount, setModalOfferedAmount] = useState(offeredAmount);

  // Tooltip state
  const [tooltipData, setTooltipData] = useState<{
    show: boolean;
    text: string;
    x: number;
    y: number;
  }>({ show: false, text: "", x: 0, y: 0 });

  // Add state for edit history modal
  const [editHistoryOpen, setEditHistoryOpen] = useState(false);

  // Add state for comment modal
  const [commentModalOpen, setCommentModalOpen] = useState(false);
  const [selectedComment, setSelectedComment] = useState<{
    type: "first_call" | "second_call" | "follow_up";
    text: string;
  } | null>(null);

  // Add state for offered amount modal
  const [offeredAmountModalOpen, setOfferedAmountModalOpen] = useState(false);

  // Add state for payment history modal
  const [paymentHistoryOpen, setPaymentHistoryOpen] = useState(false);

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

  const handleCommentClick = (
    comment: string,
    type: "first_call" | "second_call" | "follow_up"
  ) => {
    if (comment && comment.length > 25) {
      setSelectedComment({ type, text: comment });
      setCommentModalOpen(true);
    }
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

  // Add click outside handler for status dropdowns
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (quickStatusDropdown) {
        const target = event.target as Element;
        const dropdownContainer = target.closest(".status-dropdown-container");
        if (!dropdownContainer) {
          setQuickStatusDropdown(null);
        }
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [quickStatusDropdown]);

  const getStatusBadgeClass = (
    status: string,
    type: "true/false" | "call" | "payment"
  ) => {
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
    if (type === "payment") {
      if (status === "true" || status === "paid") {
        return "bg-green-500 text-white";
      }
      if (status === "partially_paid") {
        return "bg-orange-500 text-white";
      }
      if (status === "false" || status === "not_paid" || status === "no") {
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
      if (status === "N/A") return "bg-gray-100 text-gray-600";
      return "bg-gray-100 text-gray-600";
    }
    return "bg-gray-100 text-gray-600";
  };

  const handleCopyReferralCode = async (code: string) => {
    try {
      if (!isValidReferralCode(code)) {
        //console.warn("Invalid referral code:", code);
        return;
      }
      await navigator.clipboard.writeText(code);
      setCopiedCode(code);
      setTimeout(() => setCopiedCode(null), 2000);
    } catch {
      //console.error("Failed to copy referral code:", err);
    }
  };

  // Helper to get color for a status value
  const getStatusColor = (value: string, type: "first" | "second") => {
    const options =
      type === "first" ? FIRST_CALL_STATUS_OPTIONS : SECOND_CALL_STATUS_OPTIONS;
    const found = options.find((opt) => opt.value === value);
    return found ? found.color : "bg-gray-300";
  };

  // Helper to get color for amount fields
  const getAmountColor = (amount: string | number | null | undefined) => {
    if (!amount || amount === "N/A" || amount === 0 || amount === "0") {
      return "bg-gray-100 text-gray-600";
    }

    const numAmount = typeof amount === "string" ? parseFloat(amount) : amount;

    if (numAmount > 0) {
      return "bg-green-100 text-green-800";
    }

    return "bg-gray-100 text-gray-600";
  };

  // Quick status change dropdown
  const renderStatusDropdown = (
    value: string,
    options: { value: string; color: string }[],
    field: "first_call_status" | "second_call_status"
  ) => (
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
                if (field === "first_call_status")
                  setFirstCallStatus(opt.value);
                if (field === "second_call_status")
                  setSecondCallStatus(opt.value);

                setQuickStatusDropdown(null);
                setCooldown((prev) => ({ ...prev, [field]: true }));
                setTimeout(
                  () => setCooldown((prev) => ({ ...prev, [field]: false })),
                  5000
                );

                // Call API to update the status
                updateMutation.mutate(
                  {
                    first_call_status:
                      field === "first_call_status"
                        ? opt.value
                        : firstCallStatus,
                    first_call_comment: firstCallComment,
                    second_call_status:
                      field === "second_call_status"
                        ? opt.value
                        : secondCallStatus,
                    second_call_comment: secondCallComment,
                  },
                  {
                    onSuccess: (_data, variables) => {
                      setFirstCallStatus(variables.first_call_status || "");
                      setFirstCallComment(variables.first_call_comment || "");
                      setSecondCallStatus(variables.second_call_status || "");
                      setSecondCallComment(variables.second_call_comment || "");
                    },
                  }
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

  useEffect(() => {
    if (modalOpen || commentModalOpen || editHistoryOpen) {
      document.body.style.overflow = "hidden";
      document.body.style.position = "fixed";
      document.body.style.width = "100%";
    } else {
      document.body.style.overflow = "";
      document.body.style.position = "";
      document.body.style.width = "";
    }
    return () => {
      document.body.style.overflow = "";
      document.body.style.position = "";
      document.body.style.width = "";
    };
  }, [modalOpen, commentModalOpen, editHistoryOpen]);

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

  const openEditModal = () => {
    setModalFirstCallStatus(firstCallStatus);
    setModalFirstCallComment(firstCallComment);
    setModalSecondCallStatus(secondCallStatus);
    setModalSecondCallComment(secondCallComment);
    setModalFollowUpComment(followUpComment);
    setModalOpen(true);
  };
  const openOfferedAmountModal = () => {
    setModalOfferedAmount(offeredAmount);
    setOfferedAmountModalOpen(true);
  };

  // Helper function to render table cells based on column visibility
  const renderTableCell = (columnKey: string) => {
    if (
      !permanentColumns.includes(columnKey) &&
      !visibleColumns.includes(columnKey)
    ) {
      return null;
    }

    switch (columnKey) {
      case "name":
        return (
          <td key={columnKey} className="p-3">
            {entry.name}
          </td>
        );
      case "email":
        return (
          <td key={columnKey} className="p-3">
            {entry.email}
          </td>
        );
      case "phone_number":
        return (
          <td key={columnKey} className="p-3">
            {entry.phone_number}
          </td>
        );
      case "workshop_name":
        return (
          <td key={columnKey} className="p-3">
            <span className="text-xs text-[10px]">{entry.workshop_name}</span>
          </td>
        );
      case "session_number":
        return (
          <td key={columnKey} className="p-3">
            <span className="bg-green-100 items-center justify-center text-center text-green-800 px-2 py-1 rounded-full text-xs font-medium">
              {entry.session_number || 1}
            </span>
          </td>
        );
      case "referal_code":
        return (
          <td key={columnKey} className="p-3">
            {renderReferralCode()}
          </td>
        );
      case "attended_webinars":
        return (
          <td key={columnKey} className="p-3">
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
          <td key={columnKey} className="p-3">
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
          <td key={columnKey} className="p-3">
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
          <td key={columnKey} className="p-3">
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
          <td key={columnKey} className="p-3">
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
          <td key={columnKey} className="p-3">
            <span
              className={`px-2 py-1 rounded-full text-xs font-medium ${getAmountColor(
                entry.amount_paid
              )}`}
            >
              {entry.amount_paid ?? "N/A"}
            </span>
          </td>
        );
      case "amount_pending":
        return (
          <td key={columnKey} className="p-3">
            <span
              className={`px-2 py-1 rounded-full text-xs font-medium text-amber-800 bg-amber-100`}
            >
              {entry.amount_pending || "N/A"}
            </span>
          </td>
        );
      case "score":
        return (
          <td key={columnKey} className="p-3">
            <span className="text-xs font-medium">{entry.score || "N/A"}</span>
          </td>
        );
      case "offered_scholarship_percentage":
        return (
          <td key={columnKey} className="p-3">
            <span className="text-xs font-medium">
              {entry.offered_scholarship_percentage || "N/A"}
            </span>
          </td>
        );
      case "offered_amount":
        return (
          <td key={columnKey} className="p-3">
            <div className="flex items-center gap-2">
              <span
                className={`px-2 py-1 rounded-full text-xs font-medium ${getAmountColor(
                  offeredAmount
                )}`}
              >
                {offeredAmount || "N/A"}
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
          <td key={columnKey} className="p-3">
            <span
              className={`px-2 py-1 rounded-full text-xs font-medium ${getAmountColor(
                entry.platform_amount
              )}`}
            >
              {entry.platform_amount || "N/A"}
            </span>
          </td>
        );
      case "assignment_submitted_at":
        return (
          <td key={columnKey} className="p-3">
            {entry.assignment_submitted_at &&
            entry.assignment_submitted_at !== ""
              ? formatDate(entry.assignment_submitted_at)
              : "N/A"}
          </td>
        );
      case "referral_code_assessment":
        return (
          <td key={columnKey} className="p-3">
            <span className="text-xs font-medium">
              {entry.referral_code_assessment || "N/A"}
            </span>
          </td>
        );
      case "assessment_status":
        return (
          <td key={columnKey} className="p-3">
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
          <td key={columnKey} className="p-3">
            {renderStatusDropdown(
              firstCallStatus || "N/A",
              FIRST_CALL_STATUS_OPTIONS,
              "first_call_status"
            )}
          </td>
        );
      case "first_call_comment":
        return (
          <td key={columnKey} className="p-3">
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
          <td key={columnKey} className="p-3">
            {renderStatusDropdown(
              secondCallStatus || "N/A",
              SECOND_CALL_STATUS_OPTIONS,
              "second_call_status"
            )}
          </td>
        );
      case "second_call_comment":
        return (
          <td key={columnKey} className="p-3">
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
          <td key={columnKey} className="p-3">
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
      case "registered_at":
        return (
          <td key={columnKey} className="p-3">
            {formatDate(entry.registered_at)}
          </td>
        );
      case "updated_at":
        return (
          <td key={columnKey} className="p-3">
            {formatDate(entry.updated_at || "N/A")}
          </td>
        );
      case "submitted_at":
        return (
          <td key={columnKey} className="p-3">
            {entry.submitted_at && entry.submitted_at !== ""
              ? formatDate(entry.submitted_at)
              : "N/A"}
          </td>
        );
      default:
        return null;
    }
  };

  // Define column order
  const columnOrder = [
    // Personal details
    "name",
    "email",
    "phone_number",
    "workshop_name",
    "session_number",
    "referal_code",
    // Assessment details
    "attended_webinars",
    "is_assessment_attempted",
    "score",
    "offered_scholarship_percentage",
    "assignment_submitted_at",
    "referral_code_assessment",
    "assessment_status",
    // Payment details
    "is_certificate_amount_paid",
    "is_prebooking_amount_paid",
    "is_course_amount_paid",
    "amount_paid",
    "amount_pending",
    "offered_amount",
    "platform_amount",
    // Comment and status
    "first_call_status",
    "first_call_comment",
    "second_call_status",
    "second_call_comment",
    "follow_up_comment",
    // Dates
    "registered_at",
    "updated_at",
    "submitted_at",
  ];

  return (
    <>
      <tr className="border-t">
        {columnOrder.map((columnKey) => renderTableCell(columnKey))}
        {/* Action column is always visible */}
        <td className="p-3 text-nowrap flex flex-row items-center gap-x-2">
          <button
            className="text-gray-400 hover:text-blue-600"
            onClick={openEditModal}
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
          <button
            className="text-teal-600"
            onClick={() => setPaymentHistoryOpen(true)}
            type="button"
            title="View Payment History"
          >
            <div className="w-10 h-10 rounded-lg bg-teal-50 border border-teal-400 flex items-center justify-center">
              <FiCreditCard className="w-5 h-5 mx-auto text-teal-700" />
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

      {/* Modals */}
      <EditModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        modalFirstCallStatus={modalFirstCallStatus}
        modalFirstCallComment={modalFirstCallComment}
        modalSecondCallStatus={modalSecondCallStatus}
        modalSecondCallComment={modalSecondCallComment}
        modalFollowUpComment={modalFollowUpComment}
        onFirstCallStatusChange={setModalFirstCallStatus}
        onFirstCallCommentChange={setModalFirstCallComment}
        onSecondCallStatusChange={setModalSecondCallStatus}
        onSecondCallCommentChange={setModalSecondCallComment}
        onFollowUpCommentChange={setModalFollowUpComment}
        onSave={(data) => {
          setModalOpen(false);
          updateMutation.mutate(data, {
            onSuccess: () => {
              setFirstCallStatus(data.first_call_status || "");
              setFirstCallComment(data.first_call_comment || "");
              setSecondCallStatus(data.second_call_status || "");
              setSecondCallComment(data.second_call_comment || "");
              setFollowUpComment(data.follow_up_comment || "");
            },
          });
        }}
        FIRST_CALL_STATUS_OPTIONS={FIRST_CALL_STATUS_OPTIONS}
        SECOND_CALL_STATUS_OPTIONS={SECOND_CALL_STATUS_OPTIONS}
      />

      <EditHistoryModal
        isOpen={editHistoryOpen}
        onClose={() => setEditHistoryOpen(false)}
        entry={entry}
      />

      <CommentModal
        isOpen={commentModalOpen}
        onClose={() => setCommentModalOpen(false)}
        selectedComment={selectedComment}
      />

      <EditOfferedAmountModal
        isOpen={offeredAmountModalOpen}
        onClose={() => setOfferedAmountModalOpen(false)}
        offeredAmount={modalOfferedAmount}
        onOfferedAmountChange={setModalOfferedAmount}
        onSave={(offeredAmount) => {
          setOfferedAmountModalOpen(false);
          updateMutation.mutate(
            { offered_amount: offeredAmount },
            {
              onSuccess: () => {
                // Update local state so UI reflects the new value
                setOfferedAmount(offeredAmount);
              },
            }
          );
        }}
      />

      <PaymentHistoryModal
        isOpen={paymentHistoryOpen}
        onClose={() => setPaymentHistoryOpen(false)}
        transactions={
          Array.isArray(entry.payment_history) ? entry.payment_history : []
        }
      />
    </>
  );
};
