import apiClient from "./api";

/**
 * Instructor RBAC surface (Phase 1). The dashboard endpoints are assignment-scoped server-side —
 * an instructor only ever receives their assigned courses/cohorts/students. The admin endpoints
 * (assign/unassign) are admin-only server-side.
 */
const BASE = "/instructor/api";

export interface InstructorOverview {
  courses: number;
  cohorts: number;
  students: number;
  is_admin_view: boolean;
}

export interface InstructorStatStudent {
  student_id: number;
  name: string;
  email: string;
  progress: number;
}

export interface InstructorDashboard {
  instructor_name: string;
  is_admin_view: boolean;
  batches: number;
  courses: number;
  students: number;
  active_students: number;
  avg_progress: number;
  completion_rate: number;
  at_risk_count: number;
  upcoming_sessions: number;
  at_risk: InstructorStatStudent[];
  top_performers: InstructorStatStudent[];
  progress_truncated: boolean;
}

export interface InstructorCourse {
  id: number;
  title: string;
  slug: string;
  is_published: boolean;
  student_count: number;
  updated_at: string;
}

export interface InstructorCohort {
  id: number;
  name: string;
  status: string;
  start_date: string | null;
  end_date: string | null;
  member_count: number;
  artifact_count: number;
}

export interface CohortStudentRow {
  student_id: number;
  name: string;
  email: string;
  phone: string;
  status: string;
  joined_at: string;
}

export interface CohortRoster {
  cohort_id: number;
  name: string;
  count: number;
  results: CohortStudentRow[];
}

export interface CourseStudentRow {
  student_id: number;
  name: string;
  email: string;
  phone: string;
  enrolled_at: string;
  progress_percentage: number;
  completed: number;
  total: number;
  last_activity: string | null;
}

export interface CourseRoster {
  count: number;
  page: number;
  page_size: number;
  results: CourseStudentRow[];
}

export interface InstructorStudentDetail {
  student_id: number;
  name: string;
  email: string;
  phone: string;
  courses: { id: number; title: string; enrolled_at: string }[];
  cohorts: { id: number; name: string; status: string }[];
}

/** A staff assignment row (course or cohort). */
export interface StaffAssignment {
  id: number;
  profile_id: number;
  email: string;
  name: string;
  role: string;
  can_grade: boolean;
  can_manage_roster: boolean;
  can_edit_content?: boolean; // course only
  can_message?: boolean; // cohort only
  created_at: string;
}

export interface AssignStaffBody {
  profile_id: number;
  role?: string;
  can_grade?: boolean;
  can_manage_roster?: boolean;
  can_edit_content?: boolean;
  can_message?: boolean;
}

export interface InstructorDirectoryRow {
  profile_id: number;
  name: string;
  email: string;
  instructor_code: string;
  courses: { id: number; title: string; role: string }[];
  cohorts: { id: number; name: string; role: string }[];
  live_sessions: { id: number; title: string }[];
}

export interface InstructorStudentRow {
  student_id: number;
  name: string;
  email: string;
  phone: string;
  progress: number;
  courses_count: number;
  cohorts_count: number;
}

export interface InstructorStudentsPage {
  count: number;
  page: number;
  page_size: number;
  results: InstructorStudentRow[];
}

export interface InstructorAssessment {
  id: number;
  title: string;
  slug: string;
  is_draft: boolean;
  duration_minutes: number;
  submissions: number;
  pending_grading: number;
}

export interface InstructorLiveSession {
  id: number;
  topic_name: string;
  class_datetime: string;
  duration_minutes: number;
  join_link: string;
  is_upcoming: boolean;
}

export interface InstructorLiveSessions {
  upcoming: InstructorLiveSession[];
  past: InstructorLiveSession[];
}

