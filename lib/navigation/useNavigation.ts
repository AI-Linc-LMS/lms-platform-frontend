"use client";

import { useMemo } from "react";
import { useAuth } from "@/lib/auth/auth-context";
import { useClientInfo } from "@/lib/contexts/ClientInfoContext";
import { useAdminMode } from "@/lib/contexts/AdminModeContext";
import {
  COURSE_MANAGER_ADMIN_SIDEBAR_FEATURES,
  INSTRUCTOR_ADMIN_SIDEBAR_FEATURES,
  isAdminOnlyRole,
  isClientOrgAdminRole,
  isCourseManagerRole,
  isInstructorRole,
} from "@/lib/auth/role-utils";
import {
  ADMIN_NAV_ITEMS,
  INSTRUCTOR_NAV_ITEMS,
  STUDENT_NAV_ITEMS,
  filterNavigationItems,
  groupNavigation,
  type GroupedNav,
  type NavigationItem,
} from "./navModel";

export interface NavigationModel {
  /** Every item this user may reach, already feature- and role-filtered. */
  items: NavigationItem[];
  /** The same items grouped the way the sidebar and the More sheet render them. */
  grouped: GroupedNav;
  effectiveAdminMode: boolean;
  /** True while the role or the client's features are still unknown - render nothing yet. */
  resolving: boolean;
}

/**
 * The navigation a given user actually has, resolved once and shared by every surface.
 *
 * Nothing is returned while the role or the feature list is unknown: rendering a default role's
 * items for a beat showed the wrong nav, and a click on one of those stale entries is bounced by
 * the proxy, which reads as a dead tap.
 */
export function useNavigation(): NavigationModel {
  const { user, loading: authLoading } = useAuth();
  const { clientInfo, loading: loadingClientInfo } = useClientInfo();
  const { isAdminMode } = useAdminMode();

  const role = user?.role;
  const effectiveAdminMode = isAdminOnlyRole(role) || isAdminMode;
  const resolving = loadingClientInfo || authLoading || !role;

  const featureNames = useMemo(() => {
    const all = new Set(clientInfo?.features?.map((f) => f.name) || []);
    // Admin mode sees the admin_* features; student mode sees everything else. Same split the
    // sidebar has always used, so one mode can never show the other's entries.
    return new Set(
      Array.from(all).filter((n) =>
        effectiveAdminMode ? n.startsWith("admin_") : !n.startsWith("admin_"),
      ),
    );
  }, [clientInfo?.features, effectiveAdminMode]);

  const items = useMemo(() => {
    if (resolving) return [];
    // Instructors have a dedicated nav: never the student or admin one, and no feature filtering.
    if (isInstructorRole(role) && !effectiveAdminMode) return INSTRUCTOR_NAV_ITEMS;

    let allowOnly: readonly string[] | undefined;
    if (effectiveAdminMode && isCourseManagerRole(role)) allowOnly = COURSE_MANAGER_ADMIN_SIDEBAR_FEATURES;
    if (effectiveAdminMode && isInstructorRole(role)) allowOnly = INSTRUCTOR_ADMIN_SIDEBAR_FEATURES;

    return filterNavigationItems({
      items: effectiveAdminMode ? ADMIN_NAV_ITEMS : STUDENT_NAV_ITEMS,
      featureNames,
      effectiveAdminMode,
      isOrgAdmin: isClientOrgAdminRole(role),
      hideCertificatesFromStudents: Boolean(clientInfo?.hide_certificates_from_students),
      allowOnly,
    });
  }, [resolving, role, effectiveAdminMode, featureNames, clientInfo?.hide_certificates_from_students]);

  const grouped = useMemo(() => groupNavigation(items, effectiveAdminMode), [items, effectiveAdminMode]);

  return { items, grouped, effectiveAdminMode, resolving };
}
