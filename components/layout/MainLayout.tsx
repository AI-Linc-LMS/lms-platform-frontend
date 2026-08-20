"use client";

import { useState, useEffect, memo } from "react";
import { Box } from "@mui/material";
import { useTranslation } from "react-i18next";
import { isRtl } from "@/lib/i18n";
import { AppBar } from "./AppBar";
import { Sidebar, DRAWER_WIDTH } from "./Sidebar";
import { BottomNavigation } from "./BottomNavigation";
import { ReactNode } from "react";
import { useTimeTracking } from "@/hooks/useTimeTracking";
import { reportContentCompleted } from "@/lib/streak/streakCelebration";
import { StreakCelebrationOverlay } from "@/components/common/StreakCelebrationOverlay";
import { ReportIssueFAB } from "@/components/common/ReportIssueFAB";
import { useHideLeaderboardView } from "@/lib/contexts/ClientInfoContext";
import { useInsideChrome } from "./ChromeContext";
import { invalidateCached } from "@/lib/utils/ttl-cache";

interface MainLayoutProps {
  children: ReactNode;
  hideSidebar?: boolean;
  fullPage?: boolean;
  fullWidthContent?: boolean;
  /**
   * Drop the global app bar entirely, for a page that supplies its own chrome.
   *
   * Added for the AI Tutor session room, which is dark full-bleed and was rendering the
   * white app bar as a bright strip across the top of an otherwise black screen. The room
   * has its own header with a back button and a session timer, so the global bar was not
   * even carrying navigation — only the visual break.
   *
   * Use sparingly and only where the page still gives the learner a way out. Everything on
   * the app bar (notifications, streak, profile) becomes unreachable while it is hidden.
   */
  hideAppBar?: boolean;
  DrawerWidth?: number;
}

/**
 * Nesting-aware: inside the hoisted <AppChrome> (root layout) the shell is
 * already mounted and survives navigation, so this renders ONLY the per-page
 * content column. On the chromeless routes AppChrome skips, it renders the
 * original self-contained layout below, byte-for-byte unchanged.
 */
export const MainLayout: React.FC<MainLayoutProps> = memo((props) => {
  const insideChrome = useInsideChrome();
  return insideChrome ? (
    <MainLayoutContent {...props} />
  ) : (
    <StandaloneMainLayout {...props} />
  );
});

MainLayout.displayName = "MainLayout";

/**
 * The per-page content column — the only part that should change between
 * routes. Geometry copied EXACTLY from StandaloneMainLayout's inner content
 * Box (the #1148 revert was caused by dropping its height/overflow here).
 * marginTop stays 0 in all cases: the chrome shell always renders the toolbar
 * spacer, so the standalone fullPage marginTop would double-space.
 */
function MainLayoutContent({
  children,
  fullPage = false,
  fullWidthContent = false,
}: MainLayoutProps) {
  return (
    <Box
      sx={{
        flexGrow: 1,
        p: fullPage ? 0 : { xs: 2, sm: 3, md: 4 },
        width: "100%",
        maxWidth: fullPage ? "100%" : fullWidthContent ? "none" : "1400px",
        mx: fullPage ? 0 : "auto",
        pb: fullPage ? 0 : { xs: "72px", md: 4 },
        height: fullPage ? "100%" : "auto",
        minHeight: fullPage ? 0 : "calc(100vh - 64px)",
        overflow: fullPage ? "hidden" : "auto",
        position: "relative",
      }}
    >
      {children}
    </Box>
  );
}

