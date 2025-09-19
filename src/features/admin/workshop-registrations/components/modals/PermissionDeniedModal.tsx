import React from "react";
import { FiX } from "react-icons/fi";

interface PermissionDeniedModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const PermissionDeniedModal: React.FC<PermissionDeniedModalProps> = ({
  isOpen,
  onClose,
}) => {
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
      aria-labelledby="permission-denied-modal-title"
    >
      <div
        className="bg-white rounded-xl shadow-2xl p-8 w-full max-w-md relative border border-red-100 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 transition-colors"
          onClick={onClose}
          aria-label="Close permission denied modal"
        >
          <FiX className="w-6 h-6" />
        </button>
        <h2
          id="permission-denied-modal-title"
          className="text-xl font-bold mb-4 text-red-600"
        >
          Permission Denied
        </h2>
        <div className="text-base text-gray-700 mb-6">
          You do not have permission to take this action.
          <br />
          Please connect with an admin.
          <br />
          <span className="font-semibold text-blue-600">Thank you.</span>
        </div>
        <div className="flex justify-end">
          <button
            className="px-5 py-2 rounded bg-gray-200 text-gray-700 hover:bg-gray-300 font-semibold"
            onClick={onClose}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default PermissionDeniedModal;
