import apiClient from "./api";
import { config } from "../config";

// Daily Progress Leaderboard Entry
export interface DailyProgressLeaderboardEntry {
  user: {
    id?: number;
    user_name?: string;
    profile_pic_url?: string;
  };
  score?: number;
  rank?: number;
}

// Monthly Streak
export interface MonthlyStreak {
  year?: number;
  month?: number;
  streak?: { [date: string]: boolean }; // Object with date keys (YYYY-MM-DD) and boolean values
  current_streak: number;
  longest_streak?: number;
  monthly_days?: number[]; // Array of day numbers with activity (deprecated, use streak object)
}

// Overall Leaderboard Entry
export interface OverallLeaderboardEntry {
  name: string;
  marks: number;
  course_name?: number;
  rank?: number;
  profile_pic_url?: string;
}

export const dashboardService = {
  // Get daily progress leaderboard
  getDailyProgressLeaderboard: async (): Promise<
    DailyProgressLeaderboardEntry[]
  > => {
    try {
      const response = await apiClient.get(
        `/api/clients/${config.clientId}/student/daily-progress-leaderboard/`
      );

      // Handle different response formats
      let leaderboardData: any[] = [];

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
        // If response.data is an object but not an array, try to find any array property
        const keys = Object.keys(response.data);
        for (const key of keys) {
          if (Array.isArray(response.data[key])) {
            leaderboardData = response.data[key];
            break;
          }
        }
      }

      // Validate and sanitize each entry
      const validatedData = leaderboardData
        .filter((entry) => entry != null) // Remove null/undefined entries
        .map((entry) => {
          // Handle different response formats:
          // Format 1: { user: { user_name, profile_pic_url }, score, rank }
          // Format 2: { name, profile_pic_url, progress, seconds }
          const userName =
            entry?.user?.user_name ?? entry?.name ?? "Unknown User";
          const profilePicUrl =
            entry?.user?.profile_pic_url ??
            entry?.profile_pic_url ??
            "";

          return {
            user: {
              id: entry?.user?.id ?? 0,
              user_name: userName,
              profile_pic_url: profilePicUrl,
            },
            score: entry?.score ?? 0,
            rank: entry?.rank ?? 0,
          };
        });

      return validatedData;
    } catch (error: any) {
      return [];
    }
  },

  // Get monthly streak
  getMonthlyStreak: async (month?: string): Promise<MonthlyStreak> => {
    try {
      const params = month ? { month } : {};
      const response = await apiClient.get(
        `/api/clients/${config.clientId}/student/monthly-streak/`,
        { params }
      );

      // Handle different response formats
      const data = response.data?.data || response.data || {};

      return {
        year: data.year,
        month: data.month,
        streak: data.streak || {},
        current_streak: data.current_streak || 0,
        longest_streak: data.longest_streak || 0,
        monthly_days: Array.isArray(data.monthly_days) ? data.monthly_days : [],
      };
    } catch (error: any) {
      return {
        current_streak: 0,
        longest_streak: 0,
        streak: {},
        monthly_days: [],
      };
    }
  },

  // Get student activity analytics (streak holders)
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

      // Map the response to ensure profile_pic_url is included
      const data = Array.isArray(response.data) ? response.data : [];
      return data.map((entry) => ({
        studentName: entry?.studentName ?? "",
        Present_streak: entry?.Present_streak ?? 0,
        Active_days: entry?.Active_days ?? 0,
        profile_pic_url: entry?.profile_pic_url ?? "",
      }));
    } catch (error: any) {
      return [];
    }
  },

  // Get overall leaderboard
  getOverallLeaderboard: async (
    limit?: number
  ): Promise<OverallLeaderboardEntry[]> => {
    try {
      const params = limit ? { limit } : {};
      const response = await apiClient.get(
        `/api/clients/${config.clientId}/overall-leaderboard/`,
        { params }
      );

      // Handle different response formats
      let leaderboardData: any[] = [];

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
        // If response.data is an object but not an array, try to find any array property
        const keys = Object.keys(response.data);
        for (const key of keys) {
          if (Array.isArray(response.data[key])) {
            leaderboardData = response.data[key];
            break;
          }
        }
      }

      // Validate and sanitize each entry
      const validatedData = leaderboardData
        .filter((entry) => entry != null) // Remove null/undefined entries
        .map((entry) => ({
          name: entry?.name ?? " User",
          marks: entry?.marks ?? entry?.score ?? 0,
          course_name: entry?.course_name ?? " Course",
          rank: entry?.rank ?? 0,
          profile_pic_url: entry?.profile_pic_url ?? entry?.user?.profile_pic_url ?? "",
        })) as OverallLeaderboardEntry[];

      return validatedData;
    } catch (error: any) {
      return [];
    }
  },
};
