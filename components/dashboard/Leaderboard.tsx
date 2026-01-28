"use client";

import { useEffect, useState, useMemo, useRef, useCallback } from "react";
import { Box, Typography, Card, Avatar, Skeleton, LinearProgress, Tooltip } from "@mui/material";
import {
  dashboardService,
  OverallLeaderboardEntry,
} from "@/lib/services/dashboard.service";
import { useToast } from "@/components/common/Toast";
import { getUserInitials } from "@/lib/utils/user-utils";
import { IconWrapper } from "@/components/common/IconWrapper";

const LEADERBOARD_STORAGE_KEY = "leaderboard_data";

// Helper functions for localStorage
const getStoredLeaderboard = (): OverallLeaderboardEntry[] | null => {
  if (typeof window === "undefined") return null;
  try {
    const stored = localStorage.getItem(LEADERBOARD_STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    // Silently fail if localStorage is not available or data is corrupted
  }
  return null;
};

const setStoredLeaderboard = (data: OverallLeaderboardEntry[]) => {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(LEADERBOARD_STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    // Silently fail if localStorage is not available
  }
};

export const invalidateLeaderboardCache = () => {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(LEADERBOARD_STORAGE_KEY);
  } catch (error) {
    // Silently fail
  }
};

interface LeaderboardProps {
  courseId?: number; // Kept for backward compatibility but not used
}

export const Leaderboard = ({ courseId }: LeaderboardProps) => {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [leaderboard, setLeaderboard] = useState<OverallLeaderboardEntry[]>([]);
  const hasLoadedRef = useRef(false);

  const loadLeaderboard = useCallback(async () => {
    try {
      setLoading(true);
      
      // Get overall leaderboard (default limit is handled by API)
      const data = await dashboardService.getOverallLeaderboard();

      // Ensure data is an array - multiple checks
      if (!data) {
        setLeaderboard([]);
        setStoredLeaderboard([]);
        return;
      }

      if (!Array.isArray(data)) {
        setLeaderboard([]);
        setStoredLeaderboard([]);
        return;
      }

      // Update state and localStorage with fresh data
      setLeaderboard(data);
      setStoredLeaderboard(data);
    } catch (error: any) {
      // On error, try to load from localStorage if available
      const storedData = getStoredLeaderboard();
      if (storedData) {
        setLeaderboard(storedData);
      } else {
        setLeaderboard([]);
      }
      // Don't show toast for optional data
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (hasLoadedRef.current) return;
    hasLoadedRef.current = true;

    // Load from localStorage first to show cached data immediately
    const storedData = getStoredLeaderboard();
    if (storedData && storedData.length > 0) {
      setLeaderboard(storedData);
    }

    // Always fetch fresh data from API
    loadLeaderboard();
  }, [loadLeaderboard]);

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
      </Box>
      
      {/* Loading Progress Bar and Message */}
      {loading && (
        <Box sx={{ mb: 2 }}>
          <LinearProgress
            sx={{
              height: 2,
              borderRadius: 1,
              mb: 1,
              "& .MuiLinearProgress-bar": {
                borderRadius: 1,
              },
            }}
          />
          <Typography
            variant="caption"
            sx={{
              color: "#6366F1",
              fontSize: "0.75rem",
              fontWeight: 500,
              display: "flex",
              alignItems: "center",
              gap: 0.5,
            }}
          >
            <Box
              sx={{
                display: "inline-flex",
                animation: "spin 1s linear infinite",
                "@keyframes spin": {
                  "0%": { transform: "rotate(0deg)" },
                  "100%": { transform: "rotate(360deg)" },
                },
              }}
            >
              <IconWrapper
                icon="mdi:refresh"
                size={14}
                color="#6366F1"
              />
            </Box>
            Fetching latest leaderboard...
          </Typography>
        </Box>
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
