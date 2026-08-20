"use client";

import { useEffect, useState } from "react";
import { Box } from "@mui/material";
import { usePathname } from "next/navigation";
import { useTranslation } from "react-i18next";
import { isRtl } from "@/lib/i18n";
import { AppBar } from "./AppBar";
import { Sidebar, DRAWER_WIDTH } from "./Sidebar";
import { BottomNavigation } from "./BottomNavigation";
import { ChromeProvider } from "./ChromeContext";
import { useTimeTracking } from "@/hooks/useTimeTracking";
import { reportContentCompleted } from "@/lib/streak/streakCelebration";
import { StreakCelebrationOverlay } from "@/components/common/StreakCelebrationOverlay";
import { ReportIssueFAB } from "@/components/common/ReportIssueFAB";
import { useHideLeaderboardView } from "@/lib/contexts/ClientInfoContext";

/**
 * Persistent app chrome, mounted ONCE in the root layout.
 *
 * Previously every one of the ~114 pages rendered its own <MainLayout>, and 43 of the loading.tsx
 * files rendered a second one via PageShimmerLayout. Because those are different element positions in
 * different route subtrees, React unmounted and remounted the ENTIRE shell on every navigation —
 * AppBar, Sidebar, BottomNavigation, ReportIssueFAB and useTimeTracking all torn down and rebuilt,
 * with the header refetching and the in-progress time segment dropped. It also meant the chrome
 * visibly flashed between a route's loading.tsx and its page.
 *
 * Mounting it here instead means the shell survives navigation entirely; only the content column
 * swaps. MainLayout stays in place as the per-page CONTENT wrapper (it collapses to just its content
 * Box when it detects it is inside this chrome), so no page had to change.
 */

/**
 * Routes that must NOT receive the shared chrome, and keep rendering exactly what they render today:
 *  - the unauthenticated routes, which have no app shell at all;
 *  - the first-login setup wizard, likewise;
 *  - the legacy submodule player, the only page that passes RUNTIME-computed MainLayout props
 *    (`hideSidebar={!isMobile} fullPage DrawerWidth={0}`), which cannot be expressed by a static
 *    shared shell;
 *  - the assessment runner, whose desktop-only gate mounts its own MainLayout and which must stay a
 *    distraction-free full-page surface while proctored.
 */
const CHROMELESS_PREFIXES = [
  // Unauthenticated / pre-app surfaces — no shell at all.
  "/login",
  "/signup",
  "/forgot-password",
  "/reset-password",
  "/verify-email",
  "/auth/handoff",
  "/setup",
  // Public, auth-free credential verification — must not show app navigation.
  "/credentials",
  // Off-screen render target captured into a PDF; any chrome would end up in the file.
  "/user/scorecard/pdf",
  // Standalone utilities / demos that deliberately render bare.
  "/mock-interview/voice-sample",
  "/proctoring-demo",
];

const CHROMELESS_PATTERNS: RegExp[] = [
  /^\/courses\/[^/]+\/submodule\/[^/]+/, // legacy submodule player (runtime chrome props)
  // Distraction-free, often proctored runners. These render their own full-page surface today and
  // must not gain a sidebar/app bar.
  /^\/assessments\/[^/]+\/take/,
  /^\/assessments\/[^/]+\/calibration/,
  /^\/mock-interview\/[^/]+\/take/,
  /^\/adaptive-courses\/[^/]+\/interview\/[^/]+/,
];

function isChromeless(pathname: string | null): boolean {
  if (!pathname) return true; // pre-hydration: render bare rather than flashing a shell
  if (CHROMELESS_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`))) return true;
  return CHROMELESS_PATTERNS.some((re) => re.test(pathname));
}

export function AppChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  if (isChromeless(pathname)) {
    // No chrome, and no ChromeProvider — so any MainLayout on these routes behaves exactly as before.
    return <>{children}</>;
  }
  return <ChromeShell>{children}</ChromeShell>;
}

function ChromeShell({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const handleDrawerToggle = () => setMobileOpen((o) => !o);

  // Global app time tracking — now runs once for the session instead of restarting every navigation.
  useTimeTracking();

  const hideLeaderboardView = useHideLeaderboardView();

  // Any content completion (legacy or adaptive) dispatches "submodule-complete";
  // refetch the streak and celebrate if it went up.
  useEffect(() => {
    if (hideLeaderboardView || typeof window === "undefined") return;
    const handleSubmoduleComplete = () => reportContentCompleted();
    window.addEventListener("submodule-complete", handleSubmoduleComplete);
    return () => window.removeEventListener("submodule-complete", handleSubmoduleComplete);
  }, [hideLeaderboardView]);

  const { i18n } = useTranslation();
  const rtl = isRtl(i18n.language || "en");

  // direction: ltr so flex order stays consistent (order 1 = left, order 2 = right); with dir="rtl"
  // on the document, flex start would be on the right and main content would sit under the sidebar.
  return (
    <ChromeProvider value={true}>
      <Box
        sx={{
          // Scroll-container geometry copied EXACTLY from MainLayout's
          // non-fullPage path. Omitting `overflow`/`height` here is the bug
          // that forced the #1148 revert: no ancestor was a scroll container
          // any more and content past the viewport was unreachable.
          direction: "ltr",
          display: "flex",
          flexDirection: "row",
          minHeight: "auto",
          height: "auto",
          maxHeight: "none",
          overflow: "auto",
          backgroundColor: "var(--background)",
          width: "100%",
        }}
      >
        <AppBar onMenuClick={handleDrawerToggle} DrawerWidth={DRAWER_WIDTH} />
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
        <Box
          component="main"
          sx={{
            order: rtl ? 1 : 0,
            direction: rtl ? "rtl" : "ltr",
            flexGrow: 1,
            flexShrink: 1,
            minWidth: 0,
            width: { xs: "100%", md: `calc(100% - ${DRAWER_WIDTH}px)` },
            maxWidth: { md: `calc(100% - ${DRAWER_WIDTH}px)` },
            minHeight: "auto",
            height: "auto",
            maxHeight: "none",
            overflow: "auto",
            backgroundColor: "var(--background)",
            display: "flex",
            flexDirection: "column",
            marginInlineStart: { md: 0 },
            marginInlineEnd: { md: 0 },
            transition: "width 0.3s ease",
          }}
        >
          {/* Toolbar spacer for the fixed AppBar */}
          <Box sx={{ minHeight: { xs: "56px", sm: "64px" }, flexShrink: 0 }} />
          {children}
        </Box>
        <BottomNavigation />
        {!hideLeaderboardView && <StreakCelebrationOverlay />}
        <ReportIssueFAB />
      </Box>
    </ChromeProvider>
  );
}
