/**
 * Shared types + helpers for the adaptive-quiz-create wizard draft.
 *
 * We intentionally avoid a global store: a single wizard owns the draft,
 * holds it in `useState`/`useReducer`, and ships the final payload to
 * `POST /adaptive-quiz/api/admin/quizzes/`. Keeping it local means a stale
 * draft never leaks into a future visit and no extra dependency is needed.
 */

import type { AdminMcq } from "@/lib/services/admin/admin-adaptive-quiz.service";

export type Difficulty = "Easy" | "Medium" | "Hard";

export interface DifficultyCell {
  Easy: number;
  Medium: number;
  Hard: number;
}

export interface AdaptiveQuizDraft {
  title: string;
  instructions: string;
  topic: string;
  /** Ordered list of sub-skills the quiz will target. */
  sub_skills: string[];
  /** Per-sub-skill difficulty mix. Key is the sub_skill, value is counts. */
  matrix: Record<string, DifficultyCell>;
  min_questions: number;
  max_questions: number;
  se_threshold: number;
  hint_tokens: number;
  confidence_prompt_enabled: boolean;
  /** MCQ bank - empty during Step 1, populated in Step 2 (AI) or by stub. */
  mcqs: AdminMcq[];
}

export const DEFAULT_CELL: DifficultyCell = { Easy: 2, Medium: 2, Hard: 1 };

export function emptyDraft(): AdaptiveQuizDraft {
  return {
    title: "",
    instructions: "",
    topic: "",
    sub_skills: [],
    matrix: {},
    min_questions: 6,
    max_questions: 12,
    se_threshold: 0.35,
    hint_tokens: 2,
    confidence_prompt_enabled: true,
    mcqs: [],
  };
}

export function totalQuestions(matrix: Record<string, DifficultyCell>): number {
  return Object.values(matrix).reduce(
    (acc, cell) => acc + (cell.Easy || 0) + (cell.Medium || 0) + (cell.Hard || 0),
    0,
  );
}

/** Build a default matrix when sub_skills change - keep existing values, fill new ones. */
export function reconcileMatrix(
  prev: Record<string, DifficultyCell>,
  nextSkills: string[],
): Record<string, DifficultyCell> {
  const out: Record<string, DifficultyCell> = {};
  for (const s of nextSkills) {
    out[s] = prev[s] ?? { ...DEFAULT_CELL };
  }
  return out;
}
