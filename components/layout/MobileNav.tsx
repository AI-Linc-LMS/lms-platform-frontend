"use client";

import { useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { Box, ButtonBase, Drawer, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";
import { IconWrapper } from "@/components/common/IconWrapper";
import { useTenantShellTheme } from "@/lib/theme/useTenantShellTheme";
import { useAdminMode } from "@/lib/contexts/AdminModeContext";
import { useAuth } from "@/lib/auth/auth-context";
import { isClientOrgAdminRole } from "@/lib/auth/role-utils";
import { useNavigation } from "@/lib/navigation/useNavigation";
import { isNavItemActive, type NavigationItem } from "@/lib/navigation/navModel";

/* ==========================================================================
 * The phone's navigation: a bar of the four places people go daily, and a sheet holding
 * everything else this tenant has switched on.
 *
 * The old bar rendered every enabled module side by side, so a full tenant squeezed six labels
 * into 390px until each ellipsised to a couple of characters, and the modules that did not fit
 * (Certificates, Roadmaps, the AI tutor, the Resume builder, Leaderboard) were simply absent -
 * reachable only by opening the drawer meant for desktop and scrolling it.
 *
 * Now the bar holds at most five targets, each a 56px-tall column with a real label, and "More"
 * opens a sheet listing every remaining module GROUPED the way the sidebar groups them. Both read
 * one feature-gated model (lib/navigation), so a module a client does not have never appears, and
 * one it does have is always reachable in at most two taps.
 * ======================================================================== */

/** What earns a permanent slot, in order. Everything else lives one tap away under More. */
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

/** Four plus More. Five 78px columns is the most 390px fits with a legible 12px label. */
const BAR_SLOTS = 4;

function useBarItems(): { bar: NavigationItem[]; rest: NavigationItem[] } {
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
  const router = useRouter();
  const { t } = useTranslation("common");
  const shell = useTenantShellTheme();
  const { grouped, resolving, effectiveAdminMode } = useNavigation();
  const { bar, rest } = useBarItems();
  const { isAdminMode, toggleAdminMode } = useAdminMode();
  const { user } = useAuth();
  const [moreOpen, setMoreOpen] = useState(false);

  if (resolving || bar.length === 0) return null;

  const label = (item: NavigationItem) => t(item.labelKey, item.label) as string;
  const moreActive = rest.some((i) => isNavItemActive(pathname, i.path));

  return (
    <>
      <Box
        component="nav"
        aria-label={t("nav.primary", "Primary") as string}
        data-testid="mobile-nav"
        sx={{
          position: "fixed",
          insetInline: 0,
          bottom: 0,
          zIndex: 1200,
          display: { xs: "flex", md: "none" },
          alignItems: "stretch",
          backgroundColor: shell.shellBg,
          color: shell.nav,
          borderTop: "1px solid",
          borderColor: shell.navBorder,
          // Clear of the iOS home indicator, and of Android's gesture bar.
          pb: "env(safe-area-inset-bottom)",
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
              sx={{
                flex: 1,
                minWidth: 0,
                flexDirection: "column",
                gap: 0.25,
                py: 1,
                px: 0.5,
                minHeight: 56,
                color: active ? shell.activeText : shell.navMuted,
              }}
            >
              <NavIcon icon={item.icon} active={active} shell={shell} />
              <NavLabel active={active}>{label(item)}</NavLabel>
            </ButtonBase>
          );
        })}
        <ButtonBase
          onClick={() => setMoreOpen(true)}
          aria-haspopup="dialog"
          aria-expanded={moreOpen}
          data-testid="mobile-nav-more"
          sx={{
            flex: 1,
            minWidth: 0,
            flexDirection: "column",
            gap: 0.25,
            py: 1,
            px: 0.5,
            minHeight: 56,
            color: moreActive ? shell.activeText : shell.navMuted,
          }}
        >
          <NavIcon icon="mdi:dots-grid" active={moreActive} shell={shell} />
          <NavLabel active={moreActive}>{t("nav.more", "More") as string}</NavLabel>
        </ButtonBase>
      </Box>

      <Drawer
        anchor="bottom"
        open={moreOpen}
        onClose={() => setMoreOpen(false)}
        slotProps={{
          paper: {
            sx: {
              borderTopLeftRadius: 20,
              borderTopRightRadius: 20,
              maxHeight: "82vh",
              backgroundColor: "var(--card-bg, #fff)",
              backgroundImage: "none",
              pb: "calc(env(safe-area-inset-bottom) + 12px)",
            },
          },
        }}
        sx={{ display: { xs: "block", md: "none" } }}
      >
        <Box sx={{ pt: 1.25, px: 2 }}>
          <Box sx={{ width: 40, height: 4, borderRadius: 999, bgcolor: "var(--border-default, #e5e7eb)", mx: "auto", mb: 1.5 }} />
          <Typography sx={{ fontWeight: 800, fontSize: "1.05rem", color: "var(--font-primary)" }}>
            {t("nav.allModules", "All modules")}
          </Typography>
          <Typography sx={{ fontSize: "0.8rem", color: "var(--font-secondary)", mt: 0.25 }}>
            {t("nav.allModulesSub", "Everything your programme includes.")}
          </Typography>
        </Box>

        <Box sx={{ px: 2, pt: 2, overflowY: "auto" }}>
          {grouped.sections.map((section) => {
            const items = section.items.filter((i) => rest.some((r) => r.path === i.path));
            if (items.length === 0) return null;
            return (
              <Box key={section.id} sx={{ mb: 2.5 }}>
                <Typography
                  sx={{
                    fontSize: "0.7rem",
                    fontWeight: 800,
                    letterSpacing: 0.8,
                    textTransform: "uppercase",
                    color: "var(--font-tertiary)",
                    mb: 1,
                  }}
                >
                  {t(section.labelKey, section.label)}
                </Typography>
                <ModuleGrid items={items} pathname={pathname} label={label} onNavigate={() => setMoreOpen(false)} />
              </Box>
            );
          })}

          {(() => {
            const loose = [...grouped.top, ...grouped.bottom].filter((i) => rest.some((r) => r.path === i.path));
            if (loose.length === 0) return null;
            return (
              <Box sx={{ mb: 2.5 }}>
                <Typography sx={{ fontSize: "0.7rem", fontWeight: 800, letterSpacing: 0.8, textTransform: "uppercase", color: "var(--font-tertiary)", mb: 1 }}>
                  {t("nav.more", "More")}
                </Typography>
                <ModuleGrid items={loose} pathname={pathname} label={label} onNavigate={() => setMoreOpen(false)} />
              </Box>
            );
          })()}

          <Box sx={{ display: "flex", flexDirection: "column", gap: 1, pb: 1 }}>
            {isClientOrgAdminRole(user?.role) && (
              <SheetRow
                icon={isAdminMode ? "mdi:school-outline" : "mdi:shield-crown-outline"}
                label={
                  isAdminMode
                    ? (t("nav.switchToStudent", "Switch to student view") as string)
                    : (t("nav.switchToAdmin", "Switch to admin mode") as string)
                }
                onClick={() => {
                  toggleAdminMode();
                  setMoreOpen(false);
                  router.push(effectiveAdminMode ? "/dashboard" : "/admin/dashboard");
                }}
              />
            )}
            <SheetRow
              icon="mdi:account-circle-outline"
              label={t("nav.profile", "Profile") as string}
              onClick={() => {
                setMoreOpen(false);
                router.push("/profile");
              }}
            />
          </Box>
        </Box>
      </Drawer>
    </>
  );
}

