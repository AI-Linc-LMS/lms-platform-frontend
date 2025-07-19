import React, { useState, useEffect } from "react";
import { WorkshopRegistrationData } from "../../types";
import { EditRegistrationData } from "../../types";
import { editRegistration } from "../../../../../services/admin/workshopRegistrationApis";
import { useMutation } from "@tanstack/react-query";
import {
  EditHistoryModal,
  CommentModal,
  EditModal,
  EditOfferedAmountModal,
  PaymentHistoryModal,
  EditFollowUpDateModal,
} from "../modals";
import {
  TableCellRenderer,
  TableRowActions,
  StatusDropdown,
  FIRST_CALL_STATUS_OPTIONS,
  SECOND_CALL_STATUS_OPTIONS,
  formatDate,
  truncateComment,
  getStatusBadgeClass,
  getAmountColor,
} from "./index";

interface WorkshopTableRowProps {
  entry: WorkshopRegistrationData;
  visibleColumns?: string[];
  permanentColumns?: string[];
  refetch: () => void;
  isSelected?: boolean;
  onSelectionChange?: (entryId: number, selected: boolean) => void;
  showSelection?: boolean;
}

export const WorkshopTableRow: React.FC<WorkshopTableRowProps> = ({
  entry,
  visibleColumns = [],
  permanentColumns = [],
  refetch,
  isSelected = false,
  onSelectionChange,
  showSelection = false,
}) => {
  const [copiedCode, setCopiedCode] = React.useState<string | null>(null);
  const clientId = import.meta.env.VITE_CLIENT_ID;

  const updateMutation = useMutation({
    mutationFn: (data: EditRegistrationData) =>
      editRegistration(clientId, entry.id.toString(), data),
    onSuccess: () => {
      setModalOpen(false);
      // Refetch data after successful update
    },
    onError: () => {
      setModalOpen(false);
    },
    onSettled: () => {
      refetch();
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

  // Modal states
  const [editHistoryOpen, setEditHistoryOpen] = useState(false);
  const [commentModalOpen, setCommentModalOpen] = useState(false);
  const [selectedComment, setSelectedComment] = useState<{
    type: "first_call" | "second_call" | "follow_up";
    text: string;
  } | null>(null);
  const [offeredAmountModalOpen, setOfferedAmountModalOpen] = useState(false);
  const [paymentHistoryOpen, setPaymentHistoryOpen] = useState(false);
  const [followUpDateModalOpen, setFollowUpDateModalOpen] = useState(false);
  const [selectedEntryForDateEdit, setSelectedEntryForDateEdit] =
    useState<WorkshopRegistrationData | null>(null);

  const handleCommentClick = (
    comment: string,
    type: "first_call" | "second_call" | "follow_up"
  ) => {
    if (comment && comment.length > 25) {
      setSelectedComment({ type, text: comment });
      setCommentModalOpen(true);
    }
  };

  const handleStatusChange = (
    field: "first_call_status" | "second_call_status",
    value: string
  ) => {
    if (field === "first_call_status") {
      setFirstCallStatus(value);
    }
    if (field === "second_call_status") {
      setSecondCallStatus(value);
    }

    // Call API to update the status
    updateMutation.mutate(
      {
        first_call_status:
          field === "first_call_status" ? value : firstCallStatus,
        first_call_comment: firstCallComment,
        second_call_status:
          field === "second_call_status" ? value : secondCallStatus,
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

  const handleEditFollowUpDate = (entry: WorkshopRegistrationData) => {
    setSelectedEntryForDateEdit(entry);
    setFollowUpDateModalOpen(true);
  };

  const handleSaveFollowUpDate = (date: string) => {
    if (selectedEntryForDateEdit) {
      updateMutation.mutate(
        { follow_up_date: date },
        {
          onSuccess: () => {
            // Update the entry's follow_up_date in the local state
            if (selectedEntryForDateEdit.id === entry.id) {
              // Update the entry object directly
              entry.follow_up_date = date;
            }
          },
        }
      );
    }
  };

  // Add scroll event listener to close tooltip
  useEffect(() => {
    const handleScroll = () => {
      if (tooltipData.show) {
        setTooltipData({ show: false, text: "", x: 0, y: 0 });
      }
    };

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

  // Define column order
  const columnOrder = [
    // Personal details
    "name",
    "email",
    "phone_number",
    "workshop_name",
    "session_number",
    "referal_code",
    // Call details
    "first_call_status",
    "first_call_comment",
    "second_call_status",
    "second_call_comment",
    "follow_up_comment",
    "follow_up_date",
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
    // Dates
    "registered_at",
    "updated_at",
    "submitted_at",
  ];

  const renderStatusDropdown = (
    value: string,
    options: { value: string; color: string }[],
    field: "first_call_status" | "second_call_status"
  ) => (
    <StatusDropdown
      value={value}
      options={options}
      field={field}
      cooldown={cooldown}
      quickStatusDropdown={quickStatusDropdown}
      setQuickStatusDropdown={setQuickStatusDropdown}
      setCooldown={setCooldown}
      onStatusChange={handleStatusChange}
    />
  );

  return (
    <>
      <tr className={`border-t ${isSelected ? 'bg-blue-50' : ''}`}>
        {/* Selection checkbox */}
        {showSelection && (
          <td className="p-3 w-12">
            <input
              type="checkbox"
              checked={isSelected}
              onChange={(e) => onSelectionChange?.(entry.id, e.target.checked)}
              className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
            />
          </td>
        )}
        {columnOrder.map((columnKey) => (
          <TableCellRenderer
            key={columnKey}
            columnKey={columnKey}
            entry={entry}
            firstCallStatus={firstCallStatus}
            firstCallComment={firstCallComment}
            secondCallStatus={secondCallStatus}
            secondCallComment={secondCallComment}
            followUpComment={followUpComment}
            offeredAmount={offeredAmount}
            copiedCode={copiedCode}
            setCopiedCode={setCopiedCode}
            handleCommentClick={handleCommentClick}
            truncateComment={truncateComment}
            renderStatusDropdown={renderStatusDropdown}
            getStatusBadgeClass={getStatusBadgeClass}
            getAmountColor={getAmountColor}
            formatDate={formatDate}
            openOfferedAmountModal={openOfferedAmountModal}
            handleEditFollowUpDate={handleEditFollowUpDate}
            FIRST_CALL_STATUS_OPTIONS={FIRST_CALL_STATUS_OPTIONS}
            SECOND_CALL_STATUS_OPTIONS={SECOND_CALL_STATUS_OPTIONS}
            visibleColumns={visibleColumns}
            permanentColumns={permanentColumns}
          />
        ))}
        <TableRowActions
          onEditClick={openEditModal}
          onEditHistoryClick={() => setEditHistoryOpen(true)}
          onPaymentHistoryClick={() => setPaymentHistoryOpen(true)}
        />
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

      <EditFollowUpDateModal
        isOpen={followUpDateModalOpen}
        onClose={() => setFollowUpDateModalOpen(false)}
        entry={selectedEntryForDateEdit || entry}
        onSave={handleSaveFollowUpDate}
      />
    </>
  );
};
