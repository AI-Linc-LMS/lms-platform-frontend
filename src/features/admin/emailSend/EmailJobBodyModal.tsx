import React from "react";
import { EmailJob } from "./EmailJobsHistoryModal";

interface EmailJobBodyModalProps {
  open: boolean;
  onClose: () => void;
  job: EmailJob | null;
}

const EmailJobBodyModal: React.FC<EmailJobBodyModalProps> = ({
  open,
  onClose,
  job,
}) => {
  if (!open || !job) return null;

  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-50 p-4"
      style={{ background: "rgba(240, 240, 240, 0.85)" }}
    >
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] relative border border-gray-200 p-8 overflow-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-800">
            Email Body - {job.subject}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
          >
            ×
          </button>
        </div>
        <div
          className="border rounded p-4 bg-gray-50 max-h-[50vh] overflow-auto text-gray-800"
          dangerouslySetInnerHTML={{ __html: job.email_body }}
        />
        <div className="flex justify-end mt-6 pt-4 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 border border-gray-300 rounded hover:bg-gray-50 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default EmailJobBodyModal;
