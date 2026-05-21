import apiClient from "./api";
import { config } from "../config";

export interface MockInterview {
  id: number;
  title: string;
  topic: string;
  subtopic?: string;
  difficulty: string;
  duration_minutes: number;
  status: "pending" | "in_progress" | "completed" | "scheduled";
  created_at: string;
  scheduled_date_time?: string;
  job_role?: string; // Legacy field
  experience_level?: string; // Legacy field
  interview_type?: string; // Legacy field
  score?: number;
  feedback?: string;
}

export interface MockInterviewDetail extends MockInterview {
  questions?: InterviewQuestion[]; // Legacy field
  questions_for_interview?: InterviewQuestion[]; // New field
  started_at?: string;
  submitted_at?: string;

  // Dynamic (turn-based) interview fields returned by /start/. When is_dynamic is true the
  // client should ignore questions_for_interview (it is intentionally empty so the candidate
  // cannot see future questions) and drive the UI from current_question, fetching follow-ups
  // via mockInterviewService.getNextQuestion().
  is_dynamic?: boolean;
  current_question?: InterviewQuestion | null;
  turn_number?: number;
  max_turns?: number;
  /**
   * Total accumulated bonus seconds across the interview (credited by past coding turns
   * that fired the difficulty-scaled +5/+7/+10 min bump). The take page seeds its
   * `interviewBonusSeconds` state from this when the page loads / re-loads mid-interview
   * so the visible timer's effective budget stays correct across reloads.
   */
  bonus_seconds?: number;
}

export interface InterviewQuestion {
  id: number;
  question?: string; // Legacy field
  question_text?: string; // New field
  type: string;
  expected_key_points?: string[]; // Optional field
  follows_up_on?: string; // Dynamic-flow note: which prior answer this question builds on.

  /**
   * Present only when `type === "coding"`. The interviewer asks a code-writing question and
   * the frontend opens a Monaco-editor modal sourced from this block. `question_text` is the
   * spoken intro; the actual problem statement lives here. Auto-graded as text at submit
   * time (no in-browser run button on purpose — see CodingQuestionModal).
   */
  coding_problem?: {
    statement: string;
    starter_code: string;
    language: string;
    sample_input?: string;
    sample_output?: string;
  };

  /**
   * Present only when `type === "mcq"`. Multiple-choice options shown in MCQQuestionModal.
   * `mcq_multi_select` decides between radio (false) and checkbox (true) UX.
   * `mcq_correct_option_ids` is included so the post-interview evaluator can score, but the
   * frontend never reads it.
   */
  mcq_options?: { id: string; text: string }[];
  mcq_multi_select?: boolean;
  mcq_correct_option_ids?: string[];
}

export interface NextQuestionRequest {
  previous_question_id: number;
  candidate_answer: string;
  /**
   * Frontend signal that the candidate's VISIBLE timer hit zero — even if the backend's
   * `wall_clock - started_at` math would say there's still time on the effective budget
   * (which can happen when bonus_seconds from a coding turn doesn't perfectly equal the
   * candidate's actual time in the modal). When true AND we have ≥2 prior responses, the
   * backend skips the regular-question branch and returns the closing remark directly.
   */
  force_close?: boolean;
}

export interface NextQuestionResponse {
  question: InterviewQuestion | null;
  is_final_question: boolean;
  turn_number: number;
  max_turns: number;
  interview_complete?: boolean;
  message?: string;
  /**
   * When the backend decides the interview has reached its closing minute, it returns
   * `is_closing_remark: true` and a plain-text `closing_remark` for the avatar to speak
   * as a natural verbal wrap-up — thanks + light feedback — before the candidate clicks
   * Submit. When this is set, `question` is null and `interview_complete` is also true.
   */
  is_closing_remark?: boolean;
  closing_remark?: string;
  /**
   * Total accumulated `bonus_seconds` (across the whole interview) credited by coding
   * turns. The on-screen interview timer adds this to its effective budget so wrap-up
   * math stays in sync with the backend.
   */
  bonus_seconds?: number;
  /**
   * Seconds credited for THIS specific coding turn (5 / 7 / 10 min, scaled by interview
   * difficulty). The CodingQuestionModal uses this to render its own per-question
   * countdown so the candidate sees their remaining coding time, not just "TIMER PAUSED".
   * Zero (or absent) for non-coding turns.
   */
  coding_time_budget_seconds?: number;
}

/**
 * Pending interview from a course the student is enrolled in. Returned by the
 * /interview-templates/pending/ endpoint. Clicking Start lazily creates a real MockInterview
 * via `startTemplateInterview()` and the student transitions into the existing device-check
 * → take flow.
 */
export interface PendingCourseInterview {
  id: number;
  title: string;
  topic: string;
  subtopic: string;
  difficulty: "Easy" | "Medium" | "Hard";
  duration_minutes: number;
  description?: string;
  course_titles: string[];
  has_attempt: boolean;
}

