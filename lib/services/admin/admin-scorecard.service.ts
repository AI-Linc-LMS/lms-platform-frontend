import apiClient from "../api";
import { config } from "../../config";
import { ScorecardData } from "@/lib/types/scorecard.types";
import {
  mapOverviewFromApi,
  mapLearningConsumptionFromApi,
  mapPerformanceTrendsFromApi,
  mapSkillsFromApi,
  mapWeakAreasFromApi,
  mapAssessmentPerformanceFromApi,
  mapMockInterviewPerformanceFromApi,
  mapBehavioralMetricsFromApi,
  mapComparativeInsightsFromApi,
  mapAchievementsFromApi,
  mapActionPanelFromApi,
  getEmptyScorecardData,
  getEmptyOverview,
  getEmptyLearningConsumption,
  getEmptyWeakAreas,
  getEmptyMockInterviewPerformance,
  getEmptyBehavioralMetrics,
  getEmptyComparativeInsights,
  getEmptyAchievements,
  getEmptyActionPanel,
} from "../scorecard.service";

export interface SkillItem {
  id: number;
  name: string;
  category: string;
}

export interface ContentMappingItem {
  id: number;
  title: string;
  skill_ids: number[];
  locations: Array<{
    course_name: string;
    module_title: string;
    submodule_title: string;
  }>;
}

export interface ContentMappingResponse {
  videos: ContentMappingItem[];
  articles: ContentMappingItem[];
  mcqs: ContentMappingItem[];
  coding_problems: ContentMappingItem[];
  assessments: ContentMappingItem[];
}

function getAdminBaseUrl(): string {
  return `/admin-dashboard/api/clients/${config.clientId}`;
}

/**
 * Fetch scorecard data for a student (admin view).
 * @param userProfileId - UserProfile (student) ID
 */
export async function getAdminScorecardForStudent(
  userProfileId: number
): Promise<ScorecardData> {
  const response = await apiClient.get<{
    scorecard_config?: { enabled_modules?: string[]; enabled_content_types_for_skills?: string[] };
    overview?: Record<string, unknown>;
    learning_consumption?: unknown;
    performance_trends?: unknown;
    skills?: unknown[];
    weak_areas?: unknown;
    assessment_performance?: unknown[];
    mock_interview_performance?: unknown;
    behavioral_metrics?: unknown;
    comparative_insights?: unknown;
    achievements?: unknown;
    action_panel?: unknown;
  }>(`${getAdminBaseUrl()}/scorecard/`, {
    params: { user_id: userProfileId },
  });

  const data = response.data;
  const result = getEmptyScorecardData();

  if (data?.scorecard_config != null) {
    result.scorecardConfig = {
      enabledModules: Array.isArray(data.scorecard_config.enabled_modules)
        ? data.scorecard_config.enabled_modules
        : [],
    };
  }

  result.overview =
    data?.overview && typeof data.overview === "object"
      ? mapOverviewFromApi(data.overview as Record<string, unknown>)
      : getEmptyOverview();

  result.learningConsumption =
    data?.learning_consumption != null && typeof data.learning_consumption === "object"
      ? mapLearningConsumptionFromApi(data.learning_consumption as Record<string, unknown>)
      : getEmptyLearningConsumption();

  result.performanceTrends =
    data?.performance_trends != null && typeof data.performance_trends === "object"
      ? mapPerformanceTrendsFromApi(data.performance_trends)
      : { weeklyData: [], skillWiseAccuracy: [] };

  result.skills = Array.isArray(data?.skills) ? mapSkillsFromApi(data.skills) : [];

  result.weakAreas =
    data?.weak_areas != null && typeof data.weak_areas === "object"
      ? mapWeakAreasFromApi(data.weak_areas)
      : getEmptyWeakAreas();

  result.assessmentPerformance = Array.isArray(data?.assessment_performance)
    ? mapAssessmentPerformanceFromApi(data.assessment_performance)
    : [];

  result.mockInterviewPerformance =
    data?.mock_interview_performance != null && typeof data.mock_interview_performance === "object"
      ? mapMockInterviewPerformanceFromApi(data.mock_interview_performance)
      : getEmptyMockInterviewPerformance();

  result.behavioralMetrics =
    data?.behavioral_metrics != null && typeof data.behavioral_metrics === "object"
      ? mapBehavioralMetricsFromApi(data.behavioral_metrics)
      : getEmptyBehavioralMetrics();

  result.comparativeInsights =
    data?.comparative_insights != null && typeof data.comparative_insights === "object"
      ? mapComparativeInsightsFromApi(data.comparative_insights)
      : getEmptyComparativeInsights();

  result.achievements =
    data?.achievements != null && typeof data.achievements === "object"
      ? mapAchievementsFromApi(data.achievements)
      : getEmptyAchievements();

  result.actionPanel =
    data?.action_panel != null && typeof data.action_panel === "object"
      ? mapActionPanelFromApi(data.action_panel)
      : getEmptyActionPanel();

  return result;
}

