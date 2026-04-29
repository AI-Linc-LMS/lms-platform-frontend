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
import { useLeaderboardAndStreak } from "@/lib/hooks/useLeaderboardAndStreak";
import { useStreakCongratulations } from "@/lib/hooks/useStreakCongratulations";
import { StreakCongratulationsModal } from "@/components/common/StreakCongratulationsModal";
import { ReportIssueFAB } from "@/components/common/ReportIssueFAB";
import { useHideLeaderboardView } from "@/lib/contexts/ClientInfoContext";

interface MainLayoutProps {
  children: ReactNode;
  hideSidebar?: boolean;
  fullPage?: boolean;
  fullWidthContent?: boolean;
  DrawerWidth?: number;
}

export const MainLayout: React.FC<MainLayoutProps> = memo(({
  children,
  hideSidebar = false,
  fullPage = false,
  fullWidthContent = false,
  DrawerWidth = 240,
}) => {
  const [mobileOpen, setMobileOpen] = useState(false);

  // Global app time tracking
  useTimeTracking();

  // Streak congratulations modal (hidden when no_leaderboard_view)
  const hideLeaderboardView = useHideLeaderboardView();
  const { streak, isStreakLoading, refreshStreak } = useLeaderboardAndStreak();
  const { showModal, streakCount, handleClose, triggerCheck } =
    useStreakCongratulations(streak, isStreakLoading, refreshStreak);

  // Listen for submodule completion events
  useEffect(() => {
    const handleSubmoduleComplete = () => {
      triggerCheck();
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
  }, [triggerCheck]);

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
      <AppBar onMenuClick={handleDrawerToggle} DrawerWidth={DrawerWidth} />
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
        {!fullPage && (
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
            marginTop: fullPage ? { xs: "56px", sm: "64px" } : 0,
            position: "relative",
          }}
        >
          {children}
        </Box>
      </Box>
      {/* Bottom Navigation for Mobile - Hidden on full page views like submodule pages */}
      {!fullPage && <BottomNavigation />}

      {/* Streak Congratulations Modal - hidden when no_leaderboard_view */}
      {!hideLeaderboardView && (
        <StreakCongratulationsModal
          open={showModal}
          onClose={handleClose}
          streakCount={streakCount}
        />
      )}

      {/* Report Issue FAB - Shows on all pages except excluded routes, only when authenticated */}
      <ReportIssueFAB />
    </Box>
  );
});

MainLayout.displayName = "MainLayout";
