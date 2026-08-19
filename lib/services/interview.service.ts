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

export interface NextQuestion {
  done: boolean;
  question_id?: number;
  position?: number;
  kind?: "behavioural" | "conceptual" | "coding" | "mcq";
  question?: string;
  coding_problem_id?: number;
  mcq_id?: number;
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

export const interviewService = {
  /** The interviews this candidate can sit. Visibility is decided server-side. */
  available: async (): Promise<AvailableInterview[]> => {
    const { data } = await apiClient.get(`${BASE}/templates/`);
    return data.templates ?? [];
  },

  start: async (templateId: number): Promise<StartedInterview> => {
    const { data } = await apiClient.post(`${BASE}/sessions/`, { template_id: templateId });
    return data;
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
      objective_result?: Record<string, unknown>;
    },
  ): Promise<void> => {
    await apiClient.post(`${BASE}/sessions/${sessionId}/answer/`, payload);
  },

  pushTurns: async (sessionId: string, turns: InterviewTurnPayload[]): Promise<void> => {
    await apiClient.post(`${BASE}/sessions/${sessionId}/events/`, { turns });
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
