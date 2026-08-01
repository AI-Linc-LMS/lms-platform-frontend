"use client";

import type { ReactNode } from "react";
import { Box, ButtonBase, Stack, Typography } from "@mui/material";
import { IconWrapper } from "@/components/common/IconWrapper";
import {
  CTA_GRADIENT,
  CTA_SHADOW,
  HERO_BG,
  HERO_RADIUS,
  HERO_SHADOW,
  ON_DARK,
  PANEL_BORDER,
  PANEL_RADIUS,
  PANEL_SHADOW,
  PROFILE,
  TILE_GRADIENT,
} from "./profileTokens";

/**
 * The shared surface vocabulary for the profile redesign.
 *
 * These mirror components/dashboard/v2/parts.tsx rather than importing from it. Importing
 * would couple the profile surface to the dashboard's render tree, and parts.tsx atoms take
 * dashboard-shaped props (ReadinessBand, leaderboard helpers) that mean nothing here. The
 * shared contract is the token file, not the component.
 */

/** White card on canvas. Dashboard PanelCard. */
export function ProfilePanel({
  children,
  sx,
  id,
  ...rest
}: {
  children: ReactNode;
  sx?: object;
  id?: string;
  [key: `data-${string}`]: string | undefined;
}) {
  return (
    <Box
      id={id}
      {...rest}
      sx={{
        p: { xs: 2, sm: 2.75 },
        borderRadius: PANEL_RADIUS,
        border: PANEL_BORDER,
        bgcolor: PROFILE.surface,
        boxShadow: PANEL_SHADOW,
        // Deep links land here (window.location.hash → scrollIntoView in the page), so keep
        // the anchor clear of the sticky app header.
        scrollMarginTop: "104px",
        ...sx,
      }}
    >
      {children}
    </Box>
  );
}

/** 30px gradient icon tile + title + subtitle + optional trailing action. */
export function ProfileSectionHeader({
  icon,
  title,
  subtitle,
  action,
  gradient = TILE_GRADIENT,
}: {
  icon: string;
  title: string;
  subtitle?: string;
  action?: ReactNode;
  gradient?: string;
}) {
  return (
    <Stack direction="row" spacing={1.25} alignItems="center" sx={{ mb: 2 }}>
      <Box
        sx={{
          width: 30,
          height: 30,
          borderRadius: 2,
          flexShrink: 0,
          display: "grid",
          placeItems: "center",
          color: "#fff",
          background: gradient,
        }}
      >
        <IconWrapper icon={icon} size={17} />
      </Box>
      <Box sx={{ minWidth: 0, flex: 1 }}>
        <Typography
          component="h3"
          sx={{ fontWeight: 800, color: PROFILE.ink, fontSize: "0.95rem", lineHeight: 1.2, letterSpacing: "-0.2px" }}
        >
          {title}
        </Typography>
        {subtitle && (
          <Typography sx={{ fontSize: "0.72rem", color: PROFILE.inkFaint, mt: "1px" }}>{subtitle}</Typography>
        )}
      </Box>
      {action}
    </Stack>
  );
}

/** Pill-shaped secondary action for a section header. */
export function SectionAction({
  label,
  icon,
  onClick,
}: {
  label: string;
  icon?: string;
  onClick?: () => void;
}) {
  return (
    <ButtonBase
      onClick={onClick}
      sx={{
        flexShrink: 0,
        gap: 0.5,
        px: 1.5,
        py: 0.75,
        borderRadius: 999,
        fontSize: "0.75rem",
        fontWeight: 700,
        color: PROFILE.violet,
        bgcolor: PROFILE.violetSoft,
        border: `1px solid ${PROFILE.violetBorder}`,
        transition: "background .15s",
        "&:hover": { bgcolor: "#ede9fe" },
        "&:focus-visible": { outline: "none", boxShadow: `0 0 0 2px #fff, 0 0 0 4px ${PROFILE.violet}` },
      }}
    >
      {icon && <IconWrapper icon={icon} size={15} />}
      {label}
    </ButtonBase>
  );
}

