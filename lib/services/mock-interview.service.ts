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
}

export interface InterviewQuestion {
  id: number;
  question?: string; // Legacy field
  question_text?: string; // New field
  type: string;
  expected_key_points?: string[]; // Optional field
  follows_up_on?: string; // Dynamic-flow note: which prior answer this question builds on.
}

export interface NextQuestionRequest {
  previous_question_id: number;
  candidate_answer: string;
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
