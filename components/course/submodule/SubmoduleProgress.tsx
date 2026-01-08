"use client";

import { Box, Typography, CircularProgress, Paper } from "@mui/material";
import { IconWrapper } from "@/components/common/IconWrapper";
import { SubModuleContentItem } from "@/lib/services/courses.service";

interface SubmoduleProgressProps {
  contentItems: SubModuleContentItem[];
}

export function SubmoduleProgress({
  contentItems,
}: SubmoduleProgressProps) {
  // Calculate progress statistics
  const totalItems = contentItems.length;
  const completedItems = contentItems.filter(
    (item) => item.status === "complete"
  ).length;
  const progressPercentage =
    totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;

  // Count items by type
  const itemsByType = contentItems.reduce(
    (acc, item) => {
      const type = item.content_type;
      if (!acc[type]) {
        acc[type] = { total: 0, completed: 0 };
      }
      acc[type].total += 1;
      if (item.status === "complete") {
        acc[type].completed += 1;
      }
      return acc;
    },
    {} as Record<string, { total: number; completed: number }>
  );

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "VideoTutorial":
        return "mdi:video-outline";
      case "Quiz":
        return "mdi:star-outline";
      case "Article":
        return "mdi:file-document-outline";
      case "CodingProblem":
        return "mdi:code-tags";
      case "Assignment":
        return "mdi:file-check-outline";
      default:
        return "mdi:circle-outline";
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "VideoTutorial":
        return "Videos";
      case "Quiz":
        return "Quizzes";
      case "Article":
        return "Articles";
      case "CodingProblem":
        return "Problems";
      case "Assignment":
        return "Assignments";
      default:
        return type;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "VideoTutorial":
        return "#ef4444";
      case "Quiz":
        return "#f59e0b";
      case "Article":
        return "#3b82f6";
      case "CodingProblem":
        return "#10b981";
      case "Assignment":
        return "#8b5cf6";
      default:
        return "#6b7280";
    }
  };

  return (
    <Box
      sx={{
        flex: 1,
        overflowY: "auto",
        p: 3,
        backgroundColor: "#ffffff",
        "&::-webkit-scrollbar": {
          width: "6px",
        },
        "&::-webkit-scrollbar-track": {
          backgroundColor: "transparent",
        },
        "&::-webkit-scrollbar-thumb": {
          backgroundColor: "#cbd5e1",
          borderRadius: "3px",
          "&:hover": {
            backgroundColor: "#94a3b8",
          },
        },
      }}
    >
      {/* Overall Progress Card */}
      <Paper
        elevation={0}
        sx={{
          p: 3,
          mb: 3,
          borderRadius: 2,
          border: "1px solid #e5e7eb",
          backgroundColor: "#f9fafb",
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            mb: 2,
            gap: 2,
          }}
        >
          <Typography
            variant="h6"
            sx={{
              fontWeight: 600,
              color: "#1a1f2e",
              fontSize: "1rem",
              flex: 1,
              minWidth: 0,
            }}
          >
            Overall Progress
          </Typography>
          <Typography
            variant="h6"
            sx={{
              fontWeight: 700,
              color: "#6366f1",
              fontSize: "1.5rem",
              flexShrink: 0,
            }}
          >
            {progressPercentage}%
          </Typography>
        </Box>
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            width: "100%",
          }}
        >
          <Box sx={{ position: "relative", display: "inline-flex" }}>
            <CircularProgress
              variant="determinate"
              value={progressPercentage}
              size={120}
              thickness={4}
              sx={{
                color: "#6366f1",
                "& .MuiCircularProgress-circle": {
                  strokeLinecap: "round",
                },
              }}
            />
            <Box
              sx={{
                top: 0,
                left: 0,
                bottom: 0,
                right: 0,
                position: "absolute",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexDirection: "column",
              }}
            >
              <Typography
                variant="h6"
                sx={{
                  fontSize: "1.5rem",
                  fontWeight: 700,
                  color: "#1a1f2e",
                }}
              >
                {completedItems}/{totalItems}
              </Typography>
              <Typography
                variant="caption"
                sx={{
                  fontSize: "0.75rem",
                  color: "#6b7280",
                  fontWeight: 500,
                }}
              >
                Completed
              </Typography>
            </Box>
          </Box>
        </Box>
      </Paper>

      {/* Progress by Content Type */}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "1fr",
            sm: "repeat(2, 1fr)",
          },
          gap: 2,
        }}
      >
        {Object.entries(itemsByType).map(([type, stats]) => {
          const typeProgress =
            stats.total > 0
              ? Math.round((stats.completed / stats.total) * 100)
              : 0;

          return (
            <Paper
              key={type}
              elevation={0}
              sx={{
                p: 2.5,
                borderRadius: 2,
                border: "1px solid #e5e7eb",
                backgroundColor: "#ffffff",
              }}
            >
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  mb: 2,
                  position: "relative",
                }}
              >
                <CircularProgress
                  variant="determinate"
                  value={typeProgress}
                  size={80}
                  thickness={3}
                  sx={{
                    color: getTypeColor(type),
                    "& .MuiCircularProgress-circle": {
                      strokeLinecap: "round",
                    },
                  }}
                />
                <Box
                  sx={{
                    top: 0,
                    left: 0,
                    bottom: 0,
                    right: 0,
                    position: "absolute",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexDirection: "column",
                  }}
                >
                  <Typography
                    variant="body2"
                    sx={{
                      fontSize: "1rem",
                      fontWeight: 700,
                      color: getTypeColor(type),
                    }}
                  >
                    {typeProgress}%
                  </Typography>
                </Box>
              </Box>
              <Box sx={{ textAlign: "center" }}>
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 1,
                    mb: 1,
                  }}
                >
                  <IconWrapper
                    icon={getTypeIcon(type)}
                    size={18}
                    color={getTypeColor(type)}
                  />
                  <Typography
                    variant="body2"
                    sx={{
                      fontWeight: 600,
                      color: "#1a1f2e",
                      fontSize: "0.875rem",
                    }}
                  >
                    {getTypeLabel(type)}
                  </Typography>
                </Box>
                <Typography
                  variant="caption"
                  sx={{
                    color: "#6b7280",
                    fontSize: "0.75rem",
                  }}
                >
                  {stats.completed}/{stats.total} completed
                </Typography>
              </Box>
            </Paper>
          );
        })}
      </Box>
    </Box>
  );
}

