"use client";

import { Avatar, Box, Stack, Typography } from "@mui/material";
import { Icon } from "@iconify/react";
import type { DashboardLeaderboard } from "@/lib/types/dashboard";
import { PanelCard, RANK_BG, RANK_FG, avatarColor } from "./parts";

export function LeaderboardPanel({ leaderboard }: { leaderboard: DashboardLeaderboard }) {
  const me = leaderboard.me;
  if (!me || !leaderboard.rows.length) return null;
  const delta = me.rankDelta || 0;

  return (
    <PanelCard>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1.25 }}>
        <Stack direction="row" spacing={1.25} alignItems="center">
          <Box sx={{ width: 30, height: 30, borderRadius: 2, display: "grid", placeItems: "center", color: "white", background: "linear-gradient(135deg, #f59e0b, #f97316)" }}>
            <Icon icon="mdi:trophy" width={17} />
          </Box>
          <Box>
            <Typography sx={{ fontWeight: 800, color: "#0f172a", fontSize: "0.95rem", lineHeight: 1.1 }}>
              You&apos;re #{me.rank}
              {delta > 0 && <Box component="span" sx={{ color: "#15803d", fontWeight: 800, ml: 0.5, fontSize: "0.8rem" }}>▲ +{delta}</Box>}
              {delta < 0 && <Box component="span" sx={{ color: "#b91c1c", fontWeight: 800, ml: 0.5, fontSize: "0.8rem" }}>▼ {delta}</Box>}
            </Typography>
            <Typography sx={{ fontSize: "0.72rem", color: "#64748b" }}>this week · top {me.percentile}%</Typography>
          </Box>
        </Stack>
      </Stack>

      <Stack spacing={0.75}>
        {leaderboard.rows.map((r) => {
          const initial = (r.name || "?").charAt(0).toUpperCase();
          return (
            <Stack
              key={r.rank}
              direction="row" alignItems="center" spacing={1}
              sx={{ p: 0.85, borderRadius: 2.5, bgcolor: r.is_current_user ? "#f5f3ff" : "transparent", border: r.is_current_user ? "1px solid #ede9fe" : "1px solid transparent" }}
            >
              <Box sx={{ width: 22, height: 22, borderRadius: "50%", flexShrink: 0, display: "grid", placeItems: "center", fontSize: "0.66rem", fontWeight: 800, color: RANK_FG[r.rank] || "#64748b", bgcolor: RANK_BG[r.rank] || "#f1f5f9" }}>{r.rank}</Box>
              <Avatar src={r.profile_pic_url ?? undefined} sx={{ width: 28, height: 28, flexShrink: 0, fontSize: "0.78rem", fontWeight: 800, color: "white", bgcolor: avatarColor(r.name || "?") }}>{initial}</Avatar>
              <Typography sx={{ flex: 1, minWidth: 0, fontWeight: r.is_current_user ? 800 : 600, fontSize: "0.85rem", color: "#0f172a", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {r.name}{r.is_current_user && <Box component="span" sx={{ color: "#7c3aed", fontWeight: 700 }}> (you)</Box>}
              </Typography>
              <Typography sx={{ fontWeight: 800, fontSize: "0.82rem", color: "#475569", flexShrink: 0 }}>{r.score.toLocaleString()}</Typography>
            </Stack>
          );
        })}
      </Stack>

      {leaderboard.aiTip && (
        <Stack direction="row" spacing={0.6} alignItems="flex-start" sx={{ mt: 1.25, p: 1, borderRadius: 2, background: "linear-gradient(135deg, #f5f3ff, #fdf2f8)" }}>
          <Icon icon="mdi:star-four-points" width={13} color="#6d28d9" style={{ flexShrink: 0, marginTop: 2 }} />
          <Typography sx={{ fontSize: "0.74rem", color: "#6d28d9", fontWeight: 600, lineHeight: 1.45 }}>{leaderboard.aiTip}</Typography>
        </Stack>
      )}
    </PanelCard>
  );
}
