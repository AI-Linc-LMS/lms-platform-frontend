import apiClient from "../api";
import { config } from "../../config";

export interface Student {
  id: number;
  user_id: number;
  name: string;
  first_name: string;
  last_name: string;
  email: string;
  username: string;
  profile_pic_url?: string | null;
  is_active: boolean;
  date_joined: string;
  last_login: string | null;
  total_marks: number;
  most_active_course: string;
  total_time_spent: {
    value: number;
    unit: string;
  };
  last_activity_date: string | null;
  current_streak: number;
  streak_data: boolean[];
  enrollment_count: number;
  /** Whether the student has saved a resume on their profile */
  has_saved_resume?: boolean;
  assessment_submissions: number;
  activity_summary: {
    total_activities: number;
    by_type: Record<string, number>;
  };
}

export interface CourseCompletionStats {
  student_id: number;
  name: string;
  email: string;
  course_id?: number;
  course_title?: string;
  completed_contents: number;
  total_contents: number;
  completion_percentage: number;
  attended_activities: number;
  total_attendance_activities: number;
  attendance_percentage: number;
}

export interface ManageStudentsParams {
  search?: string;
  role?: string;
  course_id?: number;
  page?: number;
  limit?: number;
  sort_by?: string;
  sort_order?: "asc" | "desc";
}

export interface ManageStudentsResponse {
  students: Student[];
  pagination: {
    current_page: number;
    total_pages: number;
    total_students: number;
    limit: number;
    has_next: boolean;
    has_previous: boolean;
  };
  filters_applied: {
    course_id?: string;
    search?: string;
    is_active?: string | null;
    sort_by?: string;
    sort_order?: string;
  };
}

export interface StudentDetail {
  id: number;
  user_id: number;
  personal_info: {
    first_name: string;
    last_name: string;
    email: string;
    username: string;
    profile_pic_url?: string | null;
    date_joined: string;
    last_login: string | null;
    is_active: boolean;
  };
  academic_summary: {
    total_marks: number;
    total_time_spent: {
      value: number;
      unit: string;
    };
    enrolled_courses_count: number;
    assessment_submissions_count: number;
    current_streak: number;
    total_activities: number;
  };
  enrolled_courses: Array<{
    id: number;
    title?: string;
    description?: string;
    enrollment_date?: string | null;
    marks?: number;
    progress_percentage?: number;
    total_contents?: number;
    completed_contents?: number;
    last_activity?: string | null;
    activity_count?: number;
    category?: string;
    level?: string;
    progress?: number;
    status?: string;
    score?: number;
    certificate?: string;
    lessons_count?: number;
    hours?: number;
  }>;
  activity_pattern_30_days: Array<{
    date: string;
    activity_count: number;
    time_spent_hours: number;
    marks_earned: number;
  }>;
  assessments: Array<{
    id: number;
    title?: string;
    assessment_title?: string;
    score?: number;
    max_score?: number;
    date?: string;
    status?: string;
    submitted_at?: string | null;
    started_at?: string | null;
    offered_scholarship_percentage?: number | null;
  }>;
  activity_breakdown: Record<string, number>;
}

// ── Learning Journey (full activity breakdown for the detail page) ──────────

export interface JourneySubmodule {
  id: number;
  title: string;
  order: number;
  total: number;
  completed: number;
  progress_percentage: number;
}

export interface JourneyModule {
  id: number;
  weekno: number;
  title: string;
  total: number;
  completed: number;
  progress_percentage: number;
  submodules: JourneySubmodule[];
}

export interface JourneyCourse {
  id: number;
  title: string;
  total_contents: number;
  completed_contents: number;
  progress_percentage: number;
  marks: number;
  last_activity: string | null;
  modules: JourneyModule[];
}

export interface JourneyAssessment {
  id: number;
  assessment_title: string | null;
  score: number | null;
  status: string;
  started_at: string | null;
  submitted_at: string | null;
  offered_scholarship_percentage: number | null;
}

export interface JourneyMockInterview {
  id: number;
  title: string;
  topic: string;
  subtopic: string;
  difficulty: string;
  status: string;
  score: number | null;
  scheduled_date_time: string | null;
  started_at: string | null;
  submitted_at: string | null;
}

export interface JourneyAdaptive {
  quiz: {
    session_count: number;
    completed_count: number;
    skill_ability: Record<string, number>;
    sessions: Array<{
      id: string;
      status: string;
      question_count: number;
      hints_used: number;
      started_at: string | null;
      completed_at: string | null;
    }>;
  };
  coding: {
    session_count: number;
    passed_count: number;
    mastery: Record<string, number>;
    misconceptions: unknown[];
    sessions: Array<{
      id: string;
      status: string;
      language: string;
      passed: boolean;
      run_count: number;
      submit_count: number;
      hints_revealed: number;
      started_at: string | null;
      completed_at: string | null;
    }>;
  };
  video: {
    session_count: number;
    completed_count: number;
    avg_comprehension: number | null;
    sessions: Array<{
      id: string;
      status: string;
      watch_mode: string;
      completeness_pct: number;
      comprehension_score: number;
      started_at: string | null;
      completed_at: string | null;
    }>;
  };
}

export interface JourneyWeekItem {
  id: number;
  title: string;
  /** Normalized category: article | video | quiz | coding | other */
  type: string;
  completed_at: string | null;
}

export interface JourneyWeek {
  weekno: number;
  module_title: string;
  completed_count: number;
  type_counts: Record<string, number>;
  items: JourneyWeekItem[];
}

