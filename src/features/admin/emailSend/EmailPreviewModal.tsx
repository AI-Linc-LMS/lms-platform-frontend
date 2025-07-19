import React, { useEffect } from "react";
import { FiX, FiTrash2 } from "react-icons/fi";

interface EmailPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  emails: { email: string; name?: string }[];
  onRemoveEmail?: (email: string) => void;
}

const EmailPreviewModal: React.FC<EmailPreviewModalProps> = ({
  isOpen,
  onClose,
  emails,
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
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-gray-800">
              Email Recipients ({emails.length})
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
            >
              <FiX className="w-6 h-6" />
            </button>
          </div>
        </div>
        <div className="p-6 max-h-[55vh] overflow-y-auto">
          <div className="grid gap-2">
            {emails.map((emailData, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center gap-3 flex-1">
                  <span className="text-sm text-gray-700 font-medium">
                    {emailData.name
                      ? `${emailData.name} (${emailData.email})`
                      : emailData.email}
                  </span>
                  <span className="text-xs text-gray-500">#{index + 1}</span>
                </div>
                {onRemoveEmail && (
                  <button
                    onClick={() => handleRemoveEmail(emailData.email)}
                    className="text-red-500 hover:text-red-700 p-1 rounded hover:bg-red-50 transition-colors"
                    title="Remove email"
                  >
                    <FiTrash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
        <div className="p-6 border-t border-gray-200">
          <div className="flex justify-end gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmailPreviewModal;
