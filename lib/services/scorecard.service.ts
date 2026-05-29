import apiClient from "./api";
import { config } from "@/lib/config";
import { profileService } from "./profile.service";
import { scorecardFromApiPayload, type ScorecardApiPayload } from "./scorecard/build-scorecard";
import {
  mapAchievementsFromApi,
  mapActionPanelFromApi,
  mapAssessmentPerformanceFromApi,
  mapBehavioralMetricsFromApi,
  mapComparativeInsightsFromApi,
  mapMockInterviewPerformanceFromApi,
  mapPerformanceTrendsFromApi,
  mapSkillsFromApi,
  mapWeakAreasFromApi,
} from "./scorecard/mappers";
import type {
  Achievements,
  ActionPanel,
  AssessmentPerformance,
  BehavioralMetrics,
  ComparativeInsights,
  MockInterviewPerformance,
  PerformanceTrends,
  Skill,
  WeakAreas,
} from "@/lib/types/scorecard.types";

export { formatTimeSpent } from "./scorecard/mappers";
export type { ScorecardApiPayload };
export type PerformanceTrendsGranularity = "weekly" | "bimonthly" | "monthly";

async function mergeProfilePicture<T extends { overview: { profilePicUrl?: string } }>(result: T): Promise<T> {
  if (result.overview.profilePicUrl) {
    return result;
  }
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
    const response = await apiClient.get<ScorecardApiPayload>(
      `/api/scorecard/clients/${clientId}/student/scorecard/`,
    );
    const result = scorecardFromApiPayload(response.data);
    return await mergeProfilePicture(result);
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

  getMockInterviewPerformance: async (): Promise<MockInterviewPerformance> => {
    const clientId = config.clientId;
    const response = await apiClient.get<Record<string, unknown>>(
      `/api/scorecard/clients/${clientId}/student/scorecard/mock-interviews/`,
    );
    return mapMockInterviewPerformanceFromApi(response.data);
  },

  getBehavioralMetrics: async (): Promise<BehavioralMetrics> => {
    const clientId = config.clientId;
    const response = await apiClient.get<Record<string, unknown>>(
      `/api/scorecard/clients/${clientId}/student/scorecard/behavioral/`,
    );
    return mapBehavioralMetricsFromApi(response.data);
  },

  getComparativeInsights: async (): Promise<ComparativeInsights> => {
    const clientId = config.clientId;
    const response = await apiClient.get<Record<string, unknown>>(
      `/api/scorecard/clients/${clientId}/student/scorecard/comparative/`,
    );
    return mapComparativeInsightsFromApi(response.data);
  },

  getAchievements: async (): Promise<Achievements> => {
    const clientId = config.clientId;
    const response = await apiClient.get<Record<string, unknown>>(
      `/api/scorecard/clients/${clientId}/student/scorecard/achievements/`,
    );
    return mapAchievementsFromApi(response.data);
  },

  getActionPanel: async (): Promise<ActionPanel> => {
    const clientId = config.clientId;
    const response = await apiClient.get<Record<string, unknown>>(
      `/api/scorecard/clients/${clientId}/student/scorecard/action-panel/`,
    );
    return mapActionPanelFromApi(response.data);
  },

  exportScorecardPdf: async (): Promise<Blob> => {
    const clientId = config.clientId;
    try {
      const response = await apiClient.get(
        `/api/scorecard/clients/${clientId}/student/scorecard/export/pdf/`,
        { responseType: "blob" },
      );
      return response.data as Blob;
    } catch (err: unknown) {
      // The server returns a JSON error body, but because we asked for a Blob
      // response, axios hands the error back with `error.response.data` as a
      // Blob. Read it as text so we can surface the actual message instead of
      // the generic "Request failed with status code 500".
      const e = err as {
        response?: { data?: Blob; status?: number };
        message?: string;
      };
      let message = e?.message || "Failed to download PDF.";
      const blob = e?.response?.data;
      if (blob && blob instanceof Blob) {
        try {
          const text = await blob.text();
          try {
            const json = JSON.parse(text) as { error?: string; hint?: string };
            const parts: string[] = [];
            if (json?.error) parts.push(json.error);
            if (json?.hint) parts.push(json.hint);
            if (parts.length) message = parts.join(" — ");
            else if (text) message = text;
          } catch {
            if (text) message = text;
          }
        } catch {
          /* fall back to original message */
        }
      }
      throw new Error(message);
    }
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
