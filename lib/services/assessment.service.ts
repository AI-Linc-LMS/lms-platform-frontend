import apiClient from "./api";
import { config } from "../config";

export interface Assessment {
  id: number;
  title: string;
  description: string;
  slug: string;
  instructions?: string;
  duration_minutes: number;
  is_paid: boolean;
  price: number | null;
  amount?: number;
  is_active: boolean;
  number_of_questions: number;
  created_at: string;
  is_attempted: boolean;
  start_time?: string | null;
  end_time?: string | null;
  has_attempted?: boolean; // For backward compatibility
  proctoring_enabled?: boolean;
  /** "not_started" | "in_progress" | "submitted" | "completed" – when "submitted" or "completed", show results */
  status?: "not_started" | "in_progress" | "submitted" | "completed";
}

export interface AssessmentDetail extends Assessment {
  sections: any[];
}

export interface AssessmentSubmission {
  assessment: {
    id: number;
    title: string;
    slug: string;
    sections: Array<{
      section_type: string;
      questions: any[];
    }>;
  };
  submission: {
    id: number;
    status: string;
    started_at: string;
  };
}

export interface SubmissionResponse {
  response_sheet: any;
  status: string;
}

export interface FinalSubmissionResponse {
  id: number;
  score: number;
  offered_scholarship_percentage: number;
  status: string;
  submitted_at: string;
}

export interface ScholarshipStatus {
  has_submitted: boolean;
  score: number;
  offered_scholarship_percentage: number;
  is_redeemed: boolean;
  referral_code: string;
}

export interface AttemptedAssessment {
  id: number;
  assessment: {
    id: number;
    title: string;
    slug: string;
  };
  score: number;
  status: string;
  submitted_at: string;
}

export interface TopicWiseStats {
  total: number;
  correct: number;
  incorrect: number;
  accuracy_percent: number;
  rating_out_of_5: number;
}

export interface SkillStats {
  skill: string;
  accuracy_percent: number;
  rating_out_of_5: number;
  total: number;
  correct: number;
  incorrect: number;
}

export interface AssessmentResult {
  message: string;
  status: string;
  score: number;
  assessment_id: string;
  assessment_name: string;
  maximum_marks: number;
  stats: {
    total_questions: number;
    attempted_questions: number;
    correct_answers: number;
    score: number;
    incorrect_answers: number;
    accuracy_percent: number;
    placement_readiness: number;
    maximum_marks: number;
    topic_wise_stats: Record<string, TopicWiseStats>;
    top_skills: SkillStats[] | string[];
    low_skills: SkillStats[] | string[];
    percentile: number;
    time_taken_minutes: number;
    total_time_minutes: number;
    percentage_time_taken: number;
  };
  proctoring?: {
    eye_movement_violations?: Array<{
      timestamp: string;
      duration_seconds?: number;
    }>;
    eye_movement_count?: number;
  };
  user_responses?: {
    quiz_responses?: QuizResponseItem[];
    coding_problem_responses?: CodingProblemResponseItem[];
  };
}

export interface QuizResponseItem {
  question_id: number;
  question_text: string;
  options: Record<string, string>;
  correct_option: string;
  selected_answer: string | null;
  is_correct: boolean;
  explanation?: string | null;
  difficulty_level?: "Easy" | "Medium" | "Hard";
  topic?: string | null;
  skills?: string | null;
}

export interface CodingProblemResponseItem {
  problem_id: number;
  title: string;
  problem_statement?: string | null;
  input_format?: string | null;
  output_format?: string | null;
  sample_input?: string | null;
  sample_output?: string | null;
  constraints?: string | null;
  difficulty_level?: "Easy" | "Medium" | "Hard";
  tags?: string | null;
  submitted_code?: string | null;
  total_test_cases: number;
  passed_test_cases: number;
  all_test_cases_passed: boolean;
}

export interface AssessmentMetadata {
  proctoring: {
    face_violations: Array<{
      type:
        | "NO_FACE"
        | "MULTIPLE_FACES"
        | "LOOKING_AWAY"
        | "EYE_MOVEMENT"
        | "FACE_TOO_CLOSE"
        | "FACE_TOO_FAR"
        | "POOR_LIGHTING";
      timestamp: string;
      duration_seconds?: number;
    }>;
    eye_movement_violations?: Array<{
      timestamp: string;
      duration_seconds?: number;
    }>;
    eye_movement_count?: number;
    tab_switches: Array<{
      timestamp: string;
      duration_seconds: number;
    }>;
    fullscreen_exits: Array<{
      timestamp: string;
      timestamp_returned?: string;
    }>;
    total_violation_count: number;
    violation_threshold_reached: boolean;
  };
  timing: {
    started_at: string;
    submitted_at?: string;
    total_time_seconds?: number;
  };
}

