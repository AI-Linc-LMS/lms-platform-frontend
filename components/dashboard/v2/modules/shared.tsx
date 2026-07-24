"use client";

import type { ReactNode } from "react";
import { Box, ButtonBase, Skeleton, Stack, Typography } from "@mui/material";
import { Icon } from "@iconify/react";
import { PanelCard } from "../parts";

/**
 * Shared chrome + helpers for the tenant-gated dashboard module widgets
 * (upcoming assessments, live sessions, job openings, community highlights).
 * Each widget is self-contained: it fetches its own data, and on an
 * unrecoverable error it hides itself rather than blanking the dashboard.
 */

/** Card header: gradient icon badge + title + optional "View all" affordance. */
export function ModuleHeader({
  icon,
  title,
  gradient,
  onViewAll,
  viewAllLabel = "View all",
}: {
  icon: string;
  title: string;
  gradient: string;
  onViewAll?: () => void;
  viewAllLabel?: string;
}) {
  return (
    <Stack direction="row" alignItems="center" spacing={1.25} sx={{ mb: 1.5 }}>
      <Box sx={{ width: 32, height: 32, borderRadius: 2, flexShrink: 0, display: "grid", placeItems: "center", color: "#fff", background: gradient }}>
        <Icon icon={icon} width={18} />
      </Box>
      <Typography sx={{ fontWeight: 800, fontSize: "1rem", color: "#0f172a", flex: 1, minWidth: 0 }}>
        {title}
      </Typography>
      {onViewAll && (
        <ButtonBase onClick={onViewAll} sx={{ fontSize: "0.74rem", fontWeight: 700, color: "#7c3aed", gap: 0.25, flexShrink: 0 }}>
          {viewAllLabel}
          <Icon icon="mdi:arrow-right" width={14} />
        </ButtonBase>
      )}
    </Stack>
  );
}

/** Consistent white card wrapper for a module widget (no bottom margin - the
 *  grid handles spacing; full height so cells in a row line up). */
export function ModulePanel({ children }: { children: ReactNode }) {
  return <PanelCard sx={{ mb: 0, height: "100%", display: "flex", flexDirection: "column" }}>{children}</PanelCard>;
}

/** Slim shimmer that matches a list of rows (single target-matched loader). */
export function ModuleRowsSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <Stack spacing={1.25} sx={{ mt: 0.5 }}>
      {Array.from({ length: rows }).map((_, i) => (
        <Stack key={i} direction="row" spacing={1.25} alignItems="center">
          <Skeleton variant="rounded" width={38} height={38} sx={{ borderRadius: 2, flexShrink: 0 }} />
          <Box sx={{ flex: 1 }}>
            <Skeleton variant="text" width="70%" height={18} />
            <Skeleton variant="text" width="45%" height={14} />
          </Box>
        </Stack>
      ))}
    </Stack>
  );
}

/** Friendly empty state (module enabled but nothing to show right now). */
export function ModuleEmpty({ icon, message }: { icon: string; message: string }) {
  return (
    <Stack alignItems="center" justifyContent="center" spacing={1} sx={{ flex: 1, py: 3, textAlign: "center" }}>
      <Box sx={{ width: 40, height: 40, borderRadius: "50%", display: "grid", placeItems: "center", bgcolor: "#f1f5f9", color: "#94a3b8" }}>
        <Icon icon={icon} width={22} />
      </Box>
      <Typography sx={{ fontSize: "0.82rem", color: "#94a3b8", fontWeight: 600, maxWidth: 220 }}>{message}</Typography>
    </Stack>
  );
}

/** A small pill used for timing / status / counts inside rows. */
export function Pill({ icon, children, color, bg }: { icon?: string; children: ReactNode; color: string; bg: string }) {
  return (
    <Box component="span" sx={{ display: "inline-flex", alignItems: "center", gap: 0.35, px: 0.85, py: 0.25, borderRadius: 999, fontSize: "0.66rem", fontWeight: 800, color, bgcolor: bg, whiteSpace: "nowrap" }}>
      {icon && <Icon icon={icon} width={12} />}
      {children}
    </Box>
  );
}

/** "in 2d" / "in 3h" / "in 12m" / "now" until an ISO datetime, with a `soon`
 *  flag when it's close (drives amber/red urgency). Null if no/invalid date. */
export function timeUntil(iso?: string | null): { text: string; soon: boolean; overdue: boolean } | null {
  if (!iso) return null;
  const ms = new Date(iso).getTime() - Date.now();
  if (Number.isNaN(ms)) return null;
  if (ms <= 0) return { text: "now", soon: true, overdue: true };
  const mins = Math.floor(ms / 60000);
  if (mins < 60) return { text: `in ${mins}m`, soon: true, overdue: false };
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return { text: `in ${hrs}h`, soon: hrs < 6, overdue: false };
  const days = Math.floor(hrs / 24);
  return { text: `in ${days}d`, soon: days <= 2, overdue: false };
}

/** Short human date-time, e.g. "Jul 25, 3:00 PM". Empty string on bad input. */
export function fmtDateTime(iso?: string | null): string {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  } catch {
    return "";
  }
}
