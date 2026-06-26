"use client";

import { Box } from "@mui/material";
import { CountUp, Reveal } from "@/components/scorecard/shared";
import type { DashboardAggregate } from "@/lib/types/dashboard";
import { StatBox } from "./parts";

export function StatCards({
  aggregate, hideLeaderboard,
}: { aggregate: DashboardAggregate; hideLeaderboard: boolean }) {
  const a = aggregate;
  const rankDelta = a.cohortRank.rankDelta || 0;
  const cards: React.ReactNode[] = [
    <StatBox
      key="points"
      label="Total points"
      value={<CountUp value={a.totalPoints} />}
      sub={a.pointsThisWeek ? `+${a.pointsThisWeek} this week` : "Start earning"}
      subColor={a.pointsThisWeek ? "#15803d" : "#94a3b8"}
      icon="mdi:star-four-points"
      accent="#7c3aed"
    />,
    <StatBox
      key="streak"
      label="Day streak"
      value={<CountUp value={a.streak.current} />}
      sub={`best ${a.streak.best}`}
      subColor="#b45309"
      icon="mdi:fire"
      accent="#f97316"
    />,
  ];

  if (!hideLeaderboard && a.cohortRank.bestRank) {
    cards.push(
      <StatBox
        key="rank"
        label="Cohort rank"
        value={`#${a.cohortRank.bestRank}`}
        sub={rankDelta > 0 ? `▲ +${rankDelta} this week` : rankDelta < 0 ? `▼ ${rankDelta} this week` : "holding steady"}
        subColor={rankDelta > 0 ? "#15803d" : rankDelta < 0 ? "#b91c1c" : "#94a3b8"}
        icon="mdi:trophy"
        accent="#6366f1"
      />,
    );
  }

  cards.push(
    <StatBox
      key="momentum"
      label="Momentum"
      value={<CountUp value={a.momentum} />}
      sub="of 100"
      icon="mdi:chart-line-variant"
      accent="#0ea5e9"
    />,
    <StatBox
      key="ontime"
      label="On-time rate"
      value={a.onTimeRate == null ? "—" : `${Math.round(a.onTimeRate * 100)}%`}
      sub={a.onTimeRate === 1 ? "no penalties" : a.onTimeRate == null ? "no data yet" : "keep it up"}
      subColor={a.onTimeRate === 1 ? "#15803d" : "#94a3b8"}
      icon="mdi:check-circle-outline"
      accent="#22c55e"
    />,
  );

  const cols = cards.length;
  return (
    <Reveal>
      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "repeat(2,1fr)", sm: "repeat(3,1fr)", lg: `repeat(${cols},1fr)` }, gap: 1.5, mb: 2.5 }}>
        {cards}
      </Box>
    </Reveal>
  );
}
