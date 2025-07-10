import React from "react";
import { FiX } from "react-icons/fi";
import { WorkshopRegistrationData } from "../../types";

interface EditHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  entry: WorkshopRegistrationData;
}

export const EditHistoryModal: React.FC<EditHistoryModalProps> = ({
  isOpen,
  onClose,
  entry,
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
      {/* Modal container */}
      <div
        className="relative bg-white rounded-xl w-full max-w-2xl max-h-[90vh] overflow-hidden border border-blue-100 shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b border-gray-200">
          <h2 className="text-2xl font-bold">Edit History</h2>
          <button
            className="text-gray-400 hover:text-gray-600 transition-colors"
            onClick={onClose}
          >
            <FiX className="w-6 h-6" />
          </button>
        </div>

        {/* Scrollable content */}
        <div
          className="p-6 space-y-4 overflow-y-auto max-h-[70vh] scroll-smooth"
          style={{ scrollBehavior: "smooth" }}
        >
          {entry.edithistory && Object.entries(entry.edithistory).length > 0 ? (
            Object.entries(entry.edithistory)
              .sort(
                (a, b) =>
                  new Date(b[1].timestamp).getTime() -
                  new Date(a[1].timestamp).getTime()
              )
              .map(([key, hist]) => (
                <div key={key} className="border rounded p-4 bg-gray-50">
                  <div className="text-xs text-gray-500 mb-1">
                    {new Date(hist.timestamp).toLocaleString()}
                  </div>
                  <div className="text-sm font-semibold mb-1">
                    Edited by: {hist.edited_by}
                  </div>
                  <div className="text-xs text-gray-700">
                    {Object.entries(hist.changes).map(([field, value]) => (
                      <div key={field}>
                        <span className="font-medium">{field}:</span>{" "}
                        {value === null ? (
                          <span className="italic text-gray-400">
                            (cleared)
                          </span>
                        ) : (
                          value.toString()
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))
          ) : (
            <div className="text-gray-400 text-center">
              No edit history available.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
