import axiosInstance from "../axiosInstance";
import { AxiosError } from "axios";

type ApiErrorPayload = {
  error?: string;
  message?: string;
  detail?: string;
  [key: string]: unknown;
};

// Content Type enum
export type ContentType =
  | "Quiz"
  | "Article"
  | "Assignment"
  | "CodingProblem"
  | "DevCodingProblem"
  | "VideoTutorial";

// Content ID Type for course builder
export type ContentIdType =
  | "video_content"
  | "article_content"
  | "quiz_content"
  | "assignment_content"
  | "coding_problem_content"
  | "dev_coding_problem_content";

// Content List Item Interface
export interface ContentListItem {
  id: number;
  title: string;
  type: ContentType;
  is_verified: boolean;
}

// Content Type Count Interface
export interface ContentTypeCount {
  Quiz: number;
  Article: number;
  Assignment: number;
  CodingProblem: number;
  DevCodingProblem: number;
  VideoTutorial: number;
}

// Content Details Interfaces
export interface ArticleDetails {
  id: number;
  title: string;
  content: string;
  difficulty_level: string;
}

export interface VideoTutorialDetails {
  id: number;
  title: string;
  video_url: string;
  description: string;
  difficulty_level: string;
}

export interface QuizMCQ {
  id: number;
  question_text: string;
  difficulty_level: string;
  options: string[];
  correct_option: string;
  explanation: string;
}

export interface QuizDetails {
  id: number;
  title: string;
  instructions: string;
  durating_in_minutes: number;
  difficulty_level: string;
  mcqs: QuizMCQ[];
}

export interface AssignmentDetails {
  id: number;
  title: string;
  question: string;
  difficulty_level: string;
}

export interface TestCase {
  input: string;
  output?: string;
  expected_output?: string;
}

export interface TemplateCode {
  [language: string]: string;
}

export interface CodingProblemDetails {
  id: number;
  title: string;
  problem_statement: string;
  difficulty_level: string;
  input_format: string;
  output_format: string;
  sample_input: string;
  sample_output: string;
  constraints: string;
  tags: string;
  template_code: TemplateCode;
  test_cases: TestCase[];
}

export type ContentDetails =
  | ArticleDetails
  | VideoTutorialDetails
  | QuizDetails
  | AssignmentDetails
  | CodingProblemDetails;

// Full Content Detail Interface
export interface ContentDetail {
  id: number;
  title: string;
  type: ContentType;
  is_verified: boolean;
  order: number;
  duration_in_minutes: number;
  marks: number;
  created_at: string;
  updated_at: string;
  content_details: ContentDetails;
}

// Verify Content Response
export interface VerifyContentResponse {
  message: string;
  content: ContentListItem;
}

/**
 * Get content count by type for a client
 */
export const getContentTypeCount = async (
  clientId: string | number
): Promise<ContentTypeCount> => {
  try {
    const response = await axiosInstance.get(
      `/admin-dashboard/api/clients/${clientId}/contents/type-count/`
    );
    return response.data;
  } catch (err) {
    const error = err as AxiosError<ApiErrorPayload>;
    const message =
      error.response?.data?.error ||
      error.response?.data?.message ||
      error.response?.data?.detail ||
      "Failed to fetch content type count";
    throw new Error(message);
  }
};

/**
 * Get list of all contents for a client
 */
export const getContents = async (
  clientId: string | number
): Promise<ContentListItem[]> => {
  try {
    const response = await axiosInstance.get(
      `/admin-dashboard/api/clients/${clientId}/contents/`
    );
    return response.data;
  } catch (err) {
    const error = err as AxiosError<ApiErrorPayload>;
    const message =
      error.response?.data?.error ||
      error.response?.data?.message ||
      error.response?.data?.detail ||
      "Failed to fetch contents";
    throw new Error(message);
  }
};

/**
 * Get full content details by ID
 */
export const getContentById = async (
  clientId: string | number,
  contentId: number
): Promise<ContentDetail> => {
  try {
    const response = await axiosInstance.get(
      `/admin-dashboard/api/clients/${clientId}/contents/${contentId}/`
    );
    return response.data;
  } catch (err) {
    const error = err as AxiosError<ApiErrorPayload>;
    const message =
      error.response?.data?.error ||
      error.response?.data?.message ||
      error.response?.data?.detail ||
      "Failed to fetch content details";
    throw new Error(message);
  }
};

/**
 * Verify or unverify content
 */
export const verifyContent = async (
  clientId: string | number,
  contentId: number,
  isVerified: boolean
): Promise<VerifyContentResponse> => {
  try {
    const response = await axiosInstance.patch(
      `/admin-dashboard/api/clients/${clientId}/contents/${contentId}/verify/`,
      { is_verified: isVerified }
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
      "Failed to verify content";
    throw new Error(message);
  }
};

/**
 * Get content by type (for course builder)
 * @deprecated Use getContents with filters instead
 */
export const getContent = async (
  clientId: string | number,
  contentType: string
): Promise<any[]> => {
  try {
    const response = await axiosInstance.get(
      `/admin-dashboard/api/clients/${clientId}/contents/`,
      {
        params: { type: contentType },
      }
    );
    return response.data;
  } catch (err) {
    const error = err as AxiosError<ApiErrorPayload>;
    const message =
      error.response?.data?.error ||
      error.response?.data?.message ||
      error.response?.data?.detail ||
      "Failed to fetch content";
    throw new Error(message);
  }
};

/**
 * Upload content (for course builder)
 */
export const uploadContent = async (
  clientId: string | number,
  contentType: string,
  data: any
): Promise<any> => {
  try {
    const response = await axiosInstance.post(
      `/admin-dashboard/api/clients/${clientId}/contents/`,
      {
        type: contentType,
        ...data,
      }
    );
    return response.data;
  } catch (err) {
    const error = err as AxiosError<ApiErrorPayload>;
    const message =
      error.response?.data?.error ||
      error.response?.data?.message ||
      error.response?.data?.detail ||
      "Failed to upload content";
    throw new Error(message);
  }
};

/**
 * Update content by ID (for course builder)
 */
export const updateContentById = async (
  clientId: string | number,
  contentType: string,
  contentId: number,
  data: any
): Promise<any> => {
  try {
    const response = await axiosInstance.patch(
      `/admin-dashboard/api/clients/${clientId}/contents/${contentId}/`,
      {
        type: contentType,
        ...data,
      }
    );
    return response.data;
  } catch (err) {
    const error = err as AxiosError<ApiErrorPayload>;
    const message =
      error.response?.data?.error ||
      error.response?.data?.message ||
      error.response?.data?.detail ||
      "Failed to update content";
    throw new Error(message);
  }
};
