"use client";

import { useEffect, useState, useMemo, useRef, useCallback } from "react";
import { useTranslation } from "react-i18next";
import {
  Box,
  Typography,
  Card,
  Avatar,
  LinearProgress,
  Divider,
} from "@mui/material";
import {
  dashboardService,
  OverallLeaderboardEntry,
} from "@/lib/services/dashboard.service";
import { IconWrapper } from "@/components/common/IconWrapper";
import { useAuth } from "@/lib/auth/auth-context";

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

export const Leaderboard = ({ courseId: _courseId }: LeaderboardProps) => {
  const { t } = useTranslation("common");
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [leaderboard, setLeaderboard] = useState<OverallLeaderboardEntry[]>([]);
  const [myRankEntry, setMyRankEntry] = useState<OverallLeaderboardEntry | null>(null);
  const hasLoadedRef = useRef(false);

  const findUserEntry = useCallback(
    (data: OverallLeaderboardEntry[]) => {
      if (!user || !data?.length) return undefined;

      const fullName = `${user.first_name} ${user.last_name}`
        .trim()
        .toLowerCase();
      const userName = (user.user_name || "").toLowerCase();
      const userEmail = (user.email || "").toLowerCase();
      const firstName = (user.first_name || "").toLowerCase();
      const lastName = (user.last_name || "").toLowerCase();

      return data.find((entry) => {
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
    },
    [user]
  );

  const loadLeaderboard = useCallback(async () => {
    try {
      setLoading(true);

      const data = await dashboardService.getOverallLeaderboard();

      if (!data || !Array.isArray(data)) {
        setLeaderboard([]);
        setStoredLeaderboard([]);
        return;
      }

      setLeaderboard(data);
      setStoredLeaderboard(data);

      const foundInTop = findUserEntry(data);
      if (foundInTop) {
        setMyRankEntry(foundInTop);
      } else {
        try {
          const fullData = await dashboardService.getOverallLeaderboard(10000);
          if (fullData && Array.isArray(fullData)) {
            const foundInFull = findUserEntry(fullData);
            setMyRankEntry(foundInFull ?? null);
          }
        } catch {
          // Silently fail — user rank is optional
        }
      }
    } catch {
      const storedData = getStoredLeaderboard();
      if (storedData) {
        setLeaderboard(storedData);
        const foundInStored = findUserEntry(storedData);
        if (foundInStored) setMyRankEntry(foundInStored);
      } else {
        setLeaderboard([]);
      }
    } finally {
      setLoading(false);
    }
  }, [findUserEntry]);

  useEffect(() => {
    if (hasLoadedRef.current) return;
    hasLoadedRef.current = true;

    const storedData = getStoredLeaderboard();
    if (storedData && storedData.length > 0) {
      setLeaderboard(storedData);
    }

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

  // Derive current user entry every render (like course leaderboard) so when user loads
  // after auth, or when we have cached data, "Your rank" still shows. Use myRankEntry
  // when user is not in the top list but was found in the extended (10000) fetch.
  const currentUserEntry =
    findUserEntry(safeLeaderboard) ?? myRankEntry ?? undefined;

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
            {t("dashboard.leaderboard")}
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
              justifyContent: "center",
              alignItems: "center",
              minHeight: 200,
              p: 2,
            }}
          >
            <LinearProgress sx={{ width: "80%", height: 2, borderRadius: 1 }} />
          </Box>
        ) : safeLeaderboard.length === 0 ? (
          <Typography
            variant="body2"
            sx={{ color: "#6B7280", textAlign: "center", py: 2, p: 2 }}
          >
            {t("dashboard.noLeaderboardData")}
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
                <Box
                  key={rank || index}
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
                      {t("dashboard.score")}: {totalScore}
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
              );
            })}
          </Box>
        )}
      </Card>

      {/* Current User Rank - Pinned at Bottom */}
      {currentUserEntry && safeLeaderboard.length > 0 && (
        <Box sx={{ mt: 1.5 }}>
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
                minWidth: 28,
                height: 28,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: "50%",
                background:
                  "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
                color: "#ffffff",
                fontWeight: 700,
                fontSize: "0.75rem",
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
              alt={currentUserEntry.name || "You"}
              sx={{
                width: 32,
                height: 32,
                flexShrink: 0,
                border: "2px solid rgba(99, 102, 241, 0.3)",
                boxShadow: "0 2px 8px rgba(99, 102, 241, 0.15)",
              }}
            >
              {(currentUserEntry.name || "U")[0]}
            </Avatar>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography
                variant="body2"
                sx={{
                  fontWeight: 700,
                  color: "#1a1f2e",
                  fontSize: "0.8125rem",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                  lineHeight: 1.3,
                }}
              >
                {currentUserEntry.name || "You"}
              </Typography>
              <Typography
                variant="caption"
                sx={{
                  color: "#6366f1",
                  fontSize: "0.6875rem",
                  fontWeight: 500,
                  lineHeight: 1.2,
                }}
              >
                {t("dashboard.score")}: {currentUserEntry.marks ?? 0}
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
    </Box>
  );
};
