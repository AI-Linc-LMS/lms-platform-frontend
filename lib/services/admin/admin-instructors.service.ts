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
  /** Presigned S3 URL to the instructor's uploaded CV, when one was provided at signup. */
  instructor_cv_url?: string | null;
}

export interface InstructorCoursesPayload {
  managed_courses: InstructorAssignedCourse[];
  assigned_courses: InstructorAssignedCourse[];
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

  assignCoursesToInstructor: async (
    profileId: number,
    courseIds: number[],
    mode: AssignCoursesMode = "set"
  ): Promise<MutationResponse> => {
    const response = await apiClient.post<MutationResponse>(
      `${baseUrl()}/${profileId}/assign-courses/`,
      { course_ids: courseIds, mode }
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
