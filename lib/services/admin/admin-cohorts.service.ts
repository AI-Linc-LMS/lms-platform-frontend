import apiClient from "@/lib/services/api";

const BASE = "/cohort/api/admin";

export type CohortStatus =
  | "draft"
  | "scheduled"
  | "active"
  | "completed"
  | "archived";

export type EnrollMode = "invite_only" | "self_serve" | "paid";

export type CohortArtifactType =
  | "adaptive_course"
  | "live_series"
  | "classic_course"
  | "assessment"
  | "mock_interview"
  | "job_posting";

export interface CohortListItem {
  id: number;
  name: string;
  code: string | null;
  status: CohortStatus;
  start_date: string | null;
  end_date: string | null;
  timezone: string;
  capacity: number | null;
  waitlist_enabled: boolean;
  enroll_mode: EnrollMode;
  is_template: boolean;
  member_count: number;
  artifact_count: number;
  created_at: string;
  updated_at: string;
}

export interface CohortArtifact {
  id: number;
  artifact_type: CohortArtifactType;
  target: { id: number; label: string } | null;
  role: "primary" | "supplemental";
  visibility: "enrolled_only" | "open_to_client";
  is_required: boolean;
  order: number;
  weight: number;
  status: "active" | "paused" | "removed";
  visible_from: string | null;
  available_from: string | null;
  due_at: string | null;
  closes_at: string | null;
  drip_mode: string;
  drip_offset_days: number;
  result_release_mode: string;
  result_release_at: string | null;
  created_at: string;
}

export interface CohortStaffMember {
  id: number;
  profile: number;
  name: string;
  role: string;
  can_grade: boolean;
  can_message: boolean;
  can_manage_roster: boolean;
}

export interface CohortDetail extends CohortListItem {
  description: string;
  week_stagger_days: number;
  week_window_days: number;
  content_locked: boolean;
  cloned_from: number | null;
  artifacts: CohortArtifact[];
  staff: CohortStaffMember[];
}

export interface CohortMember {
  id: number;
  student_id: number;
  name: string;
  email: string;
  status: string;
  source: string;
  wave: number | null;
  enrolled_at: string;
  completed_at: string | null;
}

export interface CohortMembersResponse {
  count: number;
  page: number;
  page_size: number;
  results: CohortMember[];
}

export interface EnrollActionResult {
  succeeded: number;
  skipped?: number;
  failed?: Array<{ student_id: number | null; detail: string }>;
  missing?: number[];
  removed?: number;
}

export interface CohortWritePayload {
  name?: string;
  code?: string | null;
  description?: string;
  status?: CohortStatus;
  start_date?: string | null;
  end_date?: string | null;
  timezone?: string;
  capacity?: number | null;
  waitlist_enabled?: boolean;
  enroll_mode?: EnrollMode;
  week_stagger_days?: number;
  week_window_days?: number;
  content_locked?: boolean;
  is_template?: boolean;
}

export interface AssignArtifactPayload {
  artifact_type: CohortArtifactType;
  target_id: number;
  role?: "primary" | "supplemental";
  visibility?: "enrolled_only" | "open_to_client";
  is_required?: boolean;
  order?: number;
  available_from?: string;
  due_at?: string;
  closes_at?: string;
}

export const adminCohortsService = {
  async listCohorts(params?: { status?: CohortStatus }): Promise<CohortListItem[]> {
    const { data } = await apiClient.get<CohortListItem[]>(`${BASE}/cohorts/`, {
      params: params?.status ? { status: params.status } : {},
    });
    return data;
  },

  async getCohort(cohortId: number): Promise<CohortDetail> {
    const { data } = await apiClient.get<CohortDetail>(`${BASE}/cohorts/${cohortId}/`);
    return data;
  },

  async createCohort(payload: CohortWritePayload): Promise<CohortDetail> {
    const { data } = await apiClient.post<CohortDetail>(`${BASE}/cohorts/`, payload);
    return data;
  },

  async updateCohort(cohortId: number, payload: CohortWritePayload): Promise<CohortDetail> {
    const { data } = await apiClient.patch<CohortDetail>(`${BASE}/cohorts/${cohortId}/`, payload);
    return data;
  },

  async deleteCohort(cohortId: number): Promise<{ id: number; is_deleted: boolean }> {
    const { data } = await apiClient.delete<{ id: number; is_deleted: boolean }>(
      `${BASE}/cohorts/${cohortId}/`,
    );
    return data;
  },

  async listMembers(
    cohortId: number,
    params?: { search?: string; page?: number; page_size?: number },
  ): Promise<CohortMembersResponse> {
    const { data } = await apiClient.get<CohortMembersResponse>(
      `${BASE}/cohorts/${cohortId}/members/`,
      { params },
    );
    return data;
  },

  async enrollMembers(cohortId: number, studentIds: number[]): Promise<EnrollActionResult> {
    const { data } = await apiClient.post<EnrollActionResult>(
      `${BASE}/cohorts/${cohortId}/members/enroll/`,
      { student_ids: studentIds },
    );
    return data;
  },

  async removeMembers(cohortId: number, studentIds: number[]): Promise<EnrollActionResult> {
    const { data } = await apiClient.post<EnrollActionResult>(
      `${BASE}/cohorts/${cohortId}/members/remove/`,
      { student_ids: studentIds },
    );
    return data;
  },

  async listArtifacts(cohortId: number): Promise<CohortArtifact[]> {
    const { data } = await apiClient.get<CohortArtifact[]>(`${BASE}/cohorts/${cohortId}/artifacts/`);
    return data;
  },

  async assignArtifact(cohortId: number, payload: AssignArtifactPayload): Promise<CohortArtifact> {
    const { data } = await apiClient.post<CohortArtifact>(
      `${BASE}/cohorts/${cohortId}/artifacts/`,
      payload,
    );
    return data;
  },

  async removeArtifact(cohortId: number, artifactId: number): Promise<{ id: number; status: string }> {
    const { data } = await apiClient.delete<{ id: number; status: string }>(
      `${BASE}/cohorts/${cohortId}/artifacts/${artifactId}/`,
    );
    return data;
  },
};
