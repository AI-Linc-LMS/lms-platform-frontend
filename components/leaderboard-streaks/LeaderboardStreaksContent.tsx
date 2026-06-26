"use client";

import { useEffect, useState } from "react";
import { Avatar, Box, ButtonBase, CircularProgress, Menu, MenuItem, Stack, Typography } from "@mui/material";
import { Icon } from "@iconify/react";
import { Reveal } from "@/components/scorecard/shared";
import { MomentumInfo } from "@/components/common/MomentumInfo";
import { avatarColor, RANK_BG, RANK_FG } from "@/components/dashboard/v2/parts";
import { adaptiveJourneyService } from "@/lib/services/adaptive-journey.service";
import type { LbRow, LeaderboardPeriod, LeaderboardStreaks } from "@/lib/types/leaderboard-streaks";

const CARD = { borderRadius: 4, border: "1px solid #eef2f7", bgcolor: "#fff", boxShadow: "0 1px 2px rgba(16,24,40,0.04)" };
const WEEKDAYS = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];
const PERIOD_LABEL: Record<LeaderboardPeriod, string> = { week: "This week", all: "All time" };

function SectionBadge({ icon, gradient }: { icon: string; gradient: string }) {
  return (
    <Box sx={{ width: 34, height: 34, borderRadius: 2.5, flexShrink: 0, display: "grid", placeItems: "center", color: "white", background: gradient, boxShadow: "0 8px 18px -10px rgba(124,58,237,0.6)" }}>
      <Icon icon={icon} width={19} />
    </Box>
  );
}

function HeroChip({ icon, text }: { icon: string; text: string }) {
  return (
    <Stack direction="row" spacing={0.5} alignItems="center" sx={{ px: 1.1, py: 0.5, borderRadius: 999, bgcolor: "rgba(255,255,255,0.16)", fontSize: "0.76rem", fontWeight: 700 }}>
      <Icon icon={icon} width={14} /> {text}
    </Stack>
  );
}

function RankDeltaPill({ delta }: { delta: number }) {
  if (delta > 0) return <Pill icon="mdi:triangle" text={`${delta}`} color="#15803d" bg="#f0fdf4" />;
  if (delta < 0) return <Pill icon="mdi:triangle-down" text={`${Math.abs(delta)}`} color="#b91c1c" bg="#fef2f2" />;
  return <Pill icon="mdi:minus" text="0" color="#94a3b8" bg="#f1f5f9" />;
}

function Pill({ icon, text, color, bg }: { icon: string; text: string; color: string; bg: string }) {
  return (
    <Stack direction="row" spacing={0.3} alignItems="center" sx={{ px: 0.75, py: 0.25, borderRadius: 999, bgcolor: bg }}>
      <Icon icon={icon} width={9} color={color} />
      <Typography sx={{ fontSize: "0.7rem", fontWeight: 800, color }}>{text}</Typography>
    </Stack>
  );
}

