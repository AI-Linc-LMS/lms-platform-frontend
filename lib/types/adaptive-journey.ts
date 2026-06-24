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
  itemCount: number;
  questionCount: number;
  proctored: boolean;
  durationMinutes: number | null;
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
  stepsDone: number;
  stepsTotal: number;
  nodes: JourneyNodeView[];
}

export interface JourneyBoard {
  course: {
    id: number;
    title: string;
    description: string;
    fieldTier: FieldTier | null;
    abilityIndex: number | null;
    enrolledCount: number;
    certificateThreshold: number;
    estHours: number | null;
    sections: number;
    items: number;
    completionPct: number;
    startedAt: string | null;
  };
  progressCard: {
    pointsEarned: number;
    pointsTotal: number;
    onTimeRate: number | null;
    nodesDone: number;
    nodesTotal: number;
    completionPct: number;
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
  interview: {
    required: boolean;
    done: boolean;
    card: {
      templateId: number | null;
      title: string;
      topic: string | null;
      difficulty: string | null;
      durationMinutes: number | null;
      points: number;
      configured: boolean;
      status: "done" | "not_started" | "not_configured";
    };
  };
  weeks: JourneyWeekView[];
}

export interface CalibrationInsight {
  level_label: string;
  field_tier: FieldTier;
  ability_index: number;
  headline: string;
  summary: string;
  strengths: { dimension: string; percent?: number }[];
  growth_areas: { dimension: string; percent?: number }[];
  pace: { label: string | null; note: string; style: string | null };
  how_ai_helps: string[];
  shows_right_wrong: boolean;
}

export interface CalibrationResult {
  done: boolean;
  ability_index?: number;
  field_tier?: FieldTier;
  per_skill?: Record<string, number>;
  per_difficulty?: Record<string, { seen: number; correct: number; rate: number | null }>;
  timing?: {
    answered: number;
    timed: number;
    total_seconds: number | null;
    avg_seconds: number | null;
    median_seconds: number | null;
  };
  pace?: { label: string | null; note: string; style: string | null };
  insight: CalibrationInsight | null;
}

export interface InterviewLevelInsight {
  level_label: string;
  field_tier: FieldTier;
  ability_index: number;
  headline: string;
  summary: string;
  strengths: { area: string }[];
  growth_areas: { area: string }[];
  how_ai_helps: string[];
  shows_marks: boolean;
}

export interface InterviewResult {
  done: boolean;
  ability_index?: number;
  field_tier?: FieldTier;
  insight: InterviewLevelInsight | null;
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

// ---- Course-scoped calibration + interview management (admin) ----

export interface CalibrationSubmissionRow {
  submission_id: number;
  student_id: number;
  name: string;
  email: string | null;
  profile_pic_url: string | null;
  score: number | null;
  status: string;
  submitted_at: string | null;
  ability_index: number | null;
  field_tier: FieldTier | null;
  pace: string | null;
  level_label: string | null;
  summary: string | null;
  strengths: { dimension: string; percent?: number }[];
  growth_areas: { dimension: string; percent?: number }[];
  per_skill: Record<string, number>;
}

export interface CalibrationSubmissionsResponse {
  assessment_id: number | null;
  assessment_slug: string | null;
  configured: boolean;
  submission_count: number;
  submissions: CalibrationSubmissionRow[];
}

export interface CourseInterviewTemplate {
  id: number;
  title: string;
  topic: string;
  subtopic: string;
  difficulty: string;
  duration_minutes: number;
  is_level_gauge: boolean;
  result_release_mode: string;
}

export interface CourseInterviewAttempt {
  interview_id: number;
  student_id: number;
  name: string;
  email: string | null;
  profile_pic_url: string | null;
  template_id: number | null;
  template_title: string;
  topic: string;
  difficulty: string;
  status: string;
  overall_percentage: number | null;
  result_visible_to_student: boolean;
  submitted_at: string | null;
}

export interface CourseInterviewsResponse {
  templates: CourseInterviewTemplate[];
  attempt_count: number;
  attempts: CourseInterviewAttempt[];
}

export interface CalibrationInterviewStatus {
  exists: boolean;
  template_id: number | null;
  node_id: number | null;
  title: string | null;
  topic: string | null;
  difficulty: string | null;
  duration_minutes: number | null;
  points: number;
  configured: boolean;
  status: "ready" | "not_started";
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
