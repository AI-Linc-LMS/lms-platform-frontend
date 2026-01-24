"use client";

import { useEffect, useState, useRef } from "react";
import { Box, Typography, Card, Avatar, Skeleton, Tooltip } from "@mui/material";
import { dashboardService } from "@/lib/services/dashboard.service";
import { IconWrapper } from "@/components/common/IconWrapper";

interface StreakHolder {
  studentName: string;
  Present_streak: number;
  Active_days: number;
  profile_pic_url?: string;
  college?: string; // College/University name
  linkedin_url?: string; // LinkedIn profile URL
}

// Shared cache to minimize API calls
interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Module-level cache shared across all component instances
let streakHoldersCache: CacheEntry<StreakHolder[]> | null = null;

export const invalidateStreakHoldersCache = () => {
  streakHoldersCache = null;
};

// Helper function to get initials from name string
const getInitialsFromName = (name: string): string => {
  if (!name) return "U";
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
  }
  return name[0]?.toUpperCase() || "U";
};

export const StreakHolders = () => {
  const [loading, setLoading] = useState(false);
  const [streakHolders, setStreakHolders] = useState<StreakHolder[]>([]);
  const hasLoadedRef = useRef(false);

  useEffect(() => {
    if (hasLoadedRef.current) return;
    hasLoadedRef.current = true;

    // Check cache first
    const now = Date.now();
    const cachedData = streakHoldersCache?.data;
    const cacheTime = streakHoldersCache?.timestamp || 0;

    if (cachedData && now - cacheTime < CACHE_DURATION) {
      // Use cached data
      setStreakHolders(cachedData);
      setLoading(false);
    } else {
      // Load fresh data
      loadStreakHolders();
    }
  }, []);

  const loadStreakHolders = async () => {
    try {
      setLoading(true);
      // Get current month dates
      const today = new Date();
      const endDate = today.toISOString().split("T")[0]; // YYYY-MM-DD
      const startDate = new Date(today.getFullYear(), today.getMonth(), 1);
      const startDateStr = startDate.toISOString().split("T")[0];

      const data = await dashboardService.getStudentActivityAnalytics({
        start_date: startDateStr,
        end_date: endDate,
      });

      // Sort by Present_streak descending and take top 5
      const sorted = [...data]
        .sort((a, b) => b.Present_streak - a.Present_streak)
        .filter((item) => item.Present_streak > 0)
        .slice(0, 5);

      // Update cache with fresh data
      streakHoldersCache = {
        data: sorted,
        timestamp: Date.now(),
      };

      setStreakHolders(sorted);
    } catch (error: any) {
      setStreakHolders([]);
    } finally {
      setLoading(false);
    }
  };

  const getRankIcon = (index: number) => {
    if (index === 0) return "🥇";
    if (index === 1) return "🥈";
    if (index === 2) return "🥉";
    return `${index + 1}`;
  };

  const getRankColor = (index: number) => {
    if (index === 0) return "#FFD700"; // Gold
    if (index === 1) return "#C0C0C0"; // Silver
    if (index === 2) return "#CD7F32"; // Bronze
    return "#F59E0B"; // Orange for others
  };

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
        Top Streak Holders
      </Typography>
      <Card
        sx={{
          borderRadius: 2,
          boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
          border: "1px solid #e5e7eb",
          backgroundColor: "#ffffff",
          display: "flex",
          flexDirection: "column",
          maxHeight: 320,
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
                    bgcolor: "#FEF3C7",
                  }}
                />
                <Skeleton
                  variant="circular"
                  width={32}
                  height={32}
                  animation="wave"
                  sx={{
                    bgcolor: "#FEF3C7",
                  }}
                />
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Skeleton
                    variant="text"
                    width="60%"
                    height={16}
                    animation="wave"
                    sx={{
                      bgcolor: "#FEF3C7",
                    }}
                  />
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 0.5,
                      mt: 0.5,
                    }}
                  >
                    <Skeleton
                      variant="circular"
                      width={14}
                      height={14}
                      animation="wave"
                      sx={{
                        bgcolor: "#FEF3C7",
                      }}
                    />
                    <Skeleton
                      variant="text"
                      width="40%"
                      height={12}
                      animation="wave"
                      sx={{
                        bgcolor: "#FEF3C7",
                      }}
                    />
                  </Box>
                </Box>
              </Box>
            ))}
          </Box>
        ) : streakHolders.length === 0 ? (
          <Typography
            variant="body2"
            sx={{ color: "#6B7280", textAlign: "center", py: 2, p: 2 }}
          >
            No streak data available
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
            {streakHolders.map((holder, index) => {
              const userName = holder?.studentName || "User";
              const streak = holder?.Present_streak ?? 0;
              const profilePicUrl = holder?.profile_pic_url;
              const college = holder?.college;
              const linkedinUrl = holder?.linkedin_url;

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
                  key={`${userName}-${index}`}
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
                        index < 3 ? "#F9FAFB" : "transparent",
                      border:
                        index < 3 ? "1px solid #E5E7EB" : "none",
                      flexShrink: 0,
                      cursor: linkedinUrl ? "pointer" : "default",
                      transition: "all 0.2s ease",
                      "&:hover": {
                        backgroundColor: linkedinUrl ? "rgba(245, 158, 11, 0.08)" : undefined,
                        transform: linkedinUrl ? "translateX(2px)" : undefined,
                        boxShadow: linkedinUrl ? "0 2px 4px rgba(0,0,0,0.1)" : undefined,
                      },
                      "&:focus": linkedinUrl
                        ? {
                            outline: "2px solid #f59e0b",
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
                      backgroundColor: getRankColor(index),
                      color: index < 3 ? "#ffffff" : "#ffffff",
                      fontWeight: 700,
                      fontSize: "0.75rem",
                      flexShrink: 0,
                    }}
                  >
                    {getRankIcon(index)}
                  </Box>
                  <Avatar
                    src={profilePicUrl || undefined}
                    alt={userName}
                    sx={{ width: 32, height: 32, flexShrink: 0 }}
                  >
                    {getInitialsFromName(userName)}
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
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 0.5,
                        mt: 0.25,
                      }}
                    >
                      <IconWrapper
                        icon="mdi:fire"
                        size={14}
                        style={{ color: "#F59E0B" }}
                      />
                      <Typography
                        variant="caption"
                        sx={{
                          color: "#6B7280",
                          fontSize: "0.6875rem",
                          lineHeight: 1.2,
                        }}
                      >
                        {streak} day{streak !== 1 ? "s" : ""}
                      </Typography>
                    </Box>
                  </Box>
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
