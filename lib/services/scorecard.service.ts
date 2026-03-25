import apiClient from "./api";
import { config } from "@/lib/config";
import { profileService } from "./profile.service";
import type { PerformanceTrends } from "@/lib/types/scorecard.types";
import { mapPerformanceTrendsFromApi } from "./scorecard/mappers";
import { scorecardFromApiPayload, type ScorecardApiPayload } from "./scorecard/build-scorecard";

export * from "./scorecard/mappers";
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
  getPerformanceTrends: async (granularity: PerformanceTrendsGranularity): Promise<PerformanceTrends> => {
    const clientId = config.clientId;
    const response = await apiClient.get<Record<string, unknown>>(
      `/api/clients/${clientId}/student/scorecard/performance-trends/`,
      { params: { granularity } }
    );
    return mapPerformanceTrendsFromApi(response.data);
  },

  getScorecardData: async () => {
    const clientId = config.clientId;
    try {
      const response = await apiClient.get<ScorecardApiPayload>(`/api/clients/${clientId}/student/scorecard/`);
      const result = scorecardFromApiPayload(response.data);
      return await mergeProfilePicture(result);
    } catch (error) {
      console.warn("Scorecard API failed:", error);
      return await mergeProfilePicture(scorecardFromApiPayload(undefined));
    }
  },

  getScorecardDataForPdf: async (pdfToken: string, clientId: string) => {
    const url = `${config.apiBaseUrl}/api/clients/${clientId}/student/scorecard/?pdf_token=${encodeURIComponent(pdfToken)}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error("Invalid or expired PDF link");
    const data = (await res.json()) as ScorecardApiPayload;
    return scorecardFromApiPayload(data);
  },

  exportScorecardPdf: async (): Promise<Blob> => {
    const clientId = config.clientId;
    const response = await apiClient.get(`/api/clients/${clientId}/student/scorecard/export/pdf/`, {
      responseType: "blob",
    });
    return response.data as Blob;
  },

  getDashboardSummary: async () => {
    const fullData = await scorecardService.getScorecardData();
    return {
      overallScore: fullData.overview.overallPerformanceScore,
      overallGrade: fullData.overview.overallGrade,
      totalTimeSpentSeconds: fullData.overview.totalTimeSpentSeconds,
      activeDaysStreak: fullData.overview.activeDaysStreak,
      completionPercentage: fullData.overview.completionPercentage,
      currentWeek: fullData.overview.currentWeek,
      currentModule: fullData.overview.currentModule,
      topSkills: fullData.skills
        .sort((a, b) => b.proficiencyScore - a.proficiencyScore)
        .slice(0, 3),
      recentTrend: fullData.performanceTrends.weeklyData.slice(-4),
      learningConsumption: fullData.learningConsumption,
      skillDistribution: fullData.skills.map((s) => ({
        name: s.name,
        score: s.proficiencyScore,
        level: s.level,
      })),
      assessmentScores: fullData.assessmentPerformance.map((a) => ({
        name: a.assessmentName.length > 15 ? `${a.assessmentName.slice(0, 15)}…` : a.assessmentName,
        score: a.score,
      })),
      skillLevels: {
        beginner: fullData.skills.filter((s) => s.level === "Beginner").length,
        intermediate: fullData.skills.filter((s) => s.level === "Intermediate").length,
        advanced: fullData.skills.filter((s) => s.level === "Advanced").length,
        interviewReady: fullData.skills.filter((s) => s.level === "Interview-Ready").length,
      },
    };
  },
};
