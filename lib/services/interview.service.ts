import apiClient from "./api";

/**
 * Interview API client.
 *
 * Note what is NOT here: any way to fetch the question paper. The browser is deliberately
 * never given the questions, only the one it is currently on, and never the rubric. A client
 * that holds the paper can look ahead, and a candidate who can read the rubric can write to
 * it. See `lib/hooks/useRealtimeInterview.ts` for the transport.
 */

const BASE = "/interview/api";

export interface StartedInterview {
  session_id: string;
  client_secret: string;
  planned_minutes: number;
  /** A COUNT, not the questions. Used only to show progress. */
  question_count: number;
  /** Server-controlled, so the provider endpoint is not baked into the bundle. */
  realtime: { calls_url: string; model: string; voice: string };
}

export interface CodingRenderPayload {
  title: string;
  statement: string;
  sample_input: string;
  sample_output: string;
  /** One block of prose from the bank, not a list. */
  constraints: string;
  /** Keyed by language name, e.g. { python: "def solve():..." }. */
  starter_code: Record<string, string>;
}

export interface NextQuestion {
  done: boolean;
  question_id?: number;
  position?: number;
  kind?: "behavioural" | "conceptual" | "coding" | "mcq";
  question?: string;
  coding_problem_id?: number;
  mcq_id?: number;
  /** Present when kind is "mcq": the options WITHOUT the answer key. */
  options?: { a: string; b: string; c: string; d: string };
  /** Present when kind is "coding": enough to attempt it, never the test cases. */
  coding?: CodingRenderPayload;
}

export interface InterviewTurnPayload {
  role: "interviewer" | "candidate";
  text: string;
  seq: number;
}

export interface QuestionResult {
  position: number;
  kind: string;
  question: string;
  score: number;
  max_score: number;
  answered: boolean;
  feedback: string;
  /** What the candidate actually said, from the recorded transcript. */
  your_answer: string;
  /** Post-grade MCQ review. Revealable because the sitting is over. */
  mcq?: {
    options: { a: string; b: string; c: string; d: string };
    chosen: string;
    correct_option: string;
  };
  /** Post-grade coding review: the problem plus the submission and its verdict. */
  coding?: CodingRenderPayload & {
    submission: string;
    language_id: number | null;
    passed: number | null;
    total: number | null;
    status: string;
  };
}

export interface ResultContext {
  title: string;
  topic: string;
  subtopic: string;
  difficulty: string;
  created_at: string;
  ended_at: string | null;
  planned_minutes: number;
  actual_minutes: number | null;
}

export interface ResultNarrative {
  strengths?: string[];
  gaps?: string[];
  practise?: string[];
}

export interface InterviewResult {
  state: "pending" | "graded" | "failed" | "void";
  score: number | null;
  max_score?: number | null;
  percentage?: number | null;
  coverage?: {
    completeness: number;
    planned: number;
    answered: number;
    sections: Record<string, Record<string, number>>;
  };
  context?: ResultContext;
  narrative?: ResultNarrative;
  questions?: QuestionResult[];
  message?: string;
}

export interface AvailableInterview {
  id: number;
  title: string;
  topic: string;
  subtopic: string;
  difficulty: string;
  duration_minutes: number;
  description: string;
}


export type GradeState = "pending" | "graded" | "failed" | "void";

export interface GradeSummary {
  state: GradeState;
  /** Present ONLY when state is "graded". A failed grade has no score at all. */
  score?: number;
  max_score?: number;
  percentage?: number;
  completeness?: number | null;
}

export interface SessionRow {
  session_id: string;
  status: string;
  template_id: number | null;
  title: string;
  topic: string;
  created_at: string;
  ended_at: string | null;
  planned_minutes: number;
  integrity: "clean" | "flagged" | "failed";
  grade: GradeSummary;
}

export interface InterviewHistory {
  sessions: SessionRow[];
  stats: {
    attempts: number;
    graded: number;
    best_percentage: number | null;
    average_percentage: number | null;
  };
}

export interface AdminSessionRow extends SessionRow {
  student: { id: number; name: string; email: string };
}

export interface AdminQuestionDetail {
  position: number;
  kind: string;
  section: string;
  prompt: string;
  rubric: Record<string, unknown>;
  max_score: number;
  released_at: string | null;
  response: {
    transcript: string;
    code: string;
    objective_result: Record<string, unknown>;
    answered_at: string;
  } | null;
  score: {
    score: number;
    max_score: number;
    was_answered: boolean;
    feedback: string;
  } | null;
}

