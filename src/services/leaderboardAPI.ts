import axiosInstance from "./axiosInstance";

export interface LeaderboardData {
  id: number;
  name: string;
  progress: number;
  // Add other fields as per your API response
}

export const getDailyLeaderboard = async (
  clientId: number,
  csrfToken: string
): Promise<LeaderboardData[]> => {
  try {
    const res = await axiosInstance.get(
      `/api/clients/${clientId}/student/daily-progress-leaderboard/`,
      {
        headers: {
          accept: "application/json",
          "X-CSRFTOKEN": csrfToken,
        },
      }
    );
    console.log(res.data);
    return res.data;
  } catch (error: any) {
    // Optional: log or transform the error
    console.error("Failed to fetch leaderboard:", error);
    // You can throw a custom error if you want
    throw new Error(
      error?.response?.data?.detail ||
      error?.message ||
      "Failed to fetch leaderboard"
    );
  }
}; 