import React from "react";
import { FiEdit2, FiClock, FiCreditCard } from "react-icons/fi";

interface TableRowActionsProps {
  onEditClick: () => void;
  onEditHistoryClick: () => void;
  onPaymentHistoryClick: () => void;
}

export const TableRowActions: React.FC<TableRowActionsProps> = ({
  onEditClick,
  onEditHistoryClick,
  onPaymentHistoryClick,
}) => {
  return (
    <td className="p-3 text-nowrap flex flex-row items-center gap-x-2">
      <button
        className="text-gray-400 hover:text-blue-600"
        onClick={onEditClick}
        type="button"
      >
        <div className="w-10 h-10 rounded-lg bg-yellow-50 border border-yellow-400 flex items-center justify-center">
          <FiEdit2 className="w-5 h-5 mx-auto text-yellow-700" />
        </div>
      </button>
      <button
        className="text-gray-400 hover:text-green-600"
        onClick={onEditHistoryClick}
        type="button"
        title="View Edit History"
      >
        <div className="w-10 h-10 rounded-lg bg-blue-50 border border-blue-400 flex items-center justify-center">
          <FiClock className="w-5 h-5 mx-auto text-blue-700" />
        </div>
      </button>
      <button
        className="text-teal-600"
        onClick={onPaymentHistoryClick}
        type="button"
        title="View Payment History"
      >
        <div className="w-10 h-10 rounded-lg bg-teal-50 border border-teal-400 flex items-center justify-center">
          <FiCreditCard className="w-5 h-5 mx-auto text-teal-700" />
        </div>
      </button>
    </td>
  );
};
