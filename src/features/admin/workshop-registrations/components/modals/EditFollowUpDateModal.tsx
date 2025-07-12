import React, { useState, useEffect } from "react";
import { FiX } from "react-icons/fi";
import { WorkshopRegistrationData } from "../../types";

interface EditFollowUpDateModalProps {
  isOpen: boolean;
  onClose: () => void;
  entry: WorkshopRegistrationData;
  onSave: (date: string) => void;
}

export const EditFollowUpDateModal: React.FC<EditFollowUpDateModalProps> = ({
  isOpen,
  onClose,
  entry,
  onSave,
}) => {
  const [newFollowUpDate, setNewFollowUpDate] = useState(
    entry.follow_up_date || ""
  );

  useEffect(() => {
    if (isOpen) {
      setNewFollowUpDate(entry.follow_up_date || "");
    }
  }, [isOpen, entry.follow_up_date]);

  const handleSave = () => {
    onSave(newFollowUpDate);
    onClose();
  };

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
      aria-labelledby="edit-follow-up-date-modal-title"
    >
      <div
        className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md relative border border-blue-100"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 transition-colors"
          onClick={onClose}
          aria-label="Close edit follow-up date modal"
        >
          <FiX className="w-6 h-6" />
        </button>

        <h2
          id="edit-follow-up-date-modal-title"
          className="text-xl font-bold mb-4 text-gray-800"
        >
          Edit Follow-up Date
        </h2>

        <div className="mb-4">
          <p className="text-sm text-gray-600 mb-2">
            Student: <span className="font-medium">{entry.name}</span>
          </p>
          <p className="text-sm text-gray-600">
            Current Date:{" "}
            <span className="font-medium">
              {entry.follow_up_date
                ? new Date(entry.follow_up_date).toLocaleDateString()
                : "Not set"}
            </span>
          </p>
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-gray-700">
            Select Follow-up Date
          </label>
          <input
            type="date"
            value={newFollowUpDate}
            onChange={(e) => setNewFollowUpDate(e.target.value)}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <button
            className="px-4 py-2 rounded-md bg-gray-200 text-gray-700 hover:bg-gray-300 font-medium transition-colors"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            className="px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 font-medium transition-colors"
            onClick={handleSave}
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
};
