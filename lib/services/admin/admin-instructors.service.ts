import apiClient from "../api";
import { config } from "../../config";

export type InstructorStatus = "pending" | "approved" | "rejected" | "all";
export type InstructorListStatus = Exclude<InstructorStatus, "all">;
export type PromoteRole = "course_manager" | "admin";
export type AssignCoursesMode = "set" | "add" | "remove";

export interface InstructorAssignedCourse {
  id: number;
  title: string;
}

export interface InstructorRow {
  id: number;
  email: string;
  full_name: string;
  phone_number: string;
  created_at: string;
  pending_status: InstructorListStatus | null;
  pending_reviewed_at?: string | null;
  pending_rejection_reason?: string | null;
  assigned_courses?: InstructorAssignedCourse[];
  /**
   * Adaptive course assignments, which live in a different table with its own id space.
   * Deliberately NOT merged with `assigned_courses`: id 14 is a different course in each,
   * and these ids are fed straight back as the assign dialog's pre-selection.
   * Optional because an older backend does not send it.
   */
  assigned_adaptive_courses?: InstructorAssignedCourse[];
  /** Presigned S3 URL to the instructor's uploaded CV, when one was provided at signup. */
  instructor_cv_url?: string | null;
}

export interface InstructorCoursesPayload {
  managed_courses: InstructorAssignedCourse[];
  assigned_courses: InstructorAssignedCourse[];
  assigned_adaptive_courses?: InstructorAssignedCourse[];
  all_scoped: InstructorAssignedCourse[];
}

interface MutationResponse {
  detail: string;
  profile?: InstructorRow;
}

function normalizeList<T>(data: unknown): T[] {
  if (Array.isArray(data)) {
    return data as T[];
  }
  if (
    data &&
    typeof data === "object" &&
    "results" in data &&
    Array.isArray((data as { results: unknown }).results)
  ) {
    return (data as { results: T[] }).results;
  }
  return [];
}

function baseUrl(): string {
  return `/admin-dashboard/api/clients/${config.clientId}/instructors`;
}

export interface CreateInstructorPayload {
  name: string;
  email: string;
  phone?: string;
  course_ids?: number[];
  adaptive_course_ids?: number[];
  /** Second call only. Converting someone's live account is never implicit — see `CreateInstructorConflict`. */
  promote_existing?: boolean;
}

export interface CreateInstructorResult {
  detail: string;
  created_account: boolean;
  promoted_existing: boolean;
  invite_email_sent: boolean;
  profile: InstructorRow;
}

/** 409 body. `reason` says which of five situations the admin is in, so the UI can say so too. */
export interface CreateInstructorConflict {
  error: string;
  reason:
    | "existing_account"
    | "already_instructor"
    | "already_pending"
    | "previously_rejected"
    | "protected_role";
  profile_id?: number;
  current_role?: string;
  can_promote?: boolean;
}

export const adminInstructorsService = {
  listInstructors: async (
    status: InstructorStatus = "pending"
  ): Promise<InstructorRow[]> => {
    const response = await apiClient.get<unknown>(`${baseUrl()}/`, {
      params: { status },
    });
    return normalizeList<InstructorRow>(response.data);
  },

  createInstructor: async (
    payload: CreateInstructorPayload
  ): Promise<CreateInstructorResult> => {
    const response = await apiClient.post<CreateInstructorResult>(
      `${baseUrl()}/create/`,
      payload
    );
    return response.data;
  },

  approveInstructor: async (profileId: number): Promise<MutationResponse> => {
    const response = await apiClient.post<MutationResponse>(
      `${baseUrl()}/${profileId}/approve/`,
      {}
    );
    return response.data;
  },

  rejectInstructor: async (
    profileId: number,
    reason?: string
  ): Promise<MutationResponse> => {
    const response = await apiClient.post<MutationResponse>(
      `${baseUrl()}/${profileId}/reject/`,
      reason ? { reason } : {}
    );
    return response.data;
  },

  reopenInstructor: async (profileId: number): Promise<MutationResponse> => {
    const response = await apiClient.post<MutationResponse>(
      `${baseUrl()}/${profileId}/reopen/`,
      {}
    );
    return response.data;
  },

  /**
   * Assign courses to an instructor.
   *
   * Classic and adaptive courses go in separate lists because their ids come from different
   * tables. Sending `adaptive_course_ids` is what makes the assignment reach
   * `AdaptiveCourseStaff`, which is the table the instructor workspace and the RBAC gates
   * read; omitting it leaves adaptive courses unassignable, which is what five tenants with
   * no classic courses were hitting.
   */
  /**
   * Adaptive courses the caller may assign, from the admin catalogue endpoint that already
   * backs every other "pick a course" dropdown. It scopes by tenant and by what the caller
   * owns, so there is no need to pass a client id.
   */
  getAssignableAdaptiveCourses: async () => {
    const response = await apiClient.get("/adaptive-quiz/api/admin/courses/");
    return response.data;
  },

  assignCoursesToInstructor: async (
    profileId: number,
    courseIds: number[],
    mode: AssignCoursesMode = "set",
    adaptiveCourseIds: number[] = []
  ): Promise<MutationResponse> => {
    const response = await apiClient.post<MutationResponse>(
      `${baseUrl()}/${profileId}/assign-courses/`,
      {
        course_ids: courseIds,
        adaptive_course_ids: adaptiveCourseIds,
        mode,
      }
    );
    return response.data;
  },

  promoteInstructor: async (
    profileId: number,
    newRole: PromoteRole
  ): Promise<MutationResponse> => {
    const response = await apiClient.post<MutationResponse>(
      `${baseUrl()}/${profileId}/promote/`,
      { new_role: newRole }
    );
    return response.data;
  },

  // Remove someone as an instructor: demote to student + strip code/assignments/staff rows.
  removeInstructor: async (profileId: number): Promise<MutationResponse> => {
    const response = await apiClient.post<MutationResponse>(
      `${baseUrl()}/${profileId}/remove/`,
      {}
    );
    return response.data;
  },

  getInstructorCourses: async (
    profileId: number
  ): Promise<InstructorCoursesPayload> => {
    const response = await apiClient.get<InstructorCoursesPayload>(
      `${baseUrl()}/${profileId}/courses/`
    );
    return response.data;
  },
};
