import apiClient from "./api";
import { config } from "../config";

interface RawDailyLeaderboardEntry {
  user?: { id?: number; user_name?: string; profile_pic_url?: string };
  name?: string;
  profile_pic_url?: string;
  score?: number;
  rank?: number;
}

interface RawOverallLeaderboardEntry {
  id?: number;
  user?: { id?: number; name?: string; email?: string; profile_pic_url?: string; user_name?: string };
  name?: string;
  full_name?: string;
  marks?: number;
  score?: number;
  rank?: number;
  course_name?: unknown;
  profile_pic_url?: string;
  college?: string;
  college_name?: string;
  university?: string;
  linkedin_url?: string;
  linkedin_profile_url?: string;
  social_links?: { linkedin?: string };
  email?: string;
  user_name?: string;
  username?: string;
}

export interface DailyProgressLeaderboardEntry {
  user: {
    id?: number;
    user_name?: string;
    profile_pic_url?: string;
  };
  score?: number;
  rank?: number;
  college?: string;
  linkedin_url?: string;
}

export interface MonthlyStreak {
  year?: number;
  month?: number;
  streak?: { [date: string]: boolean };
  current_streak: number;
  longest_streak?: number;
  monthly_days?: number[];
}

export interface OverallLeaderboardEntry {
  id?: number;
  name: string;
  marks: number;
  course_name?: number;
  rank?: number;
  profile_pic_url?: string;
  college?: string;
  linkedin_url?: string;
  email?: string;
  user_name?: string;
}

export const dashboardService = {
  getDailyProgressLeaderboard: async (): Promise<
    DailyProgressLeaderboardEntry[]
  > => {
    try {
      const response = await apiClient.get(
        `/api/clients/${config.clientId}/student/daily-progress-leaderboard/`
      );

      let leaderboardData: unknown[] = [];

      if (Array.isArray(response.data)) {
        leaderboardData = response.data;
      } else if (
        response.data?.results &&
        Array.isArray(response.data.results)
      ) {
        leaderboardData = response.data.results;
      } else if (response.data?.data && Array.isArray(response.data.data)) {
        leaderboardData = response.data.data;
      } else if (
        response.data?.leaderboard &&
        Array.isArray(response.data.leaderboard)
      ) {
        leaderboardData = response.data.leaderboard;
      } else if (
        response.data?.entries &&
        Array.isArray(response.data.entries)
      ) {
        leaderboardData = response.data.entries;
      } else if (
        response.data &&
        typeof response.data === "object" &&
        !Array.isArray(response.data)
      ) {
        const keys = Object.keys(response.data);
        for (const key of keys) {
          if (Array.isArray(response.data[key])) {
            leaderboardData = response.data[key];
            break;
          }
        }
      }

      const validatedData = (leaderboardData as RawDailyLeaderboardEntry[])
        .filter((entry): entry is RawDailyLeaderboardEntry => entry != null)
        .map((entry) => ({
          user: {
            id: entry?.user?.id ?? 0,
            user_name: entry?.user?.user_name ?? entry?.name ?? "Unknown User",
            profile_pic_url:
              entry?.user?.profile_pic_url ?? entry?.profile_pic_url ?? "",
          },
          score: entry?.score ?? 0,
          rank: entry?.rank ?? 0,
        }));

      return validatedData;
    } catch {
      return [];
    }
  },

  getMonthlyStreak: async (month?: string): Promise<MonthlyStreak> => {
    try {
      const params = month ? { month } : {};
      const response = await apiClient.get(
        `/api/clients/${config.clientId}/student/monthly-streak/`,
        { params }
      );

      const data = response.data?.data || response.data || {};

      return {
        year: data.year,
        month: data.month,
        streak: data.streak || {},
        current_streak: data.current_streak || 0,
        longest_streak: data.longest_streak || 0,
        monthly_days: Array.isArray(data.monthly_days) ? data.monthly_days : [],
      };
    } catch {
      return {
        current_streak: 0,
        longest_streak: 0,
        streak: {},
        monthly_days: [],
      };
    }
  },

  getStudentActivityAnalytics: async (params?: {
    start_date?: string;
    end_date?: string;
  }): Promise<Array<{
    studentName: string;
    Present_streak: number;
    Active_days: number;
    profile_pic_url?: string;
  }>> => {
    try {
      const queryParams = new URLSearchParams();
      if (params?.start_date) queryParams.append("start_date", params.start_date);
      if (params?.end_date) queryParams.append("end_date", params.end_date);

      const queryString = queryParams.toString();
      const url = `/admin-dashboard/api/clients/${config.clientId}/student-activity-analytics/${queryString ? `?${queryString}` : ""}`;

      const response = await apiClient.get<Array<{
        studentName: string;
        Present_streak: number;
        Active_days: number;
        profile_pic_url?: string;
      }>>(url);

      const data = Array.isArray(response.data) ? response.data : [];
      return data.map((entry) => ({
        studentName: entry?.studentName ?? "",
        Present_streak: entry?.Present_streak ?? 0,
        Active_days: entry?.Active_days ?? 0,
        profile_pic_url: entry?.profile_pic_url ?? "",
      }));
    } catch {
      return [];
    }
  },

  getOverallLeaderboard: async (
    limit?: number
  ): Promise<OverallLeaderboardEntry[]> => {
    try {
      const params = limit ? { limit } : {};
      const response = await apiClient.get(
        `/api/clients/${config.clientId}/overall-leaderboard/`,
        { params }
      );

      let leaderboardData: unknown[] = [];

      if (Array.isArray(response.data)) {
        leaderboardData = response.data;
      } else if (
        response.data?.results &&
        Array.isArray(response.data.results)
      ) {
        leaderboardData = response.data.results;
      } else if (response.data?.data && Array.isArray(response.data.data)) {
        leaderboardData = response.data.data;
      } else if (
        response.data?.leaderboard &&
        Array.isArray(response.data.leaderboard)
      ) {
        leaderboardData = response.data.leaderboard;
      } else if (
        response.data?.entries &&
        Array.isArray(response.data.entries)
      ) {
        leaderboardData = response.data.entries;
      } else if (
        response.data &&
        typeof response.data === "object" &&
        !Array.isArray(response.data)
      ) {
        const keys = Object.keys(response.data);
        for (const key of keys) {
          if (Array.isArray(response.data[key])) {
            leaderboardData = response.data[key];
            break;
          }
        }
      }

      const validatedData = (leaderboardData as RawOverallLeaderboardEntry[])
        .filter((entry): entry is RawOverallLeaderboardEntry => entry != null)
        .map((entry) => {
          const id = entry?.id ?? entry?.user?.id ?? undefined;
          const email = entry?.email ?? entry?.user?.email ?? undefined;
          const name =
            entry?.name ??
            entry?.full_name ??
            entry?.user?.name ??
            email ??
            (id != null ? `User #${id}` : "User");
          return {
            id,
            name,
            marks: entry?.marks ?? entry?.score ?? 0,
            course_name: entry?.course_name ?? " Course",
            rank: entry?.rank ?? 0,
            profile_pic_url: entry?.profile_pic_url ?? entry?.user?.profile_pic_url ?? "",
            college: entry?.college ?? entry?.college_name ?? entry?.university ?? undefined,
            linkedin_url: entry?.linkedin_url ?? entry?.linkedin_profile_url ?? entry?.social_links?.linkedin ?? undefined,
            email,
            user_name: entry?.user_name ?? entry?.username ?? entry?.user?.user_name ?? undefined,
          } as OverallLeaderboardEntry;
        });

      return validatedData;
    } catch {
      return [];
    }
  },
};
