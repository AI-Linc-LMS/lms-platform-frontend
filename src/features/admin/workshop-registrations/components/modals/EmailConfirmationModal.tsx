import React, { useEffect } from "react";
import { FiX, FiMail, FiUsers, FiTrash2 } from "react-icons/fi";

interface EmailConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  selectedRecipients: Array<{ email: string; name: string }>;
  totalSelected: number;
  onRemoveEmail?: (email: string) => void;
}

const EmailConfirmationModal: React.FC<EmailConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  selectedRecipients,
  totalSelected,
  onRemoveEmail,
}) => {
  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }

    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);
  // Handle escape key press
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape" && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen, onClose]);

  // Handle click outside modal
  const handleBackdropClick = (event: React.MouseEvent) => {
    if (event.target === event.currentTarget) {
      onClose();
    }
  };

  const handleRemoveEmail = (email: string) => {
    if (onRemoveEmail) {
      onRemoveEmail(email);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-white/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={handleBackdropClick}
    >
      <div className="bg-white border border-gray-200 rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-hidden">
        <div className="p-4 px-6 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 bg-blue-100 rounded-lg">
                <FiMail className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-800">
                  Send Email to Selected Recipients
                </h2>
                <p className="text-sm text-gray-600">
                  Review and manage the selected email addresses before
                  proceeding
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
            >
              <FiX className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="p-6">
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <FiUsers className="w-5 h-5 text-gray-600" />
                <span className="text-md font-semibold text-gray-700">
                  {totalSelected} recipient{totalSelected !== 1 ? "s" : ""}{" "}
                  selected
                </span>
              </div>
              {onRemoveEmail && (
                <button
                  onClick={() => {
                    // Remove all emails
                    selectedRecipients.forEach((email) => onRemoveEmail(email.email));
                  }}
                  className="text-red-600 hover:text-red-800 text-sm font-medium flex items-center gap-1"
                >
                  <FiTrash2 className="w-4 h-4" />
                  Remove All
                </button>
              )}
            </div>

            <div className="bg-gray-50 rounded-lg p-4 max-h-66 overflow-y-auto">
              {selectedRecipients && selectedRecipients.length > 0 ? (
                <div className="grid gap-2">
                  {selectedRecipients.map((recipient, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-white rounded border hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center gap-3 flex-1">
                        <div className="flex flex-col">
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-500">
                              {recipient.name}
                            </span>
                            <span className="text-xs text-gray-400">
                          #{index + 1}
                        </span>
                          </div>
                          <span className="text-xs text-gray-500">
                            {recipient.email}
                          </span>
                        </div>
                      </div>
                      {onRemoveEmail && (
                        <button
                          onClick={() => handleRemoveEmail(recipient.email)}
                          className="text-red-500 hover:text-red-700 p-1 rounded hover:bg-red-50 transition-colors"
                          title="Remove email"
                        >
                          <FiTrash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              ) : selectedRecipients.length > 0 ? (
                <div className="grid gap-2">
                  {selectedRecipients.map((email, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-white rounded border hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center gap-3 flex-1">
                        <span className="text-sm text-gray-700 font-medium">
                          {email.name}
                        </span>
                        <span className="text-xs text-gray-500">
                          #{index + 1}
                        </span>
                      </div>
                      {onRemoveEmail && (
                        <button
                          onClick={() => handleRemoveEmail(email.email)}
                          className="text-red-500 hover:text-red-700 p-1 rounded hover:bg-red-50 transition-colors"
                          title="Remove email"
                        >
                          <FiTrash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <FiUsers className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p className="text-sm">No email recipients selected</p>
                </div>
              )}
            </div>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-2">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0">
                <svg
                  className="w-5 h-5 text-yellow-600"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div>
                <h3 className="text-sm font-medium text-yellow-800">
                  Confirmation Required
                </h3>
                <p className="text-sm text-yellow-700">
                  You're about to send emails to {totalSelected} recipient
                  {totalSelected !== 1 ? "s" : ""}. You'll be redirected to the
                  email composition form where you can review and send the
                  emails.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-gray-200">
          <div className="flex justify-end gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              disabled={selectedRecipients.length === 0}
              className={`px-6 py-2 rounded-md font-medium transition-colors flex items-center gap-2 ${
                selectedRecipients.length === 0
                  ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                  : "bg-green-600 hover:bg-green-700 text-white"
              }`}
            >
              <FiMail className="w-4 h-4" />
              Continue to Email Form
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmailConfirmationModal;
