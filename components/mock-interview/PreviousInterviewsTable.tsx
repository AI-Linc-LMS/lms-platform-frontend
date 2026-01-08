"use client";

import {
  Paper,
  Typography,
  Box,
  Chip,
  IconButton,
  Tooltip,
  Pagination,
} from "@mui/material";
import { IconWrapper } from "@/components/common/IconWrapper";
import { MockInterview } from "@/lib/services/mock-interview.service";
import { memo, useCallback, useState, useMemo } from "react";
import { useRouter } from "next/navigation";

interface PreviousInterviewsTableProps {
  interviews: MockInterview[];
}

const PreviousInterviewsTableComponent = ({
  interviews,
}: PreviousInterviewsTableProps) => {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const itemsPerPage = 5;

  const formatDate = useCallback((dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }, []);

  const getDifficultyColor = useCallback((difficulty: string) => {
    switch (difficulty?.toLowerCase()) {
      case "easy":
        return { bg: "#d1fae5", color: "#065f46" };
      case "medium":
        return { bg: "#fed7aa", color: "#9a3412" };
      case "hard":
        return { bg: "#fecaca", color: "#991b1b" };
      default:
        return { bg: "#f3f4f6", color: "#374151" };
    }
  }, []);

  const handleViewResult = useCallback(
    (id: number) => {
      router.push(`/mock-interview/${id}/result`);
    },
    [router]
  );

  const handlePageChange = useCallback(
    (event: React.ChangeEvent<unknown>, value: number) => {
      setPage(value);
    },
    []
  );

  const paginatedInterviews = useMemo(() => {
    const startIndex = (page - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return interviews.slice(startIndex, endIndex);
  }, [interviews, page]);

  const totalPages = useMemo(() => {
    return Math.ceil(interviews.length / itemsPerPage);
  }, [interviews.length]);

  if (interviews.length === 0) {
    return (
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
          py: 8,
          px: 3,
        }}
      >
        <Box
          sx={{
            width: 80,
            height: 80,
            borderRadius: "50%",
            backgroundColor: "#f3f4f6",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            mb: 2,
          }}
        >
          <IconWrapper icon="mdi:history" size={40} color="#9ca3af" />
        </Box>
        <Typography
          variant="h6"
          sx={{ color: "#6b7280", mb: 1, fontWeight: 600 }}
        >
          No Previous Interviews
        </Typography>
        <Typography variant="body2" sx={{ color: "#9ca3af" }}>
          Complete your first interview to see results here
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
      <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
        {paginatedInterviews.map((interview) => (
          <Paper
            key={interview.id}
            elevation={0}
            sx={{
              p: 3,
              borderRadius: 3,
              border: "1px solid #e5e7eb",
              transition: "all 0.3s ease",
              "&:hover": {
                boxShadow: "0 4px 12px rgba(0, 0, 0, 0.08)",
                borderColor: "#10b981",
                transform: "translateY(-2px)",
              },
            }}
          >
            <Box sx={{ display: "flex", gap: 3, alignItems: "flex-start" }}>
              {/* Interview Icon */}
              <Box
                sx={{
                  width: 80,
                  height: 80,
                  borderRadius: 3,
                  background:
                    "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                  boxShadow: "0 4px 12px rgba(16, 185, 129, 0.3)",
                }}
              >
                <IconWrapper
                  icon="mdi:clipboard-check-outline"
                  size={40}
                  color="#ffffff"
                />
              </Box>

              {/* Main Content */}
              <Box sx={{ flex: 1 }}>
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    mb: 2,
                  }}
                >
                  <Box>
                    <Typography
                      variant="h6"
                      sx={{ fontWeight: 700, fontSize: "1.1rem", mb: 0.5 }}
                    >
                      {interview.title}
                    </Typography>
                    <Box
                      sx={{ display: "flex", gap: 1, flexWrap: "wrap", mb: 1 }}
                    >
                      <Chip
                        label={interview.topic}
                        size="small"
                        sx={{
                          backgroundColor: "#f3f4f6",
                          color: "#374151",
                          fontSize: "0.75rem",
                          height: 24,
                        }}
                      />
                      {interview.subtopic && (
                        <Chip
                          label={interview.subtopic}
                          size="small"
                          sx={{
                            backgroundColor: "#dbeafe",
                            color: "#1e40af",
                            fontSize: "0.75rem",
                            height: 24,
                          }}
                        />
                      )}
                      <Chip
                        label={interview.difficulty}
                        size="small"
                        sx={{
                          backgroundColor: getDifficultyColor(
                            interview.difficulty
                          ).bg,
                          color: getDifficultyColor(interview.difficulty).color,
                          fontSize: "0.75rem",
                          height: 24,
                          fontWeight: 600,
                        }}
                      />
                      <Chip
                        icon={
                          <IconWrapper icon="mdi:clock-outline" size={14} />
                        }
                        label={`${interview.duration_minutes} mins`}
                        size="small"
                        sx={{
                          backgroundColor: "#fef3c7",
                          color: "#92400e",
                          fontSize: "0.75rem",
                          height: 24,
                        }}
                      />
                    </Box>
                  </Box>

                  <Chip
                    icon={<IconWrapper icon="mdi:check-circle" size={16} />}
                    label="Completed"
                    size="small"
                    sx={{
                      backgroundColor: "#d1fae5",
                      color: "#065f46",
                      fontWeight: 600,
                      fontSize: "0.75rem",
                      height: 26,
                    }}
                  />
                </Box>

                {/* Date and Actions */}
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <IconWrapper
                        icon="mdi:calendar"
                        size={16}
                        color="#6b7280"
                      />
                      <Typography
                        variant="body2"
                        sx={{ color: "#6b7280", fontSize: "0.875rem" }}
                      >
                        {formatDate(interview.scheduled_date_time || "")}
                      </Typography>
                    </Box>
                  </Box>

                  <Tooltip title="View Result" arrow>
                    <IconButton
                      size="small"
                      onClick={() => handleViewResult(interview.id)}
                      sx={{
                        backgroundColor: "#10b981",
                        color: "#ffffff",
                        px: 2,
                        borderRadius: 2,
                        "&:hover": {
                          backgroundColor: "#059669",
                        },
                      }}
                    >
                      <IconWrapper icon="mdi:chart-box-outline" size={20} />
                      <Typography
                        variant="body2"
                        sx={{
                          ml: 1,
                          fontWeight: 600,
                          fontSize: "0.875rem",
                        }}
                      >
                        View Result
                      </Typography>
                    </IconButton>
                  </Tooltip>
                </Box>
              </Box>
            </Box>
          </Paper>
        ))}
      </Box>

      {/* Pagination */}
      {totalPages > 1 && (
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            mt: 2,
          }}
        >
          <Pagination
            count={totalPages}
            page={page}
            onChange={handlePageChange}
            color="primary"
            size="large"
            showFirstButton
            showLastButton
            sx={{
              "& .MuiPaginationItem-root": {
                borderRadius: 2,
                fontWeight: 600,
              },
              "& .Mui-selected": {
                backgroundColor: "#10b981 !important",
                color: "#ffffff",
                "&:hover": {
                  backgroundColor: "#059669 !important",
                },
              },
            }}
          />
        </Box>
      )}
    </Box>
  );
};

export const PreviousInterviewsTable = memo(
  PreviousInterviewsTableComponent,
  (prevProps, nextProps) => {
    return (
      prevProps.interviews.length === nextProps.interviews.length &&
      prevProps.interviews.every(
        (interview, index) =>
          interview.id === nextProps.interviews[index]?.id &&
          interview.status === nextProps.interviews[index]?.status
      )
    );
  }
);
PreviousInterviewsTable.displayName = "PreviousInterviewsTable";
