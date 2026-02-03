"use client";

import {
  Dialog,
  DialogContent,
  DialogTitle,
  Box,
  Typography,
  Button,
  Divider,
} from "@mui/material";
import { IconWrapper } from "./IconWrapper";

interface CompletionStats {
  passed?: number;
  total_test_cases?: number;
  timeUsed?: string;
  memoryUsed?: string;
  score?: number;
  maxScore?: number;
  obtainedMarks?: number;
  totalMarks?: number;
  attemptsUsed?: number;
  attemptsLeft?: number;
}

interface CompletionDialogProps {
  open: boolean;
  onClose: () => void;
  contentType: string;
  contentTitle: string;
  stats?: CompletionStats;
}

export function CompletionDialog({
  open,
  onClose,
  contentType,
  contentTitle,
  stats,
}: CompletionDialogProps) {
  const isCodingProblem = contentType === "CodingProblem";
  const isQuiz = contentType === "Quiz";

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          boxShadow: "0 8px 32px rgba(0, 0, 0, 0.12)",
        },
      }}
    >
      <DialogTitle
        sx={{
          textAlign: "center",
          pt: 4,
          pb: 2,
        }}
      >
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 2,
          }}
        >
          <Box
            sx={{
              width: 64,
              height: 64,
              borderRadius: "50%",
              backgroundColor: "rgba(16, 185, 129, 0.1)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <IconWrapper icon="mdi:check-circle" size={40} color="#10b981" />
          </Box>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1,
            }}
          >
            <IconWrapper icon="mdi:party-popper" size={28} color="#6366f1" />
            <Typography
              variant="h5"
              sx={{
                fontWeight: 600,
                color: "#1f2937",
              }}
            >
              Congratulations!
            </Typography>
          </Box>
          <Typography
            variant="body2"
            sx={{
              color: "#6b7280",
              textAlign: "center",
            }}
          >
            {contentTitle}
          </Typography>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ px: 4, pb: 4 }}>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
          {/* Coding Problem Stats */}
          {isCodingProblem && stats && (
            <>
              <Divider />
              <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                <Typography
                  variant="subtitle2"
                  sx={{ color: "#6b7280", fontWeight: 600 }}
                >
                  Submission Summary
                </Typography>

                {/* Test Cases */}
                {stats.total_test_cases !== undefined &&
                  stats.passed !== undefined && (
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        p: 2,
                        backgroundColor: "#f9fafb",
                        borderRadius: 2,
                      }}
                    >
                      <Box
                        sx={{ display: "flex", alignItems: "center", gap: 1.5 }}
                      >
                        <IconWrapper
                          icon="mdi:checkbox-marked-circle-outline"
                          size={24}
                          color="#6366f1"
                        />
                        <Typography variant="body2" sx={{ color: "#4b5563" }}>
                          Test Cases Passed
                        </Typography>
                      </Box>
                      <Typography
                        variant="h6"
                        sx={{
                          fontWeight: 600,
                          color:
                            stats.passed === stats.total_test_cases
                              ? "#10b981"
                              : "#6b7280",
                        }}
                      >
                        {stats.passed} / {stats.total_test_cases}
                      </Typography>
                    </Box>
                  )}

                {/* Score */}
                {stats.score !== undefined && stats.maxScore !== undefined && (
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      p: 2,
                      backgroundColor: "#f9fafb",
                      borderRadius: 2,
                    }}
                  >
                    <Box
                      sx={{ display: "flex", alignItems: "center", gap: 1.5 }}
                    >
                      <IconWrapper
                        icon="mdi:trophy-outline"
                        size={24}
                        color="#f59e0b"
                      />
                      <Typography variant="body2" sx={{ color: "#4b5563" }}>
                        Score
                      </Typography>
                    </Box>
                    <Typography
                      variant="h6"
                      sx={{ fontWeight: 600, color: "#6b7280" }}
                    >
                      {stats.score} / {stats.maxScore}
                    </Typography>
                  </Box>
                )}

                {/* Performance Stats */}
                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: 2,
                  }}
                >
                  {stats.timeUsed && (
                    <Box
                      sx={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        p: 2,
                        backgroundColor: "#f9fafb",
                        borderRadius: 2,
                        gap: 1,
                      }}
                    >
                      <IconWrapper
                        icon="mdi:clock-outline"
                        size={20}
                        color="#6b7280"
                      />
                      <Typography variant="caption" sx={{ color: "#9ca3af" }}>
                        Time Used
                      </Typography>
                      <Typography
                        variant="body2"
                        sx={{ fontWeight: 600, color: "#4b5563" }}
                      >
                        {stats.timeUsed}
                      </Typography>
                    </Box>
                  )}

                  {stats.memoryUsed && (
                    <Box
                      sx={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        p: 2,
                        backgroundColor: "#f9fafb",
                        borderRadius: 2,
                        gap: 1,
                      }}
                    >
                      <IconWrapper
                        icon="mdi:memory"
                        size={20}
                        color="#6b7280"
                      />
                      <Typography variant="caption" sx={{ color: "#9ca3af" }}>
                        Memory Used
                      </Typography>
                      <Typography
                        variant="body2"
                        sx={{ fontWeight: 600, color: "#4b5563" }}
                      >
                        {stats.memoryUsed}
                      </Typography>
                    </Box>
                  )}
                </Box>

                {/* Attempts */}
                {stats.attemptsUsed !== undefined &&
                  stats.attemptsLeft !== undefined && (
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        p: 2,
                        backgroundColor: "#fef3c7",
                        borderRadius: 2,
                        border: "1px solid #fbbf24",
                      }}
                    >
                      <Box
                        sx={{ display: "flex", alignItems: "center", gap: 1.5 }}
                      >
                        <IconWrapper
                          icon="mdi:counter"
                          size={24}
                          color="#f59e0b"
                        />
                        <Typography variant="body2" sx={{ color: "#92400e" }}>
                          Attempts Left
                        </Typography>
                      </Box>
                      <Typography
                        variant="h6"
                        sx={{ fontWeight: 600, color: "#92400e" }}
                      >
                        {stats.attemptsLeft}
                      </Typography>
                    </Box>
                  )}
              </Box>
            </>
          )}

          {/* Quiz Stats */}
          {isQuiz && stats && (stats.score !== undefined || stats.obtainedMarks !== undefined) && (
            <>
              <Divider />
              <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                <Typography
                  variant="subtitle2"
                  sx={{ color: "#6b7280", fontWeight: 600 }}
                >
                  Quiz Summary
                </Typography>

                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    p: 2,
                    backgroundColor: "#f9fafb",
                    borderRadius: 2,
                  }}
                >
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                    <IconWrapper
                      icon="mdi:trophy-outline"
                      size={24}
                      color="#f59e0b"
                    />
                    <Typography variant="body2" sx={{ color: "#4b5563" }}>
                      Your Score
                    </Typography>
                  </Box>
                  <Typography
                    variant="h6"
                    sx={{ fontWeight: 600, color: "#6b7280" }}
                  >
                    {stats.totalMarks != null && stats.totalMarks > 0
                      ? `${stats.obtainedMarks ?? 0} / ${stats.totalMarks}`
                      : `${stats.score ?? 0} / ${stats.maxScore ?? 0}`}
                  </Typography>
                </Box>
              </Box>
            </>
          )}

          {/* Action Button */}
          <Button
            onClick={onClose}
            variant="contained"
            fullWidth
            sx={{
              mt: 2,
              py: 1.5,
              borderRadius: 2,
              textTransform: "none",
              fontSize: "1rem",
              fontWeight: 600,
              backgroundColor: "#6366f1",
              boxShadow: "0 4px 12px rgba(99, 102, 241, 0.3)",
              "&:hover": {
                backgroundColor: "#4f46e5",
                boxShadow: "0 6px 16px rgba(99, 102, 241, 0.4)",
              },
            }}
          >
            Continue Learning
          </Button>
        </Box>
      </DialogContent>
    </Dialog>
  );
}
