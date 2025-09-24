import React, { useState, useEffect } from "react";

interface AddRecordingLinkModalProps {
  isOpen: boolean;
  recordingLink: string | null;
  onClose: () => void;
  onSave: (link: string) => void;
}

const AddRecordingLinkModal: React.FC<AddRecordingLinkModalProps> = ({
  isOpen,
  recordingLink,
  onClose,
  onSave,
}) => {
  const [link, setLink] = useState(recordingLink || "");

  useEffect(() => {
    if (isOpen) setLink(recordingLink || ""); // reset input on open
  }, [isOpen, recordingLink]);

  const handleSave = () => {
    if (link.trim()) {
      onSave(link.trim());
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-opacity-50 backdrop-blur-sm flex items-center justify-center">
      <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl">
        <h2 className="text-xl font-semibold mb-4 text-[var(--neutral-500)]">
          Add Recording Link
        </h2>
        <input
          type="text"
          placeholder="https://zoom.us/..."
          value={link}
          onChange={(e) => setLink(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary-500)]"
        />
        <div className="mt-6 flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-100"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-[var(--primary-500)] text-[var(--font-light)] rounded-lg hover:bg-[var(--primary-600)]"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddRecordingLinkModal;
