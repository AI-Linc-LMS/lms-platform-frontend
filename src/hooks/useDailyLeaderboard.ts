import { useQuery } from "@tanstack/react-query";
import { getDailyLeaderboard, LeaderboardData } from "../services/leaderboardAPI";

export const useDailyLeaderboard = (clientId: number) => {
  return useQuery<LeaderboardData[], Error>({
    queryKey: ["dailyLeaderboard", clientId],
    queryFn: async () => {
      try {
        const data = await getDailyLeaderboard(clientId);
        // Ensure we always return an array
        return Array.isArray(data) ? data : [];
      } catch (error) {
        console.error("Error fetching leaderboard:", error);
        return []; // Return empty array on error
      }
    },
    enabled: !!clientId,
  });
}; 