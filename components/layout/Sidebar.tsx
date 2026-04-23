"use client";

import { useState, useTransition, useMemo } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Box,
  Typography,
  Avatar,
  Skeleton,
} from "@mui/material";
import { IconWrapper } from "@/components/common/IconWrapper";
import { useAuth } from "@/lib/auth/auth-context";
import {
  getUserDisplayName,
  getUserInitials,
  getUserProfilePicture,
} from "@/lib/utils/user-utils";
import { useClientInfo } from "@/lib/contexts/ClientInfoContext";
import { useAdminMode } from "@/lib/contexts/AdminModeContext";
import { Button } from "@mui/material";
import { useTranslation } from "react-i18next";
import { isRtl } from "@/lib/i18n";
import {
  isAdminOnlyRole,
  isFullAdminRole,
  isCourseManagerRole,
  isClientOrgAdminRole,
  COURSE_MANAGER_ADMIN_SIDEBAR_FEATURES,
} from "@/lib/auth/role-utils";
import { useTenantShellTheme } from "@/lib/theme/useTenantShellTheme";
import { normalizeThemeSettings } from "@/lib/theme/normalizeThemeSettings";
import { buildSidebarLogoBrandingUi } from "@/lib/theme/authHeroBranding";
import { resolveClientLogoUrl } from "@/lib/utils/resolveClientLogoUrl";

const DRAWER_WIDTH = 240;
const DRAWER_WIDTH_COLLAPSED = 64;

interface NavigationItem {
  label: string;
  labelKey: string;
  path: string;
  icon: string;
  featureName: string;
  /** If true, only org admins (admin / superadmin) see this link. */
  orgAdminOnly?: boolean;
}