/** Dashboard StatBox: 3px accent strip, big number, uppercase label. */
export function StatTile({
  label,
  value,
  sub,
  subColor = PROFILE.inkFaint,
  icon,
  accent = PROFILE.violet,
}: {
  label: string;
  value: ReactNode;
  sub?: ReactNode;
  subColor?: string;
  icon?: string;
  accent?: string;
}) {
  return (
    <Box
      sx={{
        p: 1.75,
        borderRadius: 3,
        border: `1px solid ${PROFILE.hairlineSoft}`,
        bgcolor: PROFILE.surface,
        boxShadow: "0 1px 2px rgba(16,24,40,0.04)",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <Box sx={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, bgcolor: accent }} />
      <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
        <Box sx={{ minWidth: 0 }}>
          <Typography sx={{ fontWeight: 900, fontSize: "1.5rem", color: PROFILE.ink, lineHeight: 1, letterSpacing: "-1px" }}>
            {value}
          </Typography>
          <Typography
            sx={{
              fontSize: "0.6rem",
              fontWeight: 800,
              letterSpacing: 0.5,
              textTransform: "uppercase",
              color: PROFILE.inkFaint,
              mt: 0.6,
              // Arabic joins cursively: tracking breaks the joins and uppercase is a no-op.
              '[dir="rtl"] &': { letterSpacing: "normal", textTransform: "none" },
            }}
          >
            {label}
          </Typography>
          {sub != null && (
            <Typography sx={{ fontSize: "0.72rem", fontWeight: 700, color: subColor, mt: 0.25 }}>{sub}</Typography>
          )}
        </Box>
        {icon && (
          <Box sx={{ flexShrink: 0, opacity: 0.85, color: accent }}>
            <IconWrapper icon={icon} size={20} />
          </Box>
        )}
      </Stack>
    </Box>
  );
}

/**
 * The dark hero container. `coverUrl` renders the tenant/user image BEHIND the gradient at
 * low opacity under a scrim, which is the DESIGN.md section 5 treatment: an uploaded asset
 * is an accent inside a composition that is already good without it. A 400px-wide upload
 * can no longer decide whether the screen looks good.
 */
export function HeroShell({
  children,
  coverUrl,
  sx,
  id,
}: {
  children: ReactNode;
  coverUrl?: string | null;
  sx?: object;
  id?: string;
}) {
  return (
    <Box
      id={id}
      sx={{
        position: "relative",
        overflow: "hidden",
        borderRadius: HERO_RADIUS,
        background: HERO_BG,
        boxShadow: HERO_SHADOW,
        color: "#fff",
        scrollMarginTop: "104px",
        ...sx,
      }}
    >
      {coverUrl && (
        <>
          <Box
            aria-hidden
            sx={{
              position: "absolute",
              inset: 0,
              backgroundImage: `url(${coverUrl})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
              opacity: 0.3,
              filter: "blur(2px)",
              transform: "scale(1.04)",
            }}
          />
          <Box
            aria-hidden
            sx={{
              position: "absolute",
              inset: 0,
              background: "linear-gradient(150deg, rgba(39,26,92,0.72) 0%, rgba(16,10,44,0.88) 100%)",
            }}
          />
        </>
      )}
      <Box sx={{ position: "relative", p: { xs: 2.5, md: 3.5 } }}>{children}</Box>
    </Box>
  );
}

/** Translucent capsule for use on the dark hero. */
export function HeroPill({
  children,
  icon,
  eyebrow = false,
}: {
  children: ReactNode;
  icon?: string;
  eyebrow?: boolean;
}) {
  return (
    <Box
      component="span"
      sx={{
        display: "inline-flex",
        alignItems: "center",
        gap: 0.5,
        px: 1.25,
        py: 0.5,
        borderRadius: 999,
        bgcolor: ON_DARK.fillStrong,
        border: `1px solid ${ON_DARK.border}`,
        color: "#fff",
        fontWeight: 800,
        fontSize: eyebrow ? "0.66rem" : "0.78rem",
        letterSpacing: eyebrow ? 0.6 : 0,
        textTransform: eyebrow ? "uppercase" : "none",
        ...(eyebrow ? { '[dir="rtl"] &': { letterSpacing: "normal", textTransform: "none" } } : {}),
      }}
    >
      {icon && <IconWrapper icon={icon} size={13} />}
      {children}
    </Box>
  );
}

/** The dashboard's two-up action card, on the dark hero. */
export function HeroActionCard({
  eyebrow,
  title,
  sub,
  icon,
  onClick,
}: {
  eyebrow: string;
  title: string;
  sub?: string;
  icon: string;
  onClick?: () => void;
}) {
  return (
    <ButtonBase
      onClick={onClick}
      sx={{
        flex: 1,
        width: "100%",
        textAlign: "left",
        justifyContent: "flex-start",
        p: 1.75,
        borderRadius: 3,
        gap: 1.5,
        bgcolor: ON_DARK.cardFill,
        border: `1px solid rgba(255,255,255,0.15)`,
        transition: "border-color .15s, background .15s",
        "&:hover": { borderColor: ON_DARK.borderStrong, bgcolor: ON_DARK.cardFillHover },
        "&:focus-visible": { outline: "none", boxShadow: `0 0 0 2px ${PROFILE.night}, 0 0 0 4px ${PROFILE.violetLight}` },
      }}
    >
      <Box
        sx={{
          width: 38,
          height: 38,
          borderRadius: 2.5,
          flexShrink: 0,
          display: "grid",
          placeItems: "center",
          color: "#fff",
          background: CTA_GRADIENT,
        }}
      >
        <IconWrapper icon={icon} size={20} />
      </Box>
      <Box sx={{ minWidth: 0 }}>
        <Typography
          sx={{
            fontSize: "0.6rem",
            fontWeight: 800,
            letterSpacing: 0.6,
            color: ON_DARK.textFaint,
            textTransform: "uppercase",
            '[dir="rtl"] &': { letterSpacing: "normal", textTransform: "none" },
          }}
        >
          {eyebrow}
        </Typography>
        <Typography sx={{ fontWeight: 800, fontSize: "0.95rem", color: "#fff", lineHeight: 1.25 }}>{title}</Typography>
        {sub && <Typography sx={{ fontSize: "0.74rem", color: "rgba(255,255,255,0.7)", mt: 0.25 }}>{sub}</Typography>}
      </Box>
    </ButtonBase>
  );
}

/** Primary action. The dashboard's gradient pill. */
export function HeroCta({
  children,
  icon,
  onClick,
  fullWidth = false,
}: {
  children: ReactNode;
  icon?: string;
  onClick?: () => void;
  fullWidth?: boolean;
}) {
  return (
    <ButtonBase
      onClick={onClick}
      sx={{
        px: 3,
        py: 1.25,
        width: fullWidth ? "100%" : undefined,
        justifyContent: "center",
        borderRadius: 999,
        fontWeight: 800,
        fontSize: "0.95rem",
        color: "#fff",
        background: CTA_GRADIENT,
        gap: 0.75,
        boxShadow: CTA_SHADOW,
        "&:hover": { filter: "brightness(1.06)" },
        "&:focus-visible": { outline: "none", boxShadow: `0 0 0 2px ${PROFILE.night}, 0 0 0 4px #fff` },
      }}
    >
      {icon && <IconWrapper icon={icon} size={18} />}
      {children}
    </ButtonBase>
  );
}

/** Gradient progress ring. Used for profile strength on both the hero and the admin header. */
export function StrengthRing({
  value,
  size = 112,
  stroke = 9,
  onDark = true,
  label,
}: {
  value: number;
  size?: number;
  stroke?: number;
  onDark?: boolean;
  label?: string;
}) {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(100, value));
  // Unique per size so two rings on one page don't share a gradient id.
  const gid = `profile-ring-${size}-${stroke}`;
  return (
    <Box sx={{ position: "relative", display: "grid", placeItems: "center", width: size, height: size }}>
      <Box component="svg" width={size} height={size} sx={{ transform: "rotate(-90deg)" }} aria-hidden>
        <defs>
          <linearGradient id={gid} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={PROFILE.violetLight} />
            <stop offset="100%" stopColor={PROFILE.pink} />
          </linearGradient>
        </defs>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={onDark ? "rgba(255,255,255,0.14)" : PROFILE.hairlineSoft}
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={`url(#${gid})`}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={circ - (circ * pct) / 100}
        />
      </Box>
      <Box sx={{ position: "absolute", textAlign: "center" }}>
        <Typography
          sx={{
            fontWeight: 900,
            fontSize: size >= 96 ? "1.6rem" : size >= 56 ? "0.95rem" : "0.75rem",
            color: onDark ? "#fff" : PROFILE.ink,
            letterSpacing: "-0.5px",
            lineHeight: 1,
          }}
        >
          {pct}%
        </Typography>
        {label && size >= 96 && (
          <Typography sx={{ fontSize: "0.62rem", fontWeight: 700, color: onDark ? ON_DARK.textFaint : PROFILE.inkFaint }}>
            {label}
          </Typography>
        )}
      </Box>
    </Box>
  );
}
