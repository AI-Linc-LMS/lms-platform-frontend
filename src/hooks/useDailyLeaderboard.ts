import { useQuery } from "@tanstack/react-query";
import { getDailyLeaderboard, LeaderboardData } from "../services/leaderboardAPI";

const getCSRFToken = () =>
  document.cookie
    .split("; ")
    .find((row) => row.startsWith("csrftoken="))
    ?.split("=")[1] || "";

export const useDailyLeaderboard = (clientId: number) => {
  const csrfToken = getCSRFToken();

  return useQuery<LeaderboardData[], Error>({
    queryKey: ["dailyLeaderboard", clientId],
    queryFn: () => getDailyLeaderboard(clientId, csrfToken),
    enabled: !!clientId,
  });
}; 