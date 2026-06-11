"use client";

import { ReactNode } from "react";
import { Box, Typography, Paper, ButtonBase, Chip } from "@mui/material";
import { useTranslation } from "react-i18next";
import { IconWrapper } from "@/components/common/IconWrapper";

/**
 * Shared presentational primitives for the live-sessions surfaces (admin + student).
 * Encodes the adaptive-course-builder design language: indigo accents, soft color-mix tints,
 * rounded cards, pill filter chips, gradient stat cards. Keep visual styling here so every
 * live-session page/modal stays consistent.
 */

export function SessionsPageHeader({
  title,
  subtitle,
  actions,
}: {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}) {
  return (
    <Box
      sx={{
        mb: 3,
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-start",
        flexWrap: "wrap",
        gap: 2,
      }}
    >
      <Box>
        <Typography
          variant="h4"
          sx={{
            fontWeight: 700,
            color: "var(--font-primary)",
            mb: 0.5,
            fontSize: { xs: "1.5rem", sm: "2rem" },
          }}
        >
          {title}
        </Typography>
        {subtitle && (
          <Typography variant="body1" sx={{ color: "var(--font-secondary)", maxWidth: 640 }}>
            {subtitle}
          </Typography>
        )}
      </Box>
      {actions && <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>{actions}</Box>}
    </Box>
  );
}

export function SessionStatCard({
  icon,
  label,
  value,
  color = "var(--accent-indigo)",
}: {
  icon: string;
  label: string;
  value: number | string;
  color?: string;
}) {
  return (
    <Paper
      elevation={0}
      sx={{
        p: { xs: 1.75, sm: 2.25 },
        flex: "1 1 150px",
        minWidth: 140,
        borderRadius: 2,
        border: `1px solid color-mix(in srgb, ${color} 32%, var(--border-default) 68%)`,
        background: `linear-gradient(135deg, color-mix(in srgb, ${color} 9%, var(--surface) 91%), color-mix(in srgb, ${color} 17%, var(--surface) 83%))`,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 1,
      }}
    >
      <Box>
        <Typography variant="h4" sx={{ fontWeight: 700, color: "var(--font-primary)", lineHeight: 1.1, fontSize: { xs: "1.5rem", sm: "1.75rem" } }}>
          {value}
        </Typography>
        <Typography variant="body2" sx={{ color: "var(--font-secondary)" }}>
          {label}
        </Typography>
      </Box>
      <Box
        sx={{
          width: 44,
          height: 44,
          borderRadius: "50%",
          bgcolor: `color-mix(in srgb, ${color} 22%, var(--card-bg) 78%)`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        <IconWrapper icon={icon} size={22} color={color} />
      </Box>
    </Paper>
  );
}

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
    <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", mb: 2.5 }}>
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
              px: 1.5,
              py: 0.75,
              borderRadius: 999,
              border: `1px solid ${active ? color : "var(--border-default)"}`,
              bgcolor: active ? `color-mix(in srgb, ${color} 14%, var(--card-bg) 86%)` : "var(--card-bg)",
              transition: "all 0.15s",
              "&:hover": {
                bgcolor: `color-mix(in srgb, ${color} 10%, var(--card-bg) 90%)`,
                borderColor: color,
              },
            }}
          >
            <Box sx={{ width: 9, height: 9, borderRadius: "50%", bgcolor: color }} />
            <Typography variant="body2" sx={{ fontWeight: active ? 700 : 500, color: "var(--font-primary)" }}>
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
        borderRadius: 1.5,
        display: "flex",
        gap: 1,
        alignItems: "flex-start",
        bgcolor: `color-mix(in srgb, ${color} 9%, var(--surface) 91%)`,
        border: `1px solid color-mix(in srgb, ${color} 28%, var(--border-default) 72%)`,
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
    <Paper
      elevation={0}
      sx={{
        p: { xs: 1.75, sm: 2.25 },
        borderRadius: 2,
        border: "1px solid var(--border-default)",
        bgcolor: "var(--card-bg)",
        ...sx,
      }}
    >
      {(title || action) && (
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1.5, gap: 1 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            {icon && <IconWrapper icon={icon} size={20} color="var(--accent-indigo)" />}
            {title && (
              <Typography variant="subtitle1" sx={{ fontWeight: 600, color: "var(--font-primary)" }}>
                {title}
              </Typography>
            )}
          </Box>
          {action}
        </Box>
      )}
      {children}
    </Paper>
  );
}

const STATUS_META: Record<string, { key: string; fallback: string; color: string }> = {
  scheduled: { key: "liveSessions.scheduled", fallback: "Scheduled", color: "var(--accent-indigo)" },
  live: { key: "liveSessions.live", fallback: "Live now", color: "var(--success-500)" },
  ended: { key: "liveSessions.classEnded", fallback: "Ended", color: "var(--font-tertiary)" },
  expired: { key: "liveSessions.expired", fallback: "Expired", color: "var(--warning-500)" },
};

export function MeetingStatusChip({ status, size = "small" }: { status?: string | null; size?: "small" | "medium" }) {
  const { t } = useTranslation("common");
  const meta = STATUS_META[status ?? ""] ?? { key: "", fallback: "—", color: "var(--font-tertiary)" };
  const isLive = status === "live";
  return (
    <Chip
      size={size}
      label={
        <Box sx={{ display: "inline-flex", alignItems: "center", gap: 0.5 }}>
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
          {meta.key ? t(meta.key, meta.fallback) : meta.fallback}
        </Box>
      }
      sx={{
        bgcolor: `color-mix(in srgb, ${meta.color} 16%, var(--surface) 84%)`,
        color: meta.color,
        fontWeight: 600,
        fontSize: "0.72rem",
        height: size === "small" ? 22 : 28,
      }}
    />
  );
}

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
  if (isGoogleMeet) {
    return (
      <Chip
        size="small"
        icon={<IconWrapper icon="mdi:google" size={13} />}
        label={t("liveSessions.googleMeet", "Google Meet")}
        sx={{
          bgcolor: "color-mix(in srgb, var(--success-500) 14%, var(--surface) 86%)",
          color: "var(--success-500)",
          fontWeight: 600,
          fontSize: "0.68rem",
          height: 20,
          "& .MuiChip-icon": { color: "var(--success-500)", ml: 0.5 },
        }}
      />
    );
  }
  if (isZoom) {
    const isWebinar = zoomMeetingType === "webinar";
    return (
      <Chip
        size="small"
        icon={<IconWrapper icon={isWebinar ? "mdi:presentation" : "mdi:video"} size={13} />}
        label={isWebinar ? t("liveSessions.zoomWebinar", "Zoom Webinar") : t("liveSessions.zoom", "Zoom")}
        sx={{
          bgcolor: "color-mix(in srgb, var(--accent-indigo) 14%, var(--surface) 86%)",
          color: "var(--accent-indigo)",
          fontWeight: 600,
          fontSize: "0.68rem",
          height: 20,
          "& .MuiChip-icon": { color: "var(--accent-indigo)", ml: 0.5 },
        }}
      />
    );
  }
  return null;
}
