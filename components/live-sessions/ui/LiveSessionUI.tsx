"use client";

import { ReactNode } from "react";
import { Box, Typography, ButtonBase } from "@mui/material";
import { useTranslation } from "react-i18next";
import { IconWrapper } from "@/components/common/IconWrapper";

/**
 * Shared presentational primitives for the live-sessions surfaces (admin + student).
 * Aligned with the Adaptive Content design language: indigo accents, soft color-mix
 * tints, glass cards, pill badges, gradient CTAs. Keep visual styling here so every
 * live-session page/modal stays consistent.
 *
 * NOTE: page headers use `AdaptiveSectionHero` and stat rails use `KpiRail` (from the
 * scorecard shared kit) — there is no bespoke page-header / stat-card primitive here.
 */

export interface SessionFilterOption {
  key: string;
  label: string;
  count?: number;
  color?: string;
}

export function SessionFilterChips({
  options,
  value,
  onChange,
}: {
  options: SessionFilterOption[];
  value: string;
  onChange: (key: string) => void;
}) {
  return (
    <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
      {options.map((o) => {
        const active = o.key === value;
        const color = o.color ?? "var(--accent-indigo)";
        return (
          <ButtonBase
            key={o.key}
            onClick={() => onChange(o.key)}
            sx={{
              display: "inline-flex",
              alignItems: "center",
              gap: 1,
              px: 1.75,
              py: 0.85,
              borderRadius: 999,
              fontWeight: active ? 800 : 600,
              border: `1px solid ${active ? `color-mix(in srgb, ${color} 55%, transparent)` : "color-mix(in srgb, var(--border-default) 85%, transparent)"}`,
              bgcolor: active ? `color-mix(in srgb, ${color} 14%, var(--card-bg) 86%)` : "color-mix(in srgb, var(--card-bg) 70%, transparent)",
              color: active ? color : "var(--font-secondary)",
              backdropFilter: "blur(8px)",
              transition: "all 0.15s ease",
              "&:hover": {
                bgcolor: `color-mix(in srgb, ${color} 10%, var(--card-bg) 90%)`,
                borderColor: `color-mix(in srgb, ${color} 45%, transparent)`,
              },
            }}
          >
            <Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: color }} />
            <Typography component="span" sx={{ fontSize: "0.82rem", fontWeight: "inherit", color: "inherit" }}>
              {o.label}
              {typeof o.count === "number" ? ` · ${o.count}` : ""}
            </Typography>
          </ButtonBase>
        );
      })}
    </Box>
  );
}

export function InfoCallout({
  icon = "mdi:information-outline",
  color = "var(--accent-indigo)",
  children,
  sx,
}: {
  icon?: string;
  color?: string;
  children: ReactNode;
  sx?: object;
}) {
  return (
    <Box
      sx={{
        p: 1.5,
        borderRadius: 2,
        display: "flex",
        gap: 1,
        alignItems: "flex-start",
        bgcolor: `color-mix(in srgb, ${color} 8%, var(--surface) 92%)`,
        border: `1px solid color-mix(in srgb, ${color} 24%, var(--border-default) 76%)`,
        ...sx,
      }}
    >
      <Box sx={{ mt: "1px", flexShrink: 0, display: "flex" }}>
        <IconWrapper icon={icon} size={18} color={color} />
      </Box>
      <Typography variant="body2" sx={{ color: "var(--font-secondary)", fontSize: "0.8rem", lineHeight: 1.5 }}>
        {children}
      </Typography>
    </Box>
  );
}

export function SectionCard({
  title,
  icon,
  action,
  children,
  sx,
}: {
  title?: string;
  icon?: string;
  action?: ReactNode;
  children: ReactNode;
  sx?: object;
}) {
  return (
    <Box
      sx={{
        p: { xs: 2, sm: 2.5 },
        borderRadius: 3,
        border: "1px solid color-mix(in srgb, var(--border-default) 60%, transparent)",
        bgcolor: "color-mix(in srgb, var(--card-bg) 72%, transparent)",
        backdropFilter: "blur(18px) saturate(140%)",
        boxShadow: "0 1px 0 0 color-mix(in srgb, white 14%, transparent) inset, 0 18px 40px -34px rgba(15, 23, 42, 0.2)",
        ...sx,
      }}
    >
      {(title || action) && (
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1.75, gap: 1 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            {icon && <IconWrapper icon={icon} size={20} color="var(--accent-indigo)" />}
            {title && (
              <Typography
                sx={{
                  fontWeight: 800,
                  fontSize: "0.82rem",
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  color: "var(--font-primary)",
                }}
              >
                {title}
              </Typography>
            )}
          </Box>
          {action}
        </Box>
      )}
      {children}
    </Box>
  );
}

