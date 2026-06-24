import apiClient from "./api";
import type {
  AdminJourneyNode,
  AdminNodeWritePayload,
  CalibrationInterviewStatus,
  CalibrationResult,
  CalibrationSubmissionsResponse,
  CohortScheduleResponse,
  CourseInterviewsResponse,
  InterviewResult,
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

  /** The learner's calibration profile — what we learned about them + how the AI
   *  adapts. Never includes right/wrong or solutions. */
  async getCalibrationResult(courseId: number): Promise<CalibrationResult> {
    const { data } = await apiClient.get<CalibrationResult>(
      `${BASE}/courses/${courseId}/calibration-result/`,
    );
    return data;
  },

  /** The learner's calibration-interview level insight — feedback on their level + how
   *  the course adapts. No marks, no right/wrong (like the calibration assessment). */
  async getInterviewResult(courseId: number): Promise<InterviewResult> {
    const { data } = await apiClient.get<InterviewResult>(
      `${BASE}/courses/${courseId}/interview-result/`,
    );
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

  /** Read-only calibration status for a course (admin UI). */
  async getCalibration(courseId: number): Promise<{
    exists: boolean;
    assessment_id: number | null;
    assessment_slug: string | null;
    configured: boolean;
    generating: boolean;
    status: "generating" | "ready" | "setup_pending" | "not_started";
    question_count: number;
    node_id: number | null;
    duration_minutes: number | null;
    points: number;
  }> {
    const { data } = await apiClient.get(`${ADMIN}/courses/${courseId}/calibration/`);
    return data;
  },

  /** Kick off AI generation of the course's calibration (field-aptitude questions).
   *  Runs in the background — returns immediately with generating=true; poll
   *  getCalibration until ready. Idempotent. */
  async createCalibration(
    courseId: number,
    opts?: { question_count?: number },
  ): Promise<{ assessment_id: number; assessment_slug: string; node_id: number; configured: boolean; generating: boolean }> {
    const { data } = await apiClient.post(`${ADMIN}/courses/${courseId}/calibration/create/`, opts ?? {});
    return data;
  },

  /** Per-student calibration results + the seeded Student Model (course-scoped admin). */
  async getCalibrationSubmissions(courseId: number): Promise<CalibrationSubmissionsResponse> {
    const { data } = await apiClient.get(`${ADMIN}/courses/${courseId}/calibration/submissions/`);
    return data;
  },

  /** The course's mock-interview templates + per-student attempts & feedback (admin). */
  async getCourseInterviews(courseId: number): Promise<CourseInterviewsResponse> {
    const { data } = await apiClient.get(`${ADMIN}/courses/${courseId}/interviews/`);
    return data;
  },

  /** Status of the course's calibration interview (the level-gauge). */
  async getCalibrationInterview(courseId: number): Promise<CalibrationInterviewStatus> {
    const { data } = await apiClient.get(`${ADMIN}/courses/${courseId}/interview/`);
    return data;
  },

  /** Create the calibration interview for an older course (idempotent). */
  async createCalibrationInterview(
    courseId: number,
  ): Promise<CalibrationInterviewStatus & { template_id: number; node_id: number }> {
    const { data } = await apiClient.post(`${ADMIN}/courses/${courseId}/interview/`, {});
    return data;
  },
};
