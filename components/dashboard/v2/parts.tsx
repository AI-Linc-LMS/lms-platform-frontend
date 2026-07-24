"use client";

import type { ReactNode } from "react";
import { Box, LinearProgress, Stack, Typography } from "@mui/material";
import { Icon } from "@iconify/react";
import type { ReadinessBand } from "@/lib/types/dashboard";

// --- band → color (single source) ---
export const BAND_STYLE: Record<ReadinessBand, { color: string; bg: string; label: string; bar: string }> = {
  "not-started": { color: "#94a3b8", bg: "#f1f5f9", label: "Not started", bar: "#cbd5e1" },
  "needs-work": { color: "#b91c1c", bg: "#fef2f2", label: "Needs work", bar: "#ef4444" },
  building: { color: "#b45309", bg: "#fffbeb", label: "Building", bar: "#f59e0b" },
  strong: { color: "#15803d", bg: "#f0fdf4", label: "Strong", bar: "#22c55e" },
};

export function fmtDate(iso: string | null | undefined): string {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" });
  } catch {
    return "";
  }
}

export function daysLeft(iso: string | null | undefined): number | null {
  if (!iso) return null;
  const ms = new Date(iso).getTime() - Date.now();
  if (Number.isNaN(ms)) return null;
  return Math.ceil(ms / 86_400_000);
}

// --- leaderboard helpers (mirror JourneySidePanels) ---
export const RANK_BG: Record<number, string> = { 1: "#fef3c7", 2: "#f1f5f9", 3: "#fde7d3" };
export const RANK_FG: Record<number, string> = { 1: "#b45309", 2: "#475569", 3: "#9a3412" };
const AV_COLORS = ["#6366f1", "#a855f7", "#ec4899", "#0ea5e9", "#14b8a6", "#f59e0b"];
export function avatarColor(name: string): string {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  return AV_COLORS[h % AV_COLORS.length];
}

// --- atoms ---
export function PanelCard({ children, sx }: { children: ReactNode; sx?: object }) {
  return (
    <Box sx={{ p: 2, mb: 2, borderRadius: 4, border: "1px solid #eef2f7", bgcolor: "#fff", ...sx }}>
      {children}
    </Box>
  );
}

export function SectionHeader({
  icon, title, subtitle, gradient = "linear-gradient(135deg, #6366f1, #a855f7)", action,
}: {
  icon: string; title: string; subtitle?: string; gradient?: string; action?: ReactNode;
}) {
  return (
    <Stack direction="row" spacing={1.25} alignItems="center" sx={{ mb: 1.5 }}>
      <Box sx={{ width: 30, height: 30, borderRadius: 2, flexShrink: 0, display: "grid", placeItems: "center", color: "white", background: gradient }}>
        <Icon icon={icon} width={17} />
      </Box>
      <Box sx={{ minWidth: 0, flex: 1 }}>
        <Typography sx={{ fontWeight: 800, color: "#0f172a", fontSize: "0.95rem", lineHeight: 1.2 }}>{title}</Typography>
        {subtitle && <Typography sx={{ fontSize: "0.72rem", color: "#64748b" }}>{subtitle}</Typography>}
      </Box>
      {action}
    </Stack>
  );
}

export function StatBox({
  label, value, sub, subColor = "#94a3b8", icon, accent = "#7c3aed", info,
}: {
  label: string; value: ReactNode; sub?: ReactNode; subColor?: string; icon?: string; accent?: string; info?: ReactNode;
}) {
  return (
    <Box sx={{ p: 1.75, borderRadius: 3, border: "1px solid #eef2f7", bgcolor: "#fff", boxShadow: "0 1px 2px rgba(16,24,40,0.04)", position: "relative", overflow: "hidden" }}>
      <Box sx={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, bgcolor: accent }} />
      <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
        <Box sx={{ minWidth: 0 }}>
          <Typography sx={{ fontWeight: 900, fontSize: "1.5rem", color: "#0f172a", lineHeight: 1 }}>{value}</Typography>
          <Stack direction="row" spacing={0.25} alignItems="center" sx={{ mt: 0.5 }}>
            <Typography sx={{ fontSize: "0.6rem", fontWeight: 800, letterSpacing: 0.5, textTransform: "uppercase", color: "#64748b" }}>{label}</Typography>
            {info}
          </Stack>
          {sub != null && <Typography sx={{ fontSize: "0.72rem", fontWeight: 700, color: subColor, mt: 0.25 }}>{sub}</Typography>}
        </Box>
        {icon && <Icon icon={icon} width={20} color={accent} style={{ flexShrink: 0, opacity: 0.85 }} />}
      </Stack>
    </Box>
  );
}

export function BandPill({ band, dark = false }: { band: ReadinessBand; dark?: boolean }) {
  const s = BAND_STYLE[band];
  return (
    <Box
      component="span"
      sx={{
        px: 0.85, py: 0.2, borderRadius: 999, fontSize: "0.62rem", fontWeight: 800,
        color: dark ? s.bar : s.color,
        bgcolor: dark ? "rgba(255,255,255,0.1)" : s.bg,
      }}
    >
      {s.label}
    </Box>
  );
}

export function SignalBar({
  icon, label, sub, percent, band, dark = false,
}: {
  icon: string; label: string; sub?: string; percent: number | null; band: ReadinessBand; dark?: boolean;
}) {
  const s = BAND_STYLE[band];
  const textColor = dark ? "#fff" : "#0f172a";
  const subColor = dark ? "rgba(255,255,255,0.55)" : "#94a3b8";
  const track = dark ? "rgba(255,255,255,0.12)" : "#eef2f7";
  return (
    <Box sx={{ mb: 1.25 }}>
      <Stack direction="row" alignItems="center" spacing={1}>
        <Box sx={{ width: 30, height: 30, borderRadius: 2, flexShrink: 0, display: "grid", placeItems: "center", color: s.bar, bgcolor: dark ? "rgba(255,255,255,0.08)" : s.bg }}>
          <Icon icon={icon} width={16} />
        </Box>
        <Box sx={{ minWidth: 0, flex: 1 }}>
          <Typography sx={{ fontWeight: 700, fontSize: "0.85rem", color: textColor, lineHeight: 1.2 }}>{label}</Typography>
          {sub && <Typography sx={{ fontSize: "0.66rem", color: subColor }}>{sub}</Typography>}
        </Box>
        <BandPill band={band} dark={dark} />
        <Typography sx={{ fontWeight: 800, fontSize: "0.95rem", color: textColor, minWidth: 42, textAlign: "right" }}>
          {percent == null ? "-" : `${percent}%`}
        </Typography>
      </Stack>
      <LinearProgress
        variant="determinate"
        value={percent ?? 0}
        sx={{ mt: 0.75, ml: "38px", height: 7, borderRadius: 4, bgcolor: track, "& .MuiLinearProgress-bar": { bgcolor: s.bar, borderRadius: 4 } }}
      />
    </Box>
  );
}