const STATUS_META: Record<string, { key: string; fallback: string; color: string }> = {
  scheduled: { key: "liveSessions.scheduled", fallback: "Scheduled", color: "var(--accent-indigo)" },
  live: { key: "liveSessions.live", fallback: "Live now", color: "var(--success-500)" },
  ended: { key: "liveSessions.classEnded", fallback: "Ended", color: "var(--font-tertiary)" },
  expired: { key: "liveSessions.expired", fallback: "Expired", color: "var(--warning-500)" },
  cancelled: { key: "adminLiveSessions.cancelled", fallback: "Cancelled", color: "var(--error-500)" },
};

/** Adaptive pill badge for a session's lifecycle status. Live shows a pulsing dot. */
export function MeetingStatusChip({ status, cancelled }: { status?: string | null; cancelled?: boolean }) {
  const { t } = useTranslation("common");
  const key = cancelled ? "cancelled" : status ?? "";
  const meta = STATUS_META[key];
  if (!meta) return null;
  const isLive = key === "live" && !cancelled;
  return (
    <Box
      sx={{
        display: "inline-flex",
        alignItems: "center",
        gap: 0.6,
        px: 1,
        py: 0.4,
        borderRadius: 999,
        fontSize: "0.64rem",
        fontWeight: 800,
        letterSpacing: "0.1em",
        textTransform: "uppercase",
        color: meta.color,
        bgcolor: `color-mix(in srgb, ${meta.color} 14%, transparent)`,
        border: `1px solid color-mix(in srgb, ${meta.color} 26%, transparent)`,
        lineHeight: 1,
      }}
    >
      {isLive && (
        <Box
          sx={{
            width: 7,
            height: 7,
            borderRadius: "50%",
            bgcolor: meta.color,
            animation: "lsPulse 1.4s ease-in-out infinite",
            "@keyframes lsPulse": {
              "0%, 100%": { opacity: 1, transform: "scale(1)" },
              "50%": { opacity: 0.4, transform: "scale(0.7)" },
            },
          }}
        />
      )}
      {t(meta.key, meta.fallback)}
    </Box>
  );
}

/** Adaptive pill badge for the meeting platform (Zoom / Zoom Webinar / Google Meet). */
export function PlatformChip({
  isZoom,
  isGoogleMeet,
  zoomMeetingType,
}: {
  isZoom?: boolean;
  isGoogleMeet?: boolean;
  zoomMeetingType?: string | null;
}) {
  const { t } = useTranslation("common");

  let icon: string | null = null;
  let label = "";
  let color = "var(--accent-indigo)";

  if (isGoogleMeet) {
    icon = "mdi:google";
    label = t("liveSessions.googleMeet", "Google Meet");
    color = "var(--success-500)";
  } else if (isZoom) {
    const isWebinar = zoomMeetingType === "webinar";
    icon = isWebinar ? "mdi:presentation" : "mdi:video";
    label = isWebinar ? t("liveSessions.zoomWebinar", "Zoom Webinar") : t("liveSessions.zoom", "Zoom");
  } else {
    return null;
  }

  return (
    <Box
      sx={{
        display: "inline-flex",
        alignItems: "center",
        gap: 0.5,
        px: 1,
        py: 0.4,
        borderRadius: 999,
        fontSize: "0.64rem",
        fontWeight: 800,
        letterSpacing: "0.08em",
        textTransform: "uppercase",
        color,
        bgcolor: `color-mix(in srgb, ${color} 12%, transparent)`,
        border: `1px solid color-mix(in srgb, ${color} 24%, transparent)`,
        lineHeight: 1,
      }}
    >
      <IconWrapper icon={icon} size={13} color={color} />
      {label}
    </Box>
  );
}