function LeaderRow({ r }: { r: LbRow }) {
  const me = r.is_current_user;
  return (
    <Stack
      direction="row" alignItems="center" spacing={1.5}
      sx={{
        p: 1.25, borderRadius: 3, border: "1px solid", borderColor: me ? "#ddd6fe" : "#eef2f7",
        bgcolor: me ? "#f5f3ff" : "#fff", transition: "transform .12s, box-shadow .12s, border-color .12s",
        "&:hover": { transform: "translateX(2px)", borderColor: me ? "#c4b5fd" : "#e2e8f0", boxShadow: "0 10px 24px -18px rgba(16,24,40,0.3)" },
      }}
    >
      <Box sx={{ width: 26, height: 26, borderRadius: "50%", flexShrink: 0, display: "grid", placeItems: "center", fontSize: "0.78rem", fontWeight: 800, color: RANK_FG[r.rank] ?? "#64748b", bgcolor: RANK_BG[r.rank] ?? "#f1f5f9" }}>
        {r.rank}
      </Box>
      <Avatar src={r.profile_pic_url ?? undefined} sx={{ width: 38, height: 38, fontSize: "0.95rem", fontWeight: 800, bgcolor: avatarColor(r.name) }}>
        {r.name.charAt(0).toUpperCase()}
      </Avatar>
      <Box sx={{ minWidth: 0, flex: 1 }}>
        <Typography sx={{ fontWeight: 800, fontSize: "0.92rem", color: "#0f172a", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {me ? "You" : r.name}{me && <Box component="span" sx={{ color: "#7c3aed", fontWeight: 700, ml: 0.5 }}>(you)</Box>}
        </Typography>
        <Typography sx={{ fontSize: "0.74rem", color: "#94a3b8" }}>Score: {r.score.toLocaleString()}</Typography>
      </Box>
      <RankDeltaPill delta={r.rankDelta} />
      <Typography sx={{ fontWeight: 800, fontSize: "0.95rem", color: "#7c3aed", minWidth: 34, textAlign: "right" }}>#{r.rank}</Typography>
    </Stack>
  );
}

function Calendar({ cal, bestDay }: { cal: LeaderboardStreaks["calendar"]; bestDay: string | null }) {
  const cells: ({ day: number; active: boolean } | null)[] = [
    ...Array.from({ length: cal.firstWeekday }, () => null),
    ...cal.days,
  ];
  return (
    <Box sx={{ ...CARD, p: 2.25 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1.75 }}>
        <Stack direction="row" spacing={1.25} alignItems="center">
          <SectionBadge icon="mdi:calendar-month" gradient="linear-gradient(135deg, #f59e0b, #f97316)" />
          <Box>
            <Typography sx={{ fontWeight: 800, fontSize: "1.05rem", color: "#0f172a", lineHeight: 1.15 }}>{cal.label}</Typography>
            <Typography sx={{ fontSize: "0.74rem", color: "#64748b" }}>Days you showed up</Typography>
          </Box>
        </Stack>
        {bestDay && (
          <Stack direction="row" spacing={0.4} alignItems="center" sx={{ px: 1, py: 0.4, borderRadius: 999, bgcolor: "#f5f3ff" }}>
            <Icon icon="mdi:star-four-points" width={12} color="#7c3aed" />
            <Typography sx={{ fontSize: "0.72rem", fontWeight: 700, color: "#6d28d9" }}>Best day: {bestDay}</Typography>
          </Stack>
        )}
      </Stack>
      <Box sx={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 0.75 }}>
        {WEEKDAYS.map((d) => (
          <Typography key={d} sx={{ textAlign: "center", fontSize: "0.72rem", fontWeight: 700, color: "#94a3b8", mb: 0.5 }}>{d}</Typography>
        ))}
        {cells.map((c, i) => {
          if (!c) return <Box key={`e${i}`} />;
          const today = c.day === cal.todayDay;
          return (
            <Box
              key={c.day}
              sx={{
                aspectRatio: "1", borderRadius: 2.5, display: "grid", placeItems: "center",
                fontSize: "0.85rem", fontWeight: c.active ? 800 : 600,
                color: c.active ? "white" : "#94a3b8",
                background: c.active ? "linear-gradient(155deg, #fbbf24, #f97316)" : "transparent",
                boxShadow: c.active ? "0 6px 14px -8px rgba(249,115,22,0.7)" : "none",
                border: today && !c.active ? "2px solid #f97316" : "none",
                outline: today && c.active ? "2px solid #c2410c" : "none",
                outlineOffset: today && c.active ? "1px" : 0,
              }}
            >
              {c.day}
            </Box>
          );
        })}
      </Box>
    </Box>
  );
}

function StreakCard({ s }: { s: LeaderboardStreaks["streak"] }) {
  return (
    <Box sx={{ borderRadius: 4, overflow: "hidden", boxShadow: "0 18px 44px -26px rgba(249,115,22,0.7)" }}>
      <Box sx={{ p: 2.5, color: "white", position: "relative", overflow: "hidden", background: "radial-gradient(120% 120% at 100% 0%, rgba(251,191,36,0.5) 0%, rgba(249,115,22,0) 55%), linear-gradient(120deg, #f97316 0%, #ea580c 60%, #c2410c 100%)" }}>
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
          <Box>
            <Typography sx={{ fontSize: "0.78rem", fontWeight: 700, color: "rgba(255,255,255,0.92)" }}>Current streak</Typography>
            <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 0.5 }}>
              <Typography sx={{ fontSize: "2.4rem" }}>🔥</Typography>
              <Typography sx={{ fontWeight: 900, fontSize: "2.4rem", lineHeight: 1 }}>{s.current} <Box component="span" sx={{ fontSize: "1.2rem", fontWeight: 700 }}>days</Box></Typography>
            </Stack>
            <Typography sx={{ fontSize: "0.72rem", fontWeight: 700, color: "rgba(255,255,255,0.85)", mt: 0.75 }}>Personal best: {s.longest} days</Typography>
          </Box>
          <Box sx={{ textAlign: "right" }}>
            <Stack direction="row" spacing={0.25} alignItems="center" justifyContent="flex-end">
              <Typography sx={{ fontSize: "0.72rem", fontWeight: 700, color: "#fff" }}>AI momentum score</Typography>
              <MomentumInfo info={s.momentumInfo} size={14} color="#ffffff" />
            </Stack>
            <Typography sx={{ fontWeight: 900, fontSize: "1.8rem", lineHeight: 1.1 }}>{s.momentum}<Box component="span" sx={{ fontSize: "0.95rem", fontWeight: 700, color: "rgba(255,255,255,0.85)" }}>/100</Box></Typography>
          </Box>
        </Stack>
      </Box>
      <Box sx={{ p: 2, bgcolor: "#fff", border: "1px solid #eef2f7", borderTop: "none", borderRadius: "0 0 16px 16px" }}>
        <Stack direction="row" spacing={0.75} alignItems="flex-start">
          <Icon icon="mdi:star-four-points" width={15} color="#7c3aed" style={{ flexShrink: 0, marginTop: 2 }} />
          <Typography sx={{ fontSize: "0.82rem", color: "#475569", lineHeight: 1.5 }}>
            <Box component="span" sx={{ fontWeight: 800, color: "#6d28d9" }}>AI forecast: </Box>{s.forecast}
          </Typography>
        </Stack>
        {s.atRisk && (
          <Stack direction="row" spacing={0.75} alignItems="flex-start" sx={{ mt: 1.25, p: 1.25, borderRadius: 2.5, bgcolor: "#fffbeb", border: "1px solid #fde68a" }}>
            <Icon icon="mdi:alarm" width={16} color="#b45309" style={{ flexShrink: 0, marginTop: 1 }} />
            <Typography sx={{ fontSize: "0.8rem", color: "#92400e", lineHeight: 1.5 }}>
              <Box component="span" sx={{ fontWeight: 800 }}>Streak at risk. </Box>{s.atRiskTip}
            </Typography>
          </Stack>
        )}
      </Box>
    </Box>
  );
}

