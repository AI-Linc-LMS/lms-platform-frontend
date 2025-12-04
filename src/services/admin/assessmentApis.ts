import axiosInstance from "../axiosInstance";
import { AxiosError } from "axios";

type ApiErrorPayload = {
  error?: string;
  message?: string;
  detail?: string;
  [key: string]: unknown;
};

// Assessment interfaces
export interface Assessment {
  id: number;
  title: string;
  slug: string;
  instructions: string;
  description?: string;
  duration_minutes: number;
  is_paid: boolean;
  price: string | null;
  currency?: string;
  is_active: boolean;
  created_at: string;
  total_questions: number;
  quiz_sections_count: number;
}

export interface QuizSection {
  title: string;
  description?: string;
  order?: number;
  number_of_questions?: number;
}

export interface MCQ {
  id?: number;
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

export interface CreateAssessmentPayload {
  title: string;
  instructions: string;
  description?: string;
  duration_minutes: number;
  is_paid?: boolean;
  price?: string | null;
  currency?: string;
  is_active?: boolean;
  quiz_section: QuizSection;
  mcqs?: MCQ[];
  mcq_ids?: number[];
}

export interface UpdateAssessmentPayload
  extends Partial<CreateAssessmentPayload> {
  id: number;
}

export interface AssessmentDetail extends Assessment {
  quiz_sections?: Array<{
    id: number;
    title: string;
    description?: string;
    order: number;
    number_of_questions: number;
    mcqs?: MCQ[];
  }>;
}

/**
 * Get all assessments for a client
 */
export const getAssessments = async (
  clientId: string | number
): Promise<Assessment[]> => {
  try {
    const response = await axiosInstance.get(
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
    const response = await axiosInstance.get(
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
    const response = await axiosInstance.post(
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
    const response = await axiosInstance.patch(
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
    await axiosInstance.delete(
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