export interface InterviewResponse {
  question_id: number;
  answer: string;
  /**
   * Snapshot of the question text that this answer was given to. The backend serializer
   * fills this in on /next-question/ records, and the take page now also stamps it on
   * every locally-built response so the question-history UI can render the conversation
   * without a separate lookup map.
   */
  question_text?: string;
  audio_url?: string;
}

export interface CreateMockInterviewRequest {
  job_role?: string;
  experience_level?: string;
  interview_type?: string;
  topic: string;
  subtopic?: string;
  difficulty: string;
  scheduled_at?: string;
  // Candidate-chosen interview length in minutes (5-20). Backend scales the number of
  // conversational turns so the AI wraps within this window. Optional — defaults to 7.
  duration_minutes?: number;
}

export interface SubmitInterviewRequest {
  transcript: {
    responses: InterviewResponse[];
    total_duration_seconds: number;
    logs?: any[];
    metadata: {
      face_validation_failures: number;
      multiple_face_detections: number;
      fullscreen_exits: number;
      completed_questions: number;
      total_questions: number;
      [key: string]: any;
    };
  };
}

const mockInterviewService = {
  /**
   * List all mock interviews for a client
   * @param status - Optional status filter (e.g., "completed", "scheduled")
   */
  listInterviews: async (status?: string): Promise<MockInterview[]> => {
    const url = `/mock-interview/api/clients/${config.clientId}/mock-interviews/`;
    const params = status ? { status } : {};
    const response = await apiClient.get(url, { params });
    return response.data;
  },

  /**
   * Create a new mock interview
   */
  createInterview: async (
    data: CreateMockInterviewRequest
  ): Promise<MockInterview> => {
    const response = await apiClient.post(
      `/mock-interview/api/clients/${config.clientId}/mock-interviews/`,
      data
    );
    return response.data;
  },

  /**
   * Get mock interview details
   */
  getInterviewDetail: async (
    interviewId: number
  ): Promise<MockInterviewDetail> => {
    const response = await apiClient.get(
      `/mock-interview/api/clients/${config.clientId}/mock-interviews/${interviewId}/`
    );
    return response.data;
  },

  /**
   * Start a mock interview
   */
  startInterview: async (interviewId: number): Promise<MockInterviewDetail> => {
    const response = await apiClient.post(
      `/mock-interview/api/clients/${config.clientId}/mock-interviews/${interviewId}/start/`
    );
    return response.data;
  },

  /**
   * Fetch the next follow-up question for a dynamic (turn-based) interview. The backend uses
   * the candidate's previous answer + the interview plan to generate a real follow-up question,
   * so the client does NOT need to know future questions in advance.
   *
   * When the returned `is_final_question` is true, the client should show that question, let
   * the candidate answer it, then call submitInterview() — NOT getNextQuestion() — to finish.
   * When `interview_complete` is true (rare safety path), call submitInterview() immediately.
   */
  getNextQuestion: async (
    interviewId: number,
    data: NextQuestionRequest
  ): Promise<NextQuestionResponse> => {
    const response = await apiClient.post(
      `/mock-interview/api/clients/${config.clientId}/mock-interviews/${interviewId}/next-question/`,
      data
    );
    return response.data;
  },

  /**
   * Student-side: list interviews the student has been "assigned" via course mapping but
   * hasn't yet completed. Each item is an InterviewTemplate the student can claim. Returns
   * `[]` when the student isn't enrolled in any course that has interviews attached.
   */
  listPendingCourseInterviews: async (): Promise<PendingCourseInterview[]> => {
    const response = await apiClient.get(
      `/mock-interview/api/clients/${config.clientId}/interview-templates/pending/`
    );
    return response.data;
  },

  /**
   * Student-side: lazy-claim a pending course interview. The backend creates a per-attempt
   * MockInterview instance from the template's topic/subtopic/difficulty/duration. The
   * returned shape matches `createInterview()` so the caller can redirect into the existing
   * device-check page using the returned interview.id.
   */
  startTemplateInterview: async (
    templateId: number,
    options?: { duration_minutes?: number }
  ): Promise<MockInterview> => {
    const response = await apiClient.post(
      `/mock-interview/api/clients/${config.clientId}/interview-templates/${templateId}/start/`,
      options ?? {}
    );
    return response.data;
  },

  /**
   * Submit mock interview responses
   */
  submitInterview: async (
    interviewId: number,
    data: SubmitInterviewRequest
  ): Promise<MockInterviewDetail> => {
    const response = await apiClient.post(
      `/mock-interview/api/clients/${config.clientId}/mock-interviews/${interviewId}/submit/`,
      data
    );
    return response.data;
  },
};

export default mockInterviewService;
