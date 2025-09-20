import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useMutation } from "@tanstack/react-query";
import { reportIssue } from "../../../../services/enrolled-courses-content/coursesApis";
import {
  FaTimes,
  FaCheckCircle,
  FaExclamationTriangle,
  FaPaperPlane,
  FaSpinner,
  FaBug,
  FaVideo,
  FaVolumeUp,
  FaFileAlt,
  FaCode,
} from "react-icons/fa";

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
  const [issueType, setIssueType] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);
  const [countdown, setCountdown] = useState(3);

  const issueTypes = [
    {
      id: "video",
      label: "Video Issues",
      icon: FaVideo,
      description: "Video not loading or playing",
    },
    {
      id: "audio",
      label: "Audio Problems",
      icon: FaVolumeUp,
      description: "Audio quality or sync issues",
    },
    {
      id: "content",
      label: "Content Error",
      icon: FaFileAlt,
      description: "Incorrect or missing content",
    },
    {
      id: "technical",
      label: "Technical Bug",
      icon: FaBug,
      description: "App crashes or errors",
    },
    {
      id: "other",
      label: "Other",
      icon: FaCode,
      description: "Something else",
    },
  ];

  const reportMutation = useMutation({
    mutationFn: () => reportIssue(clientId, subject, description),
    onSuccess: () => {
      setIsSuccess(true);
      setCountdown(3);
    },
  });

  // Handle countdown and auto-close
  useEffect(() => {
    let timer: number;

    if (isSuccess && countdown > 0) {
      timer = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);
    } else if (isSuccess && countdown === 0) {
      handleClose();
    }

    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [isSuccess, countdown]);

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
      setIssueType("");
      setIsSuccess(false);
      setCountdown(3);
      onClose();
    }
  };

  // Reset success state when modal opens
  useEffect(() => {
    if (isOpen) {
      setIsSuccess(false);
      setCountdown(3);
    }
  }, [isOpen]);

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

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex justify-center overflow-auto"
        onClick={handleClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-white rounded-2xl lg:rounded-3xl w-full max-w-lg shadow-2xl mt-20 mb-6 mx-4 flex flex-col"
          style={{
            maxHeight: "calc(100vh -14rem)", // 100vh - (mt-20 + mb-6)
            minHeight: "fit-content",
          }}
        >
          {isSuccess ? (
            // Success View - Compact and centered
            <div className="text-center p-6 sm:p-8 flex-shrink-0">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                className="w-16 h-16 sm:w-20 sm:h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4"
              >
                <FaCheckCircle className="w-8 h-8 sm:w-10 sm:h-10 text-green-600" />
              </motion.div>

              <motion.h2
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-xl sm:text-2xl font-bold text-gray-900 mb-3"
              >
                Issue Reported Successfully! 🎉
              </motion.h2>

              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="text-gray-600 mb-6 leading-relaxed"
              >
                Thank you for helping us improve! Our support team will review
                your report and get back to you within 24 hours.
              </motion.p>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="flex items-center justify-center gap-2 text-sm text-gray-500 bg-gray-50 rounded-lg px-4 py-3"
              >
                <FaSpinner className="w-4 h-4 animate-spin" />
                <span>Closing in {countdown} seconds...</span>
              </motion.div>
            </div>
          ) : (
            // Form View with proper flex layout
            <>
              {/* Fixed Header */}
              <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-100 flex-shrink-0">
                <div>
                  <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 mb-1">
                    Report an Issue 🔧
                  </h2>
                  <p className="text-sm text-gray-600">
                    Help us improve your learning experience
                  </p>
                </div>
                <button
                  onClick={handleClose}
                  disabled={reportMutation.isPending}
                  className="p-2 hover:bg-gray-100 rounded-xl transition-colors disabled:opacity-50 text-gray-500 hover:text-gray-700 flex-shrink-0"
                >
                  <FaTimes className="w-5 h-5" />
                </button>
              </div>

              {/* Scrollable Form Content */}
              <div className="flex-1 overflow-y-auto overscroll-contain">
                <div className="p-4 sm:p-6">
                  <form
                    onSubmit={handleSubmit}
                    className="space-y-4 sm:space-y-5"
                  >
                    {/* Issue Type Selection */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-900 mb-3">
                        What type of issue are you experiencing? *
                      </label>
                      <div className="grid grid-cols-1 gap-2 sm:gap-3">
                        {issueTypes.map((type) => (
                          <button
                            key={type.id}
                            type="button"
                            onClick={() => setIssueType(type.id)}
                            disabled={reportMutation.isPending}
                            className={`flex items-start gap-3 p-3 sm:p-4 rounded-xl border-2 transition-all text-left ${
                              issueType === type.id
                                ? "border-blue-500 bg-blue-50 text-blue-900"
                                : "border-gray-200 hover:border-gray-300 text-gray-700"
                            } ${
                              reportMutation.isPending
                                ? "opacity-50 cursor-not-allowed"
                                : ""
                            }`}
                          >
                            <type.icon
                              className={`w-4 h-4 sm:w-5 sm:h-5 mt-0.5 flex-shrink-0 ${
                                issueType === type.id
                                  ? "text-blue-600"
                                  : "text-gray-400"
                              }`}
                            />
                            <div className="min-w-0 flex-1">
                              <div className="font-semibold text-sm">
                                {type.label}
                              </div>
                              <div className="text-xs opacity-75 mt-0.5">
                                {type.description}
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Subject Input */}
                    <div>
                      <label
                        htmlFor="subject"
                        className="block text-sm font-semibold text-gray-900 mb-2"
                      >
                        Subject *
                      </label>
                      <input
                        id="subject"
                        type="text"
                        value={subject}
                        onChange={(e) => setSubject(e.target.value)}
                        disabled={reportMutation.isPending}
                        placeholder="Brief description of the issue..."
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:bg-gray-50 transition-all text-sm sm:text-base"
                        required
                      />
                    </div>

                    {/* Description Textarea */}
                    <div>
                      <label
                        htmlFor="description"
                        className="block text-sm font-semibold text-gray-900 mb-2"
                      >
                        Detailed Description *
                      </label>
                      <textarea
                        id="description"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        disabled={reportMutation.isPending}
                        rows={4}
                        placeholder="Please provide as much detail as possible. What were you trying to do? What happened? What did you expect to happen?"
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:bg-gray-50 resize-none transition-all text-sm sm:text-base"
                        required
                      />
                      <div className="mt-2 text-xs text-gray-500">
                        💡 Tip: Include steps to reproduce the issue for faster
                        resolution
                      </div>
                    </div>

                    {/* Help Text */}
                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 sm:p-4 text-sm">
                      <div className="flex items-start gap-3">
                        <FaExclamationTriangle className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                        <div className="text-blue-800 min-w-0">
                          <div className="font-semibold mb-1">
                            Need immediate help?
                          </div>
                          <div className="text-xs sm:text-sm">
                            For urgent issues, contact our support team directly
                            at support@ailinc.com or call +1-800-AILINC
                          </div>
                        </div>
                      </div>
                    </div>
                  </form>
                </div>
              </div>

              {/* Fixed Footer with Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 p-4 sm:p-6 border-t border-gray-100 flex-shrink-0 bg-white">
                <button
                  type="button"
                  onClick={handleClose}
                  disabled={reportMutation.isPending}
                  className="flex-1 px-6 py-3 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl font-medium disabled:opacity-50 transition-colors text-sm sm:text-base"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  onClick={handleSubmit}
                  disabled={
                    reportMutation.isPending ||
                    !subject.trim() ||
                    !description.trim() ||
                    !issueType
                  }
                  className="flex-1 px-6 py-3 text-white bg-blue-600 hover:bg-blue-700 rounded-xl font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2 text-sm sm:text-base"
                >
                  {reportMutation.isPending ? (
                    <>
                      <FaSpinner className="w-4 h-4 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <FaPaperPlane className="w-4 h-4" />
                      Submit Report
                    </>
                  )}
                </button>
              </div>
            </>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default ReportIssueModal;