export interface ScorecardConfigResponse {
  enabled_modules: string[];
  enabled_content_types_for_skills?: string[];
}

/**
 * Get scorecard config (enabled modules, content types for skills).
 */
export async function getAdminScorecardConfig(): Promise<ScorecardConfigResponse> {
  const response = await apiClient.get<ScorecardConfigResponse>(
    `${getAdminBaseUrl()}/scorecard-config/`
  );
  return response.data;
}

/**
 * Update scorecard config.
 */
export async function updateAdminScorecardConfig(data: {
  enabled_modules?: string[];
  enabled_content_types_for_skills?: string[];
}): Promise<ScorecardConfigResponse> {
  const response = await apiClient.patch<ScorecardConfigResponse>(
    `${getAdminBaseUrl()}/scorecard-config/`,
    data
  );
  return response.data;
}

/**
 * Get all skills for the client.
 */
export async function getAdminScorecardSkills(): Promise<SkillItem[]> {
  const response = await apiClient.get<SkillItem[]>(
    `${getAdminBaseUrl()}/scorecard-skills/`
  );
  return response.data;
}

/**
 * Create a new skill.
 */
export async function createAdminScorecardSkill(
  name: string,
  category?: string
): Promise<SkillItem> {
  const response = await apiClient.post<SkillItem>(
    `${getAdminBaseUrl()}/scorecard-skills/`,
    { name, category: category ?? "" }
  );
  return response.data;
}

/**
 * Delete a skill.
 */
export async function deleteAdminScorecardSkill(skillId: number): Promise<void> {
  await apiClient.delete(
    `${getAdminBaseUrl()}/scorecard-skills/${skillId}/`
  );
}

/**
 * Get content-to-skill mapping for videos, articles, MCQs, coding problems, assessments.
 */
export async function getAdminScorecardContentMapping(): Promise<ContentMappingResponse> {
  const response = await apiClient.get<ContentMappingResponse>(
    `${getAdminBaseUrl()}/scorecard-content-mapping/`
  );
  return response.data;
}

/** Frontend tab ids (videos, articles, etc.) map to backend content_type (video, article, etc.) */
const CONTENT_TYPE_MAP: Record<string, string> = {
  videos: "video",
  articles: "article",
  mcqs: "mcq",
  coding_problems: "coding_problem",
  assessments: "assessment",
};

export type ContentTypeForMapping =
  | "videos"
  | "articles"
  | "mcqs"
  | "coding_problems"
  | "assessments";

/**
 * Update skill mapping for a content item.
 * @param contentType - Frontend tab id (videos, articles, mcqs, coding_problems, assessments)
 * @param contentId - Content item ID
 * @param skillIds - List of skill IDs to assign
 */
export async function updateContentSkillMapping(
  contentType: ContentTypeForMapping | string,
  contentId: number,
  skillIds: number[]
): Promise<{ skill_ids: number[] }> {
  const backendType = CONTENT_TYPE_MAP[contentType] ?? contentType;
  const response = await apiClient.patch<{ skill_ids: number[] }>(
    `${getAdminBaseUrl()}/scorecard-content-mapping/${backendType}/${contentId}/`,
    { skill_ids: skillIds }
  );
  return response.data;
}
