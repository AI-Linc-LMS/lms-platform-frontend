import apiClient from "../api";
import { config } from "../../config";

// Dashboard types
export interface DashboardOverview {
  total_interviews: number;
  total_unique_students: number;
  active_students_in_period: number;
  completion_rate: number;
  status_breakdown: {
    scheduled: number;
    in_progress: number;
    completed: number;
    cancelled: number;
  };
}

export interface DashboardScoreStatistics {
  average_score: number;
  highest_score: number;
  lowest_score: number;
  median_score: number;
  total_scored_interviews: number;
}

export interface DashboardTimeStatistics {
  average_time_minutes: number;
  total_time_spent_minutes: number;
  interviews_with_time_data: number;
}

export interface DifficultyStats {
  total: number;
  completed: number;
  average_score: number;
}

export interface TopicBreakdownItem {
  topic: string;
  total_interviews: number;
  completed_interviews: number;
  unique_students: number;
  average_score: number;
}

export interface DailyTrendItem {
  date: string;
  created: number;
  completed: number;
}

export interface TopPerformer {
  student_id: number;
  student_name: string;
  student_email: string;
  interviews_completed: number;
  average_score: number;
  highest_score: number;
}

export interface DashboardResponse {
  overview: DashboardOverview;
  score_statistics: DashboardScoreStatistics;
  time_statistics: DashboardTimeStatistics;
  difficulty_distribution: Record<string, DifficultyStats>;
  topic_breakdown: TopicBreakdownItem[];
  daily_trend: DailyTrendItem[];
  top_performers: TopPerformer[];
  recent_interviews: AdminInterviewListItem[];
}

// Interview list types
export interface AdminInterviewListItem {
  id: number;
  title: string;
  topic: string;
  subtopic?: string;
  difficulty: string;
  status: string;
  duration_minutes: number;
  scheduled_date_time?: string;
  started_at?: string;
  submitted_at?: string;
  created_at: string;
  student_name: string;
  student_email: string;
  student_id: number;
  overall_score?: number;
}

export interface InterviewsPagination {
  current_page: number;
  total_pages: number;
  total_interviews: number;
  limit: number;
  has_next: boolean;
  has_previous: boolean;
}

export interface ListInterviewsParams {
  status?: string;
  difficulty?: string;
  topic?: string;
  student_id?: number;
  search?: string;
  date_from?: string;
  date_to?: string;
  sort_by?: string;
  sort_order?: "asc" | "desc";
  page?: number;
  limit?: number;
}

export interface ListInterviewsResponse {
  interviews: AdminInterviewListItem[];
  pagination: InterviewsPagination;
  filters_applied: Record<string, string | number | null>;
}

// Interview detail types
export interface AdminQuestionForInterview {
  question: string;
  question_number: number;
}

export interface GradingSchemeCriteria {
  technical_accuracy?: number;
  communication?: number;
  problem_solving?: number;
  code_quality?: number;
  [key: string]: number | undefined;
}

export interface GradingScheme {
  criteria: GradingSchemeCriteria;
}

export interface EvaluationScore {
  overall_score: number;
  technical_accuracy?: number;
  communication?: number;
  problem_solving?: number;
  code_quality?: number;
  feedback?: string;
}

export interface TranscriptResponse {
  question_number: number;
  response: string;
}

export interface InterviewTranscript {
  responses: TranscriptResponse[];
  metadata?: {
    tabSwitches?: number;
    windowSwitches?: number;
    fullscreen_exits?: number;
    face_validation_failures?: number;
    [key: string]: unknown;
  };
}

export interface AdminInterviewDetail {
  id: number;
  title: string;
  topic: string;
  subtopic?: string;
  difficulty: string;
  status: string;
  duration_minutes: number;
  scheduled_date_time?: string;
  started_at?: string;
  submitted_at?: string;
  created_at: string;
  updated_at?: string;
  student_name: string;
  student_email: string;
  student_id: number;
  questions_for_interview: AdminQuestionForInterview[];
  grading_scheme?: GradingScheme;
  evaluation_score?: EvaluationScore;
  interview_transcript?: InterviewTranscript;
  time_taken_minutes?: number;
}

// Student list types
export interface AdminStudentListItem {
  student_id: number;
  student_name: string;
  student_email: string;
  total_interviews: number;
  completed_interviews: number;
  in_progress_interviews: number;
  scheduled_interviews: number;
  cancelled_interviews: number;
  average_score: number;
  highest_score: number;
  lowest_score: number;
  total_time_spent_minutes: number;
  average_time_per_interview_minutes: number;
  topics_attempted: string[];
  difficulty_distribution: Record<string, number>;
  last_interview_date?: string;
  completion_rate: number;
}

export interface StudentsPagination {
  current_page: number;
  total_pages: number;
  total_students: number;
  limit: number;
  has_next: boolean;
  has_previous: boolean;
}

