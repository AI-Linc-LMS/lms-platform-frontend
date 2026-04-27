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

/** Request body for generating a single coding problem from raw problem text */
export interface GenerateCodingProblemRawRequest {
  raw_problem: string;
  difficulty_level: "Easy" | "Medium" | "Hard";
  programming_language: string;
}

/** Request body for generating multiple coding problems from raw problem texts (single request) */
export interface GenerateCodingProblemsRawBatchRequest {
  raw_problems: string[];
  difficulty_level: "Easy" | "Medium" | "Hard";
  programming_language: string;
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

/** One quiz block in `quizSection` on create/update payloads. */
export interface AssessmentQuizSectionWrite {
  title: string;
  description?: string;
  order: number;
  easy_score?: number;
  medium_score?: number;
  hard_score?: number;
  time_limit_minutes?: number;
  section_cutoff_marks?: string;
  number_of_questions?: number;
  number_of_questions_to_show?: number;
  mcqs?: MCQ[];
  mcq_ids?: number[];
}

/** One coding block in `codingProblemSection` on create/update payloads. */
export interface AssessmentCodingProblemSectionWrite {
  title: string;
  description?: string;
  order: number;
  easy_score?: number;
  medium_score?: number;
  hard_score?: number;
  time_limit_minutes?: number;
  section_cutoff_marks?: string;
  number_of_questions?: number;
  number_of_questions_to_show?: number;
  coding_problem_ids?: number[];
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
  live_streaming?: boolean;
  /** Whether to send notification email to students */
  send_communication?: boolean;
  /** Whether to show results to students after submission (default true) */
  show_result?: boolean;
  evaluation_mode?: "auto" | "manual";
  /** Whether a certificate can be issued for this assessment */
  certificate_available?: boolean;
  /** Minimum overall percent (inclusive) for pass band lower tier */
  pass_band_lower_min_percent?: string;
  /** Minimum overall percent (inclusive) for pass band upper tier */
  pass_band_upper_min_percent?: string;
  /**
   * Allow movement across sections (assessment-wide). When true, learners may
   * move between section blocks (e.g. quiz ↔ coding). Do not send per-section.
   */
  allow_movement?: boolean;
  /** API: camelCase array of quiz sections */
  quizSection?: AssessmentQuizSectionWrite[];
  /** API: camelCase array of coding problem sections */
  codingProblemSection?: AssessmentCodingProblemSectionWrite[];
  /** API: camelCase array (send [] when unused) */
  subjectiveQuestionSection?: unknown[];
  quiz_section?: QuizSection;
  allow_desktop?: boolean;
  allow_mobile?: boolean;
  allow_tablet?: boolean;
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
  live_streaming?: boolean;
  /** Allow navigation across section blocks (assessment-wide). */
  allow_movement?: boolean;
  start_time?: string | null;
  end_time?: string | null;
  created_at: string;
  total_questions: number;
  quiz_sections_count: number;
  coding_sections_count?: number;
  submissions_count?: number;
  courses?: Array<{ id: number; title: string }>;
  colleges?: string[];
  allow_desktop?: boolean;
  allow_mobile?: boolean;
  allow_tablet?: boolean;
}

export interface AssessmentDetail extends Assessment {
  start_time?: string | null;
  end_time?: string | null;
  proctoring_enabled?: boolean;
  live_streaming?: boolean;
  allow_desktop?: boolean;
  allow_mobile?: boolean;
  allow_tablet?: boolean;
  course_ids?: number[];
  currency?: string;
  show_result?: boolean;
  evaluation_mode?: "auto" | "manual";
  certificate_available?: boolean;
  pass_band_lower_min_percent?: string;
  pass_band_upper_min_percent?: string;
  /** API: camelCase quiz sections (detail GET) */
  quizSection?: Array<{
    id: number;
    title: string;
    description?: string;
    order: number;
    easy_score?: number;
    medium_score?: number;
    hard_score?: number;
    time_limit_minutes?: number;
    section_cutoff_marks?: string;
    mcqs?: unknown[];
    questions?: Array<{
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
  codingProblemSection?: Array<{
    id: number;
    title: string;
    description?: string;
    order: number;
    coding_problems?: unknown[];
  }>;
  subjectiveQuestionSection?: unknown[];
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
 * Duplicate an assessment
 * POST /admin-dashboard/api/clients/{client_id}/assessments/{assessment_id}/duplicate/
 */
export const duplicateAssessment = async (
  clientId: string | number,
  assessmentId: number
): Promise<Assessment> => {
  try {
    const response = await apiClient.post(
      `/admin-dashboard/api/clients/${clientId}/assessments/${assessmentId}/duplicate/`
    );
    return response.data;
  } catch (err) {
    const error = err as AxiosError<ApiErrorPayload>;
    const message =
      error.response?.data?.error ||
      error.response?.data?.message ||
      error.response?.data?.detail ||
      "Failed to duplicate assessment";
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
 * Generate a single coding problem from raw problem text.
 * POST same endpoint with raw_problem, difficulty_level, programming_language.
 */
export const generateCodingProblemFromRaw = async (
  clientId: string | number,
  payload: GenerateCodingProblemRawRequest
): Promise<GenerateCodingProblemResponse> => {
  try {
    const response = await apiClient.post(
      `/admin-dashboard/api/clients/${clientId}/generate-coding-problems/`,
      payload
    );
    return response.data;
  } catch (err) {
    const error = err as AxiosError<ApiErrorPayload>;
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
      "Failed to generate coding problem from raw text";
    throw new Error(message);
  }
};

/**
 * Generate multiple coding problems in one request with raw_problems array.
 * POST body: { raw_problems: string[], difficulty_level, programming_language }
 */
export const generateCodingProblemsFromRawBatch = async (
  clientId: string | number,
  payload: GenerateCodingProblemsRawBatchRequest
): Promise<GenerateCodingProblemResponse> => {
  try {
    const response = await apiClient.post(
      `/admin-dashboard/api/clients/${clientId}/generate-coding-problems/`,
      payload
    );
    return response.data;
  } catch (err) {
    const error = err as AxiosError<ApiErrorPayload>;
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
      "Failed to generate coding problems from raw text";
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

/** Questions export JSON shape (export-questions API) – MCQ/quiz question */
export interface QuestionsExportMCQQuestion {
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

/** Questions export – coding question shape */
export interface QuestionsExportCodingQuestion {
  id: number;
  title: string;
  problem_statement?: string;
  input_format?: string;
  output_format?: string;
  sample_input?: string;
  sample_output?: string;
  constraints?: string;
  difficulty_level?: string;
  tags?: string;
  test_cases?: Array<{ input: string; expected_output: string }>;
  time_limit?: number;
  memory_limit?: number;
  [key: string]: unknown;
}

/** Union type for quiz or coding question in export */
export type QuestionsExportQuestion = QuestionsExportMCQQuestion | QuestionsExportCodingQuestion;

export function isCodingQuestion(q: QuestionsExportQuestion): q is QuestionsExportCodingQuestion {
  return "title" in q && typeof (q as QuestionsExportCodingQuestion).title === "string";
}

export function isMCQQuestion(q: QuestionsExportQuestion): q is QuestionsExportMCQQuestion {
  return "question_text" in q && "option_a" in q;
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

/** Proctoring data per submission (for CSV export) */
export interface SubmissionsExportProctoringData {
  tab_switches_count?: number;
  face_violations_count?: number;
  fullscreen_exits_count?: number;
  eye_movement_count?: number;
  face_validation_failures_count?: number;
  multiple_face_detections_count?: number;
  total_violation_count?: number;
}

/** Submissions export JSON shape (submissions-export API) */
/** Stats block as returned by submissions-export JSON (mirrors learner result stats). */
export interface SubmissionsExportStats {
  total_questions?: number;
  attempted_questions?: number;
  correct_answers?: number;
  score?: number;
  incorrect_answers?: number;
  accuracy_percent?: number;
  placement_readiness?: number;
  maximum_marks?: number;
  topic_wise_stats?: Record<
    string,
    {
      total: number;
      correct: number;
      incorrect: number;
      accuracy_percent: number;
      rating_out_of_5: number;
    }
  >;
  top_skills?: unknown[];
  low_skills?: unknown[];
  percentile?: number;
  time_taken_minutes?: number;
  total_time_minutes?: number;
  percentage_time_taken?: number;
}

export interface SubmissionsExportUserResponses {
  quiz_responses?: Array<Record<string, unknown>>;
  coding_problem_responses?: Array<Record<string, unknown>>;
}

export interface SubmissionsExportSubmission {
  submission_id?: number;
  status?: string;
  review_status?: string;
  score?: number | null;
  profile_pic_url?: string;
  name: string;
  email: string;
  phone?: string;
  started_at?: string;
  submitted_at?: string;
  maximum_marks?: number;
  overall_score?: number | null;
  percentage?: number | null;
  total_questions?: number;
  attempted_questions?: number;
  stats?: SubmissionsExportStats;
  user_responses?: SubmissionsExportUserResponses;
  section_wise_scores?: Record<string, number>;
  section_wise_max_scores?: Record<string, number>;
  proctoring?: SubmissionsExportProctoringData;
  manual_evaluation_payload?: Record<string, unknown>;
}

export interface SubmissionsExportResponse {
  assessment: {
    id: number;
    title: string;
    slug: string;
    maximum_marks?: number;
    show_result?: boolean;
  };
  submissions: SubmissionsExportSubmission[];
}

export interface ManualEvaluationQuestionScore {
  id: number;
  awarded_marks: number;
  note?: string;
}

export interface ManualEvaluationPayload {
  quiz_scores: ManualEvaluationQuestionScore[];
  coding_scores: ManualEvaluationQuestionScore[];
  subjective_scores: ManualEvaluationQuestionScore[];
  admin_notes?: string;
}

export interface SubmissionManualEvaluationResponse {
  assessment: { id: number; title: string; slug: string; evaluation_mode?: "auto" | "manual" };
  submission: {
    id: number;
    status: string;
    review_status: string;
    score: number | null;
    published_at?: string | null;
    last_evaluated_at?: string | null;
    manual_evaluation_payload?: ManualEvaluationPayload;
  };
  student: { id: number; name: string; email: string; phone?: string };
  responses: {
    quiz_responses: Array<Record<string, unknown> & { question_id: number; max_marks?: number }>;
    coding_problem_responses: Array<Record<string, unknown> & { problem_id: number; max_marks?: number }>;
    subjective_responses: Array<Record<string, unknown> & { question_id: number; max_marks?: number }>;
  };
  maximum_marks: number;
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

export const saveManualEvaluation = async (
  clientId: string | number,
  assessmentId: number,
  submissionId: number,
  payload: { manual_evaluation_payload?: ManualEvaluationPayload }
): Promise<{ message: string }> => {
  const response = await apiClient.patch(
    `/admin-dashboard/api/clients/${clientId}/assessments/${assessmentId}/submissions/${submissionId}/manual-evaluation/`,
    payload,
  );
  return response.data;
};

export const getSubmissionManualEvaluation = async (
  clientId: string | number,
  assessmentId: number,
  submissionId: number
): Promise<SubmissionManualEvaluationResponse> => {
  const response = await apiClient.get<SubmissionManualEvaluationResponse>(
    `/admin-dashboard/api/clients/${clientId}/assessments/${assessmentId}/submissions/${submissionId}/manual-evaluation/`
  );
  return response.data;
};

export const publishSubmissionResult = async (
  clientId: string | number,
  assessmentId: number,
  submissionId: number,
): Promise<{ message: string }> => {
  const response = await apiClient.post(
    `/admin-dashboard/api/clients/${clientId}/assessments/${assessmentId}/submissions/${submissionId}/publish/`,
  );
  return response.data;
};

export const publishAssessmentResultsBulk = async (
  clientId: string | number,
  assessmentId: number,
): Promise<{ published_count: number }> => {
  const response = await apiClient.post(
    `/admin-dashboard/api/clients/${clientId}/assessments/${assessmentId}/publish-results/`,
  );
  return response.data;
};

/** GET .../assessments/{id}/analytics/?top_performers=N (default 10, max 100) */
export interface AssessmentAnalyticsAssessmentMeta {
  id: number;
  title: string;
  slug: string;
  maximum_marks: number;
  duration_minutes: number;
  show_result: boolean;
  proctoring_enabled: boolean;
}

export interface AssessmentAnalyticsSummary {
  total_submissions: number;
  completed_submissions: number;
  completed_with_score: number;
  in_progress_submissions: number;
  average_score: number;
  median_score: number;
  highest_score: number;
  lowest_score: number;
  average_percentage: number;
  median_percentage: number;
  average_time_taken_minutes: number;
  median_time_taken_minutes: number;
  pass_count: number;
  pass_rate_percent: number;
  pass_threshold_percentage: number;
  maximum_marks: number;
  duration_minutes: number;
}

export interface AssessmentAnalyticsStatusBreakdown {
  in_progress?: number;
  submitted?: number;
  finalized?: number;
}

export interface AssessmentAnalyticsScoreBucket {
  label: string;
  min_percent: number;
  max_percent: number;
  count: number;
}

export interface AssessmentAnalyticsTimeBucket {
  label: string;
  count: number;
  min_minutes: number;
  max_minutes?: number;
}

export interface AssessmentAnalyticsTimelineDay {
  date: string;
  count: number;
}

export interface AssessmentAnalyticsSectionAverage {
  section_title: string;
  average_score: number;
  max_score: number;
  average_percentage: number;
  submissions_count: number;
}

export interface AssessmentAnalyticsSectionScore {
  section_title: string;
  score: number;
  max_score: number;
  percentage: number;
  questions_attempted?: number;
  questions_correct?: number;
}

export interface AssessmentAnalyticsTopPerformer {
  rank: number;
  user_profile_id: number;
  name: string;
  email: string;
  score: number;
  percentage: number;
  time_taken_minutes: number;
  submitted_at: string;
  section_scores?: AssessmentAnalyticsSectionScore[];
}

export interface AssessmentAnalyticsStudentRow {
  submission_id: number;
  user_profile_id: number;
  name: string;
  email: string;
  status: string;
  score: number | null;
  percentage: number | null;
  time_taken_minutes: number | null;
  total_questions?: number | null;
  attempted_questions?: number | null;
  started_at: string | null;
  submitted_at: string | null;
  section_scores?: AssessmentAnalyticsSectionScore[];
}

/** Per-question aggregates from analytics API */
export interface AssessmentAnalyticsCodingQuestionRow {
  problem_id: number;
  coding_section_id?: number;
  section_title?: string;
  difficulty_level?: string;
  title: string;
  full_pass_count: number;
  partial_count: number;
  failed_count: number;
  skipped_count: number;
  appeared_count: number;
}

export interface AssessmentAnalyticsQuestionLevelResults {
  mcq?: Record<string, unknown>[];
  coding?: AssessmentAnalyticsCodingQuestionRow[];
  subjective?: Record<string, unknown>[];
  completed_submissions_used?: number;
}

export interface AssessmentAnalyticsResponse {
  assessment: AssessmentAnalyticsAssessmentMeta;
  summary: AssessmentAnalyticsSummary;
  status_breakdown: AssessmentAnalyticsStatusBreakdown;
  charts: {
    score_distribution_percent: AssessmentAnalyticsScoreBucket[];
    time_taken_minutes: AssessmentAnalyticsTimeBucket[];
    submissions_timeline: AssessmentAnalyticsTimelineDay[];
  };
  section_averages: AssessmentAnalyticsSectionAverage[];
  question_level_results?: AssessmentAnalyticsQuestionLevelResults;
  top_performers: AssessmentAnalyticsTopPerformer[];
  students: AssessmentAnalyticsStudentRow[];
}

export function clampAssessmentAnalyticsTopPerformers(n: unknown): number {
  const x = typeof n === "number" ? n : Number(n);
  if (!Number.isFinite(x)) return 10;
  return Math.min(100, Math.max(1, Math.round(x)));
}

/**
 * Assessment analytics (admin / superadmin / course_manager with access).
 * GET /admin-dashboard/api/clients/{client_id}/assessments/{assessment_id}/analytics/
 */
export const getAssessmentAnalytics = async (
  clientId: string | number,
  assessmentId: number,
  options?: { top_performers?: number }
): Promise<AssessmentAnalyticsResponse> => {
  const top = clampAssessmentAnalyticsTopPerformers(
    options?.top_performers ?? 10
  );
  try {
    const response = await apiClient.get<AssessmentAnalyticsResponse>(
      `/admin-dashboard/api/clients/${clientId}/assessments/${assessmentId}/analytics/`,
      { params: { top_performers: top } }
    );
    return response.data;
  } catch (err) {
    const error = err as AxiosError<ApiErrorPayload>;
    const message =
      error.response?.data?.error ||
      error.response?.data?.message ||
      error.response?.data?.detail ||
      "Failed to load assessment analytics";
    throw new Error(message);
  }
};

export const adminAssessmentService = {
  getAssessments,
  getAssessmentById,
  createAssessment,
  updateAssessment,
  deleteAssessment,
  duplicateAssessment,
  getSubmissionsExport,
  getQuestionsExport,
  getQuestionsExportJson,
  getSubmissionsExportJson,
  getSubmissionManualEvaluation,
  saveManualEvaluation,
  publishSubmissionResult,
  publishAssessmentResultsBulk,
  getAssessmentAnalytics,
  getMCQs,
  generateMCQsWithAI,
  getCodingProblems,
  generateCodingProblemsWithAI,
  generateCodingProblemFromRaw,
  generateCodingProblemsFromRawBatch,
};
