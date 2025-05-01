import axiosInstance from "./axiosInstance";

export interface LeaderboardData {
  id: number;
  name: string;
  progress: {
    hours: number;
    minutes: number;
  };
  // Add other fields as per your API response
}

export interface DailyTimeSpentData {
  timespent: number;
  units: string;
}
export interface LeaderboardItem {
  name: string;
  rank: number;
  course_name: string;
  marks: number;
}

export interface DailyLeaderboardResponse {
  leaderboard: LeaderboardData[];
}

export interface StreakData {
  month: number;
  year: number;
  streak: Record<string, boolean>;
}

// Daily Progress Leaderboard
export const getDailyLeaderboard = async (
  clientId: number
): Promise<DailyLeaderboardResponse> => {
  try {
    console.log(`Fetching leaderboard for client ID: ${clientId}`);

    const res = await axiosInstance.get(
      `/api/clients/${clientId}/student/daily-progress-leaderboard/`,
      {
        headers: {
          accept: "application/json",
        },
      }
    );

    console.log("Leaderboard API response:", res.data);
    return res.data;
  } catch (error: any) {
    // Log the full error for debugging
    console.error("Failed to fetch leaderboard:", error);
    console.error("Error details:", {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
    });

    // You can throw a custom error if you want
    throw new Error(
      error?.response?.data?.detail ||
      error?.message ||
      "Failed to fetch leaderboard"
    );
  }
};

// User Activity Heatmap
export const getUserActivityHeatmapData = async (clientId: number) => {
  try {
    const res = await axiosInstance.get(`/api/clients/${clientId}/student/user-activity-heatmap/`);

    console.log("User activity heatmap API response:", res.data);
    return res.data;
  } catch (error: any) {
    console.error("Failed to fetch user activity heatmap:", error);
    console.error("Error details:", {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
    });

    // You can throw a custom error if you want
    throw new Error(
      error?.response?.data?.detail ||
      error?.message ||
      "Failed to fetch user activity heatmap"
    );
  }
}


// User Daily Time Spent
export const getUserDailyTimeSpentData = async (clientId: number = 1) => {
  try {
    const res = await axiosInstance.get(`/api/clients/${clientId}/student/user-daily-time-spent/`);

    console.log("User daily time spent API response:", res.data);
    return res.data;
  } catch (error: any) {
    // Log the error details
    console.error("Failed to fetch user daily time spent:", error);
    console.error("Error details:", {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
    });

    // You can throw a custom error if you want
    throw new Error(
      error?.response?.data?.detail ||
      error?.message ||
      "Failed to fetch user daily time spent"
    );
  }
};


// Overall Leaderboard
export const getLeaderboardData = async (clientId: number = 1): Promise<LeaderboardItem[]> => {
  try {
    const res = await axiosInstance.get(`/api/clients/${clientId}/overall-leaderboard/`);

    console.log("Leaderboard API response:", res.data);
    return res.data;
  } catch (error: any) {
    // Log the error details
    console.error("Failed to fetch leaderboard:", error);
    console.error("Error details:", {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
    });

    // You can throw a custom error if you want
    throw new Error(
      error?.response?.data?.detail ||
      error?.message ||
      "Failed to fetch leaderboard"
    );
  }
};

// Streak Table
export const getStreakTableData = async (clientId: number = 1): Promise<StreakData> => {
  try {
    const res = await axiosInstance.get(`/api/clients/${clientId}/student/monthly-streak/`);

    console.log("Streak table API response:", res.data);
    return res.data;
  } catch (error: any) {
    // Log the error details
    console.error("Failed to fetch streak table:", error);
    console.error("Error details:", {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
    });

    // You can throw a custom error if you want
    throw new Error(
      error?.response?.data?.detail ||
      error?.message ||
      "Failed to fetch streak table"
    );
  }
};
