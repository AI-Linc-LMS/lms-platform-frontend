"use client";

import { useRouter, usePathname } from "next/navigation";
import { Box, Paper, Typography } from "@mui/material";
import { IconWrapper } from "@/components/common/IconWrapper";
import { useClientInfo } from "@/lib/contexts/ClientInfoContext";
import { useAdminMode } from "@/lib/contexts/AdminModeContext";

interface NavigationItem {
  label: string;
  path: string;
  icon: string;
  featureName: string;
}

// Regular (non-admin) navigation items
const regularNavigationItems: NavigationItem[] = [
  {
    label: "Dashboard",
    path: "/dashboard",
    icon: "mdi:view-dashboard",
    featureName: "dashboard",
  },
  {
    label: "Courses",
    path: "/courses",
    icon: "mdi:book-open-variant",
    featureName: "course",
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
    label: "Course",
    path: "/admin/course-builder",
    icon: "mdi:book-edit",
    featureName: "admin_course_builder",
  },
  {
    label: "Assessments",
    path: "/admin/assessment",
    icon: "mdi:file-document-edit",
    featureName: "admin_assessment",
  },
  {
    label: "Verify Content",
    path: "/admin/verify-content",
    icon: "mdi:check-circle",
    featureName: "admin_verify_content",
  },
  {
    label: "Attendance",
    path: "/admin/attendance",
    icon: "mdi:calendar-check",
    featureName: "admin_attendance",
  },
  // {
  //   label: "Payment",
  //   path: "/admin/payment",
  //   icon: "mdi:credit-card-multiple",
  //   featureName: "admin_payment",
  // },
];

export const BottomNavigation: React.FC = () => {
  const router = useRouter();
  const pathname = usePathname();
  const { clientInfo, loading: loadingClientInfo } = useClientInfo();
  const { isAdminMode } = useAdminMode();

  // Combine navigation items based on mode
  const allNavigationItems = isAdminMode
    ? adminNavigationItems
    : regularNavigationItems;

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
      // In normal mode, exclude admin features
      return Array.from(enabledFeatureNames).filter(
        (name) => !name.startsWith("admin_")
      );
    }
  };

  const filteredFeatureNames = new Set(getFilteredFeatures());

  // Only show navigation items that are enabled in client features
  // Don't show any items while loading to avoid UX flash
  // Always show dashboard for regular users (even if feature doesn't exist)
  const filteredItems = loadingClientInfo
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

  // Helper function to get the correct path (admin items already have /admin/ prefix)
  const getNavigationPath = (item: NavigationItem): string => {
    return item.path;
  };

  const handleNavigation = (item: NavigationItem) => {
    const path = getNavigationPath(item);
    router.push(path);
  };

  return (
    <Paper
      sx={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 1000,
        display: { xs: "flex", md: "none" },
        borderTop: "1px solid",
        borderColor: "rgba(255, 255, 255, 0.1)",
        borderRadius: 0,
        boxShadow: "none",
        backgroundColor: "#1a1f2e", // Dark theme like sidebar
      }}
    >
      <Box
        sx={{
          display: "flex",
          width: "100%",
          justifyContent: "space-around",
          alignItems: "center",
          py: 1,
          px: 0.5,
          minHeight: 64,
        }}
      >
        {filteredItems.map((item) => {
          const navigationPath = getNavigationPath(item);
          const isActive =
            pathname === navigationPath ||
            pathname?.startsWith(navigationPath + "/");

          return (
            <Box
              key={item.path}
              onClick={() => handleNavigation(item)}
              sx={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                flex: 1,
                cursor: "pointer",
                py: 0.5,
                px: 0.25,
                borderRadius: 1,
                transition: "all 0.15s ease",
                minWidth: 0,
                "&:active": {
                  transform: "scale(0.95)",
                  opacity: 0.8,
                },
                "&:hover": {
                  "& svg": {
                    transform: isActive
                      ? "translateY(-2px) scale(1.1)"
                      : "translateY(-1px) scale(1.05)",
                    filter: isActive
                      ? "drop-shadow(0 3px 6px rgba(99, 102, 241, 0.6)) drop-shadow(0 2px 4px rgba(99, 102, 241, 0.5))"
                      : "drop-shadow(0 2px 4px rgba(255, 255, 255, 0.2))",
                  },
                },
              }}
            >
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  position: "relative",
                  mb: 0.25,
                  color: isActive ? "#a5b4fc" : "rgba(255, 255, 255, 0.7)",
                  "& svg": {
                    transition: "all 0.2s ease",
                    filter: isActive
                      ? "drop-shadow(0 2px 4px rgba(99, 102, 241, 0.5)) drop-shadow(0 1px 3px rgba(99, 102, 241, 0.4))"
                      : "drop-shadow(0 1px 2px rgba(0, 0, 0, 0.3))",
                    transform: isActive
                      ? "translateY(-1px) scale(1.05)"
                      : "translateY(0) scale(1)",
                  },
                }}
              >
                <IconWrapper
                  icon={item.icon}
                  size={24}
                  style={{
                    color: "inherit",
                  }}
                />
              </Box>
              <Typography
                variant="caption"
                sx={{
                  fontSize: "0.7rem",
                  fontWeight: isActive ? 600 : 400,
                  color: isActive ? "#a5b4fc" : "rgba(255, 255, 255, 0.7)",
                  textAlign: "center",
                  lineHeight: 1.2,
                  mt: 0.25,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                  maxWidth: "100%",
                }}
              >
                {item.label}
              </Typography>
            </Box>
          );
        })}
      </Box>
    </Paper>
  );
};