export interface JourneyCourseWeeks {
  course_id: number;
  course_title: string;
  weeks: JourneyWeek[];
}

export interface JourneyTimelineEntry {
  type: string;
  activity_type?: string;
  title: string | null;
  course?: string | null;
  score?: number | null;
  status?: string;
  timestamp: string;
}

export interface StudentLearningJourney {
  student: {
    id: number;
    user_id: number;
    name: string;
    first_name: string;
    last_name: string;
    email: string;
    username: string;
    profile_pic_url?: string | null;
    is_active: boolean;
    date_joined: string;
    last_login: string | null;
  };
  summary: {
    enrolled_courses_count: number;
    total_marks: number;
    total_time_hours: number;
    current_streak: number;
    total_activities: number;
    overall_completion_pct: number;
    last_activity_date: string | null;
    assessments_count: number;
    mock_interviews_count: number;
    adaptive_sessions_count: number;
  };
  courses: JourneyCourse[];
  weekly_progress: JourneyCourseWeeks[];
  assessments: JourneyAssessment[];
  mock_interviews: {
    summary: {
      total?: number;
      completed?: number;
      average_score?: number | null;
      highest_score?: number | null;
    };
    items: JourneyMockInterview[];
  };
  adaptive: JourneyAdaptive;
  activity_breakdown: Record<string, number>;
  activity_pattern_30_days: Array<{
    date: string;
    activity_count: number;
    time_spent_hours: number;
    marks_earned: number;
  }>;
  timeline: JourneyTimelineEntry[];
}

export const adminStudentService = {
  // Get student list with filters
  getManageStudents: async (
    params?: ManageStudentsParams
  ): Promise<ManageStudentsResponse> => {
    const queryParams = new URLSearchParams();
    if (params?.search) queryParams.append("search", params.search);
    if (params?.role) queryParams.append("role", params.role);
    if (params?.course_id)
      queryParams.append("course_id", params.course_id.toString());
    if (params?.page) queryParams.append("page", params.page.toString());
    if (params?.limit) queryParams.append("limit", params.limit.toString());
    if (params?.sort_by) queryParams.append("sort_by", params.sort_by);
    if (params?.sort_order) queryParams.append("sort_order", params.sort_order);

    const queryString = queryParams.toString();
    const url = `/admin-dashboard/api/clients/${
      config.clientId
    }/manage-students/${queryString ? `?${queryString}` : ""}`;

    const response = await apiClient.get<ManageStudentsResponse>(url);
    return response.data;
  },

  // Get course completion stats
  getCourseCompletionStats: async (
    courseId?: number
  ): Promise<CourseCompletionStats[]> => {
    const queryParams = new URLSearchParams();
    if (courseId) queryParams.append("course_id", courseId.toString());

    const response = await apiClient.get<CourseCompletionStats[]>(
      `/admin-dashboard/api/clients/${
        config.clientId
      }/course-completion-stats/${
        queryParams.toString() ? `?${queryParams.toString()}` : ""
      }`
    );
    return response.data;
  },

  // Get single student
  getStudent: async (studentId: number): Promise<StudentDetail> => {
    const response = await apiClient.get<StudentDetail>(
      `/admin-dashboard/api/clients/${config.clientId}/manage-student/${studentId}/`
    );
    return response.data;
  },

  // Get full learning journey (activity breakdown across every surface)
  getLearningJourney: async (
    studentId: number
  ): Promise<StudentLearningJourney> => {
    const response = await apiClient.get<StudentLearningJourney>(
      `/admin-dashboard/api/clients/${config.clientId}/student-learning-journey/${studentId}/`
    );
    return response.data;
  },

  // Update student
  updateStudent: async (
    studentId: number,
    data: {
      role?: string;
      is_active?: boolean;
      first_name?: string;
      last_name?: string;
      email?: string;
    }
  ) => {
    const response = await apiClient.patch(
      `/admin-dashboard/api/clients/${config.clientId}/manage-student/${studentId}/`,
      data
    );
    return response.data;
  },

  // Activate student
  activateStudent: async (studentId: number) => {
    const response = await apiClient.post(
      `/admin-dashboard/api/clients/${config.clientId}/manage-student/${studentId}/`,
      { action: "activate" }
    );
    return response.data;
  },

  // Deactivate student
  deactivateStudent: async (studentId: number) => {
    const response = await apiClient.delete(
      `/admin-dashboard/api/clients/${config.clientId}/manage-student/${studentId}/`
    );
    return response.data;
  },

  // Bulk enroll / unenroll EXISTING students across courses (synchronous M2M op)
  bulkCourseAction: async (
    action: "enroll" | "unenroll",
    studentIds: number[],
    courseIds: number[]
  ): Promise<{
    action: string;
    succeeded: number;
    failed: number;
    results: Array<{
      student_id: number;
      course_id: number | null;
      status: string;
      detail?: string;
    }>;
  }> => {
    const response = await apiClient.post(
      `/admin-dashboard/api/clients/${config.clientId}/students/bulk-course-action/`,
      { action, student_ids: studentIds, course_ids: courseIds }
    );
    return response.data;
  },

  // Manage student actions (enroll, unenroll, reset progress)
  manageStudentAction: async (
    studentId: number,
    action: "enroll_course" | "unenroll_course" | "reset_progress",
    courseId?: number
  ) => {
    const body: { action: string; course_id?: number } = { action };
    if (courseId !== undefined) {
      body.course_id = courseId;
    }

    const response = await apiClient.post(
      `/admin-dashboard/api/clients/${config.clientId}/manage-student/${studentId}/`,
      body
    );
    return response.data;
  },
};

