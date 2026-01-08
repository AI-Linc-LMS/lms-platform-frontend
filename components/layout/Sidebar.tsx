"use client";

import { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
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

const DRAWER_WIDTH = 240;
const DRAWER_WIDTH_COLLAPSED = 64;

interface NavigationItem {
  label: string;
  path: string;
  icon: string;
  featureName: string;
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
  const { clientInfo, loading: loadingClientInfo } = useClientInfo();
  const { isAdminMode, toggleAdminMode } = useAdminMode();

  // Check if user can access admin mode
  const isAdminOrInstructor =
    user?.role === "admin" || user?.role === "instructor";
  const isSuperAdmin = user?.role === "superadmin";
  const canAccessAdmin = isAdminOrInstructor || isSuperAdmin;

  // Regular (non-admin) navigation items
  const regularNavigationItems: NavigationItem[] = [
    {
      label: "Dashboard",
      path: "/dashboard",
      icon: "mdi:view-dashboard",
      featureName: "dashboard", // Regular dashboard, not admin
    },
    {
      label: "Courses",
      path: "/courses",
      icon: "mdi:book-open-variant",
      featureName: "course",
    },
    {
      label: "Assessments",
      path: "/assessments",
      icon: "mdi:file-document-edit",
      featureName: "assessment",
    },
    {
      label: "Mock Interview",
      path: "/mock-interview",
      icon: "mdi:video-plus",
      featureName: "mock_interview",
    },
    {
      label: "Job Portal",
      path: "/jobs",
      icon: "mdi:briefcase",
      featureName: "job_portal",
    },
    {
      label: "Attendance",
      path: "/attendance",
      icon: "mdi:calendar-check",
      featureName: "attendance",
    },
    {
      label: "Community",
      path: "/community",
      icon: "mdi:forum",
      featureName: "community_forum",
    },
  ];

  // Admin navigation items - all routes start with /admin/
  const adminNavigationItems: NavigationItem[] = [
    {
      label: "Dashboard",
      path: "/admin/dashboard",
      icon: "mdi:view-dashboard",
      featureName: "admin_dashboard",
    },
    {
      label: "Manage Students",
      path: "/admin/manage-students",
      icon: "mdi:account-group",
      featureName: "admin_manage_students",
    },
    {
      label: "Course Builder",
      path: "/admin/course-builder",
      icon: "mdi:book-edit",
      featureName: "admin_course_builder",
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
    // {
    //   label: "Emails",
    //   path: "/admin/emails",
    //   icon: "mdi:email-multiple",
    //   featureName: "admin_emails",
    // },
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
    // {
    //   label: "Live",
    //   path: "/admin/live",
    //   icon: "mdi:video-box",
    //   featureName: "admin_live",
    // },
    // {
    //   label: "Verify Content",
    //   path: "/admin/verify-content",
    //   icon: "mdi:check-circle",
    //   featureName: "admin_verify_content",
    // },
    {
      label: "Assessment Management",
      path: "/admin/assessment",
      icon: "mdi:file-document-edit",
      featureName: "admin_assessment",
    },
    {
      label: "Attendance",
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

  // Combine all navigation items based on mode
  const allNavigationItems = isAdminMode
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

  // Filter features based on admin mode
  const getFilteredFeatures = () => {
    if (isAdminMode) {
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
  const navigationItems = loadingClientInfo
    ? []
    : filteredFeatureNames.size > 0
    ? allNavigationItems.filter((item) => {
        // Always show dashboard for regular users
        if (!isAdminMode && item.featureName === "dashboard") {
          return true;
        }
        return filteredFeatureNames.has(item.featureName);
      })
    : allNavigationItems;

  const handleNavigation = (item: NavigationItem) => {
    const path = getNavigationPath(item);
    router.push(path);
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
        backgroundColor: "#1a1f2e", // Always dark for hybrid design
        borderRight: "1px solid",
        borderColor: "rgba(255, 255, 255, 0.1)",
        overflow: "hidden",
      }}
    >
      {/* Logo Section */}
      <Box
        sx={{
          p: 2,
          height: 70,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderBottom: "1px solid",
          borderColor: "rgba(255, 255, 255, 0.1)",
        }}
      >
        <Box
          onClick={() =>
            router.push(isAdminMode ? "/admin/dashboard" : "/dashboard")
          }
          sx={{
            background:
              "linear-gradient(135deg, rgba(255, 255, 255, 0.12) 0%, rgba(255, 255, 255, 0.06) 100%)",
            borderRadius: 2,
            width: "100%",
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            px: 1.5,
            border: "1px solid rgba(255, 255, 255, 0.08)",
            boxShadow:
              "0 2px 8px rgba(0, 0, 0, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.1)",
            transition: "all 0.3s ease",
            cursor: "pointer",
            "&:hover": {
              background:
                "linear-gradient(135deg, rgba(255, 255, 255, 0.15) 0%, rgba(255, 255, 255, 0.08) 100%)",
              boxShadow:
                "0 4px 12px rgba(0, 0, 0, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.15)",
            },
          }}
        >
          {clientInfo?.app_logo_url ? (
            <Image
              src={clientInfo.app_logo_url}
              alt={clientInfo?.app_name || "Logo"}
              width={200}
              height={50}
              style={{
                width: "100%",
                height: "100%",
                objectFit: "contain",
              }}
              priority
            />
          ) : (
            <IconWrapper icon="mdi:school" size={32} color="#6366f1" />
          )}
        </Box>
      </Box>

      {/* Navigation Items */}
      <Box sx={{ flex: 1, py: 1.5, overflow: "hidden", minHeight: 0 }}>
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
                      sx={{ bgcolor: "rgba(255, 255, 255, 0.1)" }}
                    />
                    {!collapsed && (
                      <Skeleton
                        variant="text"
                        width="60%"
                        height={20}
                        sx={{ bgcolor: "rgba(255, 255, 255, 0.1)" }}
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
                  <ListItemButton
                    onClick={() => handleNavigation(item)}
                    sx={{
                      borderRadius: 1.5,
                      backgroundColor: isActive
                        ? "rgba(99, 102, 241, 0.2)"
                        : "transparent",
                      color: isActive ? "#a5b4fc" : "rgba(255, 255, 255, 0.7)",
                      py: 1,
                      px: collapsed ? 1.25 : 1.5,
                      justifyContent: collapsed ? "center" : "flex-start",
                      minHeight: 40,
                      position: "relative",
                      "&::before": isActive
                        ? {
                            content: '""',
                            position: "absolute",
                            left: 0,
                            top: "50%",
                            transform: "translateY(-50%)",
                            width: 3,
                            height: "50%",
                            backgroundColor: "#6366f1",
                            borderRadius: "0 3px 3px 0",
                          }
                        : {},
                      "&:hover": {
                        backgroundColor: isActive
                          ? "rgba(99, 102, 241, 0.3)"
                          : "rgba(255, 255, 255, 0.05)",
                        color: isActive ? "#a5b4fc" : "#ffffff",
                        "& .MuiListItemIcon-root svg": {
                          transform: "translateY(-2px) scale(1.1)",
                          filter:
                            "drop-shadow(0 3px 6px rgba(99, 102, 241, 0.5)) drop-shadow(0 2px 4px rgba(99, 102, 241, 0.4))",
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
                        "& svg": {
                          filter: isActive
                            ? "drop-shadow(0 2px 4px rgba(99, 102, 241, 0.4)) drop-shadow(0 1px 2px rgba(99, 102, 241, 0.3))"
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
                        primary={item.label}
                        primaryTypographyProps={{
                          fontSize: "1rem",
                          fontWeight: isActive ? 600 : 500,
                        }}
                      />
                    )}
                  </ListItemButton>
                </ListItem>
              );
            })
          )}
        </List>
      </Box>

      {/* User Profile & Settings */}
      {user && (
        <Box
          sx={{
            borderTop: "1px solid",
            borderColor: "rgba(255, 255, 255, 0.1)",
            mt: "auto",
          }}
        >
          {!collapsed && (
            <Box sx={{ p: 1.5 }}>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1.5,
                  mb: canAccessAdmin ? 1.5 : 0,
                }}
              >
                <Avatar
                  src={getUserProfilePicture(user)}
                  sx={{
                    width: 36,
                    height: 36,
                    border: "2px solid",
                    borderColor: "rgba(255, 255, 255, 0.2)",
                  }}
                >
                  {getUserInitials(user)}
                </Avatar>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography
                    variant="body2"
                    sx={{
                      fontWeight: 600,
                      color: "#ffffff",
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
                      color: "rgba(255, 255, 255, 0.6)",
                      fontSize: "0.9rem",
                    }}
                  >
                    {user?.role || "Student"}
                  </Typography>
                </Box>
              </Box>
              {/* Admin Mode Toggle Button */}
              {canAccessAdmin && (
                <Button
                  onClick={() => {
                    const newAdminMode = !isAdminMode;
                    toggleAdminMode();
                    // Navigate based on admin mode
                    if (newAdminMode) {
                      router.push("/admin/dashboard");
                    } else {
                      router.push("/dashboard");
                    }
                  }}
                  fullWidth
                  variant={isAdminMode ? "contained" : "outlined"}
                  sx={{
                    textTransform: "none",
                    fontSize: "0.875rem",
                    py: 0.75,
                    backgroundColor: isAdminMode
                      ? "rgba(99, 102, 241, 0.2)"
                      : "transparent",
                    borderColor: isAdminMode
                      ? "#6366f1"
                      : "rgba(255, 255, 255, 0.2)",
                    color: isAdminMode ? "#a5b4fc" : "rgba(255, 255, 255, 0.7)",
                    "&:hover": {
                      backgroundColor: isAdminMode
                        ? "rgba(99, 102, 241, 0.3)"
                        : "rgba(255, 255, 255, 0.05)",
                      borderColor: isAdminMode
                        ? "#6366f1"
                        : "rgba(255, 255, 255, 0.3)",
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
                  {isAdminMode ? "Switch to Student " : "Switch to Admin"}
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
      {/* Desktop Drawer */}
      <Drawer
        variant="permanent"
        sx={{
          display: { xs: "none", md: "block" },
          width: currentWidth,
          flexShrink: 0,
          "& .MuiDrawer-paper": {
            width: currentWidth,
            boxSizing: "border-box",
            borderRight: "1px solid",
            borderColor: "rgba(255, 255, 255, 0.1)",
            position: "fixed",
            height: "100vh",
            top: 0,
            left: 0,
            transition: "width 0.3s ease",
            overflow: "hidden",
          },
        }}
      >
        {drawerContent}
      </Drawer>

      {/* Mobile Drawer - Only for settings/profile access */}
      <Drawer
        variant="temporary"
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
            borderRight: "none",
          },
        }}
      >
        {drawerContent}
      </Drawer>
    </>
  );
};

export { DRAWER_WIDTH, DRAWER_WIDTH_COLLAPSED };
