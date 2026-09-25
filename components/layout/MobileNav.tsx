"use client";

import { useMemo } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { Box, ButtonBase, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";
import { IconWrapper } from "@/components/common/IconWrapper";
import { useTenantShellTheme } from "@/lib/theme/useTenantShellTheme";
import { useNavigation } from "@/lib/navigation/useNavigation";
import { resolveActiveNavPath, type NavigationItem } from "@/lib/navigation/navModel";
import { useMobileMenu } from "./MobileMenu";

/* ==========================================================================
 * The phone's dock: four daily destinations and the Menu, floating over the page.
 *
 * The first version was a flat strip pinned to the bottom edge - five equal columns of icon and
 * label, which works but reads as a default. This one is a capsule that floats clear of the screen
 * edges on the tenant's shell colour, and the ACTIVE destination expands into a pill carrying its
 * name while the others stay icon-only. That is what lets four destinations plus Menu breathe in
 * 390px: only one label is ever drawn, and it is the one that says where you are.
 *
 * Menu opens the full launcher (MobileMenu) - every module the tenant has, grouped and
 * searchable - so nothing is more than two taps away. Both read one feature-gated model.
 * ======================================================================== */

/** What earns a permanent slot, in order. Everything else lives in the Menu. */
const STUDENT_BAR_PRIORITY = [
  "dashboard",
  "adaptive_quiz",
  "course",
  "assessment",
  "live_sessions",
  "jobs_v2",
  "community_forum",
];
const ADMIN_BAR_PRIORITY = [
  "admin_dashboard",
  "admin_manage_students",
  "admin_assessment",
  "admin_live_sessions",
  "admin_cohorts",
];
const INSTRUCTOR_BAR_PRIORITY = ["instructor"];

const BAR_SLOTS = 4;
/**
 * An inactive tab's width: an icon plus a 44px+ target. With a 2px gap this leaves the active tab
 * 160px on an iPhone 14 and 130px on a 360px Android, enough for "Live Sessions" and
 * "Assessments" (measured on the live dock), where 48px and a 4px gap cut them off at 360.
 */
const TAB_PX = 46;

export function useBarItems(): { bar: NavigationItem[]; rest: NavigationItem[] } {
  const { items, effectiveAdminMode } = useNavigation();
  return useMemo(() => {
    const priority = effectiveAdminMode
      ? ADMIN_BAR_PRIORITY
      : items.some((i) => i.featureName === "instructor")
        ? INSTRUCTOR_BAR_PRIORITY
        : STUDENT_BAR_PRIORITY;
    const ranked = [...items].sort((a, b) => {
      const ai = priority.indexOf(a.featureName);
      const bi = priority.indexOf(b.featureName);
      return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
    });
    const bar = ranked.slice(0, BAR_SLOTS);
    const barPaths = new Set(bar.map((i) => i.path));
    return { bar, rest: items.filter((i) => !barPaths.has(i.path)) };
  }, [items, effectiveAdminMode]);
}

export function MobileNav() {
  const pathname = usePathname();
  const { t } = useTranslation("common");
  const shell = useTenantShellTheme();
  const { items, resolving } = useNavigation();
  const { bar, rest } = useBarItems();
  /**
   * Resolved once against the WHOLE nav, not per tab: a nested entry and its parent both
   * matching the route is what lit two rows at once in the sidebar, and the dock reads the
   * same model. Membership in `bar` or `rest` is then a plain comparison.
   */
  const activePath = resolveActiveNavPath(pathname, items.map((i) => i.path));
  const menu = useMobileMenu();

  if (resolving || bar.length === 0) return null;

  const fullLabel = (item: NavigationItem) => t(item.labelKey, item.label) as string;
  const dockLabel = (item: NavigationItem) =>
    item.dockLabelKey ? (t(item.dockLabelKey, item.dockLabel ?? item.label) as string) : fullLabel(item);
  const menuActive = menu.isOpen || rest.some((i) => i.path === activePath);

  return (
    <Box
      component="nav"
      aria-label={t("nav.primary", "Primary") as string}
      data-testid="mobile-nav"
      sx={{
        position: "fixed",
        insetInline: 12,
        // Floats above the home indicator rather than sitting on it.
        bottom: "calc(env(safe-area-inset-bottom) + 10px)",
        zIndex: 1200,
        display: { xs: "flex", md: "none" },
        alignItems: "center",
        gap: "2px",
        p: 0.75,
        borderRadius: 999,
        color: shell.nav,
        // The tenant's shell colour, glassy: the page shows through faintly as it scrolls under.
        backgroundColor: `color-mix(in srgb, ${shell.shellBg} 88%, transparent)`,
        backdropFilter: "blur(14px) saturate(160%)",
        WebkitBackdropFilter: "blur(14px) saturate(160%)",
        border: "1px solid",
        borderColor: shell.navBorder,
        boxShadow: "0 12px 32px -12px rgba(15,23,42,0.55), 0 2px 6px rgba(15,23,42,0.18)",
      }}
    >
      {bar.map((item) => {
        const active = item.path === activePath;
        return (
          <ButtonBase
            key={item.path}
            component={Link}
            href={item.path}
            aria-current={active ? "page" : undefined}
            aria-label={fullLabel(item)}
            sx={{
              // Every tab starts at a 48px icon target; only the active one grows, taking all the
              // room left over. Proportional shares (1.9 : 1) left "Dashboard" 104px wide and cut
              // to "Dashbo…" on an iPhone 14. Only flex-grow changes, so the switch still slides.
              flex: `${active ? 1 : 0} 0 ${TAB_PX}px`,
              minWidth: 0,
              height: 52,
              borderRadius: 999,
              gap: 0.75,
              px: 1,
              color: active ? shell.activeText : shell.navMuted,
              backgroundColor: active ? shell.activeBg : "transparent",
              transition: "flex-grow .28s cubic-bezier(.4,0,.2,1), background-color .2s ease, color .2s ease",
              "&:active": { transform: "scale(0.96)" },
            }}
          >
            <IconWrapper icon={item.icon} size={22} />
            {active && (
              <Typography
                data-testid="mobile-nav-label"
                // 12px is the floor on a phone. Below 380px the active tab has ~86px for its name,
                // which every dock label fits at 12px (the long admin names use dockLabel).
                sx={{ fontSize: "0.8rem", "@media (max-width:379.95px)": { fontSize: "0.75rem" }, fontWeight: 800, color: "inherit", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", minWidth: 0 }}
              >
                {dockLabel(item)}
              </Typography>
            )}
          </ButtonBase>
        );
      })}
      <ButtonBase
        onClick={menu.open}
        aria-haspopup="dialog"
        aria-expanded={menu.isOpen}
        aria-label={t("nav.menu", "Menu") as string}
        data-testid="mobile-nav-more"
        sx={{
          flex: `0 0 ${TAB_PX}px`,
          minWidth: 0,
          height: 52,
          borderRadius: 999,
          color: menuActive ? shell.activeText : shell.navMuted,
          backgroundColor: menuActive ? shell.activeBg : "transparent",
          transition: "background-color .2s ease, color .2s ease",
          "&:active": { transform: "scale(0.96)" },
        }}
      >
        <IconWrapper icon="mdi:dots-grid" size={22} />
      </ButtonBase>
    </Box>
  );
}
