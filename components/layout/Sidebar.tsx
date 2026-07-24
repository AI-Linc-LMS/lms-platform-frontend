"use client";

import { useState, useTransition, useMemo, useEffect, useRef } from "react";
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
  Collapse,
  Tooltip,
  IconButton,
} from "@mui/material";
import { IconWrapper } from "@/components/common/IconWrapper";
import { useAuth } from "@/lib/auth/auth-context";
import {
  getUserDisplayName,
  getUserInitials,
  getUserProfilePicture,
} from "@/lib/utils/user-utils";
import { useClientInfo, useThemePreview } from "@/lib/contexts/ClientInfoContext";
import { useAdminMode } from "@/lib/contexts/AdminModeContext";
import { Button } from "@mui/material";
import { useTranslation } from "react-i18next";
import { isRtl } from "@/lib/i18n";
import {
  isAdminOnlyRole,
  isFullAdminRole,
  isCourseManagerRole,
  isInstructorRole,
  isClientOrgAdminRole,
  COURSE_MANAGER_ADMIN_SIDEBAR_FEATURES,
  INSTRUCTOR_ADMIN_SIDEBAR_FEATURES,
} from "@/lib/auth/role-utils";
import { useTenantShellTheme } from "@/lib/theme/useTenantShellTheme";
import { normalizeThemeSettings } from "@/lib/theme/normalizeThemeSettings";
import { buildSidebarLogoBrandingUi } from "@/lib/theme/authHeroBranding";
import { resolveClientLogoUrl } from "@/lib/utils/resolveClientLogoUrl";

const DRAWER_WIDTH = 264;
const DRAWER_WIDTH_COLLAPSED = 64;

/**
 * Student sidebar is grouped into collapsible sections (an accordion). Items are
 * matched into a section by `featureName`; a couple stay standalone (Dashboard on
 * top, My Tickets at the bottom). Anything that matches no section still renders
 * as a standalone row, so a newly-added nav item can never silently disappear.
 */
interface NavSection {
  id: string;
  labelKey: string;
  label: string;
  icon: string;
  itemFeatures: string[];
}

const STUDENT_SECTIONS: NavSection[] = [
  {
    id: "learn",
    labelKey: "navSection.learn",
    label: "Learn",
    icon: "mdi:school-outline",
    itemFeatures: ["course", "adaptive_quiz", "assessment"],
  },
  {
    id: "career",
    labelKey: "navSection.career",
    label: "Career",
    icon: "mdi:briefcase-outline",
    itemFeatures: ["mock_interview", "jobs_v2", "resume"],
  },
  {
    id: "engage",
    labelKey: "navSection.engage",
    label: "Engage",
    icon: "mdi:account-group-outline",
    itemFeatures: ["attendance", "live_sessions", "community_forum"],
  },
];
const STUDENT_STANDALONE_TOP = ["dashboard"];
const STUDENT_STANDALONE_BOTTOM = ["support"];

// Admin nav gets the same collapsible-section treatment as the student side.
const ADMIN_SECTIONS: NavSection[] = [
  {
    id: "admin_people",
    labelKey: "navSection.people",
    label: "People",
    icon: "mdi:account-group-outline",
    itemFeatures: ["admin_manage_students", "admin_manage_instructors", "admin_cohorts"],
  },
  {
    id: "admin_content",
    labelKey: "navSection.content",
    label: "Content",
    icon: "mdi:book-multiple-outline",
    itemFeatures: [
      "admin_course_builder",
      "admin_ai_course_builder",
      "admin_adaptive_quizzes",
      "admin_verify_content",
      "admin_certificates",
    ],
  },
  {
    id: "admin_assessments",
    labelKey: "navSection.assessments",
    label: "Assessments",
    icon: "mdi:file-document-check-outline",
    itemFeatures: ["admin_assessment", "admin_scorecard"],
  },
  {
    id: "admin_engagement",
    labelKey: "navSection.engagement",
    label: "Engagement",
    icon: "mdi:calendar-star",
    itemFeatures: ["admin_live_sessions", "admin_mock_interview", "admin_attendance", "admin_jobs_v2"],
  },
  {
    id: "admin_comms",
    labelKey: "navSection.communications",
    label: "Communications",
    icon: "mdi:email-outline",
    itemFeatures: ["admin_emails", "admin_notifications"],
  },
  // Admin Settings moved out of the sidebar into the profile menu (top-right).
];
const ADMIN_STANDALONE_TOP = ["admin_dashboard"];
const ADMIN_STANDALONE_BOTTOM = ["admin_tickets"];

