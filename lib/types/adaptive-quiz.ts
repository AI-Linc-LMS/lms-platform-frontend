// Wire shapes for the adaptive quiz module.
// Mirrors `adaptive_quiz.services.session_service.QuestionPayload` and friends on the backend.

export interface AdaptiveOption {
  id: "A" | "B" | "C" | "D" | string;
  label: string;
  value: string;
}

/** Time-decay params for one quiz question - drives the live decaying-points countdown. */
export interface QuestionPointsDecay {
  base: number;  // full points if answered within the grace window
  grace: number; // seconds of full credit
  dec: number;   // points shed per interval past grace
  iv: number;    // interval length, seconds
  floor: number; // minimum points after decay
  hint_penalty?: number; // fraction shaved per hint taken (so the live HUD matches the award)
}

export interface AdaptiveQuestion {
  mcq_id: number;
  question_text: string;
  options: AdaptiveOption[];
  target_skill: string;
  difficulty_label: "Easy" | "Medium" | "Hard" | string;
  selector_rationale: string;
  predicted_p_correct: number; // 0..1
  points?: QuestionPointsDecay | null;
  /** ISO time the server served this question - the per-question clock runs off this (continues
   *  while away), so the live timer/points resume correctly. */
  served_at?: string | null;
}

/** Live completion of a result-page remediation path (GET .../remediation-progress/). */
export interface RemediationProgress {
  steps: Array<{ step: number; content_type: string; done: boolean }>;
  content_done: boolean;
  requiz: { done: boolean; session_id: string | null; status: string | null };
}

export interface AdaptiveSessionMeta {
  min_questions: number;
  max_questions: number;
  target_skills: string[];
  confidence_prompt_enabled: boolean;
  hint_tokens: number;
}

export interface StartSessionResponse {
  session_id: string;
  first_question: AdaptiveQuestion | null;
  meta: AdaptiveSessionMeta;
}

export interface ThetaDeltaEntry {
  before: number;
  after: number;
  se: number;
}

export interface SubmitAnswerResponse {
  is_correct: boolean;
  theta_delta: Record<string, ThetaDeltaEntry>;
  next_question: AdaptiveQuestion | null;
  session_complete: boolean;
  progress: {
    answered: number;
    min_questions: number;
    max_questions: number;
    avg_se: number | null;
  };
  ability_state: Record<string, number>;
  se_state: Record<string, number>;
  points_earned: number; // time-decayed points earned for the question just answered (0 if wrong)
  points_base: number;   // full points that question was worth before decay
}

export interface AdaptiveResponseMcqDetail {
  id: number;
  question_text: string;
  options: AdaptiveOption[];
  correct_option: string;
  difficulty_level: string;
  explanation: string;
}

export interface AdaptiveResponseRow {
  order_index: number;
  mcq: number;
  mcq_detail: AdaptiveResponseMcqDetail;
  target_skill: string;
  selected_option: string;
  is_correct: boolean;
  confidence: number | null;
  time_ms: number;
  hint_used: boolean;
  theta_after: Record<string, number>;
  se_after: Record<string, number>;
  asked_at: string;
}

export interface AdaptiveAINarration {
  headline: string;
  score_summary: {
    correct: number;
    total: number;
    accuracy: number;
    time_total_ms: number;
  };
  skill_mastery: Array<{
    skill: string;
    theta: number;
    se: number;
    mastery_pct: number;
    /** Change in mastery vs the user's previous attempt on this same quiz.
     *  ``null`` = first attempt or first time we've measured this skill -
     *  the UI swaps the +X chip for a "First attempt" badge. */
    delta_pct: number | null;
    /** Baseline mastery% used to compute ``delta_pct``. ``null`` when there's
     *  no prior session - drives the dashed ghost-marker on the bar. */
    previous_mastery_pct?: number | null;
    band: "emerging" | "developing" | "proficient" | "mastered" | string;
  }>;
  /** Populated only for re-quiz sessions (config targets exactly one skill).
   *  Drives the "Skill mastered" / "Improving" / "Keep practising" banner. */
  target_outcome?: {
    kind: "mastered" | "improving" | "no_progress" | "first_measure";
    target_skill: string;
    mastery_pct: number;
    delta_pct: number | null;
    previous_mastery_pct: number | null;
  } | null;
  misconceptions: Array<{
    title: string;
    evidence_question_indices: number[];
    explanation: string;
    fix: string;
  }>;
  per_question: Array<{
    index: number;
    rationale: string;
    correct_concept: string;
    your_mistake: string | null;
    diagram_suggestion: string | null;
  }>;
  remediation_path: Array<{
    step: 1 | 2 | 3 | number;
    title: string;
    why: string;
    action_kind: "read" | "practice" | "watch" | "requiz" | string;
    target_skill: string;
    est_minutes: number;
    /** Content-grounded link metadata (present when the step maps to a real
     *  course item). "requiz" = spawn a targeted re-quiz via onStartPath;
     *  "note" = informational step with no deep link (standalone-quiz fallback). */
    content_type?: "article" | "video" | "coding" | "requiz" | "note" | string;
    course_id?: number | null;
    submodule_id?: number | null;
    article_id?: number | null;
    /** The specific item id (e.g. video config) so the step deep-links exactly. */
    content_id?: number | null;
  }>;
}

export interface AdaptiveSessionDetail {
  id: string;
  status: "active" | "completed" | "abandoned";
  started_at: string;
  completed_at: string | null;
  question_count: number;
  hints_used: number;
  ability_state: Record<string, number>;
  se_state: Record<string, number>;
  pending_question: AdaptiveQuestion | null;
  /** Server clock at response time - anchors the per-question timer to the server. */
  server_now?: string | null;
  /** Sum of points earned so far this session - seeds the live running total on load/resume. */
  points_so_far?: number;
  ai_narration: AdaptiveAINarration | null;
  ai_narration_generated_at: string | null;
  config: {
    id: number;
    quiz_title: string;
    is_active: boolean;
    target_skills: string[];
    min_questions: number;
    max_questions: number;
    se_threshold: number;
    confidence_prompt_enabled: boolean;
    hint_tokens: number;
  };
  responses: AdaptiveResponseRow[];
  /** Populated only on re-quiz sessions (seeded_from set on the server). The
   *  breadcrumb on the live quiz + results headers links back to this attempt. */
  source_attempt: {
    session_id: string;
    quiz_title: string;
    completed_at: string | null;
  } | null;
  /** The whole re-quiz chain for this topic (original + its re-quizzes), so the results page can
   *  show "how many quizzes did I take on this" in one place. `total === 1` for a lone quiz. */
  attempt_chain?: {
    total: number;
    attempts: Array<{
      session_id: string;
      label: string;
      quiz_title: string;
      status: "active" | "completed" | "abandoned";
      completed_at: string | null;
      is_current: boolean;
    }>;
  };
}

export type ConfidenceLevel = 1 | 2 | 3 | 4;

export const CONFIDENCE_LABELS: Record<ConfidenceLevel, string> = {
  1: "Guessing",
  2: "Unsure",
  3: "Pretty sure",
  4: "Certain",
};
