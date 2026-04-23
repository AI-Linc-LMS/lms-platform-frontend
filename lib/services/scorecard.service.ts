import apiClient from "./api";
import { config } from "@/lib/config";
import { profileService } from "./profile.service";
import { scorecardFromApiPayload, type ScorecardApiPayload } from "./scorecard/build-scorecard";

export { formatTimeSpent } from "./scorecard/mappers";
export type { ScorecardApiPayload };

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
