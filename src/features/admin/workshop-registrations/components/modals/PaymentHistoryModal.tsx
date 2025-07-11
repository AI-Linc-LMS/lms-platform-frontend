import React, { useEffect } from "react";
import { FiX } from "react-icons/fi";

export interface PaymentTxn {
  type: string;
  amount: string | number;
  date: string;
}

interface PaymentHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  transactions: PaymentTxn[];
}

export const PaymentHistoryModal: React.FC<PaymentHistoryModalProps> = ({
  isOpen,
  onClose,
  transactions,
}) => {
  useEffect(() => {
    if (isOpen) {
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
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-opacity-50 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="payment-history-modal-title"
      onWheel={(e) => {
        if (e.target === e.currentTarget) {
          e.preventDefault();
        }
      }}
      onTouchMove={(e) => {
        if (e.target === e.currentTarget) {
          e.preventDefault();
        }
      }}
    >
      <div
        className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-3xl relative border border-blue-100 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 transition-colors"
          onClick={onClose}
          aria-label="Close payment history modal"
        >
          <FiX className="w-6 h-6" />
        </button>
        <h2 id="payment-history-modal-title" className="text-xl font-bold mb-4">
          Payment History
        </h2>
        {transactions.length === 0 ? (
          <div className="text-gray-500 text-center py-8">
            No payment history available.
          </div>
        ) : (
          <table className="w-full text-sm border">
            <thead>
              <tr className="bg-gray-100">
                <th className="p-2 text-left font-semibold">Type</th>
                <th className="p-2 text-left font-semibold">Amount</th>
                <th className="p-2 text-left font-semibold">Date</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((txn, idx) => (
                <tr key={idx} className="border-t">
                  <td className="p-2">{txn.type}</td>
                  <td className="p-2">₹{txn.amount}</td>
                  <td className="p-2">{new Date(txn.date).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};
