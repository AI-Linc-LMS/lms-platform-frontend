"use client";

import { useMemo } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { Box, ButtonBase, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";
import { IconWrapper } from "@/components/common/IconWrapper";
import { useTenantShellTheme } from "@/lib/theme/useTenantShellTheme";
import { useNavigation } from "@/lib/navigation/useNavigation";
import { isNavItemActive, type NavigationItem } from "@/lib/navigation/navModel";
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
  const { resolving } = useNavigation();
  const { bar, rest } = useBarItems();
  const menu = useMobileMenu();

  if (resolving || bar.length === 0) return null;

  const fullLabel = (item: NavigationItem) => t(item.labelKey, item.label) as string;
  const menuActive = menu.isOpen || rest.some((i) => isNavItemActive(pathname, i.path));

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
        gap: 0.5,
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
        const active = isNavItemActive(pathname, item.path);
        return (
          <ButtonBase
            key={item.path}
            component={Link}
            href={item.path}
            aria-current={active ? "page" : undefined}
            aria-label={fullLabel(item)}
            sx={{
              // The active tab takes the room; the rest shrink to an icon. The transition on
              // flex-grow is what makes it slide when you switch.
              flex: active ? "1.9 1 0" : "1 1 0",
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
                sx={{ fontSize: "0.8rem", fontWeight: 800, color: "inherit", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", minWidth: 0 }}
              >
                {fullLabel(item)}
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
          flex: "1 1 0",
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
