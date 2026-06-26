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
  workedExample: WorkedExample;
}
