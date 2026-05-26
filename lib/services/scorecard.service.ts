import apiClient from "./api";
import { config } from "@/lib/config";
import { profileService } from "./profile.service";
import { scorecardFromApiPayload, type ScorecardApiPayload } from "./scorecard/build-scorecard";
import {
  mapAssessmentPerformanceFromApi,
  mapPerformanceTrendsFromApi,
  mapSkillsFromApi,
  mapWeakAreasFromApi,
} from "./scorecard/mappers";
import type {
  AssessmentPerformance,
  PerformanceTrends,
  Skill,
  WeakAreas,
} from "@/lib/types/scorecard.types";

export { formatTimeSpent } from "./scorecard/mappers";
export type { ScorecardApiPayload };
export type PerformanceTrendsGranularity = "weekly" | "bimonthly" | "monthly";

async function mergeProfilePicture<T extends { overview: { profilePicUrl?: string } }>(result: T): Promise<T> {
  try {
    const profile = await profileService.getUserProfile();
    if (profile?.profile_picture) {
      result.overview.profilePicUrl = profile.profile_picture;
    }
  } catch {
    /* ignore */
  }
  return result;
}

export const scorecardService = {
  getScorecardData: async () => {
    const clientId = config.clientId;
    try {
      const response = await apiClient.get<ScorecardApiPayload>(
        `/api/scorecard/clients/${clientId}/student/scorecard/`
      );
      const result = scorecardFromApiPayload(response.data);
      return await mergeProfilePicture(result);
    } catch {
      return await mergeProfilePicture(scorecardFromApiPayload(undefined));
    }
  },

  getScorecardDataForPdf: async (pdfToken: string, clientId: string) => {
    const url = `${config.apiBaseUrl}/api/scorecard/clients/${clientId}/student/scorecard/?pdf_token=${encodeURIComponent(pdfToken)}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error("Invalid or expired PDF link");
    const data = (await res.json()) as ScorecardApiPayload;
    return scorecardFromApiPayload(data);
  },

  getPerformanceTrends: async (
    granularity: PerformanceTrendsGranularity = "weekly",
  ): Promise<PerformanceTrends> => {
    const clientId = config.clientId;
    const response = await apiClient.get<Record<string, unknown>>(
      `/api/scorecard/clients/${clientId}/student/scorecard/performance-trends/`,
      { params: { granularity } },
    );
    return mapPerformanceTrendsFromApi(response.data);
  },

  getSkillScorecard: async (): Promise<Skill[]> => {
    const clientId = config.clientId;
    const response = await apiClient.get<{ skills?: unknown }>(
      `/api/scorecard/clients/${clientId}/student/scorecard/skills/`,
    );
    return mapSkillsFromApi(response.data?.skills);
  },

  getWeakAreas: async (): Promise<WeakAreas> => {
    const clientId = config.clientId;
    const response = await apiClient.get<Record<string, unknown>>(
      `/api/scorecard/clients/${clientId}/student/scorecard/weak-areas/`,
    );
    return mapWeakAreasFromApi(response.data);
  },

  getAssessmentPerformance: async (): Promise<AssessmentPerformance[]> => {
    const clientId = config.clientId;
    const response = await apiClient.get<{ assessment_performance?: unknown }>(
      `/api/scorecard/clients/${clientId}/student/scorecard/assessments/`,
    );
    return mapAssessmentPerformanceFromApi(response.data?.assessment_performance);
  },

  exportScorecardPdf: async (): Promise<Blob> => {
    const clientId = config.clientId;
    const response = await apiClient.get(`/api/scorecard/clients/${clientId}/student/scorecard/export/pdf/`, {
      responseType: "blob",
    });
    return response.data as Blob;
  },

  getDashboardSummary: async () => {
    const fullData = await scorecardService.getScorecardData();
    const lc = fullData.learningConsumption;
    const totalAssigned =
      lc.videos.totalAssigned +
      lc.articles.totalAssigned +
      lc.codingProblems.totalAssigned +
      lc.mockInterviews.totalAssigned +
      (lc.practice.mcqsTotal ?? 0);
    const totalCompleted =
      lc.videos.completed +
      lc.articles.read +
      lc.codingProblems.completed +
      lc.mockInterviews.completed +
      (lc.practice.mcqsAttempted ?? 0);
    const learningProgressPct =
      totalAssigned > 0 ? Math.round((totalCompleted / totalAssigned) * 100) : 0;
    return {
      overallScore: fullData.overview.overallPerformanceScore,
      overallGrade: fullData.overview.overallGrade,
      totalTimeSpentSeconds: fullData.overview.totalTimeSpentSeconds,
      activeDaysStreak: fullData.overview.activeDaysStreak,
      completionPercentage: fullData.overview.completionPercentage,
      currentWeek: fullData.overview.currentWeek,
      currentModule: fullData.overview.currentModule,
      learningConsumption: fullData.learningConsumption,
      learningProgressPct,
    };
  },
};
