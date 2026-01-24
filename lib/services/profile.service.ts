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

export interface Skill {
  id?: string;
  name: string;
}

export interface Project {
  id?: string;
  name: string;
  description: string;
  technologies: string[];
  url?: string;
  start_date?: string;
  end_date?: string;
  current?: boolean;
}

export interface Experience {
  id?: string;
  company: string;
  position: string;
  location?: string;
  start_date: string;
  end_date?: string;
  current: boolean;
  description?: string;
}

export interface Education {
  id?: string;
  institution: string;
  degree: string;
  field_of_study?: string;
  start_date?: string;
  end_date?: string;
  gpa?: string;
  description?: string;
}

export interface Certification {
  id?: string;
  name: string;
  issuing_organization: string;
  issue_date: string;
  expiration_date?: string;
  credential_id?: string;
  credential_url?: string;
}

export interface Achievement {
  id?: string;
  title: string;
  description?: string;
  date?: string;
  organization?: string;
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
  headline?: string;
  cover_photo_url?: string;
  // Education fields
  college_name?: string;
  degree_type?: string; // B.Tech, BCA, B.Sc, MCA, M.Tech, Other
  branch?: string;
  graduation_year?: string;
  // Location
  city?: string;
  state?: string;
  // External profiles
  portfolio_website_url?: string;
  leetcode_url?: string;
  hackerrank_url?: string;
  kaggle_url?: string;
  medium_url?: string;
  // Arrays
  skills?: Skill[];
  projects?: Project[];
  experience?: Experience[];
  education?: Education[];
  certifications?: Certification[];
  achievements?: Achievement[];
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
  // New format support
  name?: string;
  progress?: {
    hours: number;
    minutes: number;
  };
  seconds?: number;
  profile_pic_url?: string;
  college?: string; // College/University name
  linkedin_url?: string; // LinkedIn profile URL
}

export interface MonthlyStreak {
  year?: number;
  month?: number;
  streak?: { [date: string]: boolean }; // Object with date keys (YYYY-MM-DD) and boolean values
  current_streak: number;
  longest_streak?: number;
  monthly_days?: number[]; // Array of day numbers with activity (deprecated, use streak object)
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

  // Upload cover photo
  uploadCoverPhoto: async (file: File): Promise<{ cover_photo_url: string }> => {
    const formData = new FormData();
    formData.append("cover_photo", file);
    
    const response = await apiClient.post<{ cover_photo_url: string }>(
      `/accounts/clients/${config.clientId}/user-profile/cover-photo/`,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );
    return response.data;
  },

  // Upload profile picture
  uploadProfilePicture: async (file: File): Promise<{ profile_picture: string }> => {
    const formData = new FormData();
    formData.append("profile_picture", file);
    
    const response = await apiClient.post<{ profile_picture: string }>(
      `/accounts/clients/${config.clientId}/user-profile/profile-picture/`,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
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

    const response = await apiClient.get<any>(url);
    
    // Handle different response formats
    let leaderboardData: any[] = [];
    
    // Format 1: { date, leaderboard: [...] }
    if (response.data?.leaderboard && Array.isArray(response.data.leaderboard)) {
      leaderboardData = response.data.leaderboard;
    }
    // Format 2: Direct array
    else if (Array.isArray(response.data)) {
      leaderboardData = response.data;
    }
    // Format 3: { results: [...] }
    else if (response.data?.results && Array.isArray(response.data.results)) {
      leaderboardData = response.data.results;
    }
    
    // Map to unified format
    return leaderboardData.map((entry, index) => {
      // New format: { name, progress: { hours, minutes }, seconds, profile_pic_url? }
      if (entry?.name && entry?.progress) {
        return {
          user: {
            id: entry?.user?.id ?? 0,
            user_name: entry.name,
            profile_pic_url: entry?.profile_pic_url ?? entry?.user?.profile_pic_url ?? "",
          },
          score: entry.seconds ?? 0, // Use seconds as score for sorting
          rank: index + 1,
          name: entry.name,
          progress: entry.progress,
          seconds: entry.seconds,
          profile_pic_url: entry?.profile_pic_url ?? "",
        };
      }
      // Old format: { user: { user_name }, score, rank }
      return {
        user: {
          id: entry?.user?.id ?? 0,
          user_name: entry?.user?.user_name ?? "Unknown User",
          profile_pic_url: entry?.user?.profile_pic_url ?? "",
        },
        score: entry?.score ?? 0,
        rank: entry?.rank ?? index + 1,
      };
    });
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
