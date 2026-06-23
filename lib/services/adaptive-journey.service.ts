import apiClient from "./api";
import type {
  AdminJourneyNode,
  AdminNodeWritePayload,
  CohortScheduleResponse,
  JourneyBoard,
  Leaderboard,
  PointsWallet,
  StreakSummary,
} from "@/lib/types/adaptive-journey";

const BASE = "/adaptive-journey/api";
const ADMIN = "/adaptive-journey/api/admin";

export const adaptiveJourneyService = {
  // ---- Learner surfaces ----
  async getJourney(courseId: number): Promise<JourneyBoard> {
    const { data } = await apiClient.get<JourneyBoard>(`${BASE}/courses/${courseId}/journey/`);
    return data;
  },

  async getPointsWallet(courseId: number): Promise<PointsWallet> {
    const { data } = await apiClient.get<PointsWallet>(`${BASE}/courses/${courseId}/points-wallet/`);
    return data;
  },

  async getLeaderboard(courseId: number): Promise<Leaderboard> {
    const { data } = await apiClient.get<Leaderboard>(`${BASE}/courses/${courseId}/leaderboard/`);
    return data;
  },

  async getStreak(courseId: number): Promise<StreakSummary> {
    const { data } = await apiClient.get<StreakSummary>(`${BASE}/courses/${courseId}/streak/`);
    return data;
  },

  // ---- Admin course-builder ----
  async getSchedule(courseId: number): Promise<CohortScheduleResponse> {
    const { data } = await apiClient.get<CohortScheduleResponse>(`${ADMIN}/courses/${courseId}/schedule/`);
    return data;
  },

  async setSchedule(
    courseId: number,
    payload: { start_date: string; week_stagger_days?: number; week_window_days?: number },
  ): Promise<CohortScheduleResponse> {
    const { data } = await apiClient.post<CohortScheduleResponse>(
      `${ADMIN}/courses/${courseId}/schedule/`,
      payload,
    );
    return data;
  },

  async deleteSchedule(courseId: number): Promise<void> {
    await apiClient.delete(`${ADMIN}/courses/${courseId}/schedule/`);
  },

  async listNodes(courseId: number): Promise<AdminJourneyNode[]> {
    const { data } = await apiClient.get<AdminJourneyNode[]>(`${ADMIN}/courses/${courseId}/journey/nodes/`);
    return data;
  },

  async createNode(courseId: number, payload: AdminNodeWritePayload): Promise<AdminJourneyNode> {
    const { data } = await apiClient.post<AdminJourneyNode>(
      `${ADMIN}/courses/${courseId}/journey/nodes/`,
      payload,
    );
    return data;
  },

  async updateNode(
    courseId: number,
    nodeId: number,
    payload: Partial<AdminNodeWritePayload>,
  ): Promise<AdminJourneyNode> {
    const { data } = await apiClient.patch<AdminJourneyNode>(
      `${ADMIN}/courses/${courseId}/journey/nodes/${nodeId}/`,
      payload,
    );
    return data;
  },

  async deleteNode(courseId: number, nodeId: number): Promise<void> {
    await apiClient.delete(`${ADMIN}/courses/${courseId}/journey/nodes/${nodeId}/`);
  },

  async reorderNodes(
    courseId: number,
    nodes: { id: number; week_no?: number; order?: number }[],
  ): Promise<AdminJourneyNode[]> {
    const { data } = await apiClient.post<AdminJourneyNode[]>(
      `${ADMIN}/courses/${courseId}/journey/reorder/`,
      { nodes },
    );
    return data;
  },

  async getPointsConfig(courseId: number): Promise<{ points_config_overrides: Record<string, unknown> }> {
    const { data } = await apiClient.get(`${ADMIN}/courses/${courseId}/points-config/`);
    return data;
  },

  async setPointsConfig(
    courseId: number,
    overrides: Record<string, unknown>,
  ): Promise<{ points_config_overrides: Record<string, unknown> }> {
    const { data } = await apiClient.patch(`${ADMIN}/courses/${courseId}/points-config/`, {
      points_config_overrides: overrides,
    });
    return data;
  },

  async linkCalibration(courseId: number, assessmentId: number): Promise<{ assessment_id: number }> {
    const { data } = await apiClient.post(`${ADMIN}/courses/${courseId}/calibration-link/`, {
      assessment_id: assessmentId,
    });
    return data;
  },

  /** Read-only calibration status for a course (admin UI). */
  async getCalibration(courseId: number): Promise<{
    exists: boolean;
    assessment_id: number | null;
    assessment_slug: string | null;
    configured: boolean;
    question_count: number;
    node_id: number | null;
    duration_minutes: number | null;
    points: number;
  }> {
    const { data } = await apiClient.get(`${ADMIN}/courses/${courseId}/calibration/`);
    return data;
  },

  /** One-click provision of a calibration shell (assessment + node) for the course;
   *  the instructor then only adds the aptitude question set. Idempotent. */
  async createCalibration(
    courseId: number,
    opts?: { duration_minutes?: number; points?: number },
  ): Promise<{ assessment_id: number; assessment_slug: string; node_id: number; configured: boolean }> {
    const { data } = await apiClient.post(`${ADMIN}/courses/${courseId}/calibration/create/`, opts ?? {});
    return data;
  },
};