const SIDEBAR_SECTIONS_STORAGE_KEY = "sidebar_open_sections";
const ALL_SECTION_IDS = [...STUDENT_SECTIONS, ...ADMIN_SECTIONS].map((s) => s.id);

function SidebarSectionHeader({
  icon,
  label,
  expanded,
  active,
  onToggle,
  rtl,
  shell,
}: {
  icon: string;
  label: string;
  expanded: boolean;
  active: boolean;
  onToggle: () => void;
  rtl: boolean;
  shell: ReturnType<typeof useTenantShellTheme>;
}) {
  return (
    <ListItemButton
      onClick={onToggle}
      sx={{
        borderRadius: 1.5,
        py: 0.75,
        px: 1.5,
        minHeight: 38,
        mb: 0.25,
        flexDirection: rtl ? "row-reverse" : "row",
        color: active ? shell.nav : shell.navCaption,
        "&:hover": {
          backgroundColor: shell.navHoverBg,
          color: shell.nav,
        },
      }}
    >
      <ListItemIcon
        sx={{
          minWidth: 32,
          color: "inherit",
          justifyContent: "center",
          ...(rtl && { marginRight: 0, marginLeft: 1 }),
        }}
      >
        <IconWrapper icon={icon} size={16} />
      </ListItemIcon>
      <ListItemText
        primary={label}
        slotProps={{
          primary: {
            fontSize: "0.72rem",
            fontWeight: 700,
            letterSpacing: "0.06em",
            textTransform: "uppercase",
            color: "inherit",
          },
        }}
      />
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          color: shell.navCaption,
          transition: "transform 0.2s ease",
          transform: expanded ? "rotate(180deg)" : "rotate(0deg)",
        }}
      >
        <IconWrapper icon="mdi:chevron-down" size={16} />
      </Box>
    </ListItemButton>
  );
}

