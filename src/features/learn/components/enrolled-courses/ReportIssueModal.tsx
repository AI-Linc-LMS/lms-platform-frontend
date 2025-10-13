import React, { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  IconButton,
} from "@mui/material";
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
  const [isSuccess, setIsSuccess] = useState(false);
  const [countdown, setCountdown] = useState(3);

  const reportMutation = useMutation({
    mutationFn: () => reportIssue(clientId, subject, description),
    onSuccess: () => {
      setIsSuccess(true);
      setCountdown(3);
    },
  });

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
      setIsSuccess(false);
      setCountdown(3);
      onClose();
    }
  };

  useEffect(() => {
    if (isOpen) {
      setIsSuccess(false);
      setCountdown(3);
    }
  }, [isOpen]);

  return (
    <Dialog
      open={isOpen}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        className: "rounded-2xl",
        sx: {
          maxHeight: "90vh",
        },
      }}
      BackdropProps={{
        sx: {
          backdropFilter: "blur(8px)",
          backgroundColor: "rgba(0, 0, 0, 0.5)",
        },
      }}
    >
      {isSuccess ? (
        <DialogContent className="text-center p-6 sm:p-8">
          <div className="mx-auto flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mb-4">
            <svg
              className="w-8 h-8 text-green-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">
            Issue Reported Successfully!
          </h2>
          <p className="text-gray-600 mb-4 text-sm sm:text-base">
            Your issue has been reported and our team will get back to you soon.
          </p>
          <div className="text-sm text-gray-500">
            This window will close automatically in {countdown} seconds...
          </div>
        </DialogContent>
      ) : (
        <form onSubmit={handleSubmit}>
          <DialogContent className="p-6 sm:p-8">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-1">
                  Report an Issue
                </h2>
                <p className="text-sm text-gray-500">
                  We'll get back to you as soon as possible
                </p>
              </div>
              <IconButton
                onClick={handleClose}
                disabled={reportMutation.isPending}
                size="small"
                sx={{
                  color: "rgb(107, 114, 128)",
                  transition: "all 0.2s",
                  "&:hover": {
                    backgroundColor: "rgb(243, 244, 246)",
                    color: "rgb(31, 41, 55)",
                    transform: "rotate(90deg)",
                  },
                  "&:disabled": {
                    opacity: 0.5,
                  },
                }}
              >
                <svg
                  width="20"
                  height="20"
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
              </IconButton>
            </div>

            <div className="space-y-8">
              {/* Subject Field */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Subject <span className="text-red-500">*</span>
                </label>
                <TextField
                  fullWidth
                  required
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  disabled={reportMutation.isPending}
                  placeholder="e.g., Video not loading, Audio issues..."
                  variant="outlined"
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      borderRadius: "12px",
                      transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                      backgroundColor: "rgb(249, 250, 251)",
                      border: "2px solid transparent",
                      "&:hover": {
                        backgroundColor: "white",
                        "& .MuiOutlinedInput-notchedOutline": {
                          borderColor: "rgb(147, 197, 253)",
                        },
                      },
                      "&.Mui-focused": {
                        backgroundColor: "white",
                        boxShadow: "0 0 0 4px rgba(59, 130, 246, 0.1)",
                        "& .MuiOutlinedInput-notchedOutline": {
                          borderColor: "rgb(59, 130, 246)",
                          borderWidth: "2px",
                        },
                      },
                    },
                  }}
                />
              </div>

              {/* Description Field */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Description <span className="text-red-500">*</span>
                </label>
                <TextField
                  fullWidth
                  required
                  multiline
                  rows={5}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  disabled={reportMutation.isPending}
                  placeholder="Please describe the issue in detail..."
                  variant="outlined"
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      borderRadius: "12px",
                      transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                      backgroundColor: "rgb(249, 250, 251)",
                      "&:hover": {
                        backgroundColor: "white",
                        "& .MuiOutlinedInput-notchedOutline": {
                          borderColor: "rgb(147, 197, 253)",
                        },
                      },
                      "&.Mui-focused": {
                        backgroundColor: "white",
                        boxShadow: "0 0 0 4px rgba(59, 130, 246, 0.1)",
                        "& .MuiOutlinedInput-notchedOutline": {
                          borderColor: "rgb(59, 130, 246)",
                          borderWidth: "2px",
                        },
                      },
                    },
                  }}
                />
                <p className="text-xs text-gray-500 mt-1.5">
                  Minimum 10 characters recommended for detailed support
                </p>
              </div>
            </div>
          </DialogContent>

          <DialogActions className="p-6 pt-0 gap-3">
            <Button
              onClick={handleClose}
              disabled={reportMutation.isPending}
              fullWidth
              sx={{
                textTransform: "none",
                fontSize: "1rem",
                fontWeight: 600,
                padding: "12px 24px",
                borderRadius: "12px",
                color: "rgb(55, 65, 81)",
                backgroundColor: "rgb(243, 244, 246)",
                transition: "all 0.2s ease",
                "&:hover": {
                  backgroundColor: "rgb(229, 231, 235)",
                  transform: "translateY(-1px)",
                  boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                },
                "&:active": {
                  transform: "translateY(0)",
                },
                "&:disabled": {
                  opacity: 0.5,
                },
              }}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={
                reportMutation.isPending ||
                !subject.trim() ||
                !description.trim()
              }
              fullWidth
              sx={{
                textTransform: "none",
                fontSize: "1rem",
                fontWeight: 600,
                padding: "12px 24px",
                borderRadius: "12px",
                color: "white",
                backgroundColor: "rgb(59, 130, 246)",
                transition: "all 0.2s ease",
                "&:hover": {
                  backgroundColor: "rgb(37, 99, 235)",
                  transform: "translateY(-1px)",
                  boxShadow: "0 10px 15px -3px rgba(59, 130, 246, 0.4)",
                },
                "&:active": {
                  transform: "translateY(0)",
                },
                "&:disabled": {
                  opacity: 0.5,
                  backgroundColor: "rgb(156, 163, 175)",
                },
              }}
            >
              {reportMutation.isPending ? (
                <span className="flex items-center gap-2">
                  <svg
                    className="animate-spin h-5 w-5"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Submitting...
                </span>
              ) : (
                "Submit Report"
              )}
            </Button>
          </DialogActions>
        </form>
      )}
    </Dialog>
  );
};

export default ReportIssueModal;
