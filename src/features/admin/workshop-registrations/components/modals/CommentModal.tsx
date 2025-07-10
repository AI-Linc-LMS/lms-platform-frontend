import React from "react";
import { FiX } from "react-icons/fi";

interface CommentModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedComment: {
    type: "first_call" | "second_call" | "follow_up";
    text: string;
  } | null;
}

export const CommentModal: React.FC<CommentModalProps> = ({
  isOpen,
  onClose,
  selectedComment,
}) => {
  if (!isOpen || !selectedComment) return null;

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
      aria-labelledby="comment-modal-title"
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
        className="bg-white rounded-xl shadow-2xl p-8 w-full max-w-2xl relative border border-blue-100"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 transition-colors"
          onClick={onClose}
          aria-label="Close comment modal"
        >
          <FiX className="w-6 h-6" />
        </button>
        <h2 id="comment-modal-title" className="text-2xl font-bold mb-6">
          {selectedComment.type === "first_call"
            ? "First Call"
            : selectedComment.type === "second_call"
            ? "Second Call"
            : "Follow Up"}{" "}
          Comment
        </h2>
        <div className="space-y-4">
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-gray-800 whitespace-pre-wrap break-words">
              {selectedComment.text}
            </p>
          </div>
        </div>
        <div className="flex justify-end mt-8">
          <button
            className="px-5 py-2 rounded bg-gray-200 text-gray-700 hover:bg-gray-300 font-semibold transition-colors"
            onClick={onClose}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
