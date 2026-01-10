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
}

export interface InterviewQuestion {
  id: number;
  question?: string; // Legacy field
  question_text?: string; // New field
  type: string;
  expected_key_points?: string[]; // Optional field
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
