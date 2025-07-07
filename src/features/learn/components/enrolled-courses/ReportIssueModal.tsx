import React, { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { reportIssue } from "../../../../services/enrolled-courses-content/coursesApis";

interface ReportIssueModalProps {
  isOpen: boolean;
  onClose: () => void;
  clientId: number;
  courseId?: number;
  courseTitle?: string;
}

const ReportIssueModal: React.FC<ReportIssueModalProps> = ({
  isOpen,
  onClose,
  clientId,
}) => {
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");

  const reportMutation = useMutation({
    mutationFn: () => reportIssue(clientId, subject, description),
    onSuccess: () => {
      // Reset form
      setSubject("");
      setDescription("");
      onClose();
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !description.trim()) {
      return;
    }
    reportMutation.mutate();
  };

  const handleClose = () => {
    if (!reportMutation.isPending) {
      setSubject("");
      setDescription("");
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-800">
            Report an Issue
          </h2>
          <button
            onClick={handleClose}
            disabled={reportMutation.isPending}
            className="text-gray-500 hover:text-gray-700 disabled:opacity-50"
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M18 6L6 18M6 6L18 18"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="subject"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Subject *
            </label>
            <input
              id="subject"
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              disabled={reportMutation.isPending}
              placeholder="e.g., Video not loading, Audio issues..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
              required
            />
          </div>

          <div>
            <label
              htmlFor="description"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Description *
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={reportMutation.isPending}
              rows={4}
              placeholder="Please describe the issue in detail..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 resize-none"
              required
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={handleClose}
              disabled={reportMutation.isPending}
              className="flex-1 px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 disabled:opacity-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={
                reportMutation.isPending ||
                !subject.trim() ||
                !description.trim()
              }
              className="flex-1 px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {reportMutation.isPending ? "Submitting..." : "Submit Report"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ReportIssueModal;
