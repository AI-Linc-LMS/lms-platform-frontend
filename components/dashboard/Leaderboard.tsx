"use client";

import { useEffect, useState, useMemo, useRef } from "react";
import { Box, Typography, Card, Avatar, CircularProgress } from "@mui/material";
import {
  dashboardService,
  OverallLeaderboardEntry,
} from "@/lib/services/dashboard.service";
import { useToast } from "@/components/common/Toast";
import { getUserInitials } from "@/lib/utils/user-utils";

interface LeaderboardProps {
  courseId?: number; // Kept for backward compatibility but not used
}

export const Leaderboard = ({ courseId }: LeaderboardProps) => {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [leaderboard, setLeaderboard] = useState<OverallLeaderboardEntry[]>([]);
  const hasLoadedRef = useRef(false);

  useEffect(() => {
    if (hasLoadedRef.current) return;
    hasLoadedRef.current = true;
    loadLeaderboard();
  }, []);

  const loadLeaderboard = async () => {
    try {
      setLoading(true);
      // Get overall leaderboard (default limit is handled by API)
      const data = await dashboardService.getOverallLeaderboard();

      // Ensure data is an array - multiple checks
      if (!data) {
        setLeaderboard([]);
        return;
      }

      if (!Array.isArray(data)) {
        setLeaderboard([]);
        return;
      }

      setLeaderboard(data);
    } catch (error: any) {
      setLeaderboard([]); // Set empty array on error
      // Don't show toast for optional data
    } finally {
      setLoading(false);
    }
  };

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

  // Ensure leaderboard is always an array - defensive check
  const safeLeaderboard = useMemo(() => {
    if (!leaderboard) return [];
    if (!Array.isArray(leaderboard)) {
      return [];
    }
    return leaderboard;
  }, [leaderboard]);

  return (
    <Box>
      <Typography
        variant="h6"
        sx={{
          fontSize: "1.125rem",
          fontWeight: 600,
          color: "#111827",
          mb: 2,
        }}
      >
        Leaderboard
      </Typography>
      <Card
        sx={{
          borderRadius: 2,
          boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
          border: "1px solid #e5e7eb",
          backgroundColor: "#ffffff",
          display: "flex",
          flexDirection: "column",
          maxHeight: 450,
          overflow: "hidden",
        }}
      >
        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 2, p: 2 }}>
            <CircularProgress size={24} />
          </Box>
        ) : safeLeaderboard.length === 0 ? (
          <Typography
            variant="body2"
            sx={{ color: "#6B7280", textAlign: "center", py: 2, p: 2 }}
          >
            No leaderboard data available
          </Typography>
        ) : (
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              gap: 1,
              p: 2,
              overflowY: "auto",
              "&::-webkit-scrollbar": {
                width: "4px",
              },
              "&::-webkit-scrollbar-track": {
                backgroundColor: "transparent",
              },
              "&::-webkit-scrollbar-thumb": {
                backgroundColor: "rgba(0, 0, 0, 0.2)",
                borderRadius: "2px",
                "&:hover": {
                  backgroundColor: "rgba(0, 0, 0, 0.3)",
                },
              },
            }}
          >
            {safeLeaderboard.map((entry, index) => {
              const userName = entry?.name || "User";
              const rank = entry?.rank ?? 0;
              const totalScore = entry?.marks ?? 0;

              return (
                <Box
                  key={rank || index}
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 1.5,
                    p: 1,
                    borderRadius: 1,
                    backgroundColor:
                      rank > 0 && rank <= 3 ? "#F9FAFB" : "transparent",
                    border:
                      rank > 0 && rank <= 3 ? "1px solid #E5E7EB" : "none",
                    flexShrink: 0,
                  }}
                >
                  <Box
                    sx={{
                      minWidth: 24,
                      height: 24,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      borderRadius: "50%",
                      backgroundColor: getRankColor(rank),
                      color: "#ffffff",
                      fontWeight: 700,
                      fontSize: "0.75rem",
                      flexShrink: 0,
                    }}
                  >
                    {getRankIcon(rank)}
                  </Box>
                  <Avatar
                    src={undefined}
                    alt={userName}
                    sx={{ width: 32, height: 32, flexShrink: 0 }}
                  >
                    {userName[0]}
                  </Avatar>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography
                      variant="body2"
                      sx={{
                        fontWeight: 600,
                        color: "#111827",
                        fontSize: "0.8125rem",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                        lineHeight: 1.2,
                      }}
                    >
                      {userName}
                    </Typography>
                    <Typography
                      variant="caption"
                      sx={{
                        color: "#6B7280",
                        fontSize: "0.6875rem",
                        lineHeight: 1.2,
                      }}
                    >
                      Score: {totalScore}
                    </Typography>
                  </Box>
                  <Typography
                    variant="body2"
                    sx={{
                      fontWeight: 700,
                      color: "#6366f1",
                      fontSize: "0.875rem",
                      flexShrink: 0,
                    }}
                  >
                    #{rank || "?"}
                  </Typography>
                </Box>
              );
            })}
          </Box>
        )}
      </Card>
    </Box>
  );
};
