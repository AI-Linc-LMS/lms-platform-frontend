"use client";

import { useState, useEffect, useCallback, useMemo, memo } from "react";
import {
  Box,
  Typography,
  Chip,
  Paper,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  Pagination,
} from "@mui/material";
import { IconWrapper } from "@/components/common/IconWrapper";
import { CodeEditor } from "@/components/editor/MonacoEditor";

interface SubmissionsProps {
  submissions: any[];
  loading: boolean;
}

export const Submissions = memo(function Submissions({ submissions, loading }: SubmissionsProps) {
  const [selectedSubmission, setSelectedSubmission] = useState<any>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // Memoize pagination calculations
  const { totalPages, currentSubmissions, startIndex } = useMemo(() => {
    const total = Math.ceil(submissions.length / itemsPerPage);
    const start = (currentPage - 1) * itemsPerPage;
    const endIndex = start + itemsPerPage;
    const current = submissions.slice(start, endIndex);
    return { totalPages: total, currentSubmissions: current, startIndex: start };
  }, [submissions, currentPage]);

  const handlePageChange = useCallback((
    event: React.ChangeEvent<unknown>,
    page: number
  ) => {
    setCurrentPage(page);
  }, []);

  const handleSubmissionClick = useCallback((submission: any) => {
    setSelectedSubmission(submission);
    setDialogOpen(true);
  }, []);

  const handleCloseDialog = useCallback(() => {
    setDialogOpen(false);
    setSelectedSubmission(null);
  }, []);

  // Reset to page 1 when submissions change
  useEffect(() => {
    setCurrentPage(1);
  }, [submissions.length]);

  // Determine language from language_id
  const getLanguageFromId = (languageId: number) => {
    const languageMap: { [key: number]: string } = {
      71: "python",
      63: "javascript",
      62: "java",
      54: "cpp",
      50: "c",
      // Add more language mappings as needed
    };
    return languageMap[languageId] || "python";
  };
  return (
    <Box
      sx={{
        p: { xs: 2, md: 2, lg: 2.5 },
        height: "100%",
        overflow: "auto",
        "&::-webkit-scrollbar": {
          width: "6px",
        },
        "&::-webkit-scrollbar-track": {
          backgroundColor: "#f1f1f1",
        },
        "&::-webkit-scrollbar-thumb": {
          backgroundColor: "#888",
          borderRadius: "4px",
          "&:hover": {
            backgroundColor: "#555",
          },
        },
      }}
    >
      <Typography
        variant="subtitle1"
        sx={{ fontWeight: 600, mb: 2, fontSize: "1rem" }}
      >
        Previous Submissions ({submissions.length})
      </Typography>

      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
          <CircularProgress size={32} />
        </Box>
      ) : submissions.length === 0 ? (
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            height: "calc(100% - 60px)", // Account for the header height
            minHeight: "300px",
            color: "#9ca3af",
          }}
        >
          <IconWrapper icon="mdi:history" size={64} color="#d1d5db" />
          <Typography
            variant="body2"
            sx={{ mt: 2, fontWeight: 500, fontSize: "1rem" }}
          >
            No submissions yet
          </Typography>
        </Box>
      ) : (
        <>
          <Box>
            {currentSubmissions.map((submission: any, index: number) => {
              const isPassed = submission.result === "passed";
              const customDim = submission.custom_dimension || {};
              const status =
                customDim.status || submission.result || "Submitted";
              const marks = parseFloat(submission.marks || "0");
              const maxMarks = parseFloat(submission.maximum_marks || "0");
              const actualIndex = startIndex + index; // Calculate actual index for numbering

              return (
                <Paper
                  key={submission.id || actualIndex}
                  onClick={() => handleSubmissionClick(submission)}
                  sx={{
                    p: { xs: 1.5, md: 1.5, lg: 2 },
                    mb: { xs: 1.5, md: 1.5, lg: 2 },
                    border: "1px solid #e5e7eb",
                    borderLeft: `4px solid ${isPassed ? "#10b981" : "#ef4444"}`,
                    backgroundColor: isPassed
                      ? "rgba(16, 185, 129, 0.02)"
                      : "rgba(239, 68, 68, 0.02)",
                    "&:hover": {
                      boxShadow: 2,
                      backgroundColor: isPassed
                        ? "rgba(16, 185, 129, 0.05)"
                        : "rgba(239, 68, 68, 0.05)",
                    },
                    cursor: "pointer",
                    transition: "all 0.2s",
                  }}
                >
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                      mb: 1,
                    }}
                  >
                    <Box>
                      <Typography
                        variant="body2"
                        sx={{ fontWeight: 600, fontSize: "0.875rem", mb: 0.5 }}
                      >
                        Submission #{submissions.length - actualIndex}
                      </Typography>
                      <Typography
                        variant="caption"
                        sx={{ color: "#6b7280", fontSize: "0.75rem" }}
                      >
                        {new Date(submission.created_at).toLocaleString()}
                      </Typography>
                    </Box>
                    <Chip
                      label={status}
                      size="small"
                      icon={
                        <IconWrapper
                          icon={
                            isPassed ? "mdi:check-circle" : "mdi:close-circle"
                          }
                          size={14}
                          color="#ffffff"
                        />
                      }
                      sx={{
                        height: 24,
                        fontSize: "0.75rem",
                        backgroundColor: isPassed ? "#10b981" : "#ef4444",
                        color: "#ffffff",
                        fontWeight: 600,
                        "& .MuiChip-icon": {
                          marginLeft: "4px",
                        },
                      }}
                    />
                  </Box>

                  {/* Marks Display */}
                  {maxMarks > 0 && (
                    <Box
                      sx={{
                        mt: 1,
                        p: 1,
                        backgroundColor: "#f9fafb",
                        borderRadius: 0.5,
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <Typography
                        variant="body2"
                        sx={{
                          fontWeight: 600,
                          fontSize: "0.875rem",
                          color: isPassed ? "#065f46" : "#991b1b",
                        }}
                      >
                        Score: {marks} / {maxMarks}
                      </Typography>
                      {customDim.passed !== undefined &&
                        customDim.total_test_cases && (
                          <Typography
                            variant="caption"
                            sx={{ color: "#6b7280", fontSize: "0.75rem" }}
                          >
                            {customDim.passed}/{customDim.total_test_cases}{" "}
                            tests passed
                          </Typography>
                        )}
                    </Box>
                  )}

                  {/* Execution Stats */}
                  {(customDim.time || customDim.memory) && (
                    <Box
                      sx={{
                        mt: 1,
                        display: "flex",
                        gap: 2,
                        color: "#6b7280",
                        fontSize: "0.75rem",
                      }}
                    >
                      {customDim.time && (
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 0.5,
                          }}
                        >
                          <IconWrapper
                            icon="mdi:clock-outline"
                            size={14}
                            color="#6b7280"
                          />
                          <Typography
                            variant="caption"
                            sx={{ fontSize: "0.75rem" }}
                          >
                            {(customDim.time * 1000).toFixed(0)}ms
                          </Typography>
                        </Box>
                      )}
                      {customDim.memory && (
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 0.5,
                          }}
                        >
                          <IconWrapper
                            icon="mdi:memory"
                            size={14}
                            color="#6b7280"
                          />
                          <Typography
                            variant="caption"
                            sx={{ fontSize: "0.75rem" }}
                          >
                            {(customDim.memory / 1024).toFixed(2)}KB
                          </Typography>
                        </Box>
                      )}
                    </Box>
                  )}
                </Paper>
              );
            })}
          </Box>

          {/* Pagination */}
          {totalPages > 1 && (
            <Box
              sx={{
                display: "flex",
                justifyContent: "center",
                mt: 3,
                mb: 2,
              }}
            >
              <Pagination
                count={totalPages}
                page={currentPage}
                onChange={handlePageChange}
                color="primary"
                shape="rounded"
                sx={{
                  "& .MuiPaginationItem-root": {
                    fontSize: "0.875rem",
                  },
                  "& .Mui-selected": {
                    backgroundColor: "#6366f1 !important",
                    color: "#ffffff",
                  },
                }}
              />
            </Box>
          )}
        </>
      )}

      {/* Submission Detail Dialog */}
      <Dialog
        open={dialogOpen}
        onClose={handleCloseDialog}
        maxWidth="md"
        fullWidth
        sx={{
          "& .MuiDialog-paper": {
            height: "80vh",
            maxHeight: "800px",
            maxWidth: "900px",
          },
        }}
      >
        <DialogTitle
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            borderBottom: "1px solid #e5e7eb",
            pb: 2,
          }}
        >
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Submission Details
            </Typography>
            {selectedSubmission && (
              <Typography variant="caption" sx={{ color: "#6b7280" }}>
                Submitted on{" "}
                {new Date(selectedSubmission.created_at).toLocaleString()}
              </Typography>
            )}
          </Box>
          <IconButton onClick={handleCloseDialog} size="small">
            <IconWrapper icon="mdi:close" size={24} />
          </IconButton>
        </DialogTitle>

        <DialogContent sx={{ p: 0, overflow: "auto" }}>
          {selectedSubmission && (
            <>
              {/* Submission Stats */}
              <Box
                sx={{
                  p: 2,
                  backgroundColor: "#f9fafb",
                  borderBottom: "1px solid #e5e7eb",
                }}
              >
                <Box
                  sx={{
                    display: "flex",
                    gap: 3,
                    flexWrap: "wrap",
                    alignItems: "center",
                  }}
                >
                  <Chip
                    label={
                      selectedSubmission.custom_dimension?.status ||
                      selectedSubmission.result ||
                      "Submitted"
                    }
                    icon={
                      <IconWrapper
                        icon={
                          selectedSubmission.result === "passed"
                            ? "mdi:check-circle"
                            : "mdi:close-circle"
                        }
                        size={16}
                        color="#ffffff"
                      />
                    }
                    sx={{
                      backgroundColor:
                        selectedSubmission.result === "passed"
                          ? "#10b981"
                          : "#ef4444",
                      color: "#ffffff",
                      fontWeight: 600,
                    }}
                  />

                  {selectedSubmission.maximum_marks > 0 && (
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <Typography variant="body2" sx={{ color: "#6b7280" }}>
                        Score:
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {selectedSubmission.marks} /{" "}
                        {selectedSubmission.maximum_marks}
                      </Typography>
                    </Box>
                  )}

                  {selectedSubmission.custom_dimension?.passed !==
                    undefined && (
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <Typography variant="body2" sx={{ color: "#6b7280" }}>
                        Tests:
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {selectedSubmission.custom_dimension.passed}/
                        {selectedSubmission.custom_dimension.total_test_cases}{" "}
                        passed
                      </Typography>
                    </Box>
                  )}

                  {selectedSubmission.custom_dimension?.time && (
                    <Box
                      sx={{ display: "flex", alignItems: "center", gap: 0.5 }}
                    >
                      <IconWrapper
                        icon="mdi:clock-outline"
                        size={18}
                        color="#6b7280"
                      />
                      <Typography variant="body2" sx={{ color: "#6b7280" }}>
                        Time:
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {(
                          selectedSubmission.custom_dimension.time * 1000
                        ).toFixed(0)}
                        ms
                      </Typography>
                    </Box>
                  )}

                  {selectedSubmission.custom_dimension?.memory && (
                    <Box
                      sx={{ display: "flex", alignItems: "center", gap: 0.5 }}
                    >
                      <IconWrapper
                        icon="mdi:memory"
                        size={18}
                        color="#6b7280"
                      />
                      <Typography variant="body2" sx={{ color: "#6b7280" }}>
                        Memory:
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {(
                          selectedSubmission.custom_dimension.memory / 1024
                        ).toFixed(2)}
                        KB
                      </Typography>
                    </Box>
                  )}
                </Box>
              </Box>

              {/* Code Editor */}
              <Box sx={{ p: 2, overflow: "hidden" }}>
                <Typography
                  variant="subtitle2"
                  sx={{ fontWeight: 600, mb: 1.5, color: "#374151" }}
                >
                  Submitted Code
                </Typography>
                <Box
                  sx={{
                    height: "400px",
                    maxHeight: "400px",
                    border: "1px solid #2d3748",
                    borderRadius: 1,
                    overflow: "hidden",
                    backgroundColor: "#1e1e1e",
                  }}
                >
                  <CodeEditor
                    value={
                      selectedSubmission.custom_dimension?.source_code || ""
                    }
                    language={getLanguageFromId(
                      selectedSubmission.custom_dimension?.language_id || 71
                    )}
                    readOnly={true}
                    height="400px"
                    theme="vs-dark"
                    onChange={() => {}}
                  />
                </Box>
              </Box>
            </>
          )}
        </DialogContent>
      </Dialog>
    </Box>
  );
});
