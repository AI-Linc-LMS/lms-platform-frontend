"use client";

import { useMemo } from "react";
import { alpha } from "@mui/material/styles";
import { useClientInfo } from "@/lib/contexts/ClientInfoContext";
import { normalizeThemeSettings } from "./normalizeThemeSettings";

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const raw = hex.trim().replace(/^#/, "");
  if (raw.length === 6 && /^[0-9a-fA-F]{6}$/.test(raw)) {
    return {
      r: parseInt(raw.slice(0, 2), 16),
      g: parseInt(raw.slice(2, 4), 16),
      b: parseInt(raw.slice(4, 6), 16),
    };
  }
  if (raw.length === 3 && /^[0-9a-fA-F]{3}$/.test(raw)) {
    return {
      r: parseInt(raw[0] + raw[0], 16),
      g: parseInt(raw[1] + raw[1], 16),
      b: parseInt(raw[2] + raw[2], 16),
    };
  }
  return null;
}

/**
 * Resolved sidebar / mobile-nav colors from tenant `clientInfo.theme_settings`.
 * Uses explicit values (not inherited CSS vars) so MUI drawers re-render correctly when branding changes.
 */
export function useTenantShellTheme() {
  const { clientInfo } = useClientInfo();

  return useMemo(() => {
    const t = normalizeThemeSettings(clientInfo?.theme_settings);
    const shellBg = (t.secondary500 || "").trim() || "#12293a";
    const nav = (t.fontLightNav || "").trim() || "#ffffff";
    const p300 = (t.primary300 || "").trim() || "#63b6d3";
    const p400 = (t.primary400 || "").trim() || "#2a8cb0";
    const p500 = (t.primary500 || "").trim() || "#255c79";
    const rgb = hexToRgb(p500);

    const dropHover = rgb
      ? `drop-shadow(0 3px 6px rgba(${rgb.r},${rgb.g},${rgb.b},0.5)) drop-shadow(0 2px 4px rgba(${rgb.r},${rgb.g},${rgb.b},0.4))`
      : "none";
    const dropIconActive = rgb
      ? `drop-shadow(0 2px 4px rgba(${rgb.r},${rgb.g},${rgb.b},0.4)) drop-shadow(0 1px 2px rgba(${rgb.r},${rgb.g},${rgb.b},0.3))`
      : "none";
    const dropBottomHover = rgb
      ? `drop-shadow(0 3px 6px rgba(${rgb.r},${rgb.g},${rgb.b},0.6)) drop-shadow(0 2px 4px rgba(${rgb.r},${rgb.g},${rgb.b},0.5))`
      : "none";
    const dropBottomIcon = rgb
      ? `drop-shadow(0 2px 4px rgba(${rgb.r},${rgb.g},${rgb.b},0.5)) drop-shadow(0 1px 3px rgba(${rgb.r},${rgb.g},${rgb.b},0.4))`
      : "none";

    return {
      shellBg,
      nav,
      p300,
      p400,
      p500,
      navMuted: alpha(nav, 0.7),
      navBorder: alpha(nav, 0.1),
      navBorderMid: alpha(nav, 0.2),
      navBorderHover: alpha(nav, 0.3),
      navHoverBg: alpha(nav, 0.05),
      navCaption: alpha(nav, 0.6),
      activeBg: alpha(p500, 0.24),
      activeBgHover: alpha(p500, 0.36),
      logoGradStart: alpha(nav, 0.12),
      logoGradEnd: alpha(nav, 0.06),
      logoGradHoverStart: alpha(nav, 0.15),
      logoGradHoverEnd: alpha(nav, 0.08),
      logoBorder: alpha(nav, 0.08),
      logoInset: alpha(nav, 0.1),
      logoInsetHover: alpha(nav, 0.15),
      skeletonBg: alpha(nav, 0.1),
      dropHover,
      dropIconActive,
      dropBottomHover,
      dropBottomIcon,
      /** Inactive icon hover glow on dark shell */
      navIconHoverDim: alpha(nav, 0.2),
    };
  }, [clientInfo]);
}
