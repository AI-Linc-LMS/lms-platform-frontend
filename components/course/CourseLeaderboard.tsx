"use client";

import {
  Box,
  Typography,
  Card,
  Avatar,
  Tooltip,
  IconButton,
} from "@mui/material";
import { IconWrapper } from "@/components/common/IconWrapper";
import { LeaderboardEntry } from "@/lib/services/courses.service";

interface CourseLeaderboardProps {
  leaderboard: LeaderboardEntry[];
}

export function CourseLeaderboard({ leaderboard }: CourseLeaderboardProps) {
  const getRankColor = (rank?: number | null) => {
    if (!rank || rank === 0) return "#6B7280";
    if (rank === 1) return "#FFD700"; // Gold
    if (rank === 2) return "#C0C0C0"; // Silver
    if (rank === 3) return "#CD7F32"; // Bronze
    return "#6B7280";
  };

  const getRankIcon = (rank?: number | null) => {
    if (!rank || rank === 0) return "?";
    if (rank === 1) return "🥇";
    if (rank === 2) return "🥈";
    if (rank === 3) return "🥉";
    return String(rank);
  };

  const getDisplayName = (entry: LeaderboardEntry) => {
    // Current structure has name directly
    return entry.name || "User";
  };

  const markingScheme = [
    { type: "VideoTutorial", marks: 10 },
    { type: "Quiz", marks: 20 },
    { type: "Assignment", marks: 30 },
    { type: "Article", marks: 5 },
    { type: "CodingProblem", marks: 50 },
  ];

  const markingSchemeTooltip = (
    <Box
      sx={{
        p: 1.5,
        display: "flex",
        flexDirection: "column",
        gap: 1,
        minWidth: 200,
      }}
    >
      <Typography
        variant="body2"
        sx={{
          color: "#ffffff",
          fontSize: "0.875rem",
          fontWeight: 600,
          mb: 0.5,
        }}
      >
        Marking Scheme
      </Typography>
      {markingScheme.map((item, index) => (
        <Box
          key={item.type}
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            py: 0.5,
            borderBottom:
              index < markingScheme.length - 1
                ? "1px solid rgba(255, 255, 255, 0.1)"
                : "none",
          }}
        >
          <Typography
            variant="body2"
            sx={{
              color: "#ffffff",
              fontSize: "0.8125rem",
              fontWeight: 400,
            }}
          >
            {item.type}
          </Typography>
          <Typography
            variant="body2"
            sx={{
              color: "#ffffff",
              fontSize: "0.8125rem",
              fontWeight: 600,
            }}
          >
            {item.marks} Marks
          </Typography>
        </Box>
      ))}
    </Box>
  );

  return (
    <Card
      elevation={0}
      sx={{
        border: "1px solid #e5e7eb",
        borderRadius: 2,
        p: 3,
        background: "linear-gradient(to bottom, #ffffff 0%, #f9fafb 100%)",
        maxHeight: 500,
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Header */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1.5,
          mb: 3,
        }}
      >
        <Box
          sx={{
            width: 40,
            height: 40,
            borderRadius: 2,
            background: "linear-gradient(135deg, #f59e0b 0%, #ef4444 100%)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <IconWrapper
            icon="mdi:trophy"
            size={22}
            color="#ffffff"
          />
        </Box>
        <Box sx={{ flex: 1 }}>
          <Typography
            variant="h6"
            sx={{ fontWeight: 700, color: "#1a1f2e", fontSize: "1.125rem" }}
          >
            Leaderboard
          </Typography>
          <Typography
            variant="caption"
            sx={{ color: "#6b7280", fontSize: "0.75rem" }}
          >
            Top performers in this course
          </Typography>
        </Box>
        <Tooltip
          title={markingSchemeTooltip}
          arrow
          placement="top"
          componentsProps={{
            tooltip: {
              sx: {
                backgroundColor: "#1a1f2e",
                border: "1px solid rgba(255, 255, 255, 0.1)",
                borderRadius: 2,
                boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
                maxWidth: 300,
              },
            },
            arrow: {
              sx: {
                color: "#1a1f2e",
              },
            },
          }}
        >
          <IconButton
            size="small"
            sx={{
              color: "#6B7280",
              "&:hover": {
                color: "#111827",
                backgroundColor: "rgba(0, 0, 0, 0.04)",
              },
            }}
          >
            <IconWrapper
              icon="mdi:information-outline"
              size={20}
              color="inherit"
            />
          </IconButton>
        </Tooltip>
      </Box>

      <Box
        sx={{
          flex: 1,
          minHeight: 0,
          overflow: "hidden",
          borderRadius: 2,
          border: "1px solid #e5e7eb",
          backgroundColor: "#ffffff",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {leaderboard.length === 0 ? (
          <Box
            sx={{
              p: 4,
              textAlign: "center",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 1,
            }}
          >
            <IconWrapper
              icon="mdi:trophy-outline"
              size={48}
              color="#d1d5db"
            />
            <Typography
              variant="body2"
              sx={{ color: "#9ca3af", fontSize: "0.875rem" }}
            >
              No leaderboard data available
            </Typography>
          </Box>
        ) : (
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              gap: 1,
              p: 2,
              overflowY: "auto",
              flex: 1,
              minHeight: 0,
              "&::-webkit-scrollbar": {
                width: "6px",
              },
              "&::-webkit-scrollbar-track": {
                backgroundColor: "#f9fafb",
                borderRadius: "3px",
              },
              "&::-webkit-scrollbar-thumb": {
                backgroundColor: "#d1d5db",
                borderRadius: "3px",
                "&:hover": {
                  backgroundColor: "#9ca3af",
                },
              },
            }}
          >
            {leaderboard.map((entry, index) => {
              const userName = getDisplayName(entry);
              const rank = entry.rank ?? 0;
              const totalScore = entry.score ?? 0;
              const profilePicUrl = undefined;

              return (
                <Box
                  key={rank || index}
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 1.5,
                    p: 1.5,
                    borderRadius: 1.5,
                    backgroundColor:
                      rank > 0 && rank <= 3 ? "#fef3c7" : "#f9fafb",
                    border: `1px solid ${
                      rank > 0 && rank <= 3 ? "#fbbf24" : "#e5e7eb"
                    }`,
                    flexShrink: 0,
                    transition: "all 0.2s ease",
                    "&:hover": {
                      backgroundColor:
                        rank > 0 && rank <= 3 ? "#fde68a" : "#f3f4f6",
                      transform: "translateX(4px)",
                    },
                  }}
                >
                  <Box
                    sx={{
                      minWidth: 28,
                      height: 28,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      borderRadius: "50%",
                      backgroundColor: getRankColor(rank),
                      color: "#ffffff",
                      fontWeight: 700,
                      fontSize: "0.8125rem",
                      flexShrink: 0,
                      boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
                    }}
                  >
                    {getRankIcon(rank)}
                  </Box>
                  <Avatar
                    src={profilePicUrl}
                    alt={userName}
                    sx={{
                      width: 36,
                      height: 36,
                      flexShrink: 0,
                      border: "2px solid #ffffff",
                      boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
                    }}
                  >
                    {userName[0]}
                  </Avatar>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography
                      variant="body2"
                      sx={{
                        fontWeight: 600,
                        color: "#1a1f2e",
                        fontSize: "0.875rem",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                        lineHeight: 1.3,
                      }}
                    >
                      {userName}
                    </Typography>
                    <Typography
                      variant="caption"
                      sx={{
                        color: "#6b7280",
                        fontSize: "0.75rem",
                        lineHeight: 1.2,
                      }}
                    >
                      Score: {totalScore.toFixed(0)}
                    </Typography>
                  </Box>
                  <Box
                    sx={{
                      px: 1.5,
                      py: 0.5,
                      borderRadius: 1,
                      backgroundColor:
                        rank > 0 && rank <= 3
                          ? "rgba(139, 92, 246, 0.1)"
                          : "rgba(99, 102, 241, 0.1)",
                      flexShrink: 0,
                    }}
                  >
                    <Typography
                      variant="body2"
                      sx={{
                        fontWeight: 700,
                        color: "#6366f1",
                        fontSize: "0.8125rem",
                      }}
                    >
                      #{rank || "?"}
                    </Typography>
                  </Box>
                </Box>
              );
            })}
          </Box>
        )}
      </Box>
    </Card>
  );
}
