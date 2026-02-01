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

export interface CodingProblemListItem {
  id: number;
  title: string;
  problem_statement: string;
  difficulty_level?: string;
  topic?: string;
  programming_language?: string;
  [key: string]: any;
}

export interface GenerateCodingProblemRequest {
  topic: string;
  difficulty_level?: "Easy" | "Medium" | "Hard";
  programming_language?: string;
  number_of_problems?: number;
}

export interface GenerateCodingProblemResponse {
  message: string;
  topic: string;
  difficulty_level: string;
  programming_language: string;
  count: number;
  coding_problem_ids: number[];
  coding_problems: Array<{
    id: number;
    title: string;
    problem_statement: string;
    [key: string]: any;
  }>;
}

export interface CreateAssessmentPayload {
  title: string;
  course_ids?: number[];
  colleges?: string[];
  instructions: string;
  description?: string;
  duration_minutes: number;
  start_time?: string;
  end_time?: string;
  is_paid?: boolean;
  price?: string | number | null;
  currency?: string;
  is_active?: boolean;
  proctoring_enabled?: boolean;
  /** Whether to send notification email to students */
  send_communication?: boolean;
  quiz_section?: QuizSection; // For backward compatibility
  quiz_sections?: Array<{
    title: string;
    description?: string;
    order: number;
    number_of_questions?: number;
    number_of_questions_to_show?: number;
    easy_score?: number;
    medium_score?: number;
    hard_score?: number;
    mcqs?: MCQ[];
    mcq_ids?: number[];
  }>;
  coding_sections?: Array<{
    title: string;
    description?: string;
    order: number;
    number_of_questions?: number;
    number_of_questions_to_show?: number;
    easy_score?: number;
    medium_score?: number;
    hard_score?: number;
    coding_problem_ids?: number[];
  }>;
  mcqs?: MCQ[]; // For backward compatibility
  mcq_ids?: number[]; // For backward compatibility
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
  proctoring_enabled?: boolean;
  start_time?: string | null;
  end_time?: string | null;
  created_at: string;
  total_questions: number;
  quiz_sections_count: number;
  coding_sections_count?: number;
  submissions_count?: number;
  courses?: Array<{ id: number; title: string }>;
  colleges?: string[];
}

export interface AssessmentDetail extends Assessment {
  start_time?: string | null;
  end_time?: string | null;
  proctoring_enabled?: boolean;
  course_ids?: number[];
  currency?: string;
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
 * Run email job for an assessment (e.g. send assessment notification emails to students)
 * POST /admin-dashboard/api/clients/{client_id}/assessments/{assessment_id}/run-email-job/
 */
export const runAssessmentEmailJob = async (
  clientId: string | number,
  assessmentId: number
): Promise<{ message?: string; task_id?: string; status?: string }> => {
  try {
    const response = await apiClient.post(
      `/admin-dashboard/api/clients/${clientId}/assessments/${assessmentId}/run-email-job/`
    );
    return response.data;
  } catch (err) {
    const error = err as AxiosError<ApiErrorPayload>;
    const message =
      error.response?.data?.error ||
      error.response?.data?.message ||
      (typeof error.response?.data?.detail === "string"
        ? error.response.data.detail
        : "Failed to run email job");
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

/**
 * Get all coding problems for a client
 */
export const getCodingProblems = async (
  clientId: string | number
): Promise<CodingProblemListItem[]> => {
  try {
    const response = await apiClient.get(
      `/admin-dashboard/api/clients/${clientId}/coding-problems/`
    );
    return response.data;
  } catch (err) {
    const error = err as AxiosError<ApiErrorPayload>;
    const message =
      error.response?.data?.error ||
      error.response?.data?.message ||
      error.response?.data?.detail ||
      "Failed to fetch coding problems";
    throw new Error(message);
  }
};

/**
 * Generate coding problems with AI
 */
export const generateCodingProblemsWithAI = async (
  clientId: string | number,
  payload: GenerateCodingProblemRequest
): Promise<GenerateCodingProblemResponse> => {
  try {
    const response = await apiClient.post(
      `/admin-dashboard/api/clients/${clientId}/generate-coding-problems/`,
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
      "Failed to generate coding problems with AI";
    throw new Error(message);
  }
};

/**
 * Fetch submissions export as CSV for an assessment.
 * GET /admin-dashboard/api/clients/{client_id}/assessments/{assessment_id}/submissions-export/
 * Returns the response as a Blob (CSV file).
 */
export const getSubmissionsExport = async (
  clientId: string | number,
  assessmentId: number
): Promise<Blob> => {
  const response = await apiClient.get(
    `/admin-dashboard/api/clients/${clientId}/assessments/${assessmentId}/submissions-export/`,
    { responseType: "blob" }
  );
  return response.data as Blob;
};

/**
 * Fetch questions export as CSV for an assessment.
 * GET /admin-dashboard/api/clients/{client_id}/assessments/{assessment_id}/questions-export/
 * Returns the response as a Blob (CSV file).
 */
export const getQuestionsExport = async (
  clientId: string | number,
  assessmentId: number
): Promise<Blob> => {
  const response = await apiClient.get(
    `/admin-dashboard/api/clients/${clientId}/assessments/${assessmentId}/export-questions/`,
    { responseType: "blob" }
  );
  return response.data as Blob;
};

/** Questions export JSON shape (export-questions API) */
export interface QuestionsExportQuestion {
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

export interface QuestionsExportSection {
  section_id: number;
  section_title: string;
  section_description?: string;
  section_type: string;
  order: number;
  easy_score?: number;
  medium_score?: number;
  hard_score?: number;
  number_of_questions: number;
  questions: QuestionsExportQuestion[];
}

export interface QuestionsExportResponse {
  assessment: { id: number; title: string; slug: string; instructions?: string; description?: string };
  sections: QuestionsExportSection[];
}

/** Submissions export JSON shape (submissions-export API) */
export interface SubmissionsExportSubmission {
  name: string;
  email: string;
  phone?: string;
  maximum_marks?: number;
  overall_score?: number;
  percentage?: number;
  total_questions?: number;
  attempted_questions?: number;
  section_wise_scores?: Record<string, number>;
  section_wise_max_scores?: Record<string, number>;
}

export interface SubmissionsExportResponse {
  assessment: { id: number; title: string; slug: string; maximum_marks?: number };
  submissions: SubmissionsExportSubmission[];
}

/**
 * Fetch questions export as JSON (for view + table download).
 * GET .../export-questions/
 */
export const getQuestionsExportJson = async (
  clientId: string | number,
  assessmentId: number
): Promise<QuestionsExportResponse> => {
  const response = await apiClient.get<QuestionsExportResponse>(
    `/admin-dashboard/api/clients/${clientId}/assessments/${assessmentId}/export-questions/`
  );
  return response.data;
};

/**
 * Fetch submissions export as JSON (for view + table download).
 * GET .../submissions-export/
 */
export const getSubmissionsExportJson = async (
  clientId: string | number,
  assessmentId: number
): Promise<SubmissionsExportResponse> => {
  const response = await apiClient.get<SubmissionsExportResponse>(
    `/admin-dashboard/api/clients/${clientId}/assessments/${assessmentId}/submissions-export/`
  );
  return response.data;
};

export const adminAssessmentService = {
  getAssessments,
  getAssessmentById,
  createAssessment,
  updateAssessment,
  deleteAssessment,
  getSubmissionsExport,
  getQuestionsExport,
  getQuestionsExportJson,
  getSubmissionsExportJson,
  getMCQs,
  generateMCQsWithAI,
  getCodingProblems,
  generateCodingProblemsWithAI,
};
