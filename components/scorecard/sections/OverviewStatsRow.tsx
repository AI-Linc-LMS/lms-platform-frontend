"use client";

import { motion } from "framer-motion";
import { Clock, CalendarDays, Flame, CheckCircle2 } from "lucide-react";
import { StatTile } from "@/components/scorecard/primitives";
import { fadeInUp, staggerContainer } from "@/lib/motion/scorecard-presets";
import { formatTimeSpent } from "@/lib/services/scorecard/mappers";
import type { StudentOverview } from "@/lib/types/scorecard.types";

interface OverviewStatsRowProps {
  overview: StudentOverview;
  currentStreak?: number;
}

export function OverviewStatsRow({ overview, currentStreak }: OverviewStatsRowProps) {
  const streak = currentStreak ?? overview.activeDaysStreak ?? 0;

  return (
    <motion.div
      variants={staggerContainer}
      initial="initial"
      animate="animate"
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
        gap: 12,
      }}
    >
      <motion.div variants={fadeInUp}>
        <StatTile
          icon={<Clock size={14} />}
          label="Time invested"
          value={formatTimeSpent(overview.totalTimeSpentSeconds)}
        />
      </motion.div>
      <motion.div variants={fadeInUp}>
        <StatTile
          icon={<CalendarDays size={14} />}
          label="Active days"
          value={overview.totalDaysActive}
        />
      </motion.div>
      <motion.div variants={fadeInUp}>
        <StatTile
          icon={<Flame size={14} />}
          label="Current streak"
          value={`${streak} ${streak === 1 ? "day" : "days"}`}
          tone={streak >= 7 ? "success" : streak >= 3 ? "warning" : "neutral"}
        />
      </motion.div>
      <motion.div variants={fadeInUp}>
        <StatTile
          icon={<CheckCircle2 size={14} />}
          label="Completion"
          value={`${Math.round(overview.completionPercentage || 0)}%`}
          tone={overview.completionPercentage >= 75 ? "success" : overview.completionPercentage >= 40 ? "warning" : "neutral"}
        />
      </motion.div>
    </motion.div>
  );
}
