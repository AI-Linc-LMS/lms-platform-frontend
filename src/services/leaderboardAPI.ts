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

export const getDailyLeaderboard = async (
  clientId: number
): Promise<LeaderboardData[]> => {
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
    
    // Ensure we return an array even if the API returns null or undefined
    if (!res.data) {
      console.warn("API returned null or undefined data");
      return [];
    }
    
    // If the API returns an object instead of an array, try to extract the array
    if (typeof res.data === 'object' && !Array.isArray(res.data)) {
      console.log("API returned an object, checking for array property");
      
      // Check if there's a property that might contain the array
      const possibleArrayProps = ['results', 'data', 'leaderboard', 'items'];
      
      for (const prop of possibleArrayProps) {
        if (Array.isArray(res.data[prop])) {
          console.log(`Found array in property: ${prop}`);
          return res.data[prop];
        }
      }
      
      // If we couldn't find an array property, return empty array
      console.warn("Could not find array in API response");
      return [];
    }
    
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