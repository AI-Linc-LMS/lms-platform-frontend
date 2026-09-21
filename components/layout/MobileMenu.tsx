"use client";

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { Avatar, Box, ButtonBase, Drawer, IconButton, InputBase, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";
import { IconWrapper } from "@/components/common/IconWrapper";
import { useAuth } from "@/lib/auth/auth-context";
import { useAdminMode } from "@/lib/contexts/AdminModeContext";
import { useClientInfo } from "@/lib/contexts/ClientInfoContext";
import { isClientOrgAdminRole } from "@/lib/auth/role-utils";
import { useNavigation } from "@/lib/navigation/useNavigation";
import { isNavItemActive, type NavigationItem } from "@/lib/navigation/navModel";

/* ==========================================================================
 * The phone's menu: every module this tenant has, as a launcher.
 *
 * The phone had no way to see the whole product. The bottom bar holds four destinations, and the
 * drawer the top bar was wired to open had no button to open it on a phone. This is that missing
 * place: a full-height sheet from the hamburger (or the dock's Menu tab) with who you are at the
 * top, a search box, and every module as a tile, grouped the way the sidebar groups them.
 *
 * One model feeds it (lib/navigation), so a module the client has not switched on never appears
 * and one it has is always here.
 * ======================================================================== */

interface MobileMenuState {
  isOpen: boolean;
  open: () => void;
  close: () => void;
  toggle: () => void;
}

const MobileMenuContext = createContext<MobileMenuState | null>(null);

/** Open/close the phone menu from anywhere in the chrome (the hamburger, the dock). */
export function useMobileMenu(): MobileMenuState {
  const ctx = useContext(MobileMenuContext);
  // Outside a provider (a bare unit render), a no-op keeps the caller rendering.
  return ctx ?? { isOpen: false, open: () => {}, close: () => {}, toggle: () => {} };
}

/** Holds the menu's open state and renders the menu once for the whole chrome. */
export function MobileMenuProvider({ children }: { children: ReactNode }) {
  const [isOpen, setOpen] = useState(false);
  const open = useCallback(() => setOpen(true), []);
  const close = useCallback(() => setOpen(false), []);
  const toggle = useCallback(() => setOpen((o) => !o), []);
  const value = useMemo(() => ({ isOpen, open, close, toggle }), [isOpen, open, close, toggle]);
  return (
    <MobileMenuContext.Provider value={value}>
      {children}
      <MobileMenu open={isOpen} onClose={close} />
    </MobileMenuContext.Provider>
  );
}

/** One accent per group, so the launcher reads as sections at a glance. */
const SECTION_ACCENT: Record<string, [string, string]> = {
  learn: ["#7c3aed", "#a855f7"],
  career: ["#f59e0b", "#f97316"],
  engage: ["#0ea5e9", "#6366f1"],
  admin_people: ["#7c3aed", "#a855f7"],
  admin_content: ["#10b981", "#0ea5e9"],
  admin_assessments: ["#f59e0b", "#f97316"],
  admin_engagement: ["#ec4899", "#8b5cf6"],
  admin_comms: ["#0ea5e9", "#6366f1"],
};
const DEFAULT_ACCENT: [string, string] = ["#64748b", "#475569"];

export function MobileMenu({ open, onClose }: { open: boolean; onClose: () => void }) {
  const pathname = usePathname();
  const router = useRouter();
  const { t } = useTranslation("common");
  const { user, logout } = useAuth();
  const { clientInfo } = useClientInfo();
  const { isAdminMode, toggleAdminMode } = useAdminMode();
  const { grouped, effectiveAdminMode } = useNavigation();
  const [query, setQuery] = useState("");

  const label = useCallback((item: NavigationItem) => t(item.labelKey, item.label) as string, [t]);
  const q = query.trim().toLowerCase();
  const matches = (item: NavigationItem) => !q || label(item).toLowerCase().includes(q);

  const groups = useMemo(() => {
    const out: { id: string; title: string; items: NavigationItem[] }[] = [];
    const home = grouped.top.filter(matches);
    if (home.length) out.push({ id: "home", title: t("nav.home", "Home") as string, items: home });
    for (const s of grouped.sections) {
      const items = s.items.filter(matches);
      if (items.length) out.push({ id: s.id, title: t(s.labelKey, s.label) as string, items });
    }
    const rest = grouped.bottom.filter(matches);
    if (rest.length) out.push({ id: "more", title: t("nav.more", "More") as string, items: rest });
    return out;
    // `matches` closes over q and label, which are the real inputs.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [grouped, q, t, label]);

  const name =
    [user?.first_name, user?.last_name].filter(Boolean).join(" ").trim() || user?.user_name || user?.email || "";
  const go = (path: string) => {
    onClose();
    setQuery("");
    router.push(path);
  };

  return (
    <Drawer
      anchor="left"
      open={open}
      onClose={onClose}
      data-testid="mobile-menu"
      sx={{ display: { xs: "block", md: "none" } }}
      slotProps={{
        paper: {
          sx: {
            width: { xs: "100%", sm: 400 },
            backgroundColor: "var(--background, #f8fafc)",
            backgroundImage: "none",
            display: "flex",
            flexDirection: "column",
          },
        },
      }}
    >
      {/* Who you are, on the tenant's own colours. */}
      <Box
        sx={{
          position: "relative",
          overflow: "hidden",
          px: 2.5,
          pt: "calc(env(safe-area-inset-top) + 16px)",
          pb: 2.5,
          color: "#fff",
          background: "linear-gradient(135deg, var(--module-cta-from, #7c3aed), var(--module-cta-to, #db2777))",
        }}
      >
        <Box aria-hidden sx={{ position: "absolute", width: 220, height: 220, borderRadius: "50%", right: -70, top: -90, bgcolor: "rgba(255,255,255,0.12)" }} />
        <Box aria-hidden sx={{ position: "absolute", width: 140, height: 140, borderRadius: "50%", right: 40, bottom: -80, bgcolor: "rgba(255,255,255,0.08)" }} />
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2, position: "relative" }}>
          <Typography sx={{ fontWeight: 800, fontSize: "0.8rem", letterSpacing: 1, opacity: 0.9, textTransform: "uppercase" }}>
            {clientInfo?.name || "Menu"}
          </Typography>
          <IconButton
            onClick={onClose}
            aria-label={t("nav.closeMenu", "Close menu") as string}
            sx={{ color: "#fff", width: 44, height: 44, bgcolor: "rgba(255,255,255,0.16)", "&:hover": { bgcolor: "rgba(255,255,255,0.24)" } }}
          >
            <IconWrapper icon="mdi:close" size={22} />
          </IconButton>
        </Box>
        <ButtonBase
          onClick={() => go("/profile")}
          sx={{ display: "flex", alignItems: "center", gap: 1.5, textAlign: "start", borderRadius: 3, position: "relative", width: "100%", justifyContent: "flex-start" }}
        >
          <Avatar
            src={user?.profile_picture || undefined}
            sx={{ width: 52, height: 52, fontWeight: 800, bgcolor: "rgba(255,255,255,0.25)", border: "2px solid rgba(255,255,255,0.55)" }}
          >
            {(name || "?").charAt(0).toUpperCase()}
          </Avatar>
          <Box sx={{ minWidth: 0, flex: 1 }}>
            <Typography sx={{ fontWeight: 800, fontSize: "1.1rem", lineHeight: 1.2 }} noWrap>
              {name}
            </Typography>
            <Typography sx={{ fontSize: "0.8rem", opacity: 0.85 }} noWrap>
              {t("nav.viewProfile", "View your profile")}
            </Typography>
          </Box>
          <IconWrapper icon="mdi:chevron-right" size={22} />
        </ButtonBase>
      </Box>

      {/* Search: with a dozen modules, typing two letters beats scanning. */}
      <Box sx={{ px: 2, pt: 2 }}>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1,
            px: 1.5,
            height: 48,
            borderRadius: 3,
            border: "1px solid var(--border-default, #e5e7eb)",
            backgroundColor: "var(--card-bg, #fff)",
          }}
        >
          <IconWrapper icon="mdi:magnify" size={20} color="var(--font-tertiary, #94a3b8)" />
          <InputBase
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("nav.searchModules", "Search modules") as string}
            inputProps={{ "aria-label": t("nav.searchModules", "Search modules") as string }}
            sx={{ flex: 1, fontSize: "0.95rem" }}
          />
          {query && (
            <IconButton size="small" onClick={() => setQuery("")} aria-label={t("nav.clearSearch", "Clear search") as string} sx={{ width: 36, height: 36 }}>
              <IconWrapper icon="mdi:close-circle" size={18} />
            </IconButton>
          )}
        </Box>
      </Box>

      <Box sx={{ flex: 1, overflowY: "auto", px: 2, pt: 2, pb: 2 }}>
        {groups.length === 0 && (
          <Typography sx={{ textAlign: "center", color: "var(--font-secondary)", py: 6, fontSize: "0.9rem" }}>
            {t("nav.noModuleMatches", "No module matches \"{{q}}\"", { q: query })}
          </Typography>
        )}
        {groups.map((g) => {
          const [from, to] = SECTION_ACCENT[g.id] ?? DEFAULT_ACCENT;
          return (
            <Box key={g.id} sx={{ mb: 2.5 }} data-testid={`menu-group-${g.id}`}>
              <Typography sx={{ fontSize: "0.75rem", fontWeight: 800, letterSpacing: 0.8, textTransform: "uppercase", color: "var(--font-tertiary, #94a3b8)", mb: 1.25, px: 0.5 }}>
                {g.title}
              </Typography>
              <Box sx={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 1.25 }}>
                {g.items.map((item) => {
                  const active = isNavItemActive(pathname, item.path);
                  return (
                    <ButtonBase
                      key={item.path}
                      component={Link}
                      href={item.path}
                      onClick={() => {
                        onClose();
                        setQuery("");
                      }}
                      aria-current={active ? "page" : undefined}
                      sx={{
                        flexDirection: "column",
                        gap: 0.75,
                        py: 1.5,
                        px: 0.75,
                        minHeight: 96,
                        borderRadius: 4,
                        backgroundColor: "var(--card-bg, #fff)",
                        border: "1px solid",
                        borderColor: active ? from : "var(--border-default, #eef2f7)",
                        boxShadow: active ? `0 6px 18px -8px ${from}` : "0 1px 2px rgba(16,24,40,0.04)",
                        transition: "transform .12s ease",
                        "&:active": { transform: "scale(0.96)" },
                      }}
                    >
                      <Box
                        sx={{
                          width: 44,
                          height: 44,
                          borderRadius: 3,
                          display: "grid",
                          placeItems: "center",
                          color: "#fff",
                          background: `linear-gradient(135deg, ${from}, ${to})`,
                          boxShadow: `0 6px 14px -6px ${from}`,
                        }}
                      >
                        <IconWrapper icon={item.icon} size={22} />
                      </Box>
                      <Typography
                        sx={{
                          fontSize: "0.78rem",
                          fontWeight: active ? 800 : 700,
                          color: "var(--font-primary)",
                          textAlign: "center",
                          lineHeight: 1.2,
                          display: "-webkit-box",
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: "vertical",
                          overflow: "hidden",
                        }}
                      >
                        {label(item)}
                      </Typography>
                    </ButtonBase>
                  );
                })}
              </Box>
            </Box>
          );
        })}
      </Box>

      <Box sx={{ px: 2, pt: 1.5, pb: "calc(env(safe-area-inset-bottom) + 16px)", borderTop: "1px solid var(--border-default, #eef2f7)", display: "flex", flexDirection: "column", gap: 1 }}>
        {isClientOrgAdminRole(user?.role) && (
          <FooterRow
            icon={isAdminMode ? "mdi:school-outline" : "mdi:shield-crown-outline"}
            label={isAdminMode ? (t("nav.switchToStudent", "Switch to student view") as string) : (t("nav.switchToAdmin", "Switch to admin mode") as string)}
            onClick={() => {
              toggleAdminMode();
              go(effectiveAdminMode ? "/dashboard" : "/admin/dashboard");
            }}
          />
        )}
        <FooterRow
          icon="mdi:logout"
          label={t("nav.signOut", "Sign out") as string}
          tone="danger"
          onClick={() => {
            onClose();
            void logout();
          }}
        />
      </Box>
    </Drawer>
  );
}

