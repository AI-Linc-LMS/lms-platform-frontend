"use client";

import { useState, useTransition, useMemo, useEffect, useRef } from "react";
import { useProfileGate } from "@/lib/contexts/ProfileGateContext";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
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
  getRoleLabel,
  getRoleAccent,
} from "@/lib/utils/user-utils";
import { useClientInfo, useThemePreview } from "@/lib/contexts/ClientInfoContext";
import { useAdminMode } from "@/lib/contexts/AdminModeContext";
import {
  ADMIN_NAV_ITEMS,
  ADMIN_SECTIONS,
  ADMIN_STANDALONE_BOTTOM,
  ADMIN_STANDALONE_TOP,
  INSTRUCTOR_NAV_ITEMS,
  STUDENT_NAV_ITEMS,
  STUDENT_SECTIONS,
  STUDENT_STANDALONE_BOTTOM,
  STUDENT_STANDALONE_TOP,
  type NavigationItem,
} from "@/lib/navigation/navModel";
import { Button } from "@mui/material";
import { useTranslation } from "react-i18next";
import { isRtl } from "@/lib/i18n";
import {
  isAdminOnlyRole,
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
import { TenantLogo } from "@/components/common/TenantLogo";

const DRAWER_WIDTH = 264;
const DRAWER_WIDTH_COLLAPSED = 64;

/**
 * The tenant name standing in for a logo that failed to load, in the logo's box.
 *
 * Block + centred text + a line-height equal to the box, not a centring flexbox: in a flex
 * container text-overflow never applies, so a long name ("Kalinga Institute of Industrial
 * Technology") was cut at both ends instead of ending in an ellipsis.
 */
export function sidebarWordmarkSx(logoHeightPx: number, color: string) {
  return {
    display: "block",
    textAlign: "center",
    lineHeight: `${logoHeightPx}px`,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
    fontSize: "1.05rem",
    color,
  } as const;
}

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
  locked = false,
  hasInfo = false,
}: {
  icon: string;
  label: string;
  isActive: boolean;
  /** Reachable, but gated. The row dims and shows a padlock; the link stays live on purpose. */
  locked?: boolean;
  /**
   * Whether the (i) tooltip button is rendered for this row. It is absolutely positioned at
   * right: 4, outside this component, so the padlock has to reserve room for it or the two
   * icons stack on top of each other.
   */
  hasInfo?: boolean;
  collapsed: boolean;
  rtl: boolean;
  shell: ReturnType<typeof useTenantShellTheme>;
  /** Slightly inset row for items nested under a section header. */
  indent?: boolean;
}) {
  const { t } = useTranslation("common");
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
        opacity: locked ? 0.72 : 1,
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
      {locked && !collapsed && (
        // A violet pill rather than a faint grey glyph. The old padlock read as "disabled",
        // which is the wrong story: these rows are reachable and the destination explains
        // exactly what is missing. A branded badge reads as "there is something here for you"
        // instead of "this is broken".
        <Tooltip
          title={t("lock.sidebarTooltip", "Complete your profile to unlock")}
          placement={rtl ? "left" : "right"}
          arrow
        >
          <Box
            component="span"
            sx={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
              width: 20,
              height: 20,
              borderRadius: "50%",
              color: "#fff",
              background: "linear-gradient(135deg, #7c3aed, #ec4899)",
              boxShadow: "0 2px 6px -2px rgba(124,58,237,0.8)",
              // The (i) button sits absolutely at right: 4 and is ~18px wide including its
              // padding. Without this the padlock renders underneath it.
              ...(hasInfo
                ? rtl
                  ? { ml: "22px" }
                  : { mr: "22px" }
                : {}),
            }}
          >
            <IconWrapper icon="mdi:lock" size={11} />
          </Box>
        </Tooltip>
      )}
    </ListItemButton>
  );
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
  const { user, loading: authLoading } = useAuth();
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
  // Instructors no longer toggle into student/admin views — only org admins keep the toggle.
  const canToggleAdminMode = isClientOrgAdminRole(role);
  const limitedAdmin = isAdminOnlyRole(role);
  /** Limited admins always use admin navigation; full admins follow toggle */
  const effectiveAdminMode = limitedAdmin || isAdminMode;

  // Regular (non-admin) navigation items

  // Admin navigation items - all routes start with /admin/

  const allNavigationItems = effectiveAdminMode
    ? ADMIN_NAV_ITEMS
    : STUDENT_NAV_ITEMS;

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
  /** The nav cannot be drawn yet: features, or the user's role, are still on their way. */
  const navResolving = loadingClientInfo || authLoading || !user?.role;

  const navigationItems = useMemo(() => {
    if (loadingClientInfo) return [];
    // Same rule for the USER: with the chrome now persistent across
    // navigation, rendering a default/pre-switch role's items while auth
    // resolves showed the WRONG role's nav for a beat — and an instructor
    // clicking one of those stale items is silently bounced by the proxy,
    // which reads as a dead click. No items until the role is known.
    if (authLoading || !user?.role) return [];
    // Instructors always get their own dedicated nav (no student/admin nav, no feature filtering).
    if (isInstructorRole(role)) return INSTRUCTOR_NAV_ITEMS;
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

    // An institution that does not issue certificates can switch the STUDENT surface off
    // (`Client.hide_certificates_from_students`, set from the super-admin portal). Admin
    // certificate management is a different entry with its own `admin_certificates` gate and is
    // deliberately untouched. The server enforces this too - hiding the link alone would leave
    // /certificates reachable by URL.
    if (clientInfo?.hide_certificates_from_students) {
      items = items.filter((item) => item.path !== "/certificates");
    }

    items = items.filter(
      (item) => !item.orgAdminOnly || isClientOrgAdminRole(role)
    );

    return items;
  }, [
    loadingClientInfo,
    authLoading,
    user?.role,
    filteredFeatureNames,
    allNavigationItems,
    effectiveAdminMode,
    role,
    clientInfo?.hide_certificates_from_students,
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

  const { lockedModules } = useProfileGate();

  /**
   * Locked, but still clickable on purpose. A dead nav item with no feedback is worse than a lock:
   * the destination page explains exactly which fields are missing and links to fix them.
   */
  const isGated = (item: NavigationItem) =>
    Boolean(item.gateKey && lockedModules.includes(item.gateKey));

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
              locked={isGated(item)}
              hasInfo={Boolean(desc && !collapsed)}
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
              {/* Plain <img>, NOT next/image: client-provided branding logos are often SVG or on
                  hosts the optimizer 400s on, which next/image silently dropped. */}
              {/* A failed load (DNS, an expired signed url) shows the tenant name, not a broken
                  image. */}
              <TenantLogo
                src={sidebarLogoUrl}
                name={clientInfo?.app_name || clientInfo?.name || "Logo"}
                imgStyle={{ width: "100%", height: "100%", objectFit: "contain" }}
                wordmarkSx={sidebarWordmarkSx(sidebarLogoSizing.logoHeightPx, shell.nav)}
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
          {navResolving ? (
            // Shimmer while EITHER half of what the nav needs is still arriving: the tenant's
            // features, or who the user is. It used to cover only the first, so the window where
            // the role was still loading rendered a blank sidebar - the half-empty page in the
            // report ("the navigation bar appears empty when returning").
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
                      fontWeight: 700,
                      color: shell.nav,
                      fontSize: "0.95rem",
                      lineHeight: 1.3,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                    title={getUserDisplayName(user)}
                  >
                    {getUserDisplayName(user)}
                  </Typography>
                  {/* The role reads as a label, not as an award.
                      It carried a filled accent background, a matching border, a crown icon,
                      uppercase and letter-spacing all at once — five emphases on one 11px word,
                      directly above a mode button wearing the same crown. It also introduced a
                      fixed hue into the one surface that is entirely tenant-branded.
                      This follows the platform's pill convention (dashboard `BandPill`): colour
                      in the text, a neutral tint behind it, sentence case, no border, no icon. */}
                  <Box
                    component="span"
                    sx={{
                      mt: 0.4,
                      display: "inline-block",
                      maxWidth: "100%",
                      px: 0.85,
                      py: 0.2,
                      borderRadius: 999,
                      fontSize: "0.68rem",
                      fontWeight: 700,
                      lineHeight: 1.5,
                      color: getRoleAccent(user?.role),
                      bgcolor: shell.roleChipBg,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {getRoleLabel(user?.role)}
                  </Box>
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
