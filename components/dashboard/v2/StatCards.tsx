"use client";

import { useEffect, useState } from "react";
import { Box } from "@mui/material";
import { CountUp, Reveal } from "@/components/scorecard/shared";
import { AnimatedPointsCounter } from "@/components/common/AnimatedPointsCounter";
import { PointsInfo } from "@/components/common/PointsInfo";
import { StreakInfo } from "@/components/common/StreakInfo";
import { MomentumInfo } from "@/components/common/MomentumInfo";
import type { DashboardAggregate } from "@/lib/types/dashboard";
import { StatBox } from "./parts";
import { useTranslation } from "react-i18next";

const LAST_TOTAL_KEY = "ailinc_last_total_points";

/** Total points that counts up from the LAST-seen total to the current one (with
 *  a lightning zap) whenever it has grown since the learner last saw the dashboard. */
function TotalPointsValue({ total }: { total: number }) {
  const [initialFrom] = useState<number | undefined>(() => {
    if (typeof window === "undefined") return undefined;
    const raw = window.localStorage.getItem(LAST_TOTAL_KEY);
    const last = raw != null ? Number(raw) : NaN;
    return Number.isFinite(last) && last < total ? last : undefined;
  });
  useEffect(() => {
    if (typeof window !== "undefined") window.localStorage.setItem(LAST_TOTAL_KEY, String(total));
  }, [total]);
  return <AnimatedPointsCounter value={total} initialFrom={initialFrom} boltSize={16} />;
}

export function StatCards({
  aggregate, hideLeaderboard,
}: { aggregate: DashboardAggregate; hideLeaderboard: boolean }) {
  const { t } = useTranslation("common");
  const a = aggregate;
  const rankDelta = a.cohortRank.rankDelta || 0;
  // Momentum is derived from the streak, so a learner who has never done anything scores a
  // genuine 0 - and "0 / of 100" reads as a mark they were given rather than a measurement that
  // has not been taken. On-time rate already says "-" / "no data yet" for exactly this; momentum
  // now agrees. "No activity at all" is the only case: one point or one day of streak and the
  // number is real again.
  const noActivityYet = a.totalPoints === 0 && a.streak.best === 0 && a.momentum === 0;
  const cards: React.ReactNode[] = [
    <StatBox
      key="points"
      label="Total points"
      value={<TotalPointsValue total={a.totalPoints} />}
      sub={a.pointsThisWeek ? `+${a.pointsThisWeek} this week` : "Start earning"}
      subColor={a.pointsThisWeek ? "#7c3aed" : "#94a3b8"}
      icon="mdi:star-four-points"
      accent="#7c3aed"
      info={<PointsInfo size={13} />}
    />,
    <StatBox
      key="streak"
      label="Day streak"
      value={<CountUp value={a.streak.current} />}
      sub={`best ${a.streak.best}`}
      subColor="#94a3b8"
      icon="mdi:fire"
      accent="#ef4444"
      info={<StreakInfo size={13} />}
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
        accent="#3b82f6"
      />,
    );
  }

  cards.push(
    <StatBox
      key="momentum"
      label="Momentum"
      value={noActivityYet ? "-" : <CountUp value={a.momentum} />}
      sub={noActivityYet ? t("zeroCourseDashboard.momentumNotStarted", { defaultValue: "not started yet" }) : "of 100"}
      icon="mdi:chart-line-variant"
      accent="#f59e0b"
      info={<MomentumInfo info={a.momentumInfo} size={13} />}
    />,
    <StatBox
      key="ontime"
      label="On-time rate"
      value={a.onTimeRate == null ? "-" : `${Math.round(a.onTimeRate * 100)}%`}
      sub={a.onTimeRate === 1 ? "no penalties" : a.onTimeRate == null ? "no data yet" : "keep it up"}
      subColor={a.onTimeRate === 1 ? "#15803d" : "#94a3b8"}
      icon="mdi:check-circle-outline"
      accent="#22c55e"
    />,
  );

  const cols = cards.length;
  return (
    <Reveal>
      <Box
      sx={{
        display: "grid",
        gridTemplateColumns: { xs: "repeat(2,1fr)", sm: "repeat(3,1fr)", lg: `repeat(${cols},1fr)` },
        gap: 1.5,
        mb: 2.5,
        "& > *": { minWidth: 0 },
      }}
    >
        {cards}
      </Box>
    </Reveal>
  );
}
