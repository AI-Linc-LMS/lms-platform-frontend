import React from "react";
import { FiX } from "react-icons/fi";
import { EditRegistrationData } from "../../types";

interface EditModalProps {
  isOpen: boolean;
  onClose: () => void;
  modalFirstCallStatus: string;
  modalFirstCallComment: string;
  modalSecondCallStatus: string;
  modalSecondCallComment: string;
  modalFollowUpComment: string;
  onFirstCallStatusChange: (value: string) => void;
  onFirstCallCommentChange: (value: string) => void;
  onSecondCallStatusChange: (value: string) => void;
  onSecondCallCommentChange: (value: string) => void;
  onFollowUpCommentChange: (value: string) => void;
  onSave: (data: EditRegistrationData) => void;
  FIRST_CALL_STATUS_OPTIONS: { value: string; color: string }[];
  SECOND_CALL_STATUS_OPTIONS: { value: string; color: string }[];
}

export const EditModal: React.FC<EditModalProps> = ({
  isOpen,
  onClose,
  modalFirstCallStatus,
  modalFirstCallComment,
  modalSecondCallStatus,
  modalSecondCallComment,
  modalFollowUpComment,
  onFirstCallStatusChange,
  onFirstCallCommentChange,
  onSecondCallStatusChange,
  onSecondCallCommentChange,
  onFollowUpCommentChange,
  onSave,
  FIRST_CALL_STATUS_OPTIONS,
  SECOND_CALL_STATUS_OPTIONS,
}) => {
  if (!isOpen) return null;

  const handleSave = () => {
    onSave({
      first_call_status: modalFirstCallStatus,
      first_call_comment: modalFirstCallComment,
      second_call_status: modalSecondCallStatus,
      second_call_comment: modalSecondCallComment,
      follow_up_comment: modalFollowUpComment,
    });
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
      aria-labelledby="edit-modal-title"
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
        className="bg-white rounded-xl shadow-2xl p-8 w-full max-w-xl relative border border-blue-100 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 transition-colors"
          onClick={onClose}
          aria-label="Close edit modal"
        >
          <FiX className="w-6 h-6" />
        </button>
        <h2 id="edit-modal-title" className="text-xl font-bold mb-3">
          Edit
        </h2>
        <div className="space-y-2">
          <div className="flex gap-5 w-full">
            <div className="w-full">
              <label className="block text-sm font-semibold mb-1">
                1st Call Status <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <select
                  className="w-full p-2 border rounded text-base bg-gray-50 border-gray-300"
                  value={modalFirstCallStatus}
                  onChange={(e) => onFirstCallStatusChange(e.target.value)}
                  required
                >
                  <option value="">Select status</option>
                  {FIRST_CALL_STATUS_OPTIONS.map((opt) => (
                    <option
                      key={opt.value}
                      value={opt.value}
                      className="absolute left-2 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full"
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
                  className="w-full p-2 border rounded text-base bg-gray-50 border-gray-300"
                  value={modalSecondCallStatus}
                  onChange={(e) => onSecondCallStatusChange(e.target.value)}
                  required
                >
                  <option value="">Select status</option>
                  {SECOND_CALL_STATUS_OPTIONS.map((opt) => (
                    <option
                      key={opt.value}
                      value={opt.value}
                      className="absolute left-1 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full"
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
              onChange={(e) => onFirstCallCommentChange(e.target.value)}
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
              onChange={(e) => onSecondCallCommentChange(e.target.value)}
              placeholder="Enter comment"
              rows={3}
            />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-1">
              Follow Up Comment
            </label>
            <textarea
              className="w-full p-3 border rounded-md text-base bg-gray-50 border-gray-300"
              value={modalFollowUpComment}
              onChange={(e) => onFollowUpCommentChange(e.target.value)}
              placeholder="Enter follow up comment"
              rows={3}
            />
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-3">
          <button
            className="px-5 py-2 rounded bg-gray-200 text-gray-700 hover:bg-gray-300 font-semibold"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            className="px-5 py-2 rounded bg-blue-600 text-white hover:bg-blue-700 font-semibold"
            onClick={handleSave}
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
};
