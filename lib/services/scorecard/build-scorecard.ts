import type { ScorecardData } from "@/lib/types/scorecard.types";
import {
  mapAssessmentPerformanceFromApi,
  mapBehavioralMetricsFromApi,
  mapComparativeInsightsFromApi,
  mapLearningConsumptionFromApi,
  mapMockInterviewPerformanceFromApi,
  mapOverviewFromApi,
  mapPerformanceTrendsFromApi,
  mapSkillsFromApi,
  mapWeakAreasFromApi,
  getEmptyLearningConsumption,
  getEmptyOverview,
  getEmptyScorecardData,
} from "./mappers";

/** Raw scorecard JSON from student or admin API */
export type ScorecardApiPayload = {
  scorecard_config?: { enabled_modules?: string[]; enabled_content_types_for_skills?: string[] };
  overview?: Record<string, unknown>;
  learning_consumption?: unknown;
  performance_trends?: unknown;
  skills?: unknown;
  weak_areas?: unknown;
  assessment_performance?: unknown;
  mock_interview_performance?: unknown;
  behavioral_metrics?: unknown;
  comparative_insights?: unknown;
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

  // Only set performanceTrends when the backend actually sent it. Leaving it
  // undefined lets pages render older deploys (Phase 0 backend) without
  // crashing on missing data — the section component renders an empty state.
  if (data?.performance_trends != null && typeof data.performance_trends === "object") {
    result.performanceTrends = mapPerformanceTrendsFromApi(data.performance_trends);
  }

  if (Array.isArray(data?.skills)) {
    result.skills = mapSkillsFromApi(data?.skills);
  }

  if (data?.weak_areas != null && typeof data.weak_areas === "object") {
    result.weakAreas = mapWeakAreasFromApi(data.weak_areas);
  }

  if (Array.isArray(data?.assessment_performance)) {
    result.assessmentPerformance = mapAssessmentPerformanceFromApi(data.assessment_performance);
  }

  if (data?.mock_interview_performance != null && typeof data.mock_interview_performance === "object") {
    result.mockInterviewPerformance = mapMockInterviewPerformanceFromApi(data.mock_interview_performance);
  }

  if (data?.behavioral_metrics != null && typeof data.behavioral_metrics === "object") {
    result.behavioralMetrics = mapBehavioralMetricsFromApi(data.behavioral_metrics);
  }

  if (data?.comparative_insights != null && typeof data.comparative_insights === "object") {
    result.comparativeInsights = mapComparativeInsightsFromApi(data.comparative_insights);
  }

  return result;
}
