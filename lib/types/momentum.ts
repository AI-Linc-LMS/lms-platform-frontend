// Shared momentum breakdown (GET dashboard aggregate + leaderboard-streaks streak).
// Mirrors adaptive_journey/scoring/momentum.py::momentum_breakdown.

export interface MomentumInfo {
  value: number;
  current: number; // current streak days
  perDay: number;
  cap: number;
  daysToMax: number;
  atMax: boolean;
  formula: string;
}
