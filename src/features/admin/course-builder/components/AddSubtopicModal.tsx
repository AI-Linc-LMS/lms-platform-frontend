import React, { useRef, useEffect } from "react";
import { useSubtopicForm } from "../hooks/useSubtopicForm";
import { Subtopic } from "../types/course";

interface AddSubtopicModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (subtopic: Subtopic) => void;
}

export const AddSubtopicModal: React.FC<AddSubtopicModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
}) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const { formData, handleInputChange, handleSubmit } =
    useSubtopicForm(onSubmit);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        modalRef.current &&
        !modalRef.current.contains(event.target as Node)
      ) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 backdrop-blur-sm bg-white/30 flex items-center justify-center z-50">
      <div
        ref={modalRef}
        className="bg-white rounded-lg w-full max-w-md shadow-xl border border-blue-200"
      >
        <div className="p-6 pb-3">
          <h2 className="text-2xl font-bold mb-6">Add Subtopic</h2>

          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="block text-gray-700 text-lg font-medium mb-2">
                Subtopic Name<span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                placeholder="e.g., Introduction to Arrays"
                className="w-full p-3 border border-gray-300 rounded-md"
                required
              />
            </div>

            <div className="mb-6">
              <label className="block text-gray-700 text-lg font-medium mb-2">
                Enter Description
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="e.g., Learn about array data structures..."
                className="w-full p-3 border border-gray-300 rounded-md"
                rows={4}
              />
            </div>

            <button
              type="submit"
              className="w-full bg-[#17627A] text-white py-4 rounded-md font-medium hover:bg-[var(--primary-800)] transition-colors text-lg"
            >
              Add Subtopic
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