const StandaloneMainLayout: React.FC<MainLayoutProps> = memo(({
  children,
  hideSidebar = false,
  fullPage = false,
  fullWidthContent = false,
  hideAppBar = false,
  DrawerWidth = 240,
}) => {
  const [mobileOpen, setMobileOpen] = useState(false);

  // Global app time tracking
  useTimeTracking();

  // Streak celebration (hidden when no_leaderboard_view)
  const hideLeaderboardView = useHideLeaderboardView();

  // Any content completion (legacy or adaptive) dispatches "submodule-complete";
  // refetch the streak and celebrate if it went up.
  useEffect(() => {
    if (hideLeaderboardView || typeof window === "undefined") return;
    const handleSubmoduleComplete = () => {
      // Completion changes course progress — never serve a stale cached copy.
      invalidateCached("courses:");
      reportContentCompleted();
    };
    window.addEventListener("submodule-complete", handleSubmoduleComplete);
    return () => {
      window.removeEventListener("submodule-complete", handleSubmoduleComplete);
    };
  }, [hideLeaderboardView]);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const { i18n } = useTranslation();
  const rtl = isRtl(i18n.language || "en");

  // Use direction: ltr so flex order is consistent: order 1 = left, order 2 = right.
  // Otherwise with dir="rtl" on document, flex start is on the right and main content would sit under the sidebar.
  return (
    <Box
      sx={{
        direction: "ltr",
        display: "flex",
        flexDirection: "row",
        minHeight: fullPage ? "100vh" : "auto",
        height: fullPage ? "100vh" : "auto",
        maxHeight: fullPage ? "100vh" : "none",
        overflow: fullPage ? "hidden" : "auto",
        backgroundColor: "var(--background)",
        width: "100%",
      }}
    >
      {!hideAppBar && (
        <AppBar onMenuClick={handleDrawerToggle} DrawerWidth={DrawerWidth} />
      )}
      {!hideSidebar && (
        <Box
          sx={{
            order: rtl ? 2 : 0,
            flexShrink: 0,
            width: { xs: 0, md: DRAWER_WIDTH },
            minWidth: { md: DRAWER_WIDTH },
            overflow: "hidden",
          }}
        >
          <Sidebar mobileOpen={mobileOpen} onClose={handleDrawerToggle} />
        </Box>
      )}
      <Box
        component="main"
        sx={{
          order: rtl ? 1 : 0,
          direction: rtl ? "rtl" : "ltr",
          flexGrow: 1,
          flexShrink: 1,
          minWidth: 0,
          width: {
            xs: "100%",
            md: hideSidebar ? "100%" : `calc(100% - ${DRAWER_WIDTH}px)`,
          },
          maxWidth: hideSidebar ? "none" : { md: `calc(100% - ${DRAWER_WIDTH}px)` },
          minHeight: fullPage ? "100vh" : "auto",
          height: fullPage ? "100vh" : "auto",
          maxHeight: fullPage ? "100vh" : "none",
          overflow: fullPage ? "hidden" : "auto",
          backgroundColor: "var(--background)",
          display: "flex",
          flexDirection: "column",
          marginInlineStart: { md: 0 },
          marginInlineEnd: { md: 0 },
          transition: "width 0.3s ease",
        }}
      >
        {/* Toolbar spacer for fixed AppBar */}
        {!fullPage && !hideAppBar && (
          <Box sx={{ minHeight: { xs: "56px", sm: "64px" }, flexShrink: 0 }} />
        )}
        <Box
          sx={{
            flexGrow: 1,
            p: fullPage ? 0 : { xs: 2, sm: 3, md: 4 },
            width: "100%",
            maxWidth: fullPage ? "100%" : fullWidthContent ? "none" : "1400px",
            mx: fullPage ? 0 : "auto",
            pb: fullPage ? 0 : { xs: "72px", md: 4 }, // Add bottom padding for mobile bottom nav (only when not fullPage)
            height: fullPage ? "100%" : "auto",
            minHeight: fullPage ? 0 : "calc(100vh - 64px)",
            overflow: fullPage ? "hidden" : "auto",
            marginTop: fullPage && !hideAppBar ? { xs: "56px", sm: "64px" } : 0,
            position: "relative",
          }}
        >
          {children}
        </Box>
      </Box>
      {/* Bottom Navigation for Mobile - Hidden on full page views like submodule pages */}
      {!fullPage && <BottomNavigation />}

      {/* Streak celebration overlay (store-driven; hidden when no_leaderboard_view) */}
      {!hideLeaderboardView && <StreakCelebrationOverlay />}

      {/* Report Issue FAB - Shows on all pages except excluded routes, only when authenticated */}
      <ReportIssueFAB />
    </Box>
  );
});

StandaloneMainLayout.displayName = "StandaloneMainLayout";
