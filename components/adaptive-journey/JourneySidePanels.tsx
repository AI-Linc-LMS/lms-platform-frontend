"use client";

import { useEffect, useState } from "react";
import { Avatar, Box, Chip, LinearProgress, Stack, Typography } from "@mui/material";
import { Icon } from "@iconify/react";
import { adaptiveJourneyService } from "@/lib/services/adaptive-journey.service";
import type { Leaderboard, PointsWallet, StreakSummary, TrendDirection } from "@/lib/types/adaptive-journey";

const TIER_COLOR: Record<string, string> = {
  bronze: "#b45309",
  silver: "#64748b",
  gold: "#ca8a04",
  platinum: "#7c3aed",
};

function TrendArrow({ trend }: { trend: TrendDirection }) {
  if (trend === "up") return <Icon icon="mdi:trending-up" width={16} color="#15803d" />;
  if (trend === "down") return <Icon icon="mdi:trending-down" width={16} color="#b91c1c" />;
  return <Icon icon="mdi:trending-neutral" width={16} color="#94a3b8" />;
}

function PanelShell({ title, icon, children }: { title: string; icon: string; children: React.ReactNode }) {
  return (
    <Box sx={{ p: 2, mb: 2, borderRadius: 3, border: "1px solid #eef2f7", bgcolor: "#fff" }}>
      <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1.25 }}>
        <Icon icon={icon} width={18} color="#6366f1" />
        <Typography sx={{ fontWeight: 800, color: "#0f172a" }}>{title}</Typography>
      </Stack>
      {children}
    </Box>
  );
}

export function JourneySidePanels({ courseId }: { courseId: number }) {
  const [wallet, setWallet] = useState<PointsWallet | null>(null);
  const [leaderboard, setLeaderboard] = useState<Leaderboard | null>(null);
  const [streak, setStreak] = useState<StreakSummary | null>(null);

  useEffect(() => {
    if (!Number.isFinite(courseId)) return;
    let cancelled = false;
    (async () => {
      const [w, l, s] = await Promise.allSettled([
        adaptiveJourneyService.getPointsWallet(courseId),
        adaptiveJourneyService.getLeaderboard(courseId),
        adaptiveJourneyService.getStreak(courseId),
      ]);
      if (cancelled) return;
      if (w.status === "fulfilled") setWallet(w.value);
      if (l.status === "fulfilled") setLeaderboard(l.value);
      if (s.status === "fulfilled") setStreak(s.value);
    })();
    return () => {
      cancelled = true;
    };
  }, [courseId]);

  return (
    <>
      {wallet && (
        <PanelShell title="Points wallet" icon="mdi:wallet-outline">
          <Stack direction="row" justifyContent="space-between" alignItems="baseline">
            <Typography sx={{ fontWeight: 900, fontSize: "1.6rem", color: "#0f172a" }}>{wallet.total}</Typography>
            <Chip
              label={wallet.tier_display}
              size="small"
              sx={{ fontWeight: 700, color: TIER_COLOR[wallet.tier] ?? "#64748b", bgcolor: "#f8fafc", border: "1px solid #eef2f7" }}
            />
          </Stack>
          {wallet.next_tier_threshold != null && (
            <>
              <LinearProgress
                variant="determinate"
                value={wallet.progress_pct}
                sx={{ mt: 1, height: 6, borderRadius: 3, bgcolor: "#eef2f7", "& .MuiLinearProgress-bar": { bgcolor: TIER_COLOR[wallet.tier] ?? "#6366f1" } }}
              />
              <Typography sx={{ fontSize: "0.72rem", color: "#94a3b8", mt: 0.5 }}>
                {wallet.next_tier_threshold - wallet.total} pts to next tier
              </Typography>
            </>
          )}
          {Object.keys(wallet.by_activity_type).length > 0 && (
            <Stack direction="row" flexWrap="wrap" gap={0.5} sx={{ mt: 1.25 }}>
              {Object.entries(wallet.by_activity_type).map(([k, v]) => (
                <Chip key={k} label={`${k}: ${v}`} size="small" sx={{ height: 20, fontSize: "0.66rem", bgcolor: "#f1f5f9", color: "#475569" }} />
              ))}
            </Stack>
          )}
        </PanelShell>
      )}

      {leaderboard && (
        <PanelShell title="Leaderboard" icon="mdi:trophy-outline">
          <Stack spacing={0.75}>
            {leaderboard.rows.slice(0, 5).map((row) => (
              <Stack
                key={row.rank}
                direction="row"
                spacing={1}
                alignItems="center"
                sx={{ p: 0.75, borderRadius: 1.5, bgcolor: row.is_current_user ? "#eef2ff" : "transparent" }}
              >
                <Typography sx={{ width: 22, fontWeight: 800, color: "#94a3b8", fontSize: "0.8rem" }}>#{row.rank}</Typography>
                <Avatar src={row.profile_pic_url ?? undefined} sx={{ width: 24, height: 24, fontSize: "0.7rem" }}>
                  {row.name?.[0]?.toUpperCase()}
                </Avatar>
                <Typography sx={{ flex: 1, fontWeight: row.is_current_user ? 800 : 600, fontSize: "0.82rem", color: "#0f172a", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {row.is_current_user ? "You" : row.name}
                </Typography>
                <TrendArrow trend={row.trend} />
                <Typography sx={{ fontWeight: 800, fontSize: "0.82rem", color: "#0f172a", width: 44, textAlign: "right" }}>{row.score}</Typography>
              </Stack>
            ))}
          </Stack>
          {leaderboard.climb_plan && (
            <Box sx={{ mt: 1, p: 1, borderRadius: 1.5, bgcolor: "#f5f3ff" }}>
              <Typography sx={{ fontSize: "0.74rem", color: "#6d28d9", fontWeight: 600 }}>
                <Icon icon="mdi:rocket-launch-outline" width={14} style={{ verticalAlign: "-2px" }} /> {leaderboard.climb_plan.text}
              </Typography>
            </Box>
          )}
        </PanelShell>
      )}

      {streak && (
        <PanelShell title="Streak" icon="mdi:fire">
          <Stack direction="row" alignItems="center" spacing={1.5}>
            <Typography sx={{ fontWeight: 900, fontSize: "1.8rem", color: "#ea580c" }}>{streak.current_len}</Typography>
            <Box>
              <Typography sx={{ fontSize: "0.78rem", color: "#64748b", fontWeight: 600 }}>day streak</Typography>
              <Typography sx={{ fontSize: "0.72rem", color: "#94a3b8" }}>Longest {streak.longest_len} · momentum {streak.momentum_score}</Typography>
            </Box>
          </Stack>
          {streak.at_risk && (
            <Box sx={{ mt: 1, p: 1, borderRadius: 1.5, bgcolor: "#fff7ed" }}>
              <Typography sx={{ fontSize: "0.74rem", color: "#c2410c", fontWeight: 600 }}>
                <Icon icon="mdi:alert-outline" width={14} style={{ verticalAlign: "-2px" }} /> Study today to keep your streak alive.
              </Typography>
            </Box>
          )}
          {streak.weekly_goal && (
            <Typography sx={{ fontSize: "0.74rem", color: "#64748b", mt: 1 }}>
              Weekly goal: {streak.weekly_goal.target} active days
            </Typography>
          )}
        </PanelShell>
      )}
    </>
  );
}
