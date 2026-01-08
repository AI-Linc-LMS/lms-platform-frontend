import apiClient from "../api";
import { config } from "../../config";
import { AxiosError } from "axios";

export interface ApiErrorPayload {
  error?: string;
  message?: string;
  detail?: string;
  [key: string]: any;
}

export interface MCQ {
  question_text: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_option: "A" | "B" | "C" | "D";
  explanation?: string;
  difficulty_level?: "Easy" | "Medium" | "Hard";
  topic?: string;
  skills?: string;
}

export interface QuizSection {
  title: string;
  description?: string;
  order?: number;
  number_of_questions?: number;
}

export interface MCQListItem {
  id: number;
  question_text: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_option: string;
  explanation?: string;
  difficulty_level?: string;
  topic?: string;
  skills?: string;
}

export interface GenerateMCQRequest {
  topic: string;
  number_of_questions: number;
  difficulty_level?: "Easy" | "Medium" | "Hard";
}

export interface GenerateMCQResponse {
  mcqs: Array<{
    question_text: string;
    option_a: string;
    option_b: string;
    option_c: string;
    option_d: string;
    correct_option: "A" | "B" | "C" | "D";
    explanation?: string;
    difficulty_level?: "Easy" | "Medium" | "Hard";
    topic?: string;
    skills?: string;
  }>;
}

export interface CreateAssessmentPayload {
  title: string;
  instructions: string;
  description?: string;
  duration_minutes: number;
  is_paid?: boolean;
  price?: string | number | null;
  currency?: string;
  is_active?: boolean;
  quiz_section: QuizSection;
  mcqs?: MCQ[];
  mcq_ids?: number[];
}

export interface Assessment {
  id: number;
  title: string;
  slug: string;
  instructions: string;
  description?: string;
  duration_minutes: number;
  is_paid: boolean;
  price: string | number | null;
  is_active: boolean;
  created_at: string;
  total_questions: number;
  quiz_sections_count: number;
}

export interface AssessmentDetail extends Assessment {
  quiz_sections?: Array<{
    id: number;
    title: string;
    description?: string;
    order: number;
    questions: Array<{
      id: number;
      question_text: string;
      option_a: string;
      option_b: string;
      option_c: string;
      option_d: string;
      correct_option: string;
      explanation?: string;
      difficulty_level?: string;
      topic?: string;
      skills?: string;
    }>;
  }>;
}

/**
 * Get all assessments for a client
 */
export const getAssessments = async (
  clientId: string | number
): Promise<Assessment[]> => {
  try {
    const response = await apiClient.get(
      `/admin-dashboard/api/clients/${clientId}/assessments/`
    );
    return response.data;
  } catch (err) {
    const error = err as AxiosError<ApiErrorPayload>;
    const message =
      error.response?.data?.error ||
      error.response?.data?.message ||
      error.response?.data?.detail ||
      "Failed to fetch assessments";
    throw new Error(message);
  }
};

/**
 * Get a single assessment by ID
 */
export const getAssessmentById = async (
  clientId: string | number,
  assessmentId: number
): Promise<AssessmentDetail> => {
  try {
    const response = await apiClient.get(
      `/admin-dashboard/api/clients/${clientId}/assessments/${assessmentId}/`
    );
    return response.data;
  } catch (err) {
    const error = err as AxiosError<ApiErrorPayload>;
    const message =
      error.response?.data?.error ||
      error.response?.data?.message ||
      error.response?.data?.detail ||
      "Failed to fetch assessment details";
    throw new Error(message);
  }
};

/**
 * Create a new assessment
 */
