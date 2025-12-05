import axiosInstance from "../axiosInstance";
import { AxiosError } from "axios";

type ApiErrorPayload = {
  error?: string;
  message?: string;
  detail?: string;
  [key: string]: unknown;
};

export interface MCQListItem {
  id: number;
  question_text: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_option: "A" | "B" | "C" | "D";
  explanation?: string;
  difficulty_level: "Easy" | "Medium" | "Hard";
  topic?: string;
  skills?: string;
  created_at?: string;
  updated_at?: string;
}

export interface CreateMCQPayload {
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

export interface UpdateMCQPayload extends Partial<CreateMCQPayload> {
  id: number;
}

// AI Generation interfaces
export interface GenerateMCQRequest {
  topic: string;
  number_of_questions: number;
  difficulty_level: "Easy" | "Medium" | "Hard";
}

export interface GenerateMCQResponse {
  message: string;
  topic: string;
  difficulty_level: string;
  count: number;
  mcqs: MCQListItem[];
}

/**
 * Get all MCQs for a client
 */
export const getMCQs = async (
  clientId: string | number
): Promise<MCQListItem[]> => {
  try {
    const response = await axiosInstance.get(
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
 * Get a single MCQ by ID
 */
export const getMCQById = async (
  clientId: string | number,
  mcqId: number
): Promise<MCQListItem> => {
  try {
    const response = await axiosInstance.get(
      `/admin-dashboard/api/clients/${clientId}/mcqs/${mcqId}/`
    );
    return response.data;
  } catch (err) {
    const error = err as AxiosError<ApiErrorPayload>;
    const message =
      error.response?.data?.error ||
      error.response?.data?.message ||
      error.response?.data?.detail ||
      "Failed to fetch MCQ details";
    throw new Error(message);
  }
};

/**
 * Create a new MCQ
 */
export const createMCQ = async (
  clientId: string | number,
  payload: CreateMCQPayload
): Promise<MCQListItem> => {
  try {
    const response = await axiosInstance.post(
      `/admin-dashboard/api/clients/${clientId}/mcqs/`,
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
      "Failed to create MCQ";
    throw new Error(message);
  }
};

/**
 * Update an existing MCQ
 */
export const updateMCQ = async (
  clientId: string | number,
  mcqId: number,
  payload: Partial<CreateMCQPayload>
): Promise<MCQListItem> => {
  try {
    const response = await axiosInstance.patch(
      `/admin-dashboard/api/clients/${clientId}/mcqs/${mcqId}/`,
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
      "Failed to update MCQ";
    throw new Error(message);
  }
};

/**
 * Delete an MCQ
 */
export const deleteMCQ = async (
  clientId: string | number,
  mcqId: number
): Promise<void> => {
  try {
    await axiosInstance.delete(
      `/admin-dashboard/api/clients/${clientId}/mcqs/${mcqId}/`
    );
  } catch (err) {
    const error = err as AxiosError<ApiErrorPayload>;
    const message =
      error.response?.data?.error ||
      error.response?.data?.message ||
      error.response?.data?.detail ||
      "Failed to delete MCQ";
    throw new Error(message);
  }
};

/**
 * Generate MCQs using AI
 */
export const generateMCQsWithAI = async (
  clientId: string | number,
  payload: GenerateMCQRequest
): Promise<GenerateMCQResponse> => {
  try {
    const response = await axiosInstance.post(
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