function SidebarNavButton({
  icon,
  label,
  isActive,
  collapsed,
  rtl,
  shell,
  indent = false,
}: {
  icon: string;
  label: string;
  isActive: boolean;
  collapsed: boolean;
  rtl: boolean;
  shell: ReturnType<typeof useTenantShellTheme>;
  /** Slightly inset row for items nested under a section header. */
  indent?: boolean;
}) {
  return (
    <ListItemButton
      sx={{
        borderRadius: 1.5,
        backgroundColor: isActive ? shell.activeBg : "transparent",
        color: isActive ? shell.activeText : shell.navMuted,
        py: 1,
        px: collapsed ? 1.25 : 1.5,
        ...(indent && !collapsed && (rtl ? { pr: 2.75 } : { pl: 2.75 })),
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
          backgroundColor: isActive ? shell.activeBgHover : shell.navHoverBg,
          color: isActive ? shell.activeText : shell.nav,
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
        <IconWrapper icon={icon} size={18} />
      </ListItemIcon>
      {!collapsed && (
        <ListItemText
          primary={label}
          slotProps={{
            primary: {
              fontSize: "1rem",
              fontWeight: isActive ? 600 : 500,
            },
          }}
        />
      )}
    </ListItemButton>
  );
}

interface NavigationItem {
  label: string;
  labelKey: string;
  path: string;
  icon: string;
  featureName: string;
  /** If set, show when any listed client admin feature is enabled (OR). */
  featureNamesAny?: string[];
  /** If true, only org admins (admin / superadmin) see this link. */
  orgAdminOnly?: boolean;
  /** i18n key for the one-line module explainer shown via the (i) tooltip. */
  descKey?: string;
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
  const { themeOverride } = useThemePreview();
  const shell = useTenantShellTheme();

  const themeFlat = useMemo(
    () => normalizeThemeSettings(themeOverride ?? clientInfo?.theme_settings),
    [clientInfo?.theme_settings, themeOverride]
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
      descKey: "navDesc.dashboard",
    },
    {
      label: "Courses",
      labelKey: "nav.courses",
      path: "/courses",
      icon: "mdi:book-open-variant",
      featureName: "course",
      descKey: "navDesc.courses",
    },
    {
      label: "Adaptive Courses",
      labelKey: "nav.adaptiveCourses",
      path: "/adaptive-courses",
      icon: "mdi:book-education-outline",
      featureName: "adaptive_quiz",
      descKey: "navDesc.adaptiveCourses",
    },
    {
      label: "Assessments",
      labelKey: "nav.assessments",
      path: "/assessments",
      icon: "mdi:file-document-edit",
      featureName: "assessment",
      descKey: "navDesc.assessments",
    },
    {
      label: "Mock Interview",
      labelKey: "nav.mockInterview",
      path: "/mock-interview",
      icon: "mdi:video-plus",
      featureName: "mock_interview",
      descKey: "navDesc.mockInterview",
    },
    {
      label: "Jobs",
      labelKey: "nav.jobsV2",
      path: "/jobs-v2",
      icon: "mdi:briefcase-search",
      featureName: "jobs_v2",
      descKey: "navDesc.jobsV2",
    },
    {
      label: "Resume",
      labelKey: "nav.resume",
      path: "/resume",
      icon: "mdi:file-account-outline",
      featureName: "resume",
      descKey: "navDesc.resume",
    },
    {
      label: "Attendance",
      labelKey: "nav.attendance",
      path: "/attendance",
      icon: "mdi:calendar-check",
      featureName: "attendance",
      descKey: "navDesc.attendance",
    },
    {
      label: "Live Sessions",
      labelKey: "nav.liveSessions",
      path: "/live-sessions",
      icon: "mdi:video-box",
      featureName: "live_sessions",
      descKey: "navDesc.liveSessions",
    },
    {
      label: "Community",
      labelKey: "nav.community",
      path: "/community",
      icon: "mdi:forum",
      featureName: "community_forum",
      descKey: "navDesc.community",
    },
    {
      label: "Support",
      labelKey: "nav.support",
      path: "/tickets",
      icon: "mdi:ticket-confirmation-outline",
      featureName: "support",
      descKey: "navDesc.support",
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
      descKey: "navDesc.admin_dashboard",
    },
    {
      label: "Manage Students",
      labelKey: "nav.manageStudents",
      path: "/admin/manage-students",
      icon: "mdi:account-group",
      featureName: "admin_manage_students",
      descKey: "navDesc.admin_manage_students",
    },
    {
      label: "Instructors",
      labelKey: "nav.instructors",
      path: "/admin/instructors",
      icon: "mdi:account-tie",
      featureName: "admin_manage_instructors",
      descKey: "navDesc.admin_manage_instructors",
      orgAdminOnly: true,
    },
    // "Settings" (admin logo / favicon / login-page text) now lives in the
    // profile menu (AppBar), not the sidebar.
    {
      label: "Course Builder",
      labelKey: "nav.courseBuilder",
      path: "/admin/course-builder",
      icon: "mdi:book-edit",
      featureName: "admin_course_builder",
      descKey: "navDesc.admin_course_builder",
    },
    {
      label: "AI Course Builder",
      labelKey: "nav.aiCourseBuilder",
      path: "/admin/ai-course-builder",
      icon: "mdi:robot",
      featureName: "admin_ai_course_builder",
      descKey: "navDesc.admin_ai_course_builder",
    },
    {
      label: "Cohorts",
      labelKey: "nav.adminCohorts",
      path: "/admin/cohorts",
      icon: "mdi:account-group",
      featureName: "admin_cohorts",
      descKey: "navDesc.admin_cohorts",
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
      descKey: "navDesc.admin_emails",
    },
    {
      label: "Notifications",
      labelKey: "nav.notifications",
      path: "/admin/notifications",
      icon: "mdi:bell-badge",
      featureName: "admin_notifications",
      descKey: "navDesc.admin_notifications",
    },
    {
      label: "Tickets",
      labelKey: "nav.adminTickets",
      path: "/admin/tickets",
      icon: "mdi:ticket-confirmation-outline",
      featureName: "admin_tickets",
      descKey: "navDesc.admin_tickets",
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
      descKey: "navDesc.admin_live_sessions",
    },
    {
      label: "Mock Interview",
      labelKey: "nav.adminMockInterview",
      path: "/admin/admin-mock-interview",
      icon: "mdi:account-voice",
      featureName: "admin_mock_interview",
      descKey: "navDesc.admin_mock_interview",
    },
    {
      label: "Verify Content",
      labelKey: "nav.verifyContent",
      path: "/admin/verify-content",
      icon: "mdi:check-circle",
      featureName: "admin_verify_content",
      descKey: "navDesc.admin_verify_content",
    },
    {
      label: "Assessment Management",
      labelKey: "nav.assessmentManagement",
      path: "/admin/assessment",
      icon: "mdi:file-document-edit",
      featureName: "admin_assessment",
      descKey: "navDesc.admin_assessment",
    },
    {
      label: "Adaptive Course Builder",
      labelKey: "nav.adminAdaptiveQuizzes",
      path: "/admin/adaptive-courses",
      icon: "mdi:robot-excited-outline",
      featureName: "admin_adaptive_quizzes",
      descKey: "navDesc.admin_adaptive_quizzes",
    },
    {
      label: "Scorecard",
      labelKey: "nav.adminScorecard",
      path: "/admin/scorecard",
      icon: "mdi:chart-box-outline",
      featureName: "admin_scorecard",
      descKey: "navDesc.admin_scorecard",
    },
    {
      label: "Certificate uploads",
      labelKey: "nav.certificateUploads",
      path: "/admin/certificates",
      icon: "mdi:certificate",
      featureName: "admin_certificates",
      descKey: "navDesc.admin_certificates",
    },
   
    {
      label: "Jobs",
      labelKey: "nav.adminJobsV2",
      path: "/admin/jobs-v2",
      icon: "mdi:briefcase-search",
      featureName: "admin_jobs_v2",
      descKey: "navDesc.admin_jobs_v2",
    },
    {
      label: "Attendance",
      labelKey: "nav.adminAttendance",
      path: "/admin/attendance",
      icon: "mdi:calendar-check",
      featureName: "admin_attendance",
      descKey: "navDesc.admin_attendance",
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
        // Support is always available to every signed-in user
        if (!effectiveAdminMode && item.featureName === "support") {
          return true;
        }
        // Resume builder is available to every student (no per-tenant flag).
        if (!effectiveAdminMode && item.featureName === "resume") {
          return true;
        }
        // (admin_scorecard used to be unconditionally shown here; it now
        // honors the per-client feature flag like every other admin item.
        // Super-admins can toggle "admin_scorecard" via the super-admin
        // portal's Client Features panel.)
        if (effectiveAdminMode && item.featureName === "admin_tickets") {
          return true;
        }
        const any = item.featureNamesAny;
        if (any?.length) {
          return any.some((n) => filteredFeatureNames.has(n));
        }
        return filteredFeatureNames.has(item.featureName);
      });
    } else {
      items = allNavigationItems;
    }

    if (isCourseManagerRole(role) && effectiveAdminMode) {
      const allow = new Set(COURSE_MANAGER_ADMIN_SIDEBAR_FEATURES);
      items = items.filter((item) => {
        const any = item.featureNamesAny;
        if (any?.length) {
          return any.some((f) => allow.has(f));
        }
        return allow.has(item.featureName);
      });
    }

    if (isInstructorRole(role) && effectiveAdminMode) {
      const allow = new Set(INSTRUCTOR_ADMIN_SIDEBAR_FEATURES);
      items = items.filter((item) => {
        const any = item.featureNamesAny;
        if (any?.length) {
          return any.some((f) => allow.has(f));
        }
        return allow.has(item.featureName);
      });
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

  // --- Sidebar accordion (student + admin) -----------------------------------
  // Which section config applies to the current mode.
  const activeSections = effectiveAdminMode ? ADMIN_SECTIONS : STUDENT_SECTIONS;
  const activeStandaloneTop = effectiveAdminMode
    ? ADMIN_STANDALONE_TOP
    : STUDENT_STANDALONE_TOP;
  const activeStandaloneBottom = effectiveAdminMode
    ? ADMIN_STANDALONE_BOTTOM
    : STUDENT_STANDALONE_BOTTOM;

  // Which sections are expanded. Persisted so the layout survives navigation and
  // reloads; defaults to all-open so nothing is hidden on a first visit.
  const [openSections, setOpenSections] = useState<Set<string>>(() => {
    if (typeof window === "undefined") return new Set(ALL_SECTION_IDS);
    try {
      const raw = window.localStorage.getItem(SIDEBAR_SECTIONS_STORAGE_KEY);
      if (raw) return new Set(JSON.parse(raw) as string[]);
    } catch {
      /* ignore malformed storage */
    }
    return new Set(ALL_SECTION_IDS);
  });

  const toggleSection = (id: string) => {
    setOpenSections((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      try {
        window.localStorage.setItem(SIDEBAR_SECTIONS_STORAGE_KEY, JSON.stringify([...next]));
      } catch {
        /* ignore quota / disabled storage */
      }
      return next;
    });
  };

  // Group the already-filtered flat list into sections for the current mode.
  // Feature-flag/role filtering is untouched - this is a display grouping only,
  // and any item matching no section still renders (as a standalone bottom row).
  const groupedNav = useMemo(() => {
    const map = new Map<string, NavigationItem[]>();
    activeSections.forEach((s) => map.set(s.id, []));
    const top: NavigationItem[] = [];
    const bottom: NavigationItem[] = [];
    const used = new Set<string>();

    navigationItems.forEach((item) => {
      if (activeStandaloneTop.includes(item.featureName)) {
        top.push(item);
        used.add(item.path);
        return;
      }
      if (activeStandaloneBottom.includes(item.featureName)) {
        bottom.push(item);
        used.add(item.path);
        return;
      }
      const sec = activeSections.find((s) => s.itemFeatures.includes(item.featureName));
      if (sec) {
        map.get(sec.id)!.push(item);
        used.add(item.path);
      }
    });

    const leftovers = navigationItems.filter((i) => !used.has(i.path));
    const sections = activeSections
      .map((s) => ({ ...s, items: map.get(s.id) as NavigationItem[] }))
      .filter((s) => s.items.length > 0);

    return { top, sections, bottom: [...bottom, ...leftovers] };
  }, [navigationItems, activeSections, activeStandaloneTop, activeStandaloneBottom]);

  // Open the section containing the current route - but ONLY when the route
  // actually changes. The filtered nav list is rebuilt on every render (the
  // feature-name Set is recreated each time), so groupedNav.sections changes
  // identity every render; without this guard the effect re-runs and instantly
  // re-opens a section the user just collapsed, making the section you are
  // currently in impossible to close (the "glitchy Engagement" bug).
  const autoOpenedForPathRef = useRef<string | null>(null);
  useEffect(() => {
    if (autoOpenedForPathRef.current === pathname) return;
    autoOpenedForPathRef.current = pathname ?? null;
    const activeSection = groupedNav.sections.find((s) =>
      s.items.some(
        (it) => pathname === it.path || pathname?.startsWith(it.path + "/")
      )
    );
    if (activeSection) {
      setOpenSections((prev) =>
        prev.has(activeSection.id) ? prev : new Set(prev).add(activeSection.id)
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, groupedNav.sections]);

  const renderNavRow = (item: NavigationItem, indent: boolean) => {
    const isActive =
      pathname === item.path || pathname?.startsWith(item.path + "/");
    const desc = item.descKey ? t(item.descKey, "") : "";
    return (
      <ListItem key={item.path} component="div" disablePadding sx={{ mb: 0.25 }}>
        <Box
          sx={{
            position: "relative",
            width: "100%",
            "&:hover .nav-info-btn": { opacity: 0.8 },
          }}
        >
          <Link
            href={item.path}
            prefetch={true}
            style={{ textDecoration: "none", color: "inherit", width: "100%", display: "block" }}
            onClick={() => handleNavigation(item)}
          >
            <SidebarNavButton
              icon={item.icon}
              label={t(item.labelKey, item.label)}
              isActive={!!isActive}
              collapsed={collapsed}
              indent={indent}
              rtl={rtl}
              shell={shell}
            />
          </Link>
          {desc && !collapsed && (
            <Tooltip title={desc} placement={rtl ? "left" : "right"} arrow>
              <IconButton
                className="nav-info-btn"
                size="small"
                aria-label={`${t(item.labelKey, item.label)} - info`}
                onClick={(e) => {
                  // Sibling of the <Link>, not a child, so it never navigates.
                  e.preventDefault();
                  e.stopPropagation();
                }}
                sx={{
                  position: "absolute",
                  top: "50%",
                  transform: "translateY(-50%)",
                  ...(rtl ? { left: 4 } : { right: 4 }),
                  p: 0.25,
                  opacity: 0.25,
                  color: shell.navMuted,
                  transition: "opacity 0.2s ease, color 0.2s ease",
                  "&:hover": {
                    opacity: 1,
                    color: shell.nav,
                    backgroundColor: shell.navHoverBg,
                  },
                }}
              >
                <IconWrapper icon="mdi:information-outline" size={14} />
              </IconButton>
            </Tooltip>
          )}
        </Box>
      </ListItem>
    );
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
        <List component="div" sx={{ py: 0, px: 1.5 }}>
          {loadingClientInfo ? (
            // Show loading skeletons while features are being loaded
            <>
              {[1, 2, 3, 4, 5].map((i) => (
                <ListItem key={i} component="div" disablePadding sx={{ mb: 0.25 }}>
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
            // Navigation (student + admin) grouped into collapsible sections.
            <>
              {groupedNav.top.map((item) => renderNavRow(item, false))}
              {groupedNav.sections.map((section) => {
                const expanded = openSections.has(section.id);
                const sectionActive = section.items.some(
                  (it) =>
                    pathname === it.path || pathname?.startsWith(it.path + "/")
                );
                return (
                  <Box key={section.id} sx={{ mt: 0.5 }}>
                    <SidebarSectionHeader
                      icon={section.icon}
                      label={t(section.labelKey, section.label)}
                      expanded={expanded}
                      active={sectionActive}
                      onToggle={() => toggleSection(section.id)}
                      rtl={rtl}
                      shell={shell}
                    />
                    <Collapse in={expanded} timeout="auto" unmountOnExit>
                      {section.items.map((item) => renderNavRow(item, true))}
                    </Collapse>
                  </Box>
                );
              })}
              {groupedNav.bottom.map((item) => renderNavRow(item, false))}
            </>
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
                    color: isAdminMode ? shell.activeText : shell.navMuted,
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