export interface ListStudentsParams {
  search?: string;
  sort_by?: string;
  sort_order?: "asc" | "desc";
  page?: number;
  limit?: number;
  min_interviews?: number;
}

export interface ListStudentsResponse {
  students: AdminStudentListItem[];
  pagination: StudentsPagination;
}

// Student detail types
export interface AdminStudentProfile {
  id: number;
  name: string;
  email: string;
  phone_number?: string;
  profile_pic_url?: string;
}

export interface AdminStudentSummary {
  total_interviews: number;
  completed_interviews: number;
  in_progress_interviews: number;
  scheduled_interviews: number;
  cancelled_interviews: number;
  average_score: number;
  highest_score: number;
  lowest_score: number;
  total_time_spent_minutes: number;
  average_time_per_interview_minutes: number;
  completion_rate: number;
  topics_attempted: string[];
  difficulty_distribution: Record<string, number>;
  last_interview_date?: string;
}

export interface ScoreTrendItem {
  interview_id: number;
  title: string;
  topic: string;
  difficulty: string;
  date: string;
  score: number;
}

export interface TopicPerformanceItem {
  topic: string;
  total_interviews: number;
  completed: number;
  average_score: number;
  highest_score: number;
  subtopics: string[];
}

export interface DifficultyPerformanceItem {
  total: number;
  completed: number;
  average_score: number;
  highest_score: number;
}

export interface StudentDetailResponse {
  student: AdminStudentProfile;
  summary: AdminStudentSummary;
  score_trend: ScoreTrendItem[];
  topic_performance: TopicPerformanceItem[];
  difficulty_performance: Record<string, DifficultyPerformanceItem>;
  interviews?: AdminInterviewListItem[];
}

// Topic analytics types
export interface TopicSubtopic {
  subtopic: string;
  total_interviews: number;
  completed: number;
  unique_students: number;
  average_score: number;
}

export interface AdminTopicItem {
  topic: string;
  total_interviews: number;
  completed_interviews: number;
  unique_students: number;
  average_score: number;
  highest_score: number;
  lowest_score: number;
  difficulty_breakdown: Record<string, number>;
  subtopics: TopicSubtopic[];
}

export interface TopicsResponse {
  total_topics: number;
  topics: AdminTopicItem[];
}

export interface GetTopicsParams {
  sort_by?: string;
  sort_order?: "asc" | "desc";
}

// Export params
export interface ExportCSVParams {
  status?: string;
  difficulty?: string;
  student_id?: number;
  date_from?: string;
  date_to?: string;
}

const BASE_URL = `/admin-dashboard/api/clients/${config.clientId}/mock-interviews`;

const adminMockInterviewService = {
  /**
   * Get dashboard overview with KPIs, trends, and top performers
   */
  getDashboard: async (days?: number): Promise<DashboardResponse> => {
    const params = days != null ? { days } : {};
    const response = await apiClient.get(`${BASE_URL}/dashboard/`, { params });
    return response.data;
  },

  /**
   * List all mock interviews with filtering, search, sorting, and pagination
   */
  listInterviews: async (
    params: ListInterviewsParams = {}
  ): Promise<ListInterviewsResponse> => {
    const response = await apiClient.get(BASE_URL, { params });
    return response.data;
  },

  /**
   * Get full details of a single mock interview
   */
  getInterviewDetail: async (
    interviewId: number
  ): Promise<AdminInterviewDetail> => {
    const response = await apiClient.get(
      `${BASE_URL}/${interviewId}/`
    );
    return response.data;
  },

  /**
   * List all students with mock interview summary statistics
   */
  listStudents: async (
    params: ListStudentsParams = {}
  ): Promise<ListStudentsResponse> => {
    const response = await apiClient.get(`${BASE_URL}/students/`, {
      params,
    });
    return response.data;
  },

  /**
   * Get detailed performance report for a specific student
   */
  getStudentDetail: async (
    studentId: number,
    includeInterviews = true
  ): Promise<StudentDetailResponse> => {
    const response = await apiClient.get(
      `${BASE_URL}/students/${studentId}/`,
      { params: { include_interviews: includeInterviews } }
    );
    return response.data;
  },

  /**
   * Get topic-level analytics
   */
  getTopics: async (
    params: GetTopicsParams = {}
  ): Promise<TopicsResponse> => {
    const response = await apiClient.get(`${BASE_URL}/topics/`, {
      params,
    });
    return response.data;
  },

  /**
   * Export mock interview data as CSV
   */
  exportCSV: async (params: ExportCSVParams = {}): Promise<Blob> => {
    const response = await apiClient.get(`${BASE_URL}/export/`, {
      params,
      responseType: "blob",
      headers: {
        Accept: "text/csv",
      },
    });
    return response.data as Blob;
  },
};

export default adminMockInterviewService;
