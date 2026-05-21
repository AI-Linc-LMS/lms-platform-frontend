import apiClient from "./api";
import { config } from "@/lib/config";
import { profileService } from "./profile.service";
import { scorecardFromApiPayload, type ScorecardApiPayload } from "./scorecard/build-scorecard";
import {
  mapAIRecommendationFromApi,
  mapBadgesFromApi,
  mapGoalsFromApi,
  mapPeerPercentileFromApi,
  mapStreakFromApi,
} from "./scorecard/mappers";
import type {
  AIRecommendation,
  Badges,
  Goals,
  PeerPercentile,
  StreakSnapshot,
} from "@/lib/types/scorecard.types";

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

  getAIRecommendations: async (): Promise<AIRecommendation[]> => {
    const clientId = config.clientId;
    try {
      const response = await apiClient.get<{ recommendations: Record<string, unknown>[] }>(
        `/api/scorecard/clients/${clientId}/student/ai-recommendations/`
      );
      return (response.data.recommendations ?? []).map(mapAIRecommendationFromApi);
    } catch {
      return [];
    }
  },

  refreshAIRecommendations: async (): Promise<AIRecommendation[]> => {
    const clientId = config.clientId;
    const response = await apiClient.post<{ recommendations: Record<string, unknown>[] }>(
      `/api/scorecard/clients/${clientId}/student/ai-recommendations/refresh/`
    );
    return (response.data.recommendations ?? []).map(mapAIRecommendationFromApi);
  },

  dismissAIRecommendation: async (recId: number): Promise<AIRecommendation> => {
    const clientId = config.clientId;
    const response = await apiClient.post<Record<string, unknown>>(
      `/api/scorecard/clients/${clientId}/student/ai-recommendations/${recId}/dismiss/`
    );
    return mapAIRecommendationFromApi(response.data);
  },

  completeAIRecommendation: async (recId: number): Promise<AIRecommendation> => {
    const clientId = config.clientId;
    const response = await apiClient.post<Record<string, unknown>>(
      `/api/scorecard/clients/${clientId}/student/ai-recommendations/${recId}/complete/`
    );
    return mapAIRecommendationFromApi(response.data);
  },

  getGoals: async (): Promise<Goals> => {
    const clientId = config.clientId;
    const res = await apiClient.get<Record<string, unknown>>(
      `/api/scorecard/clients/${clientId}/student/goals/`
    );
    return mapGoalsFromApi(res.data);
  },

  setGoals: async (input: { targetMinutes?: number; targetContentCount?: number }): Promise<Goals> => {
    const clientId = config.clientId;
    const body: Record<string, number> = {};
    if (typeof input.targetMinutes === "number") body.target_minutes = input.targetMinutes;
    if (typeof input.targetContentCount === "number") body.target_content_count = input.targetContentCount;
    const res = await apiClient.post<Record<string, unknown>>(
      `/api/scorecard/clients/${clientId}/student/goals/`,
      body,
    );
    return mapGoalsFromApi(res.data);
  },

  getStreak: async (): Promise<StreakSnapshot> => {
    const clientId = config.clientId;
    const res = await apiClient.get<Record<string, unknown>>(
      `/api/scorecard/clients/${clientId}/student/streak/`
    );
    return mapStreakFromApi(res.data);
  },

  useStreakFreeze: async (): Promise<StreakSnapshot> => {
    const clientId = config.clientId;
    const res = await apiClient.post<Record<string, unknown>>(
      `/api/scorecard/clients/${clientId}/student/streak/freeze/`
    );
    return mapStreakFromApi(res.data);
  },

  getBadges: async (): Promise<Badges> => {
    const clientId = config.clientId;
    const res = await apiClient.get<Record<string, unknown>>(
      `/api/scorecard/clients/${clientId}/student/badges/`
    );
    return mapBadgesFromApi(res.data);
  },

  markBadgeSeen: async (awardId: number): Promise<void> => {
    const clientId = config.clientId;
    await apiClient.post(
      `/api/scorecard/clients/${clientId}/student/badges/${awardId}/seen/`
    );
  },

  listShareLinks: async (): Promise<Array<{ id: number; slug: string; url: string; createdAt?: string; viewCount: number; lastViewedAt?: string }>> => {
    const clientId = config.clientId;
    const res = await apiClient.get<{ shares: Array<Record<string, unknown>> }>(
      `/api/scorecard/clients/${clientId}/student/share/`
    );
    return (res.data.shares ?? []).map((s) => ({
      id: Number(s.id),
      slug: String(s.slug),
      url: String(s.url),
      createdAt: typeof s.created_at === "string" ? s.created_at : undefined,
      viewCount: Number(s.view_count ?? 0),
      lastViewedAt: typeof s.last_viewed_at === "string" ? s.last_viewed_at : undefined,
    }));
  },

  createShareLink: async (): Promise<{ id: number; slug: string; url: string }> => {
    const clientId = config.clientId;
    const res = await apiClient.post<Record<string, unknown>>(
      `/api/scorecard/clients/${clientId}/student/share/`
    );
    return {
      id: Number(res.data.id),
      slug: String(res.data.slug),
      url: String(res.data.url),
    };
  },

  revokeShareLinks: async (): Promise<void> => {
    const clientId = config.clientId;
    await apiClient.delete(`/api/scorecard/clients/${clientId}/student/share/`);
  },

  getPublicScorecard: async (slug: string): Promise<Record<string, unknown>> => {
    const res = await apiClient.get<Record<string, unknown>>(
      `/api/scorecard/share/${slug}/`
    );
    return res.data;
  },

  exportScorecardPdfCertificate: async (): Promise<Blob> => {
    const clientId = config.clientId;
    const response = await apiClient.get(
      `/api/scorecard/clients/${clientId}/student/scorecard/export/pdf/?template=certificate`,
      { responseType: "blob" },
    );
    return response.data as Blob;
  },

  getPeerPercentile: async (): Promise<PeerPercentile> => {
    const clientId = config.clientId;
    const res = await apiClient.get<Record<string, unknown>>(
      `/api/scorecard/clients/${clientId}/student/peer-percentile/`
    );
    return mapPeerPercentileFromApi(res.data);
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
