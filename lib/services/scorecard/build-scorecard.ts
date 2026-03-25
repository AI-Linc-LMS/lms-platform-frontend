import type { ScorecardData } from "@/lib/types/scorecard.types";
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
} from "./mappers";

/** Raw scorecard JSON from student or admin API */
export type ScorecardApiPayload = {
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
};

export function scorecardFromApiPayload(data: ScorecardApiPayload | undefined | null): ScorecardData {
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
