// Payload for GET /adaptive-journey/api/points-system/ (derived from the scoring engine).

export interface PointsActivity {
  key: string;
  icon: string;
  accent: string;
  label: string;
  sub: string;
  points: string;
  unit: string;
}

export interface DecayCurvePoint {
  t: number;
  pts: number;
}

export interface DecaySpec {
  title: string;
  base: number;
  grace: number;
  dec: number;
  iv: number;
  floor: number;
  tMax: number;
  curve: DecayCurvePoint[];
}

export interface DifficultyRow {
  label: string;
  mult: number;
  quiz: number;
  coding: number;
}

export interface LateBand {
  label: string;
  note: string;
  mult: number;
  caption: string;
}

/** What a retry is worth, and the rule that a learner keeps their best attempt. */
export interface PointsRetry {
  /** The last attempt still worth full value. */
  fullThrough: number;
  /** Which activities the ladder applies to (coding, quiz). */
  activities: string[];
  bands: LateBand[];
  note: string;
}

export interface PointsLate {
  windowDays: number;
  halfWindowDays: number;
  staggerDays: number;
  bands: LateBand[];
}

export interface WorkedExampleRow {
  label: string;
  raw: number;
  late: boolean;
  final: number;
}

export interface WorkedExample {
  summary: string;
  latePct: number;
  rows: WorkedExampleRow[];
  total: number;
}

export interface PointsSystem {
  title: string;
  subtitle: string;
  formula: string;
  formulaNote: string;
  activities: PointsActivity[];
  decay: { quizEasy: DecaySpec; codingHard: DecaySpec };
  difficulty: DifficultyRow[];
  late: PointsLate;
  /** Absent from an older server - render nothing rather than inventing a rule. */
  retry?: PointsRetry;
  workedExample: WorkedExample;
}