function FooterRow({ icon, label, onClick, tone }: { icon: string; label: string; onClick: () => void; tone?: "danger" }) {
  return (
    <ButtonBase
      onClick={onClick}
      sx={{
        justifyContent: "flex-start",
        gap: 1.25,
        px: 1.5,
        minHeight: 48,
        borderRadius: 3,
        fontWeight: 700,
        fontSize: "0.9rem",
        color: tone === "danger" ? "#dc2626" : "var(--font-primary)",
        backgroundColor: "var(--card-bg, #fff)",
        border: "1px solid var(--border-default, #eef2f7)",
      }}
    >
      <IconWrapper icon={icon} size={20} />
      {label}
    </ButtonBase>
  );
}

/** The top bar's hamburger: three lines that fold into an X while the menu is open. */
export function MobileMenuButton() {
  const { isOpen, toggle } = useMobileMenu();
  const { t } = useTranslation("common");
  const bar = {
    position: "absolute" as const,
    left: 11,
    width: 20,
    height: 2.5,
    borderRadius: 2,
    backgroundColor: "currentColor",
    transition: "transform .22s ease, opacity .18s ease, top .22s ease",
  };
  return (
    <IconButton
      onClick={toggle}
      aria-label={isOpen ? (t("nav.closeMenu", "Close menu") as string) : (t("nav.openMenu", "Open menu") as string)}
      aria-expanded={isOpen}
      data-testid="mobile-menu-button"
      sx={{
        display: { xs: "inline-flex", md: "none" },
        position: "relative",
        width: 42,
        height: 42,
        borderRadius: 2.5,
        color: "var(--font-primary)",
        border: "1px solid var(--border-default, #e5e7eb)",
        backgroundColor: "var(--card-bg, #fff)",
      }}
    >
      <Box component="span" aria-hidden sx={{ ...bar, top: isOpen ? 19.5 : 13, transform: isOpen ? "rotate(45deg)" : "none" }} />
      <Box component="span" aria-hidden sx={{ ...bar, top: 19.5, opacity: isOpen ? 0 : 1 }} />
      <Box component="span" aria-hidden sx={{ ...bar, top: isOpen ? 19.5 : 26, transform: isOpen ? "rotate(-45deg)" : "none" }} />
    </IconButton>
  );
}