export function LeaderboardStreaksContent() {
  const [data, setData] = useState<LeaderboardStreaks | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<LeaderboardPeriod>("week");
  const [menuEl, setMenuEl] = useState<HTMLElement | null>(null);

  // State is only set in the async callbacks (never synchronously in the effect body);
  // the period-change spinner is armed in the menu handler instead.
  useEffect(() => {
    let cancelled = false;
    adaptiveJourneyService.getLeaderboardStreaks(period)
      .then((d) => { if (!cancelled) setData(d); })
      .catch(() => { if (!cancelled) setData(null); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [period]);

  const me = data?.leaderboard.me;

  return (
    <Box>
      {/* Hero */}
      <Reveal>
        <Box sx={{ borderRadius: 5, p: { xs: 2.5, md: 3.5 }, mb: 3, color: "white", position: "relative", overflow: "hidden", background: "radial-gradient(110% 130% at 90% -10%, rgba(236,72,153,0.45) 0%, rgba(124,58,237,0) 55%), linear-gradient(135deg, #7c3aed 0%, #a855f7 55%, #c026d3 100%)", boxShadow: "0 24px 60px -30px rgba(124,58,237,0.7)" }}>
          <Stack direction="row" spacing={1.75} alignItems="flex-start">
            <Box sx={{ width: 52, height: 52, borderRadius: 3, flexShrink: 0, display: "grid", placeItems: "center", bgcolor: "rgba(255,255,255,0.16)", border: "1px solid rgba(255,255,255,0.25)" }}>
              <Icon icon="mdi:trophy-variant" width={28} />
            </Box>
            <Box sx={{ minWidth: 0 }}>
              <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                <Typography sx={{ fontWeight: 900, fontSize: { xs: "1.6rem", md: "2.1rem" }, lineHeight: 1.1 }}>Leaderboard &amp; Streaks</Typography>
                <Box sx={{ px: 1, py: 0.3, borderRadius: 999, fontSize: "0.62rem", fontWeight: 800, color: "#7c3aed", bgcolor: "white" }}>AI INSIGHT</Box>
              </Stack>
              <Typography sx={{ fontSize: "0.92rem", color: "rgba(255,255,255,0.88)", mt: 1, maxWidth: 720, lineHeight: 1.55 }}>
                Not just rankings — how to climb, and how to keep your momentum.
              </Typography>
              {data && (
                <Stack direction="row" gap={1} flexWrap="wrap" sx={{ mt: 1.75 }}>
                  {me && <HeroChip icon="mdi:trophy" text={`Rank #${me.rank} · Top ${me.percentile}%`} />}
                  <HeroChip icon="mdi:fire" text={`${data.streak.current}-day streak`} />
                  <HeroChip icon="mdi:chart-line-variant" text={`Momentum ${data.streak.momentum}/100`} />
                  <HeroChip icon="mdi:account-group" text={`${data.leaderboard.total} in cohort`} />
                </Stack>
              )}
            </Box>
          </Stack>
        </Box>
      </Reveal>

      {loading && !data ? (
        <Box sx={{ display: "grid", placeItems: "center", py: 12 }}><CircularProgress sx={{ color: "#7c3aed" }} /></Box>
      ) : !data ? (
        <Typography sx={{ color: "#b91c1c", py: 6, textAlign: "center", fontWeight: 600 }}>Couldn&apos;t load leaderboard &amp; streaks.</Typography>
      ) : (
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", lg: "minmax(0,1fr) 1fr" }, gap: 2.5, alignItems: "start" }}>
          {/* Leaderboard */}
          <Reveal>
            <Box sx={{ ...CARD, p: 2.5, opacity: loading ? 0.6 : 1, transition: "opacity .2s" }}>
              <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1.75 }}>
                <Stack direction="row" spacing={1.25} alignItems="center">
                  <SectionBadge icon="mdi:trophy" gradient="linear-gradient(135deg, #f59e0b, #f97316)" />
                  <Box>
                    <Typography sx={{ fontWeight: 800, fontSize: "1.1rem", color: "#0f172a", lineHeight: 1.15 }}>Leaderboard</Typography>
                    <Typography sx={{ fontSize: "0.74rem", color: "#64748b" }}>Where you stand in your cohort</Typography>
                  </Box>
                </Stack>
                <ButtonBase onClick={(e) => setMenuEl(e.currentTarget)} sx={{ px: 1.25, py: 0.6, borderRadius: 999, border: "1px solid #e2e8f0", fontSize: "0.8rem", fontWeight: 700, color: "#475569", gap: 0.4, "&:hover": { borderColor: "#c4b5fd", color: "#6d28d9" } }}>
                  {PERIOD_LABEL[data.period]} <Icon icon="mdi:chevron-down" width={16} />
                </ButtonBase>
                <Menu anchorEl={menuEl} open={Boolean(menuEl)} onClose={() => setMenuEl(null)}>
                  {(["week", "all"] as LeaderboardPeriod[]).map((p) => (
                    <MenuItem key={p} selected={p === period} onClick={() => { if (p !== period) setLoading(true); setPeriod(p); setMenuEl(null); }} sx={{ fontSize: "0.85rem" }}>
                      {PERIOD_LABEL[p]}
                    </MenuItem>
                  ))}
                </Menu>
              </Stack>

              {data.leaderboard.climbText && (
                <Stack direction="row" spacing={0.75} alignItems="flex-start" sx={{ mb: 1.75, p: 1.5, borderRadius: 3, background: "linear-gradient(120deg, #f5f3ff, #fdf2f8)", border: "1px solid #f1ebff" }}>
                  <Icon icon="mdi:star-four-points" width={15} color="#7c3aed" style={{ flexShrink: 0, marginTop: 2 }} />
                  <Typography sx={{ fontSize: "0.82rem", color: "#475569", lineHeight: 1.5 }}>
                    <Box component="span" sx={{ fontWeight: 800, color: "#6d28d9" }}>AI climb plan: </Box>{data.leaderboard.climbText}
                  </Typography>
                </Stack>
              )}

              {data.leaderboard.rows.length === 0 ? (
                <Typography sx={{ color: "#94a3b8", textAlign: "center", py: 4, fontSize: "0.85rem" }}>No leaderboard activity yet — earn some points to appear here.</Typography>
              ) : (
                <Stack spacing={1}>
                  {data.leaderboard.rows.map((r) => <LeaderRow key={r.rank + r.name} r={r} />)}
                </Stack>
              )}
            </Box>
          </Reveal>

          {/* Streak + calendar */}
          <Stack spacing={2.5}>
            <Reveal><StreakCard s={data.streak} /></Reveal>
            <Reveal><Calendar cal={data.calendar} bestDay={data.streak.bestDay} /></Reveal>
          </Stack>
        </Box>
      )}
    </Box>
  );
}
