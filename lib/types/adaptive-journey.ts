// Types for the adaptive-journey backend (calibration, scored journey, points,
// leaderboard, streak). Mirrors the payloads emitted by the Django
// `adaptive_journey` app. Board endpoints use camelCase; wallet/leaderboard/
// streak/admin endpoints use snake_case — preserved here verbatim.

export type NodeType = "topic" | "checkpoint" | "interview" | "week_final";
export type NodeStatus = "locked" | "current" | "done";
export type UnlockRule = "sequential" | "week_open" | "prev_passed" | "always";
export type FieldTier = "beginner" | "intermediate" | "advanced";

export interface JourneyNodeRef {
  submoduleId?: number | null;
  assessmentId?: number | null;
  interviewTemplateId?: number | null;
}

export interface JourneyNodeView {
  id: number;
  type: NodeType;
  title: string;
  order: number;
  status: NodeStatus;
  score: { earned: number; total: number };
  weight: number;
  basePoints: number;
  unlockRule: UnlockRule;
  lockReason: string | null;
  isCalibration: boolean;
  content?: { articles: number; quizzes: number; coding: number; videos: number } | null;
  ref: JourneyNodeRef;
}

export interface JourneyWeekSchedule {
  opensAt: string;
  dueAt: string;
  startDay: number;
  dueDay: number;
}

export interface JourneyWeekView {
  weekNo: number;
  title: string;
  schedule: JourneyWeekSchedule | null;
  penaltyStrip: { onTimeUntil: string; halfCreditUntil: string; zeroAfter: string } | null;
  totals: { earned: number; total: number };
  nodes: JourneyNodeView[];
}

export interface JourneyBoard {
  course: { id: number; title: string; fieldTier: FieldTier | null; abilityIndex: number | null };
  progressCard: {
    pointsEarned: number;
    pointsTotal: number;
    onTimeRate: number | null;
    nodesDone: number;
    nodesTotal: number;
  };
  calibration: {
    required: boolean;
    done: boolean;
    card: {
      assessmentId: number | null;
      assessmentSlug: string | null;
      title: string;
      points: number;
      durationMinutes: number | null;
      questionCount: number;
      proctored: boolean;
      configured: boolean;
      generating: boolean;
      status: "done" | "not_started" | "not_configured";
    } | null;
  };
  weeks: JourneyWeekView[];
}

export interface PointsDecayCurve {
  base: number;
  grace: number;
  dec: number;
  iv: number;
  floor: number;
  sample: { t: number; p: number }[];
}

export interface PointsWallet {
  total: number;
  tier: "bronze" | "silver" | "gold" | "platinum";
  tier_display: string;
  next_tier_threshold: number | null;
  progress_pct: number;
  by_week: Record<string, number>;
  by_activity_type: Record<string, number>;
  on_time_rate: number | null;
  recent_events: {
    activity_type: string;
    difficulty: string;
    base: number;
    after_decay: number;
    correctness_factor: number;
    late_penalty_mult: number;
    weight: number;
    earned: number;
    earned_at: string;
  }[];
  formula: { expression: string; difficulty_mult: Record<string, number> };
  decay_curves: { quiz_easy: PointsDecayCurve; coding_hard: PointsDecayCurve };
}

export type TrendDirection = "up" | "down" | "flat";

export interface LeaderboardRow {
  rank: number;
  name: string;
  score: number;
  profile_pic_url: string | null;
  trend: TrendDirection;
  is_current_user: boolean;
}

export interface Leaderboard {
  me: { rank: number; score: number; trend: TrendDirection } | null;
  rows: LeaderboardRow[];
  climb_plan: { target_rank: number; points_gap: number; text: string } | null;
}

export interface StreakSummary {
  current_len: number;
  longest_len: number;
  last_active_date: string | null;
  momentum_score: number;
  forecast_days: number;
  at_risk: boolean;
  weekly_goal: { target: number; text: string };
}

// ---- Admin course-builder shapes ----

export interface CohortScheduleView {
  start_date: string;
  week_stagger_days: number;
  week_window_days: number;
  is_active: boolean;
}

export interface CohortCalendarWeek {
  week_no: number;
  opens_at: string;
  due_at: string;
  start_day: number;
  due_day: number;
}

export interface CohortScheduleResponse {
  schedule: CohortScheduleView | null;
  calendar: CohortCalendarWeek[];
  schedule_set: boolean;
}

export interface AdminJourneyNode {
  id: number;
  week_no: number;
  order: number;
  type: NodeType;
  title: string;
  base_points: number;
  weight: number;
  unlock_rule: UnlockRule;
  meta: Record<string, unknown>;
  points_config: Record<string, unknown>;
  is_calibration: boolean;
  ref: { submodule_id?: number; assessment_id?: number; interview_template_id?: number };
}

export interface AdminNodeWritePayload {
  type: NodeType;
  week_no: number;
  order: number;
  base_points?: number;
  weight?: number;
  unlock_rule?: UnlockRule;
  title?: string;
  meta?: Record<string, unknown>;
  points_config?: Record<string, unknown>;
  submodule_id?: number;
  assessment_id?: number;
  interview_template_id?: number;
}
