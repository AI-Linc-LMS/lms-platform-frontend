"use client";

import {
  Paper,
  Typography,
  Box,
  Chip,
  IconButton,
  Tooltip,
  Button,
  Pagination,
} from "@mui/material";
import { IconWrapper } from "@/components/common/IconWrapper";
import { MockInterview } from "@/lib/services/mock-interview.service";
import { memo, useCallback, useState, useMemo } from "react";
import { useRouter } from "next/navigation";

interface ScheduledInterviewsTableProps {
  interviews: MockInterview[];
  onViewDetails: (id: number) => void;
  onDelete?: (id: number) => void;
}

const ScheduledInterviewsTableComponent = ({
  interviews,
  onViewDetails,
  onDelete,
}: ScheduledInterviewsTableProps) => {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const itemsPerPage = 5;

  const formatDateTime = useCallback((dateString: string) => {
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      }),
      time: date.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };
  }, []);

  const getDifficultyColor = useCallback((difficulty: string) => {
    switch (difficulty?.toLowerCase()) {
      case "easy":
        return { bg: "#fef3c7", color: "#92400e" };
      case "medium":
        return { bg: "#fed7aa", color: "#9a3412" };
      case "hard":
        return { bg: "#fecaca", color: "#991b1b" };
      default:
        return { bg: "#fef3c7", color: "#92400e" };
    }
  }, []);

  const handleTakeInterview = useCallback(
    (id: number) => {
      router.push(`/mock-interview/${id}/take`);
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
            backgroundColor: "#fef3c7",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            mb: 2,
          }}
        >
          <IconWrapper icon="mdi:calendar-clock" size={40} color="#f59e0b" />
        </Box>
        <Typography
          variant="h6"
          sx={{ color: "#6b7280", mb: 1, fontWeight: 600 }}
        >
          No Scheduled Interviews
        </Typography>
        <Typography variant="body2" sx={{ color: "#9ca3af" }}>
          Schedule your first interview to see it here
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
      <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
        {paginatedInterviews.map((interview) => {
          const datetime = formatDateTime(
            interview.scheduled_date_time || interview.created_at
          );
          const difficultyColor = getDifficultyColor(interview.difficulty);

          return (
            <Paper
              key={interview.id}
              elevation={0}
              sx={{
                p: 3,
                borderRadius: 3,
                border: "1px solid #fde68a",
                backgroundColor: "#fffbeb",
                transition: "all 0.3s ease",
                "&:hover": {
                  boxShadow: "0 4px 12px rgba(245, 158, 11, 0.15)",
                  borderColor: "#f59e0b",
                  transform: "translateY(-2px)",
                },
              }}
            >
              <Box sx={{ display: "flex", gap: 3, alignItems: "flex-start" }}>
                {/* Date Box */}
                <Box
                  sx={{
                    width: 80,
                    height: 80,
                    borderRadius: 2,
                    background:
                      "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                    boxShadow: "0 4px 12px rgba(245, 158, 11, 0.3)",
                  }}
                >
                  <Typography
                    variant="h5"
                    sx={{ color: "#ffffff", fontWeight: 700, lineHeight: 1 }}
                  >
                    {new Date(
                      interview.scheduled_date_time || interview.created_at
                    ).getDate()}
                  </Typography>
                  <Typography
                    variant="caption"
                    sx={{
                      color: "#ffffff",
                      fontSize: "0.7rem",
                      textTransform: "uppercase",
                    }}
                  >
                    {new Date(
                      interview.scheduled_date_time || interview.created_at
                    ).toLocaleDateString("en-US", { month: "short" })}
                  </Typography>
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
                        sx={{
                          fontWeight: 700,
                          fontSize: "1.1rem",
                          mb: 0.5,
                          color: "#78350f",
                        }}
                      >
                        {interview.title}
                      </Typography>
                      <Box
                        sx={{
                          display: "flex",
                          gap: 1,
                          flexWrap: "wrap",
                          mb: 1,
                        }}
                      >
                        <Chip
                          label={interview.topic}
                          size="small"
                          sx={{
                            backgroundColor: "#fef3c7",
                            color: "#92400e",
                            fontSize: "0.75rem",
                            height: 24,
                            border: "1px solid #fde68a",
                          }}
                        />
                        {interview.subtopic && (
                          <Chip
                            label={interview.subtopic}
                            size="small"
                            sx={{
                              backgroundColor: "#fef3c7",
                              color: "#92400e",
                              fontSize: "0.75rem",
                              height: 24,
                              border: "1px solid #fde68a",
                            }}
                          />
                        )}
                        <Chip
                          label={interview.difficulty}
                          size="small"
                          sx={{
                            backgroundColor: difficultyColor.bg,
                            color: difficultyColor.color,
                            fontSize: "0.75rem",
                            height: 24,
                            border: `1px solid ${difficultyColor.bg}`,
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
                            border: "1px solid #fde68a",
                          }}
                        />
                      </Box>
                    </Box>

                    <Chip
                      icon={<IconWrapper icon="mdi:clock-outline" size={16} />}
                      label="Scheduled"
                      size="small"
                      sx={{
                        backgroundColor: "#fef3c7",
                        color: "#92400e",
                        fontWeight: 600,
                        fontSize: "0.75rem",
                        height: 26,
                        border: "1px solid #f59e0b",
                      }}
                    />
                  </Box>

                  {/* Date/Time and Actions */}
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <Box sx={{ display: "flex", gap: 2 }}>
                      <Box
                        sx={{ display: "flex", alignItems: "center", gap: 0.5 }}
                      >
                        <IconWrapper
                          icon="mdi:calendar"
                          size={16}
                          color="#92400e"
                        />
                        <Typography
                          variant="body2"
                          sx={{
                            color: "#92400e",
                            fontSize: "0.875rem",
                            fontWeight: 500,
                          }}
                        >
                          {datetime.date}
                        </Typography>
                      </Box>
                      <Box
                        sx={{ display: "flex", alignItems: "center", gap: 0.5 }}
                      >
                        <IconWrapper
                          icon="mdi:clock-outline"
                          size={16}
                          color="#92400e"
                        />
                        <Typography
                          variant="body2"
                          sx={{
                            color: "#92400e",
                            fontSize: "0.875rem",
                            fontWeight: 500,
                          }}
                        >
                          {datetime.time}
                        </Typography>
                      </Box>
                    </Box>

                    <Box sx={{ display: "flex", gap: 1 }}>
                      <Button
                        variant="contained"
                        size="small"
                        startIcon={
                          <IconWrapper icon="mdi:play-circle" size={18} />
                        }
                        onClick={() => handleTakeInterview(interview.id)}
                        sx={{
                          backgroundColor: "#f59e0b",
                          color: "#ffffff",
                          fontWeight: 600,
                          textTransform: "none",
                          px: 2,
                          "&:hover": {
                            backgroundColor: "#d97706",
                          },
                        }}
                      >
                        Start Now
                      </Button>
                    </Box>
                  </Box>
                </Box>
              </Box>
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
                backgroundColor: "#f59e0b !important",
                color: "#ffffff",
                "&:hover": {
                  backgroundColor: "#d97706 !important",
                },
              },
            }}
          />
        </Box>
      )}
    </Box>
  );
};

const areEqual = (
  prevProps: ScheduledInterviewsTableProps,
  nextProps: ScheduledInterviewsTableProps
) => {
  return (
    prevProps.interviews.length === nextProps.interviews.length &&
    prevProps.interviews.every(
      (interview, index) =>
        interview.id === nextProps.interviews[index]?.id &&
        interview.status === nextProps.interviews[index]?.status
    )
  );
};

export const ScheduledInterviewsTable = memo(
  ScheduledInterviewsTableComponent,
  areEqual
);
ScheduledInterviewsTable.displayName = "ScheduledInterviewsTable";
