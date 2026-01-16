"use client";

import {
  AppBar as MuiAppBar,
  Toolbar,
  Box,
  Avatar,
  Menu,
  MenuItem,
  IconButton,
  Typography,
  Divider,
  Badge,
  Popover,
} from "@mui/material";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/auth-context";
import { LogOut, User, Menu as MenuIcon, Bell } from "lucide-react";
import { useState, useEffect } from "react";
import { DRAWER_WIDTH } from "./Sidebar";
import {
  getUserDisplayName,
  getUserInitials,
  getUserProfilePicture,
} from "@/lib/utils/user-utils";
import { useClientInfo } from "@/lib/contexts/ClientInfoContext";
import { useAdminMode } from "@/lib/contexts/AdminModeContext";
import Image from "next/image";
import { motion } from "framer-motion";
import { useLeaderboardAndStreak } from "@/lib/hooks/useLeaderboardAndStreak";
import { IconWrapper } from "@/components/common/IconWrapper";
import { Settings } from "lucide-react";

interface AppBarProps {
  onMenuClick?: () => void;
  DrawerWidth: number;
}

export const AppBar: React.FC<AppBarProps> = ({ onMenuClick, DrawerWidth }) => {
  const router = useRouter();
  const { user, logout, isAuthenticated } = useAuth();
  const { clientInfo } = useClientInfo();
  const { isAdminMode, toggleAdminMode } = useAdminMode();

  // Check if user can access admin mode
  const isAdminOrInstructor =
    user?.role === "admin" || user?.role === "instructor";
  const isSuperAdmin = user?.role === "superadmin";
  const canAccessAdmin = isAdminOrInstructor || isSuperAdmin;
  const {
    leaderboard,
    streak,
    isLeaderboardLoading,
    isStreakLoading,
    leaderboardError,
    refreshStreak,
  } = useLeaderboardAndStreak();

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [leaderboardAnchorEl, setLeaderboardAnchorEl] =
    useState<null | HTMLElement>(null);
  const [streakAnchorEl, setStreakAnchorEl] = useState<null | HTMLElement>(
    null
  );

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = async () => {
    await logout();
    router.push("/login");
    handleMenuClose();
  };

  const handleLeaderboardHover = (event: React.MouseEvent<HTMLElement>) => {
    setLeaderboardAnchorEl(event.currentTarget);
  };

  const handleLeaderboardLeave = () => {
    setLeaderboardAnchorEl(null);
  };

  const handleStreakHover = (event: React.MouseEvent<HTMLElement>) => {
    setStreakAnchorEl(event.currentTarget);
  };

  const handleStreakLeave = () => {
    setStreakAnchorEl(null);
  };

  useEffect(() => {
    const handleSubmoduleComplete = () => {
      if (refreshStreak) {
        refreshStreak();
      }
    };

    if (typeof window !== "undefined") {
      window.addEventListener("submodule-complete", handleSubmoduleComplete);
      return () => {
        window.removeEventListener(
          "submodule-complete",
          handleSubmoduleComplete
        );
      };
    }
  }, [refreshStreak]);

  // Convert score (in minutes) to hours and minutes
  const formatScore = (score: number) => {
    const hours = Math.floor(score / 60);
    const minutes = score % 60;
    return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
  };

  // Format progress from new API format
  const formatProgress = (entry: any) => {
    // New format: { progress: { hours, minutes }, seconds }
    if (entry?.progress) {
      const { hours, minutes } = entry.progress;
      if (hours > 0) {
        return `${hours}h ${minutes}m`;
      }
      return `${minutes}m`;
    }
    // Old format: score in minutes
    if (entry?.score !== undefined) {
      return formatScore(entry.score);
    }
    return "0m";
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <MuiAppBar
      position="fixed"
      sx={{
        zIndex: (theme) => theme.zIndex.drawer + 1,
        backgroundColor: "#ffffff",
        color: "#111827",
        boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
        borderBottom: "1px solid #e5e7eb",
        width: {
          xs: "100%",
          md: `calc(100% - ${
            DrawerWidth === 0 ? DrawerWidth : DRAWER_WIDTH
          }px)`,
        },
        left: {
          xs: 0,
          md: `${DrawerWidth === 0 ? DrawerWidth : DRAWER_WIDTH}px`,
        },
      }}
    >
      <Toolbar
        sx={{
          minHeight: { xs: 56, sm: 64 },
          px: { xs: 1.5, sm: 2.5 },
        }}
      >
        {/* LEFT SIDE - Client Logo (Mobile) and Leaderboard */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 2,
            flex: 1,
          }}
        >
          {/* Admin Mode Indicator */}

          {clientInfo?.app_icon_url && (
            <Box
              onClick={() =>
                router.push(isAdminMode ? "/admin/dashboard" : "/dashboard")
              }
              sx={{
                display: { xs: "flex", md: "none" },
                position: "relative",
                width: 40,
                height: 40,
                borderRadius: 1,
                overflow: "hidden",
                backgroundColor: "#ffffff",
                border: "1px solid #e5e7eb",
                cursor: "pointer",
                transition: "all 0.2s ease",
                "&:hover": {
                  borderColor: "#6366f1",
                  transform: "scale(1.05)",
                },
              }}
            >
              <Image
                src={clientInfo.app_icon_url}
                alt={clientInfo.name || "Client"}
                fill
                style={{ objectFit: "contain" }}
                sizes="40px"
              />
            </Box>
          )}
        </Box>

        {/* RIGHT SIDE ACTIONS */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: { xs: 0.5, sm: 1.5 },
            ml: { xs: "auto", md: "auto" },
          }}
        >
          {canAccessAdmin && isAdminMode && (
            <>
              {/* Desktop: Icon + Text */}
              <Box
                sx={{
                  display: { xs: "none", sm: "flex" },
                  alignItems: "center",
                  gap: 0.75,
                  px: 1.5,
                  py: 0.5,
                  borderRadius: 2,
                  backgroundColor: "#fef3c7",
                  border: "1px solid #fde68a",
                }}
              >
                <IconWrapper
                  icon="mdi:shield-crown"
                  size={16}
                  color="#92400e"
                />
                <Typography
                  variant="body2"
                  sx={{
                    fontSize: "0.75rem",
                    fontWeight: 600,
                    color: "#92400e",
                  }}
                >
                  Admin Mode
                </Typography>
              </Box>
              {/* Mobile: Icon Only */}
              <Box
                sx={{
                  display: { xs: "flex", sm: "none" },
                  alignItems: "center",
                  justifyContent: "center",
                  width: 36,
                  height: 36,
                  borderRadius: 2,
                  backgroundColor: "#fef3c7",
                  border: "1px solid #fde68a",
                }}
              >
                <IconWrapper
                  icon="mdi:shield-crown"
                  size={18}
                  color="#92400e"
                />
              </Box>
            </>
          )}
          {/* Daily Progress Leaderboard */}
          <Box
            sx={{
              display: { xs: "none", sm: "block" },
            }}
          >
            {/* Today's Leaders Button */}
            <Box
              onMouseEnter={handleLeaderboardHover}
              onMouseLeave={handleLeaderboardLeave}
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1,
                cursor: "pointer",
                px: 2,
                py: 1,
                borderRadius: 2,
                backgroundColor: "#fef3c7",
                border: "1px solid #fde68a",
                transition: "all 0.2s ease",
                boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                "&:hover": {
                  backgroundColor: "#fde68a",
                  boxShadow: "0 2px 6px rgba(0,0,0,0.15)",
                  transform: "translateY(-1px)",
                },
              }}
            >
              <IconWrapper icon="mdi:clock-outline" size={16} color="#92400e" />
              <Typography
                variant="body2"
                sx={{
                  fontSize: "0.875rem",
                  fontWeight: 600,
                  color: "#92400e",
                }}
              >
                <motion.span
                  animate={{
                    rotate: [0, 12, -12, 12, 0],
                    scale: [1, 1.2, 1.15, 1.2, 1],
                  }}
                  transition={{
                    duration: 0.8,
                    repeat: Infinity,
                    repeatDelay: 2.5,
                  }}
                >
                  Today's Leaders
                </motion.span>
              </Typography>
            </Box>
          </Box>
          <Box
            sx={{
              display: { xs: "block", sm: "none" },
            }}
          >
            {/* Today's Leaders Button */}
            <Box
              onMouseEnter={handleLeaderboardHover}
              onMouseLeave={handleLeaderboardLeave}
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1,
                cursor: "pointer",
                px: 2,
                py: 1,
                borderRadius: 2,
                backgroundColor: "#fef3c7",
                border: "1px solid #fde68a",
                transition: "all 0.2s ease",
                boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                "&:hover": {
                  backgroundColor: "#fde68a",
                  boxShadow: "0 2px 6px rgba(0,0,0,0.15)",
                  transform: "translateY(-1px)",
                },
              }}
            >
              <IconWrapper icon="mdi:clock-outline" size={16} color="#92400e" />
              <Typography
                variant="body2"
                sx={{
                  fontSize: "0.875rem",
                  fontWeight: 600,
                  color: "#92400e",
                }}
              >
                TL
              </Typography>
            </Box>
          </Box>
          {/* Leaderboard Popover */}
          <Popover
            open={Boolean(leaderboardAnchorEl)}
            anchorEl={leaderboardAnchorEl}
            onClose={handleLeaderboardLeave}
            anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
            transformOrigin={{ vertical: "top", horizontal: "left" }}
            disableRestoreFocus
            sx={{
              pointerEvents: "none",
            }}
            PaperProps={{
              sx: {
                mt: 1,
                minWidth: 280,
                borderRadius: 2,
                border: "1px solid #e5e7eb",
                boxShadow: "0 8px 24px rgba(0,0,0,0.15)",
                pointerEvents: "auto",
              },
            }}
            onMouseEnter={() => {
              // Keep popover open when hovering over it
            }}
            onMouseLeave={handleLeaderboardLeave}
          >
            <Box sx={{ p: 2 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1.5 }}>
                Today's Progress Leaders
              </Typography>
              {isLeaderboardLoading ? (
                <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                  {[...Array(3)].map((_, index) => (
                    <Box
                      key={index}
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                      }}
                    >
                      <Box
                        sx={{ display: "flex", alignItems: "center", gap: 1 }}
                      >
                        <Box
                          sx={{
                            width: 24,
                            height: 24,
                            borderRadius: "50%",
                            backgroundColor: "#e5e7eb",
                            animation: "pulse 1.5s ease-in-out infinite",
                            "@keyframes pulse": {
                              "0%, 100%": { opacity: 1 },
                              "50%": { opacity: 0.5 },
                            },
                          }}
                        />
                        <Box
                          sx={{
                            width: 80,
                            height: 12,
                            backgroundColor: "#e5e7eb",
                            borderRadius: 1,
                            animation: "pulse 1.5s ease-in-out infinite",
                          }}
                        />
                      </Box>
                      <Box
                        sx={{
                          width: 40,
                          height: 12,
                          backgroundColor: "#e5e7eb",
                          borderRadius: 1,
                          animation: "pulse 1.5s ease-in-out infinite",
                        }}
                      />
                    </Box>
                  ))}
                </Box>
              ) : leaderboard.length > 0 ? (
                <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                  {leaderboard.slice(0, 3).map((entry, index) => {
                    // Get name from new format or old format
                    const userName = entry?.name ?? entry?.user?.user_name ?? "Unknown";
                    const timeDisplay = formatProgress(entry);
                    const profilePicUrl = entry?.profile_pic_url ?? entry?.user?.profile_pic_url;
                    
                    // Create a unique key combining user id, name, and index
                    const uniqueKey = entry?.user?.id 
                      ? `leaderboard-${entry.user.id}-${index}` 
                      : `leaderboard-${userName}-${index}`;
                    
                    return (
                      <Box
                        key={uniqueKey}
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                        }}
                      >
                        <Box
                          sx={{ display: "flex", alignItems: "center", gap: 1 }}
                        >
                          <Typography
                            variant="caption"
                            sx={{
                              fontSize: "0.7rem",
                              fontWeight: "bold",
                              px: 1,
                              py: 0.5,
                              borderRadius: "50%",
                              backgroundColor:
                                index === 0
                                  ? "#fef3c7"
                                  : index === 1
                                  ? "#f3f4f6"
                                  : "#fed7aa",
                              color:
                                index === 0
                                  ? "#92400e"
                                  : index === 1
                                  ? "#374151"
                                  : "#9a3412",
                              minWidth: 24,
                              textAlign: "center",
                            }}
                          >
                            #{index + 1}
                          </Typography>
                          {profilePicUrl && (
                            <Avatar
                              src={profilePicUrl}
                              alt={userName}
                              sx={{ width: 24, height: 24 }}
                            >
                              {userName[0]}
                            </Avatar>
                          )}
                          <Typography
                            variant="body2"
                            sx={{
                              fontSize: "0.875rem",
                              color: "#374151",
                              maxWidth: 150,
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {userName}
                          </Typography>
                        </Box>
                        <Typography
                          variant="caption"
                          sx={{
                            fontSize: "0.75rem",
                            fontWeight: 500,
                            color: "#17627A",
                          }}
                        >
                          {timeDisplay}
                        </Typography>
                      </Box>
                    );
                  })}
                </Box>
              ) : leaderboardError ? (
                <Typography
                  variant="body2"
                  sx={{
                    color: "#ef4444",
                    textAlign: "center",
                    py: 2,
                    fontSize: "0.875rem",
                  }}
                >
                  Error loading data
                </Typography>
              ) : (
                <Typography
                  variant="body2"
                  sx={{
                    color: "#9ca3af",
                    textAlign: "center",
                    py: 2,
                    fontSize: "0.875rem",
                  }}
                >
                  No data available
                </Typography>
              )}
            </Box>
          </Popover>
          {/* Monthly Streak Badge */}
          <Box
            onMouseEnter={handleStreakHover}
            onMouseLeave={handleStreakLeave}
            sx={{
              position: "relative",
              display: { xs: "block", sm: "block" },
            }}
          >
            <motion.div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 4,
                padding: "6px 12px",
                fontSize: "12px",
                background:
                  "linear-gradient(135deg, #fef3c7 0%, #fed7aa 50%, #fecaca 100%)",
                borderRadius: "9999px",
                border: "1px solid #fdba74",
                cursor: "pointer",
                position: "relative",
                overflow: "hidden",
              }}
              initial={{ scale: 1 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              animate={{
                boxShadow: [
                  "0 2px 8px rgba(251, 146, 60, 0.25)",
                  "0 4px 12px rgba(251, 146, 60, 0.4)",
                  "0 2px 8px rgba(251, 146, 60, 0.25)",
                ],
              }}
              transition={{
                boxShadow: {
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut",
                },
                scale: { duration: 0.2 },
              }}
            >
              {/* Animated gradient overlay */}
              <motion.div
                style={{
                  position: "absolute",
                  inset: 0,
                  background:
                    "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.4) 50%, transparent 100%)",
                }}
                animate={{
                  x: ["-100%", "200%"],
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  repeatDelay: 4,
                  ease: "easeInOut",
                }}
              />

              {/* Pulsing background */}
              <motion.div
                style={{
                  position: "absolute",
                  inset: 0,
                  background:
                    "linear-gradient(90deg, #fdba74 0%, #f87171 100%)",
                  borderRadius: "9999px",
                  opacity: 0.2,
                }}
                animate={{
                  scale: [1, 1.15, 1],
                  opacity: [0.2, 0.35, 0.2],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              />

              {/* Streak number */}
              <motion.span
                style={{
                  color: "#17627A",
                  fontWeight: "bold",
                  position: "relative",
                  zIndex: 10,
                }}
                animate={{
                  scale: [1, 1.1, 1],
                }}
                transition={{
                  duration: 0.6,
                  repeat: Infinity,
                  repeatDelay: 3,
                }}
              >
                {isStreakLoading ? "..." : streak?.current_streak || 0}
              </motion.span>

              {/* Fire emoji */}
              <motion.span
                style={{
                  position: "relative",
                  zIndex: 10,
                  fontSize: "14px",
                }}
                animate={{
                  rotate: [0, 12, -12, 12, 0],
                  scale: [1, 1.2, 1.15, 1.2, 1],
                }}
                transition={{
                  duration: 0.8,
                  repeat: Infinity,
                  repeatDelay: 2.5,
                }}
              >
                🔥
              </motion.span>
            </motion.div>
            <Popover
              open={Boolean(streakAnchorEl)}
              anchorEl={streakAnchorEl}
              onClose={handleStreakLeave}
              anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
              transformOrigin={{ vertical: "top", horizontal: "left" }}
              PaperProps={{
                sx: {
                  mt: 1,
                  minWidth: 20,
                  left: -200,
                  borderRadius: 2,
                  border: "1px solid #e5e7eb",
                  boxShadow: "0 8px 24px rgba(0,0,0,0.15)",
                },
              }}
            >
              <Box sx={{ p: 2 }}>
                <Typography
                  variant="subtitle2"
                  sx={{ fontWeight: 600, mb: 1.5 }}
                >
                  Current Streak{" "}
                  <motion.span
                    style={{
                      position: "relative",
                      zIndex: 10,
                      fontSize: "14px",
                    }}
                    animate={{
                      rotate: [0, 12, -12, 12, 0],
                      scale: [1, 1.2, 1.15, 1.2, 1],
                    }}
                    transition={{
                      duration: 0.8,
                      repeat: Infinity,
                      repeatDelay: 2.5,
                    }}
                  >
                    🔥
                  </motion.span>
                </Typography>
                <Typography
                  variant="body2"
                  sx={{ fontWeight: 200, mb: 1.5, fontSize: "1rem" }}
                >
                  Keep it Going!
                </Typography>
              </Box>
            </Popover>
          </Box>

          {/* Notifications */}
          <IconButton
            sx={{
              color: "#6b7280",
              width: 40,
              height: 40,
              "&:hover": {
                backgroundColor: "#f3f4f6",
              },
            }}
          >
            <Badge badgeContent={0} color="error">
              <Bell size={18} />
            </Badge>
          </IconButton>

          {/* User Info - Desktop */}
          <Box
            sx={{
              display: { xs: "none", md: "flex" },
              alignItems: "center",
              gap: 1.5,
            }}
          >
            <Avatar
              onClick={handleMenuOpen}
              src={getUserProfilePicture(user)}
              sx={{
                width: 40,
                height: 40,
                cursor: "pointer",
                border: "2px solid #e5e7eb",
                "&:hover": {
                  borderColor: "#6366f1",
                },
              }}
            >
              {getUserInitials(user)}
            </Avatar>
          </Box>

          {/* User Avatar - Mobile */}
          <Avatar
            onClick={handleMenuOpen}
            src={getUserProfilePicture(user)}
            sx={{
              display: { xs: "flex", md: "none" },
              width: 36,
              height: 36,
              cursor: "pointer",
              border: "2px solid #e5e7eb",
            }}
          >
            {getUserInitials(user)}
          </Avatar>

          {/* User Menu */}
          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleMenuClose}
            anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
            transformOrigin={{ vertical: "top", horizontal: "right" }}
            PaperProps={{
              sx: {
                mt: 1.5,
                minWidth: 220,
                borderRadius: 2,
                border: "1px solid #e5e7eb",
                boxShadow: "0 8px 24px rgba(0,0,0,0.15)",
              },
            }}
          >
            <Box sx={{ px: 2, py: 1.5 }}>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                {getUserDisplayName(user)}
              </Typography>
              <Typography variant="caption" sx={{ color: "#6b7280" }}>
                {user?.email || ""}
              </Typography>
            </Box>

            <Divider />

            {canAccessAdmin && (
              <MenuItem
                onClick={() => {
                  const newAdminMode = !isAdminMode;
                  toggleAdminMode();
                  handleMenuClose();
                  // Navigate based on admin mode
                  if (newAdminMode) {
                    router.push("/admin/dashboard");
                  } else {
                    router.push("/dashboard");
                  }
                }}
                sx={{
                  backgroundColor: isAdminMode
                    ? "rgba(99, 102, 241, 0.1)"
                    : "transparent",
                }}
              >
                <Settings size={18} style={{ marginRight: 12 }} />
                {isAdminMode ? "Exit Admin Mode" : "Switch to Admin"}
              </MenuItem>
            )}

            {canAccessAdmin && <Divider />}

            <MenuItem
              onClick={() => {
                router.push("/profile");
                handleMenuClose();
              }}
            >
              <User size={18} style={{ marginRight: 12 }} />
              Profile Settings
            </MenuItem>

            <Divider />

            <MenuItem onClick={handleLogout} sx={{ color: "error.main" }}>
              <LogOut size={18} style={{ marginRight: 12 }} />
              Logout
            </MenuItem>
          </Menu>
        </Box>
      </Toolbar>
    </MuiAppBar>
  );
};
