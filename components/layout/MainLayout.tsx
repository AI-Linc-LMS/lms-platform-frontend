"use client";

import { useState, useEffect, memo } from "react";
import { Box } from "@mui/material";
import { AppBar } from "./AppBar";
import { Sidebar, DRAWER_WIDTH } from "./Sidebar";
import { BottomNavigation } from "./BottomNavigation";
import { ReactNode } from "react";
import { useTimeTracking } from "@/hooks/useTimeTracking";
import { useLeaderboardAndStreak } from "@/lib/hooks/useLeaderboardAndStreak";
import { useStreakCongratulations } from "@/lib/hooks/useStreakCongratulations";
import { StreakCongratulationsModal } from "@/components/common/StreakCongratulationsModal";
import { ReportIssueFAB } from "@/components/common/ReportIssueFAB";

interface MainLayoutProps {
  children: ReactNode;
  hideSidebar?: boolean;
  fullPage?: boolean;
  DrawerWidth?: number;
}

export const MainLayout: React.FC<MainLayoutProps> = memo(({
  children,
  hideSidebar = false,
  fullPage = false,
  DrawerWidth = 240,
}) => {
  const [mobileOpen, setMobileOpen] = useState(false);

  // Global app time tracking
  useTimeTracking();

  // Streak congratulations modal
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

  return (
    <Box
      sx={{
        display: "flex",
        minHeight: fullPage ? "100vh" : "auto",
        height: fullPage ? "100vh" : "auto",
        maxHeight: fullPage ? "100vh" : "none",
        overflow: fullPage ? "hidden" : "auto",
        backgroundColor: "#f9fafb",
      }}
    >
      <AppBar onMenuClick={handleDrawerToggle} DrawerWidth={DrawerWidth} />
      {!hideSidebar && (
        <Sidebar mobileOpen={mobileOpen} onClose={handleDrawerToggle} />
      )}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          width: {
            xs: "100%",
            md: hideSidebar ? "100%" : `calc(100% - ${DRAWER_WIDTH}px)`,
          },
          minHeight: fullPage ? "100vh" : "auto",
          height: fullPage ? "100vh" : "auto",
          maxHeight: fullPage ? "100vh" : "none",
          overflow: fullPage ? "hidden" : "auto",
          backgroundColor: "#f9fafb",
          display: "flex",
          flexDirection: "column",
          marginLeft: { md: 0 },
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
            maxWidth: fullPage ? "100%" : "1400px",
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

      {/* Streak Congratulations Modal */}
      <StreakCongratulationsModal
        open={showModal}
        onClose={handleClose}
        streakCount={streakCount}
      />

      {/* Report Issue FAB - Shows on all pages except excluded routes, only when authenticated */}
      <ReportIssueFAB />
    </Box>
  );
});

MainLayout.displayName = "MainLayout";
