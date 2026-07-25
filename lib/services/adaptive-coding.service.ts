import apiClient from "@/lib/services/api";

const BASE = "/adaptive-coding/api";

// --- Wire types --------------------------------------------------------------

export interface CodingProblem {
  id: number;
  title: string;
  difficulty_level: "Easy" | "Medium" | "Hard";
  problem_statement: string;
  input_format: string;
  output_format: string;
  sample_input: string;
  sample_output: string;
  constraints: string;
  template_code: Record<string, string>;
  tags: string;
  target_skills: string[];
  topic: string;
  // NOTE: `solution` is intentionally never present - the backend excludes it.
}

export interface TestCaseResult {
  index: number;
  input: string;
  expected: string;
  actual: string;
  verdict: string;
  passed: boolean;
  stderr: string | null;
  compile_output: string | null;
}

export interface TestResults {
  results: TestCaseResult[];
  passed: number;
  failed: number;
  total: number;
  first_failing_index: number | null;
  compile_error: string | null;
  status?: string;
  all_passed?: boolean;
}

/** Mentor diagnosis on a failing Run/Submit. */
export interface MentorDiagnosis {
  whats_wrong: string;
  root_cause_line: number | null;
  root_cause_excerpt: string;
  conceptual_gap: string;
  strengths: string[];
}

/** Stretch goal offered on a clean pass. */
export interface OptimizationChallenge {
  offer: boolean;
  challenge: string;
  focus_skill: string;
}

export interface MasteryDelta {
  [skill: string]: { before: number; after: number; band: string };
}

export interface CodingSubmissionRecord {
  id: number;
  kind: "run" | "submit";
  order_index: number;
  language: string;
  test_results: TestResults;
  passed_count: number;
  failed_count: number;
  total_count: number;
  all_passed: boolean;
  diagnosis: (MentorDiagnosis & { optimization_challenge?: OptimizationChallenge }) | null;
  conceptual_gap: string;
  hints_revealed_at_submit: number;
  created_at: string;
}

/** Time-decay params for the live coding points HUD (mirrors the engine's coding decay). */
export interface CodingPointsDecay {
  base: number;
  grace: number;
  dec: number;
  iv: number;
  floor: number;
  /** Fraction shaved per hint taken (so the HUD matches the awarded points). */
  hint_penalty?: number;
}

export interface CodingSession {
  id: string;
  config: number;
  problem: CodingProblem;
  language: string;
  status: "active" | "completed" | "abandoned";
  run_count: number;
  submit_count: number;
  hints_revealed: number;
  passed: boolean;
  last_source: string;
  /** Copy/paste policy for the editor, from the coding set (admin-controlled). */
  allow_clipboard: boolean;
  /** Decay params for the live points HUD (null if the journey app is unavailable). */
  points: CodingPointsDecay | null;
  /** Server clock at fetch time - anchors the live timer against server time (clock-skew safe). */
  server_now: string;
  started_at: string;
  completed_at: string | null;
  latest_submission: CodingSubmissionRecord | null;
}

/** One row in the learner's "your attempts" history. */
export interface CodingSessionSummary {
  id: string;
  config_id: number;
  problem_id: number;
  problem_title: string;
  difficulty_level: "Easy" | "Medium" | "Hard";
  language: string;
  status: "active" | "completed" | "abandoned";
  passed: boolean;
  run_count: number;
  submit_count: number;
  hints_revealed: number;
  started_at: string;
  completed_at: string | null;
}

export interface CodingMasterySkill {
  skill: string;
  mastery: number;
  band: "emerging" | "developing" | "proficient" | "mastered";
}

export interface CodingStudentModel {
  skills: CodingMasterySkill[];
  open_misconceptions: Array<{ tag: string; skill: string; problem_id: number; at: string; resolved: boolean }>;
  updated_at: string | null;
}

export interface SubmitGrade {
  status: string;
  passed: number;
  failed: number;
  total: number;
  all_passed: boolean;
  results: TestCaseResult[];
  first_failing_index: number | null;
  compile_error: string | null;
}

