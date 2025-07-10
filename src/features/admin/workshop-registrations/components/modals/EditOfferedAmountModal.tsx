import React from "react";
import { FiX } from "react-icons/fi";

interface EditOfferedAmountModalProps {
  isOpen: boolean;
  onClose: () => void;
  offeredAmount: string;
  onOfferedAmountChange: (value: string) => void;
  onSave: (offeredAmount: string) => void;
}

export const EditOfferedAmountModal: React.FC<EditOfferedAmountModalProps> = ({
  isOpen,
  onClose,
  offeredAmount,
  onOfferedAmountChange,
  onSave,
}) => {
  if (!isOpen) return null;

  const handleSave = () => {
    onSave(offeredAmount);
  };

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
      aria-labelledby="edit-offered-amount-modal-title"
      onWheel={(e) => {
        // Only prevent scroll on the background overlay
        if (e.target === e.currentTarget) {
          e.preventDefault();
        }
      }}
      onTouchMove={(e) => {
        // Only prevent touch scroll on the background overlay
        if (e.target === e.currentTarget) {
          e.preventDefault();
        }
      }}
    >
      <div
        className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md relative border border-blue-100"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 transition-colors"
          onClick={onClose}
          aria-label="Close edit offered amount modal"
        >
          <FiX className="w-5 h-5" />
        </button>
        <h2
          id="edit-offered-amount-modal-title"
          className="text-lg font-bold mb-4"
        >
          Edit Offered Amount
        </h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold mb-2">
              Offered Amount <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              className="w-full p-3 border rounded-md text-base bg-gray-50 border-gray-300 focus:border-blue-500 focus:outline-none"
              value={offeredAmount}
              onChange={(e) => onOfferedAmountChange(e.target.value)}
              placeholder="Enter offered amount"
              required
            />
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-6">
          <button
            className="px-4 py-2 rounded bg-gray-200 text-gray-700 hover:bg-gray-300 font-semibold"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700 font-semibold"
            onClick={handleSave}
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
};
