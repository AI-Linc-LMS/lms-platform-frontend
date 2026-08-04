import apiClient from "./api";

/**
 * Instructor RBAC surface (Phase 1). The dashboard endpoints are assignment-scoped server-side —
 * an instructor only ever receives their assigned courses/cohorts/students. The admin endpoints
 * (assign/unassign) are admin-only server-side.
 */
const BASE = "/instructor/api";

export interface InstructorOverview {
  courses: number;
  /** Breakdown of `courses`. Optional so an older backend still type-checks. */
  adaptive_courses?: number;
  classic_courses?: number;
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

export interface InstructorCohortDetail {
  id: number;
  name: string;
  /** The courses this batch is studying — the link between "My Cohorts" and "My Courses". */
  courses?: { id: number; title: string }[];
  client_name: string;
  status: string;
  end_date: string | null;
  student_count: number;
  progress: number;
  avg_score: number;
  at_risk: number;
}

export interface InstructorScheduleItem {
  id: number;
  topic: string;
  datetime: string;
  duration_minutes: number;
  status: "live" | "scheduled";
  registered: number;
  cohort_name: string;
  join_link: string;
}

export interface InstructorRecentSubmission {
  submission_id: number;
  student_name: string;
  assessment_title: string;
  score: number | null;
  review_status: string;
  completed_at: string | null;
}

export interface InstructorDashboard {
  instructor_name: string;
  instructor_code: string;
  is_admin_view: boolean;
  batches: number;
  courses: number;
  students: number;
  active_students: number;
  avg_progress: number;
  completion_rate: number;
  at_risk_count: number;
  upcoming_sessions: number;
  live_now: number;
  at_risk: InstructorStatStudent[];
  top_performers: InstructorStatStudent[];
  cohorts_detailed: InstructorCohortDetail[];
  schedule: InstructorScheduleItem[];
  recent_submissions: InstructorRecentSubmission[];
  progress_truncated: boolean;
}

/**
 * Which assignment system a course came from. The two live in different tables with INDEPENDENT id
 * spaces, so `id` alone is ambiguous — always branch on `kind` before routing or passing an id to an
 * adaptive-only endpoint, or you can address a completely unrelated course that shares the number.
 */
export type InstructorCourseKind = "adaptive" | "classic";

export interface InstructorCourse {
  id: number;
  kind: InstructorCourseKind;
  title: string;
  /** null for classic courses. */
  slug: string | null;
  is_published: boolean;
  student_count: number;
  updated_at: string;
  /** True when THIS instructor built it — which carries full edit rights, unlike being assigned. */
  authored_by_me: boolean;
  /** "" for anything not instructor-authored (including every classic course). */
  review_status: "" | "draft" | "pending_review" | "approved" | "rejected";
  /** The admin's reason on a rejection, shown verbatim. */
  review_note: string;
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

export type InstructorStudentStatus = "on_track" | "watch" | "at_risk";

export interface InstructorStudentRow {
  student_id: number;
  name: string;
  email: string;
  phone: string;
  progress: number;
  /** null when the student has no scored submission (distinguishes a real 0 from missing data). */
  avg_score: number | null;
  points: number;
  last_active: string | null;
  cohort: string;
  status: InstructorStudentStatus;
  courses_count: number;
  cohorts_count: number;
}

export interface InstructorStudentsSummary {
  count: number;
  avg_progress: number;
  avg_score: number;
  at_risk: number;
}

export interface InstructorStudentsPage {
  /** count of the FILTERED result set (drives pagination). */
  count: number;
  page: number;
  page_size: number;
  results: InstructorStudentRow[];
  summary: InstructorStudentsSummary;
  cohort_id: number | null;
}

export interface GetStudentsParams {
  search?: string;
  page?: number;
  pageSize?: number;
  status?: InstructorStudentStatus | "";
  cohortId?: number | null;
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

export type LiveSessionProvider = "webinar" | "meeting" | "google_meet" | "manual";

export interface InstructorLiveSession {
  id: number;
  topic_name: string;
  class_datetime: string;
  /** IANA zone the session was scheduled in (authoritative for display; "" on legacy rows). */
  timezone?: string | null;
  duration_minutes: number;
  join_link: string;
  is_upcoming: boolean;
  provider: LiveSessionProvider;
  status: "live" | "scheduled" | "ended";
  is_zoom: boolean;
  is_webinar: boolean;
  is_google_meet: boolean;
  cohort_name: string;
  password: string;
  hostable: boolean;
  created_by_me: boolean;
  editable: boolean;
  registered: number;
  attendance: number;
  turnout: number | null;
  has_recording: boolean;
  recording_url: string;
}

export interface EditLiveSessionPayload {
  topic_name?: string;
  description?: string;
  /** Naive wall-clock; interpreted in `timezone` when both are sent. */
  class_datetime?: string;
  timezone?: string;
  duration_minutes?: number;
}

export interface AttendeeRow {
  name: string;
  email: string;
  duration_minutes: number | null;
  source: "zoom" | "meet" | "manual";
}

export interface AttendanceRoster {
  registered: number;
  attendance: number;
  attendees: AttendeeRow[];
}

export interface InstructorLiveSessions {
  upcoming: InstructorLiveSession[];
  past: InstructorLiveSession[];
  past_total: number;
}

export interface HostLink {
  kind: "panelist" | "host" | "join";
  url: string;
}

export interface CreateLiveSessionPayload {
  topic_name: string;
  description?: string;
  /** Naive wall-clock ("YYYY-MM-DDTHH:mm"); the backend interprets it in `timezone`. */
  class_datetime: string;
  /** IANA zone the wall-clock is in (defaults to the instructor's browser zone). */
  timezone?: string;
  duration_minutes: number;
  session_type: "meeting" | "webinar";
  cohort_id?: number;
  adaptive_course_id?: number;
  passcode?: string;
  registration_required?: boolean;
}

export interface CreatedLiveSession extends InstructorLiveSession {
  host_link: HostLink;
}

export const instructorService = {
  async getStudents({ search, page = 1, pageSize, status, cohortId }: GetStudentsParams = {}): Promise<InstructorStudentsPage> {
    const { data } = await apiClient.get<InstructorStudentsPage>(`${BASE}/students/`, {
      params: {
        page,
        ...(pageSize ? { page_size: pageSize } : {}),
        ...(search ? { search } : {}),
        ...(status ? { status } : {}),
        ...(cohortId ? { cohort_id: cohortId } : {}),
      },
    });
    return data;
  },
  async nudgeStudent(studentId: number, message?: string): Promise<{ student_id: number; sent: boolean }> {
    const { data } = await apiClient.post(`${BASE}/students/${studentId}/nudge/`, message ? { message } : {});
    return data;
  },
  async messageCohort(
    cohortId: number,
    message: string,
    title?: string,
  ): Promise<{ cohort_id: number; sent: number }> {
    const { data } = await apiClient.post(`${BASE}/cohorts/${cohortId}/message/`, {
      message,
      ...(title ? { title } : {}),
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
  async createLiveSession(payload: CreateLiveSessionPayload): Promise<CreatedLiveSession> {
    const { data } = await apiClient.post<CreatedLiveSession>(`${BASE}/live-sessions/`, payload);
    return data;
  },
  async getHostLink(sessionId: number): Promise<HostLink> {
    const { data } = await apiClient.get<HostLink>(`${BASE}/live-sessions/${sessionId}/host-link/`);
    return data;
  },
  async editLiveSession(sessionId: number, payload: EditLiveSessionPayload): Promise<InstructorLiveSession> {
    const { data } = await apiClient.patch<InstructorLiveSession>(`${BASE}/live-sessions/${sessionId}/`, payload);
    return data;
  },
  async getAttendance(sessionId: number): Promise<AttendanceRoster> {
    const { data } = await apiClient.get<AttendanceRoster>(`${BASE}/live-sessions/${sessionId}/attendance/`);
    return data;
  },
  async deleteLiveSession(sessionId: number): Promise<void> {
    await apiClient.delete(`${BASE}/live-sessions/${sessionId}/`);
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
