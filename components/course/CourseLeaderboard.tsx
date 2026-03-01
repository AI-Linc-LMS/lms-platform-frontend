"use client";

import {
  Box,
  Typography,
  Card,
  Avatar,
  Tooltip,
  IconButton,
  Divider,
} from "@mui/material";
import { useTranslation } from "react-i18next";
import { IconWrapper } from "@/components/common/IconWrapper";
import { LeaderboardEntry } from "@/lib/services/courses.service";
import { useAuth } from "@/lib/auth/auth-context";

interface CourseLeaderboardProps {
  leaderboard: LeaderboardEntry[];
}

export function CourseLeaderboard({ leaderboard }: CourseLeaderboardProps) {
  const { t } = useTranslation("common");
  const { user } = useAuth();
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
    return entry.name || "User";
  };

  const currentUserEntry = (() => {
    if (!user || leaderboard.length === 0) return undefined;

    const fullName = `${user.first_name} ${user.last_name}`.trim().toLowerCase();
    const userName = (user.user_name || "").toLowerCase();
    const userEmail = (user.email || "").toLowerCase();
    const firstName = (user.first_name || "").toLowerCase();
    const lastName = (user.last_name || "").toLowerCase();

    return leaderboard.find((entry) => {
      const entryName = (entry?.name || "").toLowerCase().trim();
      const entryEmail = (entry?.email || "").toLowerCase();
      const entryUserName = (entry?.user_name || "").toLowerCase();

      if (userEmail && entryEmail && userEmail === entryEmail) return true;
      if (userName && entryUserName && userName === entryUserName) return true;
      if (fullName && entryName && fullName === entryName) return true;
      if (userName && entryName && userName === entryName) return true;
      if (
        firstName &&
        lastName &&
        entryName.includes(firstName) &&
        entryName.includes(lastName)
      )
        return true;
      return false;
    });
  })();

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
        {t("courses.markingScheme")}
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
            {item.marks} {t("courses.marks")}
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
            {t("courses.leaderboardTitle")}
          </Typography>
          <Typography
            variant="caption"
            sx={{ color: "#6b7280", fontSize: "0.75rem" }}
          >
            {t("courses.topPerformersInCourse")}
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
              {t("courses.noLeaderboardDataAvailable")}
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
              const profilePicUrl = entry.profile_pic_url ?? undefined;

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
                      {t("courses.scoreLabel")}: {totalScore.toFixed(0)}
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

      {/* Current User Rank - Pinned at Bottom */}
      {currentUserEntry && leaderboard.length > 0 && (
        <Box sx={{ mt: 2 }}>
          <Divider sx={{ mb: 1.5 }} />
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1.5,
              p: 1.5,
              borderRadius: 2,
              background:
                "linear-gradient(135deg, rgba(99, 102, 241, 0.06) 0%, rgba(139, 92, 246, 0.06) 100%)",
              border: "1px solid rgba(99, 102, 241, 0.2)",
            }}
          >
            <Box
              sx={{
                minWidth: 32,
                height: 32,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: "50%",
                background:
                  "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
                color: "#ffffff",
                fontWeight: 700,
                fontSize: "0.8125rem",
                flexShrink: 0,
                boxShadow: "0 2px 8px rgba(99, 102, 241, 0.3)",
              }}
            >
              {currentUserEntry.rank ?? "?"}
            </Box>
            <Avatar
              src={
                currentUserEntry.profile_pic_url ||
                user?.profile_picture ||
                undefined
              }
              alt={getDisplayName(currentUserEntry)}
              sx={{
                width: 36,
                height: 36,
                flexShrink: 0,
                border: "2px solid rgba(99, 102, 241, 0.3)",
                boxShadow: "0 2px 8px rgba(99, 102, 241, 0.15)",
              }}
            >
              {getDisplayName(currentUserEntry)[0]}
            </Avatar>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography
                variant="body2"
                sx={{
                  fontWeight: 700,
                  color: "#1a1f2e",
                  fontSize: "0.875rem",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                  lineHeight: 1.3,
                }}
              >
                {getDisplayName(currentUserEntry)}
              </Typography>
              <Typography
                variant="caption"
                sx={{
                  color: "#6366f1",
                  fontSize: "0.75rem",
                  fontWeight: 500,
                  lineHeight: 1.2,
                }}
              >
                {t("courses.scoreLabel")}:{" "}
                {(currentUserEntry.score ?? 0).toFixed(0)}
              </Typography>
            </Box>
            <Box
              sx={{
                px: 1.5,
                py: 0.5,
                borderRadius: 1.5,
                background:
                  "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
                flexShrink: 0,
                boxShadow: "0 2px 4px rgba(99, 102, 241, 0.2)",
              }}
            >
              <Typography
                variant="body2"
                sx={{
                  fontWeight: 700,
                  color: "#ffffff",
                  fontSize: "0.8125rem",
                }}
              >
                #{currentUserEntry.rank ?? "?"}
              </Typography>
            </Box>
          </Box>
        </Box>
      )}
    </Card>
  );
}
