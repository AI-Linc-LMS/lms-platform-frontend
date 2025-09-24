import React, { useState } from "react";
import EmailJobBodyModal from "./EmailJobBodyModal";

export interface EmailJob {
  id: number;
  task_id: string;
  task_name: string;
  emails: string[];
  subject: string;
  email_body: string;
  successful_emails: string[];
  failed_emails: string[];
  status: string;
  created_at: string;
}

interface EmailJobsHistoryModalProps {
  open: boolean;
  onClose: () => void;
  emailJobs: EmailJob[] | undefined;
  isLoading: boolean;
  error: Error | null;
  onViewStatus: (jobId: string) => void;
  onCreateNewJob: () => void;
}

const EmailJobsHistoryModal: React.FC<EmailJobsHistoryModalProps> = ({
  open,
  onClose,
  emailJobs,
  isLoading,
  error,
  onViewStatus,
  onCreateNewJob,
}) => {
  const [showEmailBodyModal, setShowEmailBodyModal] = useState(false);
  const [selectedJob, setSelectedJob] = useState<EmailJob | null>(null);
  if (!open) return null;

  if (error) {
    return <div>Error: {error.message}</div>;
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return "text-green-600 bg-green-100";
      case "IN_PROGRESS":
        return "text-blue-600 bg-blue-100";
      case "FAILED":
        return "text-red-600 bg-red-100";
      default:
        return "text-gray-600 bg-gray-100";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return "✓";
      case "IN_PROGRESS":
        return "⏳";
      case "FAILED":
        return "✗";
      case "PENDING":
        return "⏳";
      default:
        return "";
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-50"
      style={{ background: "rgba(240, 240, 240, 0.85)" }}
    >
      <div className="bg-white rounded-xl shadow-2xl p-8 min-w-[800px] max-w-[95vw] max-h-[90vh] relative border border-gray-200">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-800">
            Email Jobs History
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
          >
            ×
          </button>
        </div>

        {isLoading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading email jobs...</p>
          </div>
        ) : emailJobs && emailJobs.length > 0 ? (
          <div className="max-h-[60vh] overflow-y-auto">
            <div className="space-y-4">
              {emailJobs.map((job) => (
                <div
                  key={job.id}
                  className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-800 text-lg">
                        {job.task_name}
                      </h3>
                      <p className="text-gray-600 text-sm mt-1">
                        {job.emails.length} recipients
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                          job.status
                        )}`}
                      >
                        <span className="mr-1">
                          {getStatusIcon(job.status)}
                        </span>
                        {job.status}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-3 text-sm">
                    <div>
                      <span className="text-gray-500">Subject:</span>
                      <p className="text-gray-800 truncate">{job.subject}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">Created:</span>
                      <p className="text-gray-800">
                        {formatDate(job.created_at)}
                      </p>
                    </div>
                  </div>

                  <div className="flex justify-between items-center">
                    <div className="flex gap-2 text-sm">
                      <span className="text-green-600">
                        ✓ {job.successful_emails.length} successful
                      </span>
                      {job.failed_emails.length > 0 && (
                        <span className="text-red-600">
                          ✗ {job.failed_emails.length} failed
                        </span>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setSelectedJob(job);
                          setShowEmailBodyModal(true);
                        }}
                        className="px-3 py-1 bg-blue-500 text-[var(--font-light)] rounded text-sm hover:bg-blue-600 transition-colors"
                      >
                        View email
                      </button>
                      <button
                        onClick={() => onViewStatus(job.task_id)}
                        className="px-3 py-1 bg-blue-500 text-[var(--font-light)] rounded text-sm hover:bg-blue-600 transition-colors"
                      >
                        View Details
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <div className="text-gray-400 text-6xl mb-4">📧</div>
            <p className="text-gray-600 mb-4">No email jobs found</p>
            <p className="text-gray-500 text-sm">
              Create your first email campaign to get started
            </p>
          </div>
        )}

        <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 border border-gray-300 rounded hover:bg-gray-50 transition-colors"
          >
            Close
          </button>
          <button
            onClick={onCreateNewJob}
            className="px-4 py-2 bg-blue-500 text-[var(--font-light)] rounded hover:bg-blue-600 transition-colors font-medium"
          >
            Create New Job
          </button>
        </div>
      </div>
      <EmailJobBodyModal
        open={showEmailBodyModal}
        onClose={() => setShowEmailBodyModal(false)}
        job={selectedJob}
      />
    </div>
  );
};

export default EmailJobsHistoryModal;