export interface AdminSessionDetail extends AdminSessionRow {
  connected_at: string | null;
  end_reason: string;
  billable_seconds: number;
  cost_usd: number;
  coverage: Record<string, unknown>;
  narrative: Record<string, unknown>;
  grade_attempts: number;
  questions: AdminQuestionDetail[];
  /** The raw conversation as recorded, oldest first. */
  turns: { role: "interviewer" | "candidate"; text: string; seq: number }[];
  integrity_events: {
    kind: string;
    severity: string;
    detail: Record<string, unknown>;
    created_at: string;
  }[];
}

export const interviewService = {
  /** The hub's single call: my sessions plus aggregate stats. */
  history: async (): Promise<InterviewHistory> => {
    const { data } = await apiClient.get(`${BASE}/history/`);
    return data;
  },

  admin: {
    sessions: async (
      params: { template?: number; status?: string; verdict?: string } = {},
    ): Promise<AdminSessionRow[]> => {
      const { data } = await apiClient.get(`${BASE}/admin/sessions/`, { params });
      return data.sessions ?? [];
    },
    sessionDetail: async (sessionId: string): Promise<AdminSessionDetail> => {
      const { data } = await apiClient.get(`${BASE}/admin/sessions/${sessionId}/`);
      return data;
    },
    regrade: async (sessionId: string): Promise<{ state: GradeState }> => {
      const { data } = await apiClient.post(
        `${BASE}/admin/sessions/${sessionId}/regrade/`,
        {},
      );
      return data;
    },
  },

  /** The interviews this candidate can sit. Visibility is decided server-side. */

  available: async (): Promise<AvailableInterview[]> => {
    const { data } = await apiClient.get(`${BASE}/templates/`);
    return data.templates ?? [];
  },

  /**
   * Start an interview: either an assigned template, or a topic the candidate typed.
   *
   * A practice run is not the same product as an assigned interview. Nobody authored its
   * paper, so the server marks it and every surface says so.
   */
  start: async (
    input: number | { topic: string; minutes?: number; difficulty?: string },
  ): Promise<StartedInterview> => {
    const body =
      typeof input === "number"
        ? { template_id: input }
        : { topic: input.topic, minutes: input.minutes, difficulty: input.difficulty };
    const { data } = await apiClient.post(`${BASE}/sessions/`, body);
    return data;
  },

  /**
   * Record what the device check could NOT verify.
   *
   * The valuable distinction is not "did the camera see anything" but "did the check run at
   * all". A reviewer looking at a flagged attempt needs to know whether monitoring was off,
   * and nothing else records that.
   */
  reportPreflight: async (sessionId: string, degraded: string[]): Promise<void> => {
    await apiClient.post(`${BASE}/sessions/${sessionId}/preflight/`, { degraded });
  },

  reportConnected: async (sessionId: string, callId: string): Promise<void> => {
    await apiClient.post(`${BASE}/sessions/${sessionId}/connected/`, { call_id: callId });
  },

  /** The server tool. The interviewer has no questions of its own. */
  nextQuestion: async (sessionId: string): Promise<NextQuestion> => {
    const { data } = await apiClient.post(`${BASE}/sessions/${sessionId}/next-question/`, {});
    return data;
  },

  answer: async (
    sessionId: string,
    payload: {
      question_id: number;
      transcript?: string;
      code?: string;
      language_id?: number;
      /** MCQ answer: "a" | "b" | "c" | "d". The server grades it; no verdict comes back. */
      choice?: string;
    },
  ): Promise<void> => {
    await apiClient.post(`${BASE}/sessions/${sessionId}/answer/`, payload);
  },

  pushTurns: async (
    sessionId: string,
    turns: InterviewTurnPayload[],
    usage: Record<string, unknown>[] = [],
  ): Promise<void> => {
    // Usage rides along with the transcript batch rather than getting its own request: a
    // twenty-minute interview emits dozens of response.done events and one endpoint call per
    // event would be noise on a single-task backend.
    await apiClient.post(`${BASE}/sessions/${sessionId}/events/`, { turns, usage });
  },

  end: async (sessionId: string, reason = "closed"): Promise<void> => {
    await apiClient.post(`${BASE}/sessions/${sessionId}/end/`, { reason });
  },

  result: async (sessionId: string): Promise<InterviewResult> => {
    const { data } = await apiClient.get(`${BASE}/sessions/${sessionId}/result/`);
    return data;
  },
};

export default interviewService;
