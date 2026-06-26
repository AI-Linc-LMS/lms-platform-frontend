import type { FieldTier, LeaderboardRow } from "./adaptive-journey";
import type { MomentumInfo } from "./momentum";

// Payload for GET /adaptive-journey/api/learner/dashboard/

export type ReadinessBand = "not-started" | "needs-work" | "building" | "strong";

export interface ReadinessCell {
  percent: number | null;
  band: ReadinessBand;
}

export interface CourseReadiness {
  coverage: ReadinessCell;
  precision: ReadinessCell;
  craft: ReadinessCell;
  clutch: ReadinessCell;
  overall: ReadinessCell;
}

export interface DashboardSkill {
  skill: string;
  percent: number;
  band: "strong" | "emerging";
}

export interface CourseSkillProfile {
  abilityIndex: number | null;
  fieldTier: FieldTier | null;
  mastery: number | null;
  skillsTracked: number;
  skills: DashboardSkill[];
  aiTip: string;
}

export interface NodeRef {
  submoduleId?: number;
  assessmentId?: number;
  interviewTemplateId?: number;
}

export interface UpNextNode {
  nodeId: number;
  title: string;
  type: string;
  points: number;
  weekNo: number | null;
  ref: NodeRef;
  dueAt: string | null;
  lockReason: string | null;
  why: string;
}

export interface CrossCourseUpNext extends UpNextNode {
  courseId: number;
  courseTitle: string;
  resumeSubmoduleId: number | null;
}

export interface CourseDue {
  dueAt: string | null;
  zeroAfter: string | null;
  penaltyNote: string | null;
}

export interface DashboardCourse {
  id: number;
  title: string;
  cardImageUrl: string | null;
  completionPct: number;
  readiness: CourseReadiness;
  skillProfile: CourseSkillProfile;
  upNext: UpNextNode | null;
  resumeSubmoduleId: number | null;
  due: CourseDue | null;
  leaderboardRank: number | null;
  certificate: { enabled: boolean; pct: number; threshold: number };
}

export interface DashboardAggregate {
  totalPoints: number;
  pointsThisWeek: number;
  streak: { current: number; best: number; atRisk: boolean };
  momentum: number;
  momentumInfo: MomentumInfo;
  onTimeRate: number | null;
  overallMasteryAvg: number | null;
  cohortRank: { bestRank: number | null; rankDelta: number; perCourse: Record<string, number | null> };
}

export interface DashboardLeaderboard {
  // score + trend are also sent by the API but surfaced via the rows (current-user row)
  // and the rankDelta arrow, so the panel only consumes rank / percentile / rankDelta.
  me: { rank: number; percentile: number; rankDelta: number } | null;
  rows: LeaderboardRow[];
  aiTip: string | null;
}

export interface BriefingAction {
  label: string;
  course: string;
  route: string;
  points: number;
  kind: string;
}

export interface AiBriefing {
  headline: string;
  lastWeek: string;
  thisWeek: { focus: string; course: string };
  today: string;
  weakestSkill: { skill: string; course: string; percent: number; fixSuggestion: string; route: string } | null;
  actions: BriefingAction[];
  focusRoute: string;
  source: string;
}

export interface LearnerDashboard {
  profile: {
    name: string;
    weekNo: number | null;
    weekDueAt: string | null;
    weekProgressPct: number;
    streakDays: number;
    bestStreak: number;
  };
  aggregate: DashboardAggregate;
  courses: DashboardCourse[];
  crossCourseUpNext: CrossCourseUpNext[];
  leaderboard: DashboardLeaderboard;
  briefing: AiBriefing | null;
  generatedAt: string;
}