export const assessmentService = {
  // Get active assessments
  getActiveAssessments: async (): Promise<Assessment[]> => {
    const response = await apiClient.get<Assessment[]>(
      `/assessment/api/client/${config.clientId}/active-assessments/`
    );
    return response.data;
  },

  // Get assessment detail
  getAssessmentDetail: async (slug: string): Promise<AssessmentDetail> => {
    const response = await apiClient.get<AssessmentDetail>(
      `/assessment/api/client/${config.clientId}/assessment-details/${slug}/`
    );
    return response.data;
  },

  // Start assessment
  startAssessment: async (
    assessmentId: number | string
  ): Promise<AssessmentSubmission> => {
    const response = await apiClient.get<AssessmentSubmission>(
      `/assessment/api/client/${config.clientId}/start-assessment/${assessmentId}/`
    );
    return response.data;
  },

  // Save assessment submission (autosave)
  saveSubmission: async (
    assessmentId: string,
    payload: {
      metadata: {
        transcript: {
          logs: any[];
          metadata: any;
          total_duration_seconds: number;
        };
      };
      quizSectionId: Array<Record<string, any>>;
      codingProblemSectionId: Array<Record<string, any>>;
    }
  ): Promise<SubmissionResponse> => {
    const response = await apiClient.put<SubmissionResponse>(
      `/assessment/api/client/${config.clientId}/assessment-submission/${assessmentId}/`,
      {
        response_sheet: payload,
      }
    );
    return response.data;
  },

  // Update assessment submission (deprecated - use saveSubmission)
  updateSubmission: async (
    assessmentId: number,
    responseSheet: Record<string, Record<string, any>>,
    metadata?: AssessmentMetadata
  ): Promise<SubmissionResponse> => {
    const response = await apiClient.put<SubmissionResponse>(
      `/assessment/api/client/${config.clientId}/assessment-submission/${assessmentId}/`,
      {
        response_sheet: responseSheet,
        metadata: metadata,
      }
    );
    return response.data;
  },

  // Final submit assessment
  finalSubmit: async (
    assessmentId: string,
    payload: {
      metadata: {
        transcript: {
          logs: any[];
          metadata: any;
          total_duration_seconds: number;
        };
      };
      quizSectionId: Array<Record<string, any>>;
      codingProblemSectionId: Array<Record<string, any>>;
    }
  ): Promise<FinalSubmissionResponse> => {
    const response = await apiClient.put<FinalSubmissionResponse>(
      `/assessment/api/client/${config.clientId}/assessment-submission/${assessmentId}/final/`,
      {
        response_sheet: payload,
      }
    );
    return response.data;
  },

  // Redeem scholarship
  redeemScholarship: async (
    assessmentIdOrSlug: number | string,
    referralCode?: string
  ): Promise<{
    scholarship_percentage: number;
    referral_code: string;
    message: string;
  }> => {
    const response = await apiClient.post(
      `/assessment/api/client/${config.clientId}/redeem-scholarship/${assessmentIdOrSlug}/`,
      referralCode ? { referral_code: referralCode } : {}
    );
    return response.data;
  },

  // Get scholarship assessment status
  getScholarshipStatus: async (
    assessmentIdOrSlug: number | string
  ): Promise<ScholarshipStatus> => {
    const response = await apiClient.get<ScholarshipStatus>(
      `/assessment/api/client/${config.clientId}/scholarship-assessment-status/${assessmentIdOrSlug}/`
    );
    return response.data;
  },

  // Get attempted assessments
  getAttemptedAssessments: async (): Promise<AttemptedAssessment[]> => {
    const response = await apiClient.get<AttemptedAssessment[]>(
      `/assessment/api/client/${config.clientId}/attempted-assessments/`
    );
    return response.data;
  },

  getAssessmentResult: async (
    assessmentIdOrSlug: number | string
  ): Promise<AssessmentResult> => {
    const response = await apiClient.get<AssessmentResult>(
      `/assessment/api/client/${config.clientId}/assessment-result/${assessmentIdOrSlug}/`
    );
    return response.data;
  },

  // Assessment Coding Problem: Run Code
  runCodeInAssessment: async (
    slug: string,
    questionId: number,
    sourceCode: string,
    languageId: number,
    customInput?: string
  ): Promise<any> => {
    const endpoint = `/assessment/api/client/${config.clientId}/run-code/${slug}/${questionId}/`;

    const payload: any = {
      source_code: sourceCode,
      language_id: languageId,
    };

    // Add custom input if provided
    if (customInput !== undefined) {
      payload.stdin = customInput;
    }

    const response = await apiClient.post(endpoint, payload);
    return response.data;
  },

  // Assessment Coding Problem: Submit Code
  submitCodeInAssessment: async (
    slug: string,
    questionId: number,
    sourceCode: string,
    languageId: number
  ): Promise<any> => {
    const endpoint = `/assessment/api/client/${config.clientId}/submit-code/${slug}/${questionId}/`;

    const response = await apiClient.post(endpoint, {
      source_code: sourceCode,
      language_id: languageId,
    });

    return response.data;
  },
};
