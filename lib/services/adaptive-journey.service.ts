import apiClient from "./api";
import type {
  AdaptiveCredential,
  AdminCertificateConfig,
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
import type { LearnerDashboard } from "@/lib/types/dashboard";
import type { PointsSystem } from "@/lib/types/points-system";
import type { LeaderboardPeriod, LeaderboardStreaks } from "@/lib/types/leaderboard-streaks";

const BASE = "/adaptive-journey/api";
const ADMIN = "/adaptive-journey/api/admin";

export const adaptiveJourneyService = {
  // ---- Learner surfaces ----
  async getLearnerDashboard(): Promise<LearnerDashboard> {
    const { data } = await apiClient.get<LearnerDashboard>(`${BASE}/learner/dashboard/`);
    return data;
  },

  async getPointsSystem(): Promise<PointsSystem> {
    const { data } = await apiClient.get<PointsSystem>(`${BASE}/points-system/`);
    return data;
  },

  async getLeaderboardStreaks(period: LeaderboardPeriod = "all"): Promise<LeaderboardStreaks> {
    const { data } = await apiClient.get<LeaderboardStreaks>(
      `${BASE}/learner/leaderboard-streaks/`, { params: { period } },
    );
    return data;
  },

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

  /** The learner's calibration profile - what we learned about them + how the AI
   *  adapts. Never includes right/wrong or solutions. */
  async getCalibrationResult(courseId: number): Promise<CalibrationResult> {
    const { data } = await apiClient.get<CalibrationResult>(
      `${BASE}/courses/${courseId}/calibration-result/`,
    );
    return data;
  },

  /** The learner's calibration-interview level insight - feedback on their level + how
   *  the course adapts. No marks, no right/wrong (like the calibration assessment). */
  async getInterviewResult(courseId: number): Promise<InterviewResult> {
    const { data } = await apiClient.get<InterviewResult>(
      `${BASE}/courses/${courseId}/interview-result/`,
    );
    return data;
  },

  /** AI-written LinkedIn post celebrating completion of this course (built from the
   *  course title + description). Returns "" if the AI call failed - caller falls back. */
  async getCertificateLinkedInPost(courseId: number): Promise<string> {
    const { data } = await apiClient.get<{ post: string }>(
      `${BASE}/courses/${courseId}/certificate/linkedin-post/`,
    );
    return data?.post ?? "";
  },

  /** Issue (idempotently) the learner's verifiable credential. Eligibility-gated;
   *  rejects with 409 if the certificate isn't enabled or completion < threshold. */
  async issueCertificate(courseId: number): Promise<AdaptiveCredential> {
    const { data } = await apiClient.post<AdaptiveCredential>(
      `${BASE}/courses/${courseId}/certificate/issue/`,
      {},
    );
    return data;
  },

  /** PUBLIC credential verification (no auth required) - powers /credentials/<id>. */
  async getPublicCredential(credentialId: string): Promise<AdaptiveCredential> {
    const { data } = await apiClient.get<AdaptiveCredential>(
      `${BASE}/credentials/${encodeURIComponent(credentialId)}/`,
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
   *  Runs in the background - returns immediately with generating=true; poll
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

  // ---- Admin certificate ----
  /** Read the course's certificate settings (enabled, completion threshold, title, template). */
  async getCertificateConfig(courseId: number): Promise<AdminCertificateConfig> {
    const { data } = await apiClient.get<AdminCertificateConfig>(
      `${ADMIN}/courses/${courseId}/certificate/`,
    );
    return data;
  },

  /** Update the certificate criteria (any subset of enabled / threshold / title). */
  async updateCertificateConfig(
    courseId: number,
    payload: { enabled?: boolean; min_completion_percent?: number; title?: string },
  ): Promise<AdminCertificateConfig> {
    const { data } = await apiClient.patch<AdminCertificateConfig>(
      `${ADMIN}/courses/${courseId}/certificate/`,
      payload,
    );
    return data;
  },

  /** Upload the certificate template image (multipart). Returns the refreshed config. */
  async uploadCertificateTemplate(courseId: number, file: File): Promise<AdminCertificateConfig> {
    const form = new FormData();
    form.append("file", file);
    // Don't set Content-Type - the browser adds the multipart boundary; forcing it breaks DRF.
    const { data } = await apiClient.post<AdminCertificateConfig>(
      `${ADMIN}/courses/${courseId}/certificate/upload/`,
      form,
    );
    return data;
  },
};