interface SidebarProps {
  open?: boolean;
  onClose?: () => void;
  mobileOpen?: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({
  mobileOpen = false,
  onClose,
}) => {
  const router = useRouter();
  const pathname = usePathname();
  const { user } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const [isPending, startTransition] = useTransition();
  const { clientInfo, loading: loadingClientInfo } = useClientInfo();
  const shell = useTenantShellTheme();

  const themeFlat = useMemo(
    () => normalizeThemeSettings(clientInfo?.theme_settings),
    [clientInfo?.theme_settings]
  );
  const sidebarLogoSizing = useMemo(
    () => buildSidebarLogoBrandingUi(themeFlat),
    [themeFlat]
  );
  const sidebarLogoUrl = resolveClientLogoUrl(clientInfo);
  const sidebarLogoBoxSx = useMemo(() => {
    return {
      position: "relative" as const,
      width: "100%",
      maxWidth: sidebarLogoSizing.logoMaxWidthPx,
      height: sidebarLogoSizing.logoHeightPx,
      mx: "auto" as const,
      flexShrink: 0,
    };
  }, [sidebarLogoSizing.logoMaxWidthPx, sidebarLogoSizing.logoHeightPx]);
  const { isAdminMode, toggleAdminMode } = useAdminMode();
  const { t, i18n } = useTranslation("common");
  const rtl = isRtl(i18n.language || "en");

  const role = user?.role;
  const canToggleAdminMode = isFullAdminRole(role);
  const limitedAdmin = isAdminOnlyRole(role);
  /** Limited admins always use admin navigation; full admins follow toggle */
  const effectiveAdminMode = limitedAdmin || isAdminMode;

  // Regular (non-admin) navigation items
  const regularNavigationItems: NavigationItem[] = [
    {
      label: "Dashboard",
      labelKey: "nav.dashboard",
      path: "/dashboard",
      icon: "mdi:view-dashboard",
      featureName: "dashboard", // Regular dashboard, not admin
    },
    {
      label: "Courses",
      labelKey: "nav.courses",
      path: "/courses",
      icon: "mdi:book-open-variant",
      featureName: "course",
    },
    {
      label: "Assessments",
      labelKey: "nav.assessments",
      path: "/assessments",
      icon: "mdi:file-document-edit",
      featureName: "assessment",
    },
    {
      label: "Mock Interview",
      labelKey: "nav.mockInterview",
      path: "/mock-interview",
      icon: "mdi:video-plus",
      featureName: "mock_interview",
    },
    {
      label: "Jobs",
      labelKey: "nav.jobsV2",
      path: "/jobs-v2",
      icon: "mdi:briefcase-search",
      featureName: "jobs_v2",
    },
    {
      label: "Attendance",
      labelKey: "nav.attendance",
      path: "/attendance",
      icon: "mdi:calendar-check",
      featureName: "attendance",
    },
    {
      label: "Live Sessions",
      labelKey: "nav.liveSessions",
      path: "/live-sessions",
      icon: "mdi:video-box",
      featureName: "live_sessions",
    },
    {
      label: "Community",
      labelKey: "nav.community",
      path: "/community",
      icon: "mdi:forum",
      featureName: "community_forum",
    },
  ];

  // Admin navigation items - all routes start with /admin/
  const adminNavigationItems: NavigationItem[] = [
    {
      label: "Dashboard",
      labelKey: "nav.dashboard",
      path: "/admin/dashboard",
      icon: "mdi:view-dashboard",
      featureName: "admin_dashboard",
    },
    {
      label: "Manage Students",
      labelKey: "nav.manageStudents",
      path: "/admin/manage-students",
      icon: "mdi:account-group",
      featureName: "admin_manage_students",
    },
    {
      label: "Pending instructors",
      labelKey: "nav.pendingInstructors",
      path: "/admin/pending-instructors",
      icon: "mdi:account-clock",
      featureName: "admin_manage_instructors",
      orgAdminOnly: true,
    },
    {
      label: "Branding & theme",
      labelKey: "nav.branding",
      path: "/admin/branding",
      icon: "mdi:palette-outline",
      featureName: "admin_dashboard",
      orgAdminOnly: true,
    },
    {
      label: "Course Builder",
      labelKey: "nav.courseBuilder",
      path: "/admin/course-builder",
      icon: "mdi:book-edit",
      featureName: "admin_course_builder",
    },
    {
      label: "AI Course Builder",
      labelKey: "nav.aiCourseBuilder",
      path: "/admin/ai-course-builder",
      icon: "mdi:robot",
      featureName: "admin_ai_course_builder",
    },
    // {
    //   label: "Workshop Registration",
    //   path: "/admin/workshop-registration",
    //   icon: "mdi:calendar-edit",
    //   featureName: "admin_workshop_reg",
    // },
    // {
    //   label: "Assessment Results",
    //   path: "/admin/assessment-results",
    //   icon: "mdi:chart-box",
    //   featureName: "admin_assessment_result",
    // },
    // {
    //   label: "Referral",
    //   path: "/admin/referral",
    //   icon: "mdi:account-arrow-right",
    //   featureName: "admin_referral",
    // },
    {
      label: "Emails",
      labelKey: "nav.emails",
      path: "/admin/emails",
      icon: "mdi:email-multiple",
      featureName: "admin_emails",
    },
    {
      label: "Notifications",
      labelKey: "nav.notifications",
      path: "/admin/notifications",
      icon: "mdi:bell-badge",
      featureName: "admin_notifications",
    },
    // {
    //   label: "Payment",
    //   path: "/admin/payment",
    //   icon: "mdi:credit-card-multiple",
    //   featureName: "admin_payment",
    // },
    // {
    //   label: "Webinar Management",
    //   path: "/admin/webinar-management",
    //   icon: "mdi:video",
    //   featureName: "admin_webinar_management",
    // },
    
    {
      label: "Live Sessions",
      labelKey: "nav.adminLiveSessions",
      path: "/admin/live-sessions",
      icon: "mdi:video-box",
      featureName: "admin_live_sessions",
    },
    {
      label: "Mock Interview",
      labelKey: "nav.adminMockInterview",
      path: "/admin/admin-mock-interview",
      icon: "mdi:account-voice",
      featureName: "admin_mock_interview",
    },
    {
      label: "Verify Content",
      labelKey: "nav.verifyContent",
      path: "/admin/verify-content",
      icon: "mdi:check-circle",
      featureName: "admin_verify_content",
    },
    {
      label: "Assessment Management",
      labelKey: "nav.assessmentManagement",
      path: "/admin/assessment",
      icon: "mdi:file-document-edit",
      featureName: "admin_assessment",
    },
    {
      label: "Scorecard",
      labelKey: "nav.scorecard",
      path: "/admin/scorecard",
      icon: "mdi:chart-box-outline",
      featureName: "admin_scorecard",
    },
    {
      label: "Jobs",
      labelKey: "nav.adminJobsV2",
      path: "/admin/jobs-v2",
      icon: "mdi:briefcase-search",
      featureName: "admin_jobs_v2",
    },
    {
      label: "Attendance",
      labelKey: "nav.adminAttendance",
      path: "/admin/attendance",
      icon: "mdi:calendar-check",
      featureName: "admin_attendance",
    },

    // {
    //   label: "E-Book",
    //   path: "/admin/ebook",
    //   icon: "mdi:book-open-page-variant",
    //   featureName: "admin_ebook",
    // },
  ];

  const allNavigationItems = effectiveAdminMode
    ? adminNavigationItems
    : regularNavigationItems;

  // Helper function to get the correct path (admin items already have /admin/ prefix)
  const getNavigationPath = (item: NavigationItem): string => {
    return item.path;
  };

  // Filter navigation items based on client features
  const enabledFeatureNames = new Set(
    clientInfo?.features?.map((feature) => feature.name) || []
  );

  const getFilteredFeatures = () => {
    if (effectiveAdminMode) {
      // In admin mode, only show features that start with "admin_"
      return Array.from(enabledFeatureNames).filter((name) =>
        name.startsWith("admin_")
      );
    } else {
      // In normal mode, exclude admin features and show regular features
      return Array.from(enabledFeatureNames).filter(
        (name) => !name.startsWith("admin_")
      );
    }
  };

  const filteredFeatureNames = new Set(getFilteredFeatures());

  // Only show navigation items that are enabled in client features
  // Don't show any items while loading to avoid UX flash
  // Always show dashboard for regular users (even if feature doesn't exist)
  // Memoize navigation items to prevent unnecessary recalculations
  const navigationItems = useMemo(() => {
    if (loadingClientInfo) return [];
    let items: NavigationItem[];
    if (filteredFeatureNames.size > 0) {
      items = allNavigationItems.filter((item) => {
        // Always show dashboard for regular users
        if (!effectiveAdminMode && item.featureName === "dashboard") {
          return true;
        }
        if (effectiveAdminMode && item.featureName === "admin_scorecard") {
          return true;
        }
        return filteredFeatureNames.has(item.featureName);
      });
    } else {
      items = allNavigationItems;
    }

    if (isCourseManagerRole(role) && effectiveAdminMode) {
      const allow = new Set(COURSE_MANAGER_ADMIN_SIDEBAR_FEATURES);
      items = items.filter((item) => allow.has(item.featureName));
    }

    items = items.filter(
      (item) => !item.orgAdminOnly || isClientOrgAdminRole(role)
    );

    return items;
  }, [
    loadingClientInfo,
    filteredFeatureNames,
    allNavigationItems,
    effectiveAdminMode,
    role,
  ]);

  const handleNavigation = (item: NavigationItem) => {
    if (onClose) {
      onClose();
    }
  };

  const currentWidth = collapsed ? DRAWER_WIDTH_COLLAPSED : DRAWER_WIDTH;

  const drawerContent = (
    <Box
      sx={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        backgroundColor: shell.shellBg,
        borderInlineEnd: `1px solid ${shell.navBorder}`,
        overflow: "hidden",
      }}
    >
      {/* Logo Section */}
      <Box
        sx={(theme) => {
          const padY = parseFloat(String(theme.spacing(2))) || 16;
          return {
            p: 2,
            minHeight: Math.max(70, sidebarLogoSizing.logoHeightPx + padY * 2),
            height: "auto",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            borderBottom: "1px solid",
            borderColor: shell.navBorder,
          };
        }}
      >
        <Link
          href={effectiveAdminMode ? "/admin/dashboard" : "/dashboard"}
          prefetch={true}
          style={{
            textDecoration: "none",
            width: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Box
            sx={{
              background: `linear-gradient(135deg, ${shell.logoGradStart} 0%, ${shell.logoGradEnd} 100%)`,
              borderRadius: 2,
              width: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              px: 1.5,
              py: 0.5,
              border: `1px solid ${shell.logoBorder}`,
              boxShadow: `0 2px 8px rgba(0, 0, 0, 0.15), inset 0 1px 0 ${shell.logoInset}`,
              transition: "all 0.3s ease",
              cursor: "pointer",
              "&:hover": {
                background: `linear-gradient(135deg, ${shell.logoGradHoverStart} 0%, ${shell.logoGradHoverEnd} 100%)`,
                boxShadow: `0 4px 12px rgba(0, 0, 0, 0.2), inset 0 1px 0 ${shell.logoInsetHover}`,
              },
            }}
          >
          {sidebarLogoUrl ? (
            <Box sx={sidebarLogoBoxSx}>
              <Image
                src={sidebarLogoUrl}
                alt={clientInfo?.app_name || "Logo"}
                fill
                style={{ objectFit: "contain" }}
                sizes={`${sidebarLogoSizing.logoMaxWidthPx}px`}
                priority
              />
            </Box>
          ) : (
            <IconWrapper icon="mdi:school" size={32} color={shell.p400} />
          )}
        </Box>
        </Link>
      </Box>

      {/* Navigation Items */}
      <Box sx={{ flex: 1, py: 1.5, overflow: "hidden", minHeight: 0, display: "flex", flexDirection: "column" }}>
        <Box
          sx={(theme) => ({
            flex: 1,
            minHeight: 0,
            overflowY: "auto",
            overflowX: "hidden",
            ...(navigationItems.length > 9 && {
              [theme.breakpoints.down("md")]: {
                maxHeight: 432, // ~9 items (48px each)
              },
            }),
          })}
        >
        <List sx={{ py: 0, px: 1.5 }}>
          {loadingClientInfo ? (
            // Show loading skeletons while features are being loaded
            <>
              {[1, 2, 3, 4, 5].map((i) => (
                <ListItem key={i} disablePadding sx={{ mb: 0.25 }}>
                  <Box
                    sx={{
                      width: "100%",
                      display: "flex",
                      flexDirection: rtl ? "row-reverse" : "row",
                      alignItems: "center",
                      py: 1,
                      px: 1.5,
                      gap: 1.5,
                    }}
                  >
                    <Skeleton
                      variant="circular"
                      width={18}
                      height={18}
                      sx={{
                        bgcolor: shell.skeletonBg,
                      }}
                    />
                    {!collapsed && (
                      <Skeleton
                        variant="text"
                        width="60%"
                        height={20}
                        sx={{
                          bgcolor: shell.skeletonBg,
                        }}
                      />
                    )}
                  </Box>
                </ListItem>
              ))}
            </>
          ) : (
            navigationItems.map((item) => {
              const navigationPath = getNavigationPath(item);
              const isActive =
                pathname === navigationPath ||
                pathname?.startsWith(navigationPath + "/");

              return (
                <ListItem key={item.path} disablePadding sx={{ mb: 0.25 }}>
                  <Link
                    href={navigationPath}
                    prefetch={true}
                    style={{ textDecoration: "none", color: "inherit", width: "100%" }}
                    onClick={() => handleNavigation(item)}
                  >
                    <ListItemButton
                      sx={{
                        borderRadius: 1.5,
                        backgroundColor: isActive
                          ? shell.activeBg
                          : "transparent",
                        color: isActive ? shell.p300 : shell.navMuted,
                        py: 1,
                        px: collapsed ? 1.25 : 1.5,
                        justifyContent: collapsed ? "center" : rtl ? "flex-end" : "flex-start",
                        flexDirection: rtl && !collapsed ? "row-reverse" : "row",
                        minHeight: 40,
                        position: "relative",
                        "&::before": isActive
                          ? {
                              content: '""',
                              position: "absolute",
                              ...(rtl ? { right: 0, left: "auto" } : { left: 0, right: "auto" }),
                              top: "50%",
                              transform: "translateY(-50%)",
                              width: 3,
                              height: "50%",
                              backgroundColor: shell.p500,
                              borderRadius: rtl ? "3px 0 0 3px" : "0 3px 3px 0",
                            }
                          : {},
                        "&:hover": {
                          backgroundColor: isActive
                            ? shell.activeBgHover
                            : shell.navHoverBg,
                          color: isActive ? shell.p300 : shell.nav,
                          "& .MuiListItemIcon-root svg": {
                            transform: "translateY(-2px) scale(1.1)",
                            filter: shell.dropHover,
                          },
                        },
                      }}
                    >
                    <ListItemIcon
                      sx={{
                        minWidth: collapsed ? 0 : 36,
                        color: "inherit",
                        justifyContent: "center",
                        position: "relative",
                        ...(rtl && !collapsed && { marginRight: 0, marginLeft: 1 }),
                        "& svg": {
                          filter: isActive
                            ? shell.dropIconActive
                            : "drop-shadow(0 1px 2px rgba(0, 0, 0, 0.2))",
                          transform: isActive
                            ? "translateY(-1px) scale(1.05)"
                            : "translateY(0) scale(1)",
                          transition: "all 0.2s ease",
                        },
                      }}
                    >
                      <IconWrapper icon={item.icon} size={18} />
                    </ListItemIcon>
                    {!collapsed && (
                      <ListItemText
                        primary={t(item.labelKey)}
                        primaryTypographyProps={{
                          fontSize: "1rem",
                          fontWeight: isActive ? 600 : 500,
                        }}
                      />
                    )}
                  </ListItemButton>
                  </Link>
                </ListItem>
              );
            })
          )}
        </List>
        </Box>
      </Box>

      {/* User Profile & Settings */}
      {user && (
        <Box
          sx={{
            borderTop: "1px solid",
            borderColor: shell.navBorder,
            mt: "auto",
          }}
        >
          {!collapsed && (
            <Box sx={{ p: 1.5 }}>
              <Box
                sx={{
                  display: "flex",
                  flexDirection: rtl ? "row-reverse" : "row",
                  alignItems: "center",
                  gap: 1.5,
                  mb: canToggleAdminMode ? 1.5 : 0,
                }}
              >
                <Avatar
                  src={getUserProfilePicture(user)}
                  sx={{
                    width: 36,
                    height: 36,
                    border: "2px solid",
                    borderColor: shell.navBorderMid,
                  }}
                >
                  {getUserInitials(user)}
                </Avatar>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography
                    variant="body2"
                    sx={{
                      fontWeight: 600,
                      color: shell.nav,
                      fontSize: "1rem",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {getUserDisplayName(user)}
                  </Typography>
                  <Typography
                    variant="caption"
                    sx={{
                      color: shell.navCaption,
                      fontSize: "0.9rem",
                    }}
                  >
                    {user?.role || "Student"}
                  </Typography>
                </Box>
              </Box>
              {/* Admin Mode Toggle Button */}
              {canToggleAdminMode && (
                <Button
                  onClick={() => {
                    const newAdminMode = !isAdminMode;
                    toggleAdminMode();
                    startTransition(() => {
                      if (newAdminMode) {
                        router.push("/admin/dashboard");
                      } else {
                        router.push("/dashboard");
                      }
                    });
                  }}
                  fullWidth
                  variant={isAdminMode ? "contained" : "outlined"}
                  sx={{
                    textTransform: "none",
                    fontSize: "0.875rem",
                    py: 0.75,
                    backgroundColor: isAdminMode
                      ? shell.activeBg
                      : "transparent",
                    borderColor: isAdminMode
                      ? shell.p500
                      : shell.navBorderMid,
                    color: isAdminMode ? shell.p300 : shell.navMuted,
                    "&:hover": {
                      backgroundColor: isAdminMode
                        ? shell.activeBgHover
                        : shell.navHoverBg,
                      borderColor: isAdminMode
                        ? shell.p500
                        : shell.navBorderHover,
                    },
                  }}
                  startIcon={
                    <IconWrapper
                      icon={
                        isAdminMode ? "mdi:shield-crown" : "mdi:shield-outline"
                      }
                      size={16}
                    />
                  }
                >
                  {isAdminMode ? t("common.studentMode") : t("common.adminMode")}
                </Button>
              )}
            </Box>
          )}
        </Box>
      )}
    </Box>
  );

  return (
    <>
      {/* Desktop Drawer - left in LTR, right in RTL */}
      <Drawer
        variant="permanent"
        sx={{
          display: { xs: "none", md: "block" },
          width: currentWidth,
          flexShrink: 0,
          "& .MuiDrawer-paper": {
            width: currentWidth,
            boxSizing: "border-box",
            backgroundColor: shell.shellBg,
            color: shell.nav,
            ...(rtl
              ? {
                  borderLeft: "1px solid",
                  right: 0,
                  left: "auto",
                }
              : {
                  borderRight: "1px solid",
                  left: 0,
                  right: "auto",
                }),
            borderColor: shell.navBorder,
            position: "fixed",
            height: "100vh",
            top: 0,
            transition: "width 0.3s ease",
            overflow: "hidden",
          },
        }}
      >
        {drawerContent}
      </Drawer>

      {/* Mobile Drawer - left in LTR, right in RTL */}
      <Drawer
        variant="temporary"
        anchor={rtl ? "right" : "left"}
        open={mobileOpen}
        onClose={onClose}
        ModalProps={{
          keepMounted: true,
        }}
        sx={{
          display: { xs: "block", md: "none" },
          "& .MuiDrawer-paper": {
            width: DRAWER_WIDTH,
            boxSizing: "border-box",
            backgroundColor: shell.shellBg,
            color: shell.nav,
            ...(rtl
              ? {
                  borderInlineStart: `1px solid ${shell.navBorder}`,
                }
              : { borderInlineEnd: "none" }),
          },
        }}
      >
        {drawerContent}
      </Drawer>
    </>
  );
};

export { DRAWER_WIDTH, DRAWER_WIDTH_COLLAPSED };
