import apiClient from "./api";
import { config } from "../config";

export interface ActivityTypeCount {
  Quiz: number;
  Article: number;
  Assignment: number;
  CodingProblem: number;
  DevCodingProblem: number;
  VideoTutorial: number;
  total: number;
}

export interface HeatmapData {
  [key: string]: ActivityTypeCount;
}

export interface UserProfile {
  first_name: string;
  last_name: string;
  email: string;
  username: string;
  profile_picture: string;
  phone_number: string;
  bio: string;
  social_links: {
    github: string;
    linkedin: string;
  };
  date_of_birth: string | null;
  role?: string;
}

export interface UserActivityHeatmap {
  heatmap_data: HeatmapData;
}

export interface DailyProgressLeaderboardEntry {
  user: {
    id: number;
    user_name: string;
    profile_pic_url: string;
  };
  score: number;
  rank: number;
}

export interface MonthlyStreak {
  current_streak: number;
  longest_streak: number;
  monthly_days: number[];
}

export const profileService = {
  // Get user profile
  getUserProfile: async (): Promise<UserProfile> => {
    const response = await apiClient.get<UserProfile>(
      `/accounts/clients/${config.clientId}/user-profile/`
    );
    return response.data;
  },

  // Update user profile
  updateUserProfile: async (
    data: Partial<UserProfile>
  ): Promise<UserProfile> => {
    const response = await apiClient.post<UserProfile>(
      `/accounts/clients/${config.clientId}/user-profile/`,
      data
    );
    return response.data;
  },

  // Get user activity heatmap
  getUserActivityHeatmap: async (
    startDate?: string,
    endDate?: string
  ): Promise<UserActivityHeatmap> => {
    let url = `/api/clients/${config.clientId}/student/user-activity-heatmap/`;
    const params = new URLSearchParams();

    if (startDate) params.append("start_date", startDate);
    if (endDate) params.append("end_date", endDate);

    if (params.toString()) {
      url += `?${params.toString()}`;
    }

    const response = await apiClient.get<UserActivityHeatmap>(url);
    return response.data;
  },

  // Get daily progress leaderboard
  getDailyProgressLeaderboard: async (
    date?: string
  ): Promise<DailyProgressLeaderboardEntry[]> => {
    let url = `/api/clients/${config.clientId}/student/daily-progress-leaderboard/`;
    const params = new URLSearchParams();

    if (date) params.append("date", date);

    if (params.toString()) {
      url += `?${params.toString()}`;
    }

    const response = await apiClient.get<DailyProgressLeaderboardEntry[]>(url);
    return response.data;
  },

  // Get monthly streak
  getMonthlyStreak: async (month?: string): Promise<MonthlyStreak> => {
    let url = `/api/clients/${config.clientId}/student/monthly-streak/`;
    const params = new URLSearchParams();

    if (month) params.append("month", month);

    if (params.toString()) {
      url += `?${params.toString()}`;
    }

    const response = await apiClient.get<MonthlyStreak>(url);
    return response.data;
  },
};