export const instructorService = {
  async getStudents(search?: string, page = 1, pageSize?: number): Promise<InstructorStudentsPage> {
    const { data } = await apiClient.get<InstructorStudentsPage>(`${BASE}/students/`, {
      params: { page, ...(pageSize ? { page_size: pageSize } : {}), ...(search ? { search } : {}) },
    });
    return data;
  },
  async getAssessments(): Promise<InstructorAssessment[]> {
    const { data } = await apiClient.get<InstructorAssessment[]>(`${BASE}/assessments/`);
    return data;
  },
  async getLiveSessions(): Promise<InstructorLiveSessions> {
    const { data } = await apiClient.get<InstructorLiveSessions>(`${BASE}/live-sessions/`);
    return data;
  },

  // --- Admin settings: instructor directory + public code ---
  async getInstructorDirectory(): Promise<InstructorDirectoryRow[]> {
    const { data } = await apiClient.get<InstructorDirectoryRow[]>(`${BASE}/admin/instructors/`);
    return data;
  },
  async setInstructorCode(
    profileId: number,
    code: string,
  ): Promise<{ profile_id: number; instructor_code: string }> {
    const { data } = await apiClient.patch(`${BASE}/admin/instructors/${profileId}/`, {
      instructor_code: code,
    });
    return data;
  },

  // --- Dashboard (assignment-scoped) ---
  async getDashboard(): Promise<InstructorDashboard> {
    const { data } = await apiClient.get<InstructorDashboard>(`${BASE}/dashboard/`);
    return data;
  },
  async getOverview(): Promise<InstructorOverview> {
    const { data } = await apiClient.get<InstructorOverview>(`${BASE}/overview/`);
    return data;
  },
  async getCourses(): Promise<InstructorCourse[]> {
    const { data } = await apiClient.get<InstructorCourse[]>(`${BASE}/courses/`);
    return data;
  },
  async getCohorts(): Promise<InstructorCohort[]> {
    const { data } = await apiClient.get<InstructorCohort[]>(`${BASE}/cohorts/`);
    return data;
  },
  async getCohortStudents(cohortId: number, search?: string): Promise<CohortRoster> {
    const { data } = await apiClient.get<CohortRoster>(`${BASE}/cohorts/${cohortId}/students/`, {
      params: search ? { search } : {},
    });
    return data;
  },
  async getStudent(studentId: number): Promise<InstructorStudentDetail> {
    const { data } = await apiClient.get<InstructorStudentDetail>(`${BASE}/students/${studentId}/`);
    return data;
  },

  // --- Course roster (via the capability-re-gated admin endpoints; an assigned instructor may use these) ---
  async getCourseStudents(courseId: number, search?: string, page = 1): Promise<CourseRoster> {
    const { data } = await apiClient.get<CourseRoster>(
      `/adaptive-quiz/api/admin/courses/${courseId}/students/`,
      { params: { page, ...(search ? { search } : {}) } },
    );
    return data;
  },
  async unenrollCourseStudents(courseId: number, studentIds: number[]): Promise<{ succeeded: number }> {
    const { data } = await apiClient.post(`/adaptive-quiz/api/admin/courses/${courseId}/students/unenroll/`, {
      student_ids: studentIds,
    });
    return data;
  },
  async enrollCourseStudents(courseId: number, studentIds: number[]): Promise<{ succeeded: number; skipped: number; missing: number[] }> {
    const { data } = await apiClient.post(`/adaptive-quiz/api/admin/courses/${courseId}/students/enroll/`, {
      student_ids: studentIds,
    });
    return data;
  },

  // --- Admin: assignment management (admin-only server-side) ---
  async listCourseStaff(courseId: number): Promise<StaffAssignment[]> {
    const { data } = await apiClient.get<StaffAssignment[]>(`${BASE}/admin/courses/${courseId}/staff/`);
    return data;
  },
  async assignCourseStaff(courseId: number, body: AssignStaffBody): Promise<StaffAssignment> {
    const { data } = await apiClient.post<StaffAssignment>(`${BASE}/admin/courses/${courseId}/staff/`, body);
    return data;
  },
  async removeCourseStaff(courseId: number, profileId: number): Promise<void> {
    await apiClient.delete(`${BASE}/admin/courses/${courseId}/staff/${profileId}/`);
  },
  async listCohortStaff(cohortId: number): Promise<StaffAssignment[]> {
    const { data } = await apiClient.get<StaffAssignment[]>(`${BASE}/admin/cohorts/${cohortId}/staff/`);
    return data;
  },
  async assignCohortStaff(cohortId: number, body: AssignStaffBody): Promise<StaffAssignment> {
    const { data } = await apiClient.post<StaffAssignment>(`${BASE}/admin/cohorts/${cohortId}/staff/`, body);
    return data;
  },
  async removeCohortStaff(cohortId: number, profileId: number): Promise<void> {
    await apiClient.delete(`${BASE}/admin/cohorts/${cohortId}/staff/${profileId}/`);
  },
};
