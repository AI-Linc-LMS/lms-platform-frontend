"use client";

import { useEffect, useState, useMemo, useRef, useCallback } from "react";
import { Box, Typography, Card, Avatar, Skeleton, LinearProgress, IconButton, Tooltip } from "@mui/material";
import {
  dashboardService,
  OverallLeaderboardEntry,
} from "@/lib/services/dashboard.service";
import { useToast } from "@/components/common/Toast";
import { getUserInitials } from "@/lib/utils/user-utils";
import { IconWrapper } from "@/components/common/IconWrapper";

// Shared cache to minimize API calls
interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
const AUTO_REFRESH_INTERVAL = 5 * 60 * 1000; // 5 minutes

// Module-level cache shared across all component instances
let leaderboardCache: CacheEntry<OverallLeaderboardEntry[]> | null = null;

export const invalidateLeaderboardCache = () => {
  leaderboardCache = null;
};

interface LeaderboardProps {
  courseId?: number; // Kept for backward compatibility but not used
}

export const Leaderboard = ({ courseId }: LeaderboardProps) => {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [leaderboard, setLeaderboard] = useState<OverallLeaderboardEntry[]>([]);
  const [timeUntilRefresh, setTimeUntilRefresh] = useState<number>(AUTO_REFRESH_INTERVAL);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const hasLoadedRef = useRef(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const countdownRef = useRef<NodeJS.Timeout | null>(null);

  // Calculate time until next refresh
  const calculateTimeUntilRefresh = useCallback(() => {
    if (!leaderboardCache?.timestamp) return AUTO_REFRESH_INTERVAL;
    const elapsed = Date.now() - leaderboardCache.timestamp;
    const remaining = AUTO_REFRESH_INTERVAL - elapsed;
    return Math.max(0, remaining);
  }, []);

  const loadLeaderboard = useCallback(async (isAutoRefresh = false) => {
    try {
      if (isAutoRefresh) {
        setIsRefreshing(true);
      } else {
        setLoading(true);
      }
      
      // Get overall leaderboard (default limit is handled by API)
      const data = await dashboardService.getOverallLeaderboard();

      // Ensure data is an array - multiple checks
      if (!data) {
        setLeaderboard([]);
        // Update cache with empty array
        leaderboardCache = {
          data: [],
          timestamp: Date.now(),
        };
        setTimeUntilRefresh(AUTO_REFRESH_INTERVAL);
        return;
      }

      if (!Array.isArray(data)) {
        setLeaderboard([]);
        // Update cache with empty array
        leaderboardCache = {
          data: [],
          timestamp: Date.now(),
        };
        setTimeUntilRefresh(AUTO_REFRESH_INTERVAL);
        return;
      }

      // Update cache with fresh data
      leaderboardCache = {
        data,
        timestamp: Date.now(),
      };

      setLeaderboard(data);
      setTimeUntilRefresh(AUTO_REFRESH_INTERVAL);
    } catch (error: any) {
      setLeaderboard([]); // Set empty array on error
      // Don't show toast for optional data
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    if (hasLoadedRef.current) return;
    hasLoadedRef.current = true;

    // Check cache first
    const now = Date.now();
    const cachedData = leaderboardCache?.data;
    const cacheTime = leaderboardCache?.timestamp || 0;

    if (cachedData && now - cacheTime < CACHE_DURATION) {
      // Use cached data
      setLeaderboard(cachedData);
      setLoading(false);
      setTimeUntilRefresh(calculateTimeUntilRefresh());
    } else {
      // Load fresh data
      loadLeaderboard();
    }
  }, [loadLeaderboard, calculateTimeUntilRefresh]);

  // Set up auto-refresh interval and countdown
  useEffect(() => {
    if (!hasLoadedRef.current) return;

    // Set up countdown timer that updates every second
    countdownRef.current = setInterval(() => {
      setTimeUntilRefresh((prev) => {
        const newTime = prev - 1000;
        if (newTime <= 0) {
          // Trigger refresh when countdown reaches 0
          loadLeaderboard(true);
          return AUTO_REFRESH_INTERVAL;
        }
        return newTime;
      });
    }, 1000);

    // Set up auto-refresh interval as backup (runs every 5 minutes)
    intervalRef.current = setInterval(() => {
      loadLeaderboard(true);
      setTimeUntilRefresh(AUTO_REFRESH_INTERVAL);
    }, AUTO_REFRESH_INTERVAL);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      if (countdownRef.current) {
        clearInterval(countdownRef.current);
      }
    };
  }, [loadLeaderboard]);

  // Format time for display
  const formatTime = useCallback((ms: number) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  }, []);

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

  const handleManualRefresh = useCallback(() => {
    loadLeaderboard(false);
  }, [loadLeaderboard]);

  return (
    <Box>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 2,
        }}
      >
        <Typography
          variant="h6"
          sx={{
            fontSize: "1.125rem",
            fontWeight: 600,
            color: "#111827",
          }}
        >
          Leaderboard
        </Typography>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          {timeUntilRefresh > 0 && (
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 0.5,
                px: 1.5,
                py: 0.5,
                borderRadius: 1.5,
                backgroundColor: "rgba(99, 102, 241, 0.08)",
              }}
            >
              <IconWrapper
                icon="mdi:clock-outline"
                size={14}
                color="#6366F1"
              />
              <Typography
                variant="caption"
                sx={{
                  color: "#6366F1",
                  fontSize: "0.75rem",
                  fontWeight: 500,
                }}
              >
                Updates in {formatTime(timeUntilRefresh)}
              </Typography>
            </Box>
          )}
          <Tooltip title="Refresh leaderboard">
            <IconButton
              size="small"
              onClick={handleManualRefresh}
              disabled={loading || isRefreshing}
              sx={{
                width: 28,
                height: 28,
                "&:hover": {
                  backgroundColor: "rgba(99, 102, 241, 0.08)",
                },
              }}
            >
              <IconWrapper
                icon="mdi:refresh"
                size={16}
                color={loading || isRefreshing ? "#9CA3AF" : "#6366F1"}
              />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>
      
      {/* Loading Progress Bar */}
      {(loading || isRefreshing) && (
        <LinearProgress
          sx={{
            height: 2,
            borderRadius: 1,
            mb: 2,
            "& .MuiLinearProgress-bar": {
              borderRadius: 1,
            },
          }}
        />
      )}
      
      <Card
        sx={{
          borderRadius: 2,
          boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
          border: "1px solid #e5e7eb",
          backgroundColor: "#ffffff",
          display: "flex",
          flexDirection: "column",
          maxHeight: 350,
          overflow: "hidden",
        }}
      >
        {loading ? (
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              gap: 1,
              p: 2,
            }}
          >
            {[1, 2, 3, 4, 5].map((i) => (
              <Box
                key={i}
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1.5,
                  p: 1,
                  borderRadius: 1,
                }}
              >
                <Skeleton
                  variant="circular"
                  width={24}
                  height={24}
                  animation="wave"
                  sx={{
                    bgcolor: "#E0E7FF",
                  }}
                />
                <Skeleton
                  variant="circular"
                  width={32}
                  height={32}
                  animation="wave"
                  sx={{
                    bgcolor: "#E0E7FF",
                  }}
                />
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Skeleton
                    variant="text"
                    width="60%"
                    height={16}
                    animation="wave"
                    sx={{
                      bgcolor: "#E0E7FF",
                    }}
                  />
                  <Skeleton
                    variant="text"
                    width="40%"
                    height={12}
                    animation="wave"
                    sx={{
                      mt: 0.5,
                      bgcolor: "#E0E7FF",
                    }}
                  />
                </Box>
                <Skeleton
                  variant="text"
                  width={30}
                  height={16}
                  animation="wave"
                  sx={{
                    bgcolor: "#E0E7FF",
                  }}
                />
              </Box>
            ))}
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
              const profilePicUrl = entry?.profile_pic_url;
              const college = entry?.college;
              const linkedinUrl = entry?.linkedin_url;

              const handleClick = (e: React.MouseEvent) => {
                e.stopPropagation();
                if (linkedinUrl) {
                  // Ensure URL is valid and starts with http/https
                  const url = linkedinUrl.startsWith("http") 
                    ? linkedinUrl 
                    : `https://${linkedinUrl}`;
                  // Open LinkedIn in new tab
                  window.open(url, "_blank", "noopener,noreferrer");
                }
              };

              return (
                <Tooltip
                  key={rank || index}
                  title={
                    linkedinUrl
                      ? college
                        ? `College: ${college} - Click to view LinkedIn`
                        : "Click to view LinkedIn profile"
                      : college
                      ? `College: ${college}`
                      : "No college information available"
                  }
                  arrow
                  placement="top"
                  disableInteractive
                >
                  <Box
                    onClick={handleClick}
                    onKeyDown={(e) => {
                      if ((e.key === "Enter" || e.key === " ") && linkedinUrl) {
                        e.preventDefault();
                        e.stopPropagation();
                        if (linkedinUrl) {
                          const url = linkedinUrl.startsWith("http") 
                            ? linkedinUrl 
                            : `https://${linkedinUrl}`;
                          window.open(url, "_blank", "noopener,noreferrer");
                        }
                      }
                    }}
                    role={linkedinUrl ? "button" : undefined}
                    tabIndex={linkedinUrl ? 0 : undefined}
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
                      cursor: linkedinUrl ? "pointer" : "default",
                      transition: "all 0.2s ease",
                      "&:hover": {
                        backgroundColor: linkedinUrl ? "rgba(99, 102, 241, 0.08)" : undefined,
                        transform: linkedinUrl ? "translateX(2px)" : undefined,
                        boxShadow: linkedinUrl ? "0 2px 4px rgba(0,0,0,0.1)" : undefined,
                      },
                      "&:focus": linkedinUrl
                        ? {
                            outline: "2px solid #6366f1",
                            outlineOffset: "2px",
                          }
                        : {},
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
                    src={profilePicUrl || undefined}
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
                  {linkedinUrl && (
                    <Box sx={{ ml: 0.5, flexShrink: 0, display: "flex", alignItems: "center" }}>
                      <IconWrapper
                        icon="mdi:linkedin"
                        size={16}
                        color="#0077B5"
                      />
                    </Box>
                  )}
                </Box>
                </Tooltip>
              );
            })}
          </Box>
        )}
      </Card>
    </Box>
  );
};
