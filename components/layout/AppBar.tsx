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
  Popover,
  Tooltip,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/auth-context";
import {
  isAdminOnlyRole,
  canPurchase,
  isClientOrgAdminRole,
  isInstructorRole,
} from "@/lib/auth/role-utils";
import { LogOut, User, Menu as MenuIcon, Ticket,
  ReceiptText,
} from "lucide-react";
import React, { useState, useEffect, useRef } from "react";
import { DRAWER_WIDTH } from "./Sidebar";
import {
  getUserDisplayName,
  getUserInitials,
  getUserProfilePicture,
} from "@/lib/utils/user-utils";
import { useClientInfo, useHideLeaderboardView } from "@/lib/contexts/ClientInfoContext";
import { useAdminMode } from "@/lib/contexts/AdminModeContext";
import { AnimatePresence, motion } from "framer-motion";
import { useLeaderboardAndStreak } from "@/lib/hooks/useLeaderboardAndStreak";
import { useStreakCelebration, primeNavStreak } from "@/lib/streak/streakCelebration";
import { IconWrapper } from "@/components/common/IconWrapper";
import { PageGuide } from "@/components/common/PageGuide";
import { PLATFORM_GUIDE } from "@/lib/guide/registry";
import { Settings, ShieldCheck } from "lucide-react";
import { LanguageSelect } from "@/components/common/LanguageSelect";
import { useTranslation } from "react-i18next";
import { isRtl } from "@/lib/i18n";
import { useToast } from "@/components/common/Toast";
import { config } from "@/lib/config";
import { useVisibilityRefresh } from "@/lib/hooks/useVisibilityRefresh";
import { MobileMenuButton } from "./MobileMenu";
import { PHONE } from "@/components/common/mobile/phone";
import { useLogoFallback } from "@/components/common/TenantLogo";
import {
  notificationService,
  type Notification,
} from "@/lib/services/notification.service";
import {
  NotificationPopover,
  NotificationBell,
} from "@/components/notifications/NotificationPopover";
import {
  getUnreadCountCached,
  peekUnreadCount,
  setUnreadCountCached,
} from "@/lib/notifications/unreadBadge";

interface AppBarProps {
  onMenuClick?: () => void;
  DrawerWidth: number;
}

