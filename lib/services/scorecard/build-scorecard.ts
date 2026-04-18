import type { ScorecardData } from "@/lib/types/scorecard.types";
import {
  mapLearningConsumptionFromApi,
  mapOverviewFromApi,
  getEmptyLearningConsumption,
  getEmptyOverview,
  getEmptyScorecardData,
} from "./mappers";

/** Raw scorecard JSON from student or admin API */
export type ScorecardApiPayload = {
  scorecard_config?: { enabled_modules?: string[]; enabled_content_types_for_skills?: string[] };
  overview?: Record<string, unknown>;
  learning_consumption?: unknown;
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

  return result;
}
