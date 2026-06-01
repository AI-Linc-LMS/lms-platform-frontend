import apiClient from "./api";
import { config } from "@/lib/config";
import { profileService } from "./profile.service";
import { scorecardFromApiPayload, type ScorecardApiPayload } from "./scorecard/build-scorecard";

// Response cache for the umbrella + dashboard scorecard endpoints. Same TTL as
// the backend's view-level cache so a learner can navigate dashboard ↔ full
// scorecard and back without re-fetching, and React StrictMode's double-mount
// in dev doesn't fire twice. Stored in memory for instant hits and mirrored
// to sessionStorage so the cache survives a single tab's reloads (but not a
// re-login — it's tab-scoped, not localStorage).
const SCORECARD_CACHE_TTL_MS = 90 * 1000;
const SCORECARD_CACHE_PREFIX = "scorecard-cache:";
const scorecardMemoryCache = new Map<string, { ts: number; data: ScorecardApiPayload }>();

function readScorecardCache(url: string): ScorecardApiPayload | null {
  const mem = scorecardMemoryCache.get(url);
  if (mem && Date.now() - mem.ts < SCORECARD_CACHE_TTL_MS) {
    return mem.data;
  }
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(`${SCORECARD_CACHE_PREFIX}${url}`);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { ts: number; data: ScorecardApiPayload };
    if (parsed?.ts && Date.now() - parsed.ts < SCORECARD_CACHE_TTL_MS) {
      scorecardMemoryCache.set(url, parsed);
      return parsed.data;
    }
  } catch {
    /* corrupted entry / quota / privacy mode — ignore */
  }
  return null;
}

function writeScorecardCache(url: string, data: ScorecardApiPayload): void {
  const entry = { ts: Date.now(), data };
  scorecardMemoryCache.set(url, entry);
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(`${SCORECARD_CACHE_PREFIX}${url}`, JSON.stringify(entry));
  } catch {
    /* quota exceeded — fine, memory cache still works */
  }
}

/** Drop every cached scorecard payload. Call after actions that meaningfully
 *  change the scorecard (e.g. finishing an assessment) so the next load
 *  reflects fresh data instead of waiting out the TTL.
 */
export function invalidateScorecardCache(): void {
  scorecardMemoryCache.clear();
  if (typeof window === "undefined") return;
  try {
    const keysToRemove: string[] = [];
    for (let i = 0; i < window.sessionStorage.length; i++) {
      const k = window.sessionStorage.key(i);
      if (k && k.startsWith(SCORECARD_CACHE_PREFIX)) keysToRemove.push(k);
    }
    for (const k of keysToRemove) window.sessionStorage.removeItem(k);
  } catch {
    /* ignore */
  }
}

async function fetchScorecardPayload(url: string): Promise<ScorecardApiPayload> {
  const cached = readScorecardCache(url);
  if (cached) return cached;
  const response = await apiClient.get<ScorecardApiPayload>(url);
  writeScorecardCache(url, response.data);
  return response.data;
}
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
    const url = `/api/scorecard/clients/${clientId}/student/scorecard/`;
    const data = await fetchScorecardPayload(url);
    const result = scorecardFromApiPayload(data);
    return await mergeProfilePicture(result);
  },

  /** Lightweight payload used by the dashboard widget — overview + learning
   *  consumption only. Hits the dedicated /dashboard/ endpoint so the backend
   *  skips the 10+ heavy section builders (skills, weak areas, comparative
   *  insights, behavioral metrics, etc.) that the full /scorecard/ endpoint
   *  runs. The frontend mapper handles the missing sections gracefully.
   */
  getDashboardScorecardData: async () => {
    const clientId = config.clientId;
    const url = `/api/scorecard/clients/${clientId}/student/scorecard/dashboard/`;
    const data = await fetchScorecardPayload(url);
    const result = scorecardFromApiPayload(data);
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
    const fullData = await scorecardService.getDashboardScorecardData();
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