export const AppBar: React.FC<AppBarProps> = ({ onMenuClick, DrawerWidth }) => {
  const router = useRouter();
  const { user, logout, isAuthenticated } = useAuth();
  const { clientInfo } = useClientInfo();
  const hideLeaderboardView = useHideLeaderboardView();
  const { isAdminMode, toggleAdminMode } = useAdminMode();
  const { showToast } = useToast();

  const role = user?.role;
  // Instructors and course managers triage their cohorts' tickets rather than raising their own.
  const isTeachingRole = ["instructor", "course_manager"].includes(
    String(role ?? "").trim().toLowerCase().replace(/\s+/g, "_")
  );
  // Instructors get a teacher top bar — none of the student gamification (leaderboard, streak, guide).
  const isInstructor = isInstructorRole(role);
  // Instructors no longer toggle into student/admin views — only org admins keep the toggle.
  const canToggleAdminMode = isClientOrgAdminRole(role);
  const effectiveAdminMode = isAdminOnlyRole(role) || isAdminMode;
  // Admin "Settings" (logo / favicon / login text) moved from the sidebar into
  // this menu; keep the same gate the sidebar item used (admin_branding feature).
  const canSeeAdminSettings =
    canToggleAdminMode &&
    Boolean(clientInfo?.features?.some((f) => f.name === "admin_branding"));
  const { i18n, t } = useTranslation("common");
  const rtl = isRtl(i18n.language || "en");
  const {
    leaderboard,
    streak,
    isLeaderboardLoading,
    isStreakLoading,
    leaderboardError,
    refreshStreak,
  } = useLeaderboardAndStreak();

  // Nav streak number is driven by the shared celebration store so it ticks +1 exactly
  // when the celebration animation lands. Seed it from the server value on load.
  const streakCel = useStreakCelebration();
  useEffect(() => {
    if (!isStreakLoading && streak) primeNavStreak(streak.current_streak ?? 0);
  }, [isStreakLoading, streak]);
  const navStreak = streakCel.primed ? streakCel.navCount : streak?.current_streak ?? 0;

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  // The bar's logo. From 600px up (below md) it is the square app icon in a 40px tile, as it
  // always was. A phone has 120px for it, so it prefers the wide app logo - the one emails and
  // certificates print on white, so it reads on this white bar (the login logo is made for the
  // dark auth panel, and its light parts vanish here). If no image loads, the tenant name
  // stands in as a wordmark: never the browser's broken-image glyph with raw alt text.
  //
  // The choice is a <picture> <source media>, not a JS media query: useMediaQuery is false during
  // hydration, so a phone fetched the icon and then the logo. The browser now fetches only one.
  // Each slot has its own order; a failure moves both past the url that failed.
  const tenantName = clientInfo?.name?.trim() || "";
  const barLogo = useLogoFallback([clientInfo?.app_logo_url, clientInfo?.app_icon_url]);
  const phoneLogoUrl = barLogo.pick([clientInfo?.app_logo_url, clientInfo?.app_icon_url]);
  const baseLogoUrl = barLogo.pick([clientInfo?.app_icon_url, clientInfo?.app_logo_url]);
  const logoFailed = !phoneLogoUrl && !baseLogoUrl;

  const [leaderboardAnchorEl, setLeaderboardAnchorEl] =
    useState<null | HTMLElement>(null);
  const [streakAnchorEl, setStreakAnchorEl] = useState<null | HTMLElement>(
    null
  );
  // Whether the streak chip is being driven by touch (see its handlers). The ref gates the
  // handlers within one gesture; the state decides whether the open card takes pointer events
  // (a touch-opened card must catch the tap outside that closes it; a hover-opened one must not,
  // or it steals the pointer from the chip and closes and re-opens on every move).
  const streakTouchRef = useRef(false);
  const [streakByTouch, setStreakByTouch] = useState(false);
  // Today's Leaders opened from the phone overflow menu (no hover to close it; it needs its
  // backdrop to catch the tap outside).
  const [leaderboardFromMenu, setLeaderboardFromMenu] = useState(false);
  // Phone only: the guide and Today's Leaders leave the bar for this overflow menu, so the
  // tenant logo has room to be read. The guide dialog itself is the same instance as desktop's.
  const [overflowAnchorEl, setOverflowAnchorEl] = useState<null | HTMLElement>(null);
  const [guideOpen, setGuideOpen] = useState(false);
  const [notificationAnchorEl, setNotificationAnchorEl] =
    useState<null | HTMLElement>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notificationsLoading, setNotificationsLoading] = useState(false);

  const clientId = clientInfo?.id ?? config.clientId;

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = async () => {
    handleMenuClose();
    // logout() puts the tick up itself, before its own network call, and returns once the mark
    // has finished drawing — so the redirect below cannot tear it down mid-stroke. Any future
    // caller of logout() gets the same confirmation without having to know about it.
    try {
      await logout();
    } finally {
      // Hard-replace rather than router.push so the current page (and any
      // in-flight queries/toasts attached to it) is destroyed instead of
      // re-rendering against a now-null user and triggering 401 toasts.
      if (typeof window !== "undefined") {
        window.location.replace("/login");
      }
    }
  };

  const handleLeaderboardHover = (event: React.MouseEvent<HTMLElement>) => {
    setLeaderboardFromMenu(false);
    setLeaderboardAnchorEl(event.currentTarget);
  };

  const handleLeaderboardLeave = () => {
    setLeaderboardAnchorEl(null);
  };

  const handleStreakHover = (event: React.MouseEvent<HTMLElement>) => {
    setStreakAnchorEl(event.currentTarget);
  };

  const fetchUnreadCount = React.useCallback(
    async (force = false) => {
      if (!isAuthenticated || !clientId) return;
      try {
        setUnreadCount(await getUnreadCountCached(clientId, force));
      } catch {
        // Silently ignore - user may not have notifications
      }
    },
    [isAuthenticated, clientId]
  );

  const fetchNotifications = React.useCallback(async () => {
    if (!isAuthenticated || !clientId) return;
    setNotificationsLoading(true);
    try {
      const data = await notificationService.getNotifications(clientId);
      setNotifications(data.results);
      // The user just opened the panel — bypass the cache so the badge is exact.
      fetchUnreadCount(true);
    } catch {
      setNotifications([]);
    } finally {
      setNotificationsLoading(false);
    }
  }, [isAuthenticated, clientId, fetchUnreadCount]);

  useEffect(() => {
    if (isAuthenticated && clientId) {
      // Mount: served from the module cache on a remount (i.e. on every navigation).
      fetchUnreadCount();
      // Poll: force a real request so the badge still updates live — but SKIP while the tab is
      // hidden. Browsers throttle background timers and then fire the backlog on return, so an
      // unguarded poll contributed a catch-up request burst exactly when the user was trying to
      // navigate. The visibility refresh below covers the "came back" case once, cheaply.
      const interval = setInterval(() => {
        if (document.visibilityState === "visible") fetchUnreadCount(true);
      }, 60000);
      return () => clearInterval(interval);
    }
  }, [isAuthenticated, clientId, fetchUnreadCount]);

  // One throttled refresh when the tab comes back, instead of the throttled-timer backlog.
  useVisibilityRefresh(() => fetchUnreadCount(true), {
    minIntervalMs: 60_000,
    enabled: Boolean(isAuthenticated && clientId),
  });

  const handleNotificationClick = (event: React.MouseEvent<HTMLElement>) => {
    setNotificationAnchorEl(event.currentTarget);
    fetchNotifications();
  };

  const handleNotificationClose = () => {
    setNotificationAnchorEl(null);
  };

  const handleNotificationItemClick = async (n: Notification) => {
    if (!clientId) return;
    try {
      if (!n.is_read) {
        await notificationService.markAsRead(clientId, n.id);
        setNotifications((prev) =>
          prev.map((x) => (x.id === n.id ? { ...x, is_read: true } : x))
        );
        // Into the shared cache too: the navigation below remounts this bar, which reads it.
        const next = Math.max(0, (peekUnreadCount(clientId) ?? unreadCount) - 1);
        setUnreadCountCached(clientId, next);
        setUnreadCount(next);
      }
      handleNotificationClose();
      if (n.action_url) {
        router.push(n.action_url);
      }
    } catch {
      if (n.action_url) {
        router.push(n.action_url);
      }
    }
  };

  const handleMarkAllRead = async () => {
    if (!clientId) return;
    try {
      await notificationService.markAllAsRead(clientId);
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      setUnreadCountCached(clientId, 0);
      setUnreadCount(0);
      showToast("All notifications marked as read", "success");
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : "Failed to mark all as read",
        "error"
      );
    }
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
        backgroundColor: "var(--surface)",
        color: "var(--font-primary)",
        boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
        borderBottom: "1px solid var(--border-default)",
        width: {
          xs: "100%",
          md: `calc(100% - ${
            DrawerWidth === 0 ? DrawerWidth : DRAWER_WIDTH
          }px)`,
        },
        ...(rtl
          ? {
              left: { xs: 0, md: 0 },
              right: { xs: "auto", md: "auto" },
            }
          : {
              left: {
                xs: 0,
                md: `${DrawerWidth === 0 ? DrawerWidth : DRAWER_WIDTH}px`,
              },
              right: { xs: "auto", md: "auto" },
            }),
      }}
    >
      <Toolbar
        sx={{
          minHeight: { xs: 56, sm: 64 },
          px: { xs: 1.5, sm: 2.5 },
          flexDirection: rtl ? "row-reverse" : "row",
          [PHONE]: { px: 1 },
        }}
      >
        {/* LEFT (LTR) / RIGHT (RTL) - Client Logo (Mobile) and Leaderboard */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 2,
            flex: 1,
            ...(rtl && { justifyContent: "flex-end" }),
            [PHONE]: { gap: 1, minWidth: 0 },
          }}
        >
          {/* Admin Mode Indicator */}
          {/* The phone menu: every module this tenant has, as a launcher. */}
          <MobileMenuButton />

          {(!logoFailed || tenantName) && (
            <Box
              onClick={() =>
                router.push(
                  effectiveAdminMode ? "/admin/dashboard" : "/dashboard"
                )
              }
              sx={{
                display: { xs: "flex", md: "none" },
                position: "relative",
                width: 40,
                height: 40,
                borderRadius: 1,
                overflow: "hidden",
                backgroundColor: "var(--card-bg)",
                border: "1px solid var(--border-default)",
                cursor: "pointer",
                transition: "all 0.2s ease",
                "&:hover": {
                  borderColor: "var(--accent-indigo)",
                  transform: "scale(1.05)",
                },
                // No usable image: the name as text, without the icon tile around it.
                ...(logoFailed && {
                  width: "auto",
                  maxWidth: 160,
                  minWidth: 0,
                  alignItems: "center",
                  border: "none",
                  backgroundColor: "transparent",
                  "&:hover": { transform: "none" },
                }),
                // A wordmark squeezed into a 40px square read as 6px type. On a phone the logo
                // gets the room the guide and leaders chips gave up: up to 120px wide, 32px tall.
                [PHONE]: {
                  flex: "0 1 120px",
                  width: "auto",
                  minWidth: logoFailed ? 0 : 88,
                  maxWidth: 120,
                  height: 32,
                  border: "none",
                  borderRadius: 0,
                  backgroundColor: "transparent",
                  "&:hover": { transform: "none" },
                  // A wordmark reads from the start edge, next to the menu button.
                  "& img": { objectPosition: rtl ? "right center" : "left center" },
                },
              }}
              data-testid="appbar-logo"
            >
              {logoFailed ? (
                <Typography
                  component="span"
                  data-testid="tenant-wordmark"
                  title={tenantName}
                  sx={{
                    display: "block",
                    minWidth: 0,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                    fontWeight: 800,
                    fontSize: "1rem",
                    lineHeight: 1.2,
                    color: "var(--font-primary)",
                  }}
                >
                  {tenantName}
                </Typography>
              ) : (
                /* Plain <img>, not next/image, as the sidebar and auth logos already are: tenant
                   assets are admin-supplied urls (often SVG, or a backend url that 302s to signed
                   S3) that the optimizer can reject, and the failure must reach onError here. */
                <picture>
                  {phoneLogoUrl && phoneLogoUrl !== baseLogoUrl && (
                    <source media="(max-width:599.95px)" srcSet={phoneLogoUrl} />
                  )}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={baseLogoUrl || phoneLogoUrl}
                    alt={tenantName || "Client"}
                    {...barLogo.imgProps}
                    style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "contain" }}
                  />
                </picture>
              )}
            </Box>
          )}
        </Box>

        {/* RIGHT (LTR) / LEFT (RTL) - actions; in RTL row-reverse so avatar is at extreme left */}
        <Box
          sx={{
            display: "flex",
            flexDirection: rtl ? "row-reverse" : "row",
            alignItems: "center",
            gap: { xs: 0.5, sm: 1.5 },
            ml: { xs: "auto", md: "auto" },
          }}
        >
          {effectiveAdminMode && (
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
                  {t("common.adminMode")}
                </Typography>
              </Box>
              {/* Mobile: Icon Only */}
              <Box
                sx={{
                  display: { xs: "flex", sm: "none" },
                  [PHONE]: { display: "none" },
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
          {/* Platform guide - "what can I do here" overview + platform tour; sits
              left of Today's Leaders and stays available regardless of the flag. */}
          {isAuthenticated && !isInstructor && (
            <PageGuide
              content={PLATFORM_GUIDE}
              variant="nav"
              label="Guide"
              tooltip="Take a platform guide"
              tourStartPath="/dashboard"
              open={guideOpen}
              onOpenChange={setGuideOpen}
              triggerSx={{ [PHONE]: { display: "none" } }}
            />
          )}
          {/* Phone: one overflow button for what left the bar (guide, Today's Leaders, the
              admin-mode marker). Hidden from 600px up, where each still sits on the bar. */}
          {(effectiveAdminMode || !isInstructor) && (
            <>
              <IconButton
                onClick={(e) => setOverflowAnchorEl(e.currentTarget)}
                aria-label={t("mobileChrome.more", "More") as string}
                aria-haspopup="menu"
                aria-expanded={Boolean(overflowAnchorEl)}
                data-testid="appbar-overflow"
                sx={{
                  display: "none",
                  [PHONE]: { display: "inline-flex" },
                  width: 44,
                  height: 44,
                  borderRadius: 2,
                  color: "var(--font-secondary)",
                }}
              >
                <IconWrapper icon="mdi:dots-vertical" size={22} />
              </IconButton>
              <Menu
                anchorEl={overflowAnchorEl}
                open={Boolean(overflowAnchorEl)}
                onClose={() => setOverflowAnchorEl(null)}
                anchorOrigin={{ vertical: "bottom", horizontal: rtl ? "left" : "right" }}
                transformOrigin={{ vertical: "top", horizontal: rtl ? "left" : "right" }}
                data-testid="appbar-overflow-menu"
                PaperProps={{
                  sx: {
                    mt: 1,
                    minWidth: 220,
                    borderRadius: 2,
                    border: "1px solid var(--border-default)",
                    boxShadow: "0 8px 24px rgba(0,0,0,0.15)",
                  },
                }}
              >
                {effectiveAdminMode && (
                  /* A disabled item, not a bare Box: MenuList skips it when moving focus, so the
                     first focus lands on a real action and the arrow keys cycle the actions. */
                  <MenuItem
                    disabled
                    data-testid="appbar-overflow-admin-mode"
                    sx={{ gap: 1, color: "#92400e", "&.Mui-disabled": { opacity: 1 } }}
                  >
                    <IconWrapper icon="mdi:shield-crown" size={18} color="#92400e" />
                    <Typography sx={{ fontSize: "0.85rem", fontWeight: 700, color: "#92400e" }}>
                      {t("common.adminMode")}
                    </Typography>
                  </MenuItem>
                )}
                {!isInstructor && (
                  <MenuItem
                    onClick={() => {
                      setOverflowAnchorEl(null);
                      setGuideOpen(true);
                    }}
                    sx={{ minHeight: 48 }}
                  >
                    <Box component="span" sx={{ marginInlineEnd: 1.5, display: "inline-flex" }}>
                      <IconWrapper icon="mdi:compass-outline" size={18} color="var(--primary-700)" />
                    </Box>
                    {t("mobileChrome.platformGuide", "Platform guide")}
                  </MenuItem>
                )}
                {!hideLeaderboardView && !isInstructor && (
                  <MenuItem
                    onClick={() => {
                      // The same Today's Leaders card, anchored under the overflow button.
                      setLeaderboardFromMenu(true);
                      setLeaderboardAnchorEl(overflowAnchorEl);
                      setOverflowAnchorEl(null);
                    }}
                    sx={{ minHeight: 48 }}
                  >
                    <Box component="span" sx={{ marginInlineEnd: 1.5, display: "inline-flex" }}>
                      <IconWrapper icon="mdi:clock-outline" size={18} color="var(--primary-700)" />
                    </Box>
                    {t("common.todaysLeaders")}
                  </MenuItem>
                )}
              </Menu>
            </>
          )}
          {/* Daily Progress Leaderboard - hidden when no_leaderboard_view, and for instructors. */}
          {!hideLeaderboardView && !isInstructor && (
          <React.Fragment>
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
                backgroundColor: "var(--surface-indigo-light)",
                border: "1px solid",
                borderColor: "var(--primary-200)",
                transition: "all 0.2s ease",
                boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                "&:hover": {
                  backgroundColor: "var(--primary-100)",
                  boxShadow: "0 2px 6px rgba(0,0,0,0.15)",
                  transform: "translateY(-1px)",
                },
              }}
            >
              <IconWrapper icon="mdi:clock-outline" size={16} color="var(--primary-700)" />
              <Typography
                variant="body2"
                sx={{
                  fontSize: "0.875rem",
                  fontWeight: 600,
                  color: "var(--primary-700)",
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
                  {t("common.todaysLeaders")}
                </motion.span>
              </Typography>
            </Box>
          </Box>
          {/* Phone: Today's Leaders is in the overflow menu (appbar-overflow) instead of a "TL"
              chip, so the tenant logo keeps its room. */}
          {/* Leaderboard Popover */}
          <Popover
            open={Boolean(leaderboardAnchorEl)}
            anchorEl={leaderboardAnchorEl}
            onClose={handleLeaderboardLeave}
            anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
            transformOrigin={{ vertical: "top", horizontal: "left" }}
            disableRestoreFocus
            sx={{
              // Hover-driven from the bar chip, exactly as before. Opened from the phone overflow
              // menu there is no hover to close it, so its backdrop takes the tap outside.
              pointerEvents: leaderboardFromMenu ? "auto" : "none",
            }}
            PaperProps={{
              sx: {
                mt: 1,
                minWidth: 280,
                borderRadius: 2,
                border: "1px solid",
                borderColor: "var(--primary-200)",
                bgcolor: "var(--card-bg)",
                color: "var(--font-primary)",
                boxShadow: (theme) =>
                  `0 8px 24px ${alpha(theme.palette.common.black, 0.15)}`,
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
                            backgroundColor: "var(--border-default)",
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
                            backgroundColor: "var(--border-default)",
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
                    const college = entry?.college;
                    const linkedinUrl = entry?.linkedin_url;
                    
                    // Create a unique key combining user id, name, and index
                    const uniqueKey = entry?.user?.id 
                      ? `leaderboard-${entry.user.id}-${index}` 
                      : `leaderboard-${userName}-${index}`;
                    
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
                        key={uniqueKey}
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
                        placement="left"
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
                            justifyContent: "space-between",
                            cursor: linkedinUrl ? "pointer" : "default",
                            p: 0.5,
                            borderRadius: 1,
                            transition: "all 0.2s ease",
                            "&:hover": {
                              backgroundColor: linkedinUrl ? "rgba(99, 102, 241, 0.08)" : undefined,
                              transform: linkedinUrl ? "translateX(2px)" : undefined,
                            },
                            "&:focus": linkedinUrl
                              ? {
                                  outline: "2px solid var(--accent-indigo)",
                                  outlineOffset: "2px",
                                }
                              : {},
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
                              color: "var(--font-primary)",
                              maxWidth: 150,
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {userName}
                          </Typography>
                        </Box>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                          <Typography
                            variant="caption"
                            sx={{
                              fontSize: "0.75rem",
                              fontWeight: 500,
                              color: "var(--primary-700)",
                            }}
                          >
                            {timeDisplay}
                          </Typography>
                          {linkedinUrl && (
                            <IconWrapper
                              icon="mdi:linkedin"
                              size={14}
                              color="#0077B5"
                            />
                          )}
                        </Box>
                      </Box>
                      </Tooltip>
                    );
                  })}
                </Box>
              ) : leaderboardError ? (
                <Typography
                  variant="body2"
                  sx={{
                    color: "var(--error-500)",
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
                    color: "var(--font-tertiary)",
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
          {/* Monthly Streak Badge — hidden for instructors (student gamification). */}
          <Box
            // Desktop: hover opens the card, exactly as before. Touch has no hover, and the
            // compatibility mouse events a tap fires would open it and then re-open it after a
            // tap outside, so for touch a tap toggles it instead and the hover handlers stand down.
            onPointerEnter={(e) => {
              if (e.pointerType === "mouse") streakTouchRef.current = false;
            }}
            onPointerDown={(e) => {
              streakTouchRef.current = e.pointerType !== "mouse";
            }}
            onMouseEnter={(e) => {
              if (streakTouchRef.current) return;
              setStreakByTouch(false);
              handleStreakHover(e);
            }}
            onMouseLeave={() => {
              if (!streakTouchRef.current) handleStreakLeave();
            }}
            onClick={(e) => {
              // Clicks inside the card (a portal) bubble here through React; only the chip toggles.
              if (!streakTouchRef.current || !e.currentTarget.contains(e.target as Node)) return;
              const chip = e.currentTarget;
              setStreakByTouch(true);
              setStreakAnchorEl((a) => (a ? null : chip));
            }}
            data-testid="streak-chip"
            sx={{
              position: "relative",
              display: isInstructor ? "none" : { xs: "block", sm: "block" },
              ...(!isInstructor && {
                // 44px tall on a phone; the pill keeps its look, only its height grows.
                [PHONE]: { display: "flex", "& > div:first-of-type": { minHeight: 44 } },
              }),
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
                // The same 3s sweep then a 4s pause, but the pause is spent parked back at -100%
                // instead of at +200%. Either spot is clipped by the chip, so nothing on screen
                // changes; parked at +200% the layer's box sat past a 360px screen's right edge
                // for most of every cycle.
                animate={{
                  x: ["-100%", "200%", "-100%", "-100%"],
                }}
                transition={{
                  duration: 7,
                  times: [0, 3 / 7, 3 / 7 + 0.0001, 1],
                  ease: ["easeInOut", "linear", "linear"],
                  repeat: Infinity,
                }}
                data-testid="streak-shimmer"
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
                {isStreakLoading && !streakCel.primed ? (
                  "..."
                ) : (
                  <AnimatePresence mode="popLayout" initial={false}>
                    <motion.span
                      key={navStreak}
                      initial={{ y: -16, opacity: 0, scale: 1.7 }}
                      animate={{ y: 0, opacity: 1, scale: 1 }}
                      exit={{ y: 16, opacity: 0, position: "absolute" }}
                      transition={{ type: "spring", stiffness: 500, damping: 22 }}
                      style={{ display: "inline-block" }}
                    >
                      {navStreak}
                    </motion.span>
                  </AnimatePresence>
                )}
              </motion.span>

              {/* Fire emoji */}
              <motion.span
                id="nav-streak-flame"
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
              disableRestoreFocus
              sx={{ pointerEvents: streakByTouch ? "auto" : "none" }}
              PaperProps={{
                sx: {
                  mt: 1,
                  minWidth: 20,
                  left: -200,
                  borderRadius: 2,
                  border: "1px solid var(--border-default)",
                  boxShadow: "0 8px 24px rgba(0,0,0,0.15)",
                  pointerEvents: "auto",
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
          </React.Fragment>
          )}

          {/* Language selector - only for client id 28 */}
          {/* {clientInfo?.id === 28 && (
            <Box sx={{ minWidth: 100 }}>
              <LanguageSelect size="small" variant="outlined" />
            </Box>
          )} */}

          {/* Notifications */}
          {isAuthenticated && (
            <>
              <NotificationBell
                unreadCount={unreadCount}
                onClick={handleNotificationClick}
              />
              <NotificationPopover
                anchorEl={notificationAnchorEl}
                onClose={handleNotificationClose}
                notifications={notifications}
                unreadCount={unreadCount}
                loading={notificationsLoading}
                onNotificationClick={handleNotificationItemClick}
                onMarkAllRead={handleMarkAllRead}
              />
            </>
          )}

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
                border: "2px solid var(--border-default)",
                "&:hover": {
                  borderColor: "var(--accent-indigo)",
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
              border: "2px solid var(--border-default)",
              [PHONE]: { width: 44, height: 44 },
            }}
            data-testid="appbar-avatar-mobile"
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
              <Typography variant="caption" sx={{ color: "var(--font-secondary)" }}>
                {user?.email || ""}
              </Typography>
            </Box>

            <Divider />

            {canToggleAdminMode && (
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
                <Box component="span" sx={{ marginInlineEnd: 1.5, display: "inline-flex" }}><ShieldCheck size={18} /></Box>
                {isAdminMode ? t("common.exitAdminMode") : t("common.switchToAdmin")}
              </MenuItem>
            )}

            {canToggleAdminMode && <Divider />}

            <MenuItem
              onClick={() => {
                router.push("/profile");
                handleMenuClose();
              }}
            >
              <Box component="span" sx={{ marginInlineEnd: 1.5, display: "inline-flex" }}><User size={18} /></Box>
              {t("common.profile")}
            </MenuItem>

            {/* Learners only. Staff never buy anything, so for them this is a permanently empty
                page. The route itself stays reachable — someone promoted from student to
                instructor still has real receipts. */}
            {canPurchase(role) && (
              <MenuItem
                onClick={() => {
                  router.push("/purchases");
                  handleMenuClose();
                }}
              >
                <Box component="span" sx={{ marginInlineEnd: 1.5, display: "inline-flex" }}>
                  <ReceiptText size={18} />
                </Box>
                {t("common.myPurchases", "My Purchases")}
              </MenuItem>
            )}

            {canSeeAdminSettings && (
              <MenuItem
                onClick={() => {
                  router.push("/admin/settings");
                  handleMenuClose();
                }}
              >
                <Box component="span" sx={{ marginInlineEnd: 1.5, display: "inline-flex" }}><Settings size={18} /></Box>
                {t("common.settings")}
              </MenuItem>
            )}

            {/* A teacher answers their batch's doubts; they are not a person filing support
                requests. Pointing them at the learner raise-flow was the wrong destination. */}
            <MenuItem
              onClick={() => {
                router.push(isTeachingRole ? "/instructor/tickets" : "/tickets");
                handleMenuClose();
              }}
            >
              <Box component="span" sx={{ marginInlineEnd: 1.5, display: "inline-flex" }}><Ticket size={18} /></Box>
              {isTeachingRole ? "Cohort Tickets" : "My Tickets"}
            </MenuItem>

            <Divider />

            <MenuItem onClick={handleLogout} sx={{ color: "error.main" }}>
              <Box component="span" sx={{ marginInlineEnd: 1.5, display: "inline-flex" }}><LogOut size={18} /></Box>
              {t("common.logout")}
            </MenuItem>
          </Menu>
        </Box>
      </Toolbar>
    </MuiAppBar>
  );
};