function NavIcon({ icon, active, shell }: { icon: string; active: boolean; shell: ReturnType<typeof useTenantShellTheme> }) {
  return (
    <Box
      sx={{
        width: 44,
        height: 26,
        borderRadius: 999,
        display: "grid",
        placeItems: "center",
        // The active pill is the whole affordance: on a phone a colour change alone is easy to
        // miss, and an underline collides with the home indicator.
        backgroundColor: active ? shell.activeBg : "transparent",
        transition: "background-color .15s ease",
      }}
    >
      <IconWrapper icon={icon} size={21} />
    </Box>
  );
}

function NavLabel({ active, children }: { active: boolean; children: React.ReactNode }) {
  return (
    <Typography
      sx={{
        fontSize: "0.75rem",
        fontWeight: active ? 800 : 600,
        lineHeight: 1.15,
        textAlign: "center",
        // Two lines, so "Live Sessions" reads as itself instead of ellipsising to "Live S…".
        display: "-webkit-box",
        WebkitLineClamp: 2,
        WebkitBoxOrient: "vertical",
        overflow: "hidden",
        maxWidth: "100%",
        color: "inherit",
      }}
    >
      {children}
    </Typography>
  );
}

function ModuleGrid({
  items,
  pathname,
  label,
  onNavigate,
}: {
  items: NavigationItem[];
  pathname: string | null;
  label: (i: NavigationItem) => string;
  /** The chrome persists across navigation, so the sheet has to be dismissed by the tap itself. */
  onNavigate: () => void;
}) {
  return (
    <Box sx={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: 1, "& > *": { minWidth: 0 } }}>
      {items.map((item) => {
        const active = isNavItemActive(pathname, item.path);
        return (
          <ButtonBase
            key={item.path}
            component={Link}
            href={item.path}
            onClick={onNavigate}
            sx={{
              justifyContent: "flex-start",
              gap: 1.25,
              p: 1.25,
              minHeight: 56,
              borderRadius: 3,
              border: "1px solid",
              borderColor: active ? "var(--primary-300, #c4b5fd)" : "var(--border-default, #eef2f7)",
              backgroundColor: active ? "var(--surface-indigo-light, #f5f3ff)" : "var(--card-bg, #fff)",
              textAlign: "start",
            }}
          >
            <Box
              sx={{
                width: 34,
                height: 34,
                flexShrink: 0,
                borderRadius: 2,
                display: "grid",
                placeItems: "center",
                color: "var(--primary-600, #7c3aed)",
                backgroundColor: "var(--surface-indigo-light, #f5f3ff)",
              }}
            >
              <IconWrapper icon={item.icon} size={19} />
            </Box>
            <Typography
              sx={{
                fontSize: "0.85rem",
                fontWeight: active ? 800 : 600,
                color: "var(--font-primary)",
                lineHeight: 1.2,
                minWidth: 0,
              }}
            >
              {label(item)}
            </Typography>
          </ButtonBase>
        );
      })}
    </Box>
  );
}

function SheetRow({ icon, label, onClick }: { icon: string; label: string; onClick: () => void }) {
  return (
    <ButtonBase
      onClick={onClick}
      sx={{
        justifyContent: "flex-start",
        gap: 1.25,
        px: 1.5,
        minHeight: 48,
        borderRadius: 3,
        border: "1px solid var(--border-default, #eef2f7)",
        color: "var(--font-primary)",
        fontWeight: 700,
        fontSize: "0.88rem",
      }}
    >
      <IconWrapper icon={icon} size={19} />
      {label}
    </ButtonBase>
  );
}