export const createAssessment = async (
  clientId: string | number,
  payload: CreateAssessmentPayload
): Promise<Assessment> => {
  try {
    const response = await apiClient.post(
      `/admin-dashboard/api/clients/${clientId}/assessments/`,
      payload
    );
    return response.data;
  } catch (err) {
    const error = err as AxiosError<ApiErrorPayload>;

    // Handle validation errors
    if (error.response?.status === 400 && error.response?.data) {
      const errorData = error.response.data;
      // Convert error object to a readable message
      const errorMessages = Object.entries(errorData)
        .map(([key, value]) => {
          if (Array.isArray(value)) {
            return `${key}: ${value.join(", ")}`;
          }
          return `${key}: ${value}`;
        })
        .join("; ");
      throw new Error(errorMessages || "Validation error");
    }

    const message =
      error.response?.data?.error ||
      error.response?.data?.message ||
      error.response?.data?.detail ||
      "Failed to create assessment";
    throw new Error(message);
  }
};

/**
 * Update an existing assessment
 */
export const updateAssessment = async (
  clientId: string | number,
  assessmentId: number,
  payload: Partial<CreateAssessmentPayload>
): Promise<Assessment> => {
  try {
    const response = await apiClient.patch(
      `/admin-dashboard/api/clients/${clientId}/assessments/${assessmentId}/`,
      payload
    );
    return response.data;
  } catch (err) {
    const error = err as AxiosError<ApiErrorPayload>;

    // Handle validation errors
    if (error.response?.status === 400 && error.response?.data) {
      const errorData = error.response.data;
      const errorMessages = Object.entries(errorData)
        .map(([key, value]) => {
          if (Array.isArray(value)) {
            return `${key}: ${value.join(", ")}`;
          }
          return `${key}: ${value}`;
        })
        .join("; ");
      throw new Error(errorMessages || "Validation error");
    }

    const message =
      error.response?.data?.error ||
      error.response?.data?.message ||
      error.response?.data?.detail ||
      "Failed to update assessment";
    throw new Error(message);
  }
};

/**
 * Delete an assessment
 */
export const deleteAssessment = async (
  clientId: string | number,
  assessmentId: number
): Promise<void> => {
  try {
    await apiClient.delete(
      `/admin-dashboard/api/clients/${clientId}/assessments/${assessmentId}/`
    );
  } catch (err) {
    const error = err as AxiosError<ApiErrorPayload>;
    const message =
      error.response?.data?.error ||
      error.response?.data?.message ||
      error.response?.data?.detail ||
      "Failed to delete assessment";
    throw new Error(message);
  }
};

/**
 * Get all MCQs for a client
 */
export const getMCQs = async (
  clientId: string | number
): Promise<MCQListItem[]> => {
  try {
    const response = await apiClient.get(
      `/admin-dashboard/api/clients/${clientId}/mcqs/`
    );
    return response.data;
  } catch (err) {
    const error = err as AxiosError<ApiErrorPayload>;
    const message =
      error.response?.data?.error ||
      error.response?.data?.message ||
      error.response?.data?.detail ||
      "Failed to fetch MCQs";
    throw new Error(message);
  }
};

/**
 * Generate MCQs with AI
 */
export const generateMCQsWithAI = async (
  clientId: string | number,
  payload: GenerateMCQRequest
): Promise<GenerateMCQResponse> => {
  try {
    const response = await apiClient.post(
      `/admin-dashboard/api/clients/${clientId}/generate-mcq-questions/`,
      payload
    );
    return response.data;
  } catch (err) {
    const error = err as AxiosError<ApiErrorPayload>;

    // Handle validation errors
    if (error.response?.status === 400 && error.response?.data) {
      const errorData = error.response.data;
      const errorMessages = Object.entries(errorData)
        .map(([key, value]) => {
          if (Array.isArray(value)) {
            return `${key}: ${value.join(", ")}`;
          }
          return `${key}: ${value}`;
        })
        .join("; ");
      throw new Error(errorMessages || "Validation error");
    }

    const message =
      error.response?.data?.error ||
      error.response?.data?.message ||
      error.response?.data?.detail ||
      "Failed to generate MCQs with AI";
    throw new Error(message);
  }
};

export const adminAssessmentService = {
  getAssessments,
  getAssessmentById,
  createAssessment,
  updateAssessment,
  deleteAssessment,
  getMCQs,
  generateMCQsWithAI,
};