export interface RunResult {
  submission_id: number;
  test_results: TestResults;
  diagnosis: MentorDiagnosis | null;
}

export interface SubmitResult {
  submission_id: number | null;
  grade: SubmitGrade;
  diagnosis: MentorDiagnosis | null;
  optimization_challenge: OptimizationChallenge | null;
  mastery_delta: MasteryDelta;
  /** Points awarded for this submit (time-decayed from the session's started_at). */
  points_earned?: number;
  /** Set when the submit couldn't be graded (no test cases / runner outage). */
  detail?: string;
}

/** One past Submit in the learner's per-problem submissions history. */
export interface CodingSubmissionHistoryItem {
  id: number;
  language: string;
  source: string;
  passed_count: number;
  failed_count: number;
  total_count: number;
  all_passed: boolean;
  conceptual_gap: string;
  whats_wrong: string;
  created_at: string;
}

export interface HintResult {
  layer: number;
  title: string;
  body: string;
  reveals_code: boolean;
  hints_revealed: number;
  hint_layers: number;
  exhausted: boolean;
}

// --- Service -----------------------------------------------------------------

export const adaptiveCodingService = {
  async getProblem(problemId: number): Promise<CodingProblem> {
    const { data } = await apiClient.get<CodingProblem>(`${BASE}/problems/${problemId}/`);
    return data;
  },

  async startSession(payload: {
    config_id: number;
    problem_id: number;
    language?: string;
  }): Promise<CodingSession> {
    const { data } = await apiClient.post<CodingSession>(`${BASE}/sessions/start/`, payload);
    return data;
  },

  /** Peek the learner's existing session for a problem WITHOUT creating one - null on a fresh
   *  problem (so the UI can show a "ready to begin" gate before the timer starts). */
  async getActiveSession(configId: number, problemId: number): Promise<CodingSession | null> {
    const { data } = await apiClient.get<{ active: CodingSession | null }>(`${BASE}/sessions/active/`, {
      params: { config_id: configId, problem_id: problemId },
    });
    return data.active;
  },

  /** Mode 2 - On Run: execute visible cases + line-level diagnosis (no grade). */
  async runWithDiagnosis(
    sessionId: string,
    payload: { source: string; language_id: number; language?: string },
  ): Promise<RunResult> {
    const { data } = await apiClient.post<RunResult>(`${BASE}/sessions/${sessionId}/run/`, payload);
    return data;
  },

  /** Mode 3 - On Submit: grade + diagnosis/optimization + Student Model update. */
  async submitWithDiagnosis(
    sessionId: string,
    payload: { source: string; language_id: number; language?: string },
  ): Promise<SubmitResult> {
    const { data } = await apiClient.post<SubmitResult>(`${BASE}/sessions/${sessionId}/submit/`, payload);
    return data;
  },

  /** Reveal the next scaffolded hint rung (monotonic; cached server-side). */
  async revealHint(sessionId: string, source: string): Promise<HintResult> {
    const { data } = await apiClient.post<HintResult>(`${BASE}/sessions/${sessionId}/hint/`, { source });
    return data;
  },

  /** The learner's recent coding attempts ("your attempts" history). */
  async listMyAttempts(): Promise<CodingSessionSummary[]> {
    const { data } = await apiClient.get<CodingSessionSummary[]>(`${BASE}/sessions/`);
    return data;
  },

  /** The learner's past Submit history for one problem (newest first, with code). */
  async listProblemSubmissions(problemId: number): Promise<CodingSubmissionHistoryItem[]> {
    const { data } = await apiClient.get<CodingSubmissionHistoryItem[]>(
      `${BASE}/problems/${problemId}/submissions/`,
    );
    return data;
  },

  /** Durable cross-session coding mastery + open misconceptions. */
  async getStudentModel(): Promise<CodingStudentModel> {
    const { data } = await apiClient.get<CodingStudentModel>(`${BASE}/student-model/`);
    return data;
  },
};

export default adaptiveCodingService;
