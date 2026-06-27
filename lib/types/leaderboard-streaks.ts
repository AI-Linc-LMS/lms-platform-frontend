// Payload for GET /adaptive-journey/api/learner/leaderboard-streaks/

import type { MomentumInfo } from "./momentum";

export type LeaderboardPeriod = "all" | "week";

export interface LbRow {
  rank: number;
  name: string;
  score: number;
  trend: "up" | "down" | "flat";
  rankDelta: number;
  profile_pic_url: string | null;
  is_current_user: boolean;
}

export interface LbMe {
  rank: number;
  score: number;
  trend: "up" | "down" | "flat";
  percentile: number;
  rankDelta: number;
}

export interface CalendarDay {
  day: number;
  active: boolean;
}

export interface StreakCalendar {
  label: string;
  firstWeekday: number; // 0 = Monday
  todayDay: number;
  days: CalendarDay[];
}

export interface LeaderboardStreaks {
  period: LeaderboardPeriod;
  leaderboard: {
    me: LbMe | null;
    rows: LbRow[];
    total: number;
    climbText: string;
    rankDelta: number;
  };
  streak: {
    current: number;
    longest: number;
    momentum: number;
    momentumInfo: MomentumInfo;
    atRisk: boolean;
    forecast: string;
    atRiskTip: string;
    bestDay: string | null;
  };
  calendar: StreakCalendar;
}
