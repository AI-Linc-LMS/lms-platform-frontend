import { useEffect, useState, useRef } from "react";
import {
  profileService,
  DailyProgressLeaderboardEntry,
  MonthlyStreak,
} from "@/lib/services/profile.service";

// Shared cache to minimize API calls across the app
interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Module-level cache shared across all hook instances
let leaderboardCache: CacheEntry<DailyProgressLeaderboardEntry[]> | null = null;
let streakCache: CacheEntry<MonthlyStreak> | null = null;

export const invalidateStreakCache = () => {
  streakCache = null;
};

export const useLeaderboardAndStreak = () => {
  const [leaderboard, setLeaderboard] = useState<
    DailyProgressLeaderboardEntry[]
  >([]);
  const [streak, setStreak] = useState<MonthlyStreak | null>(null);
  const [isLeaderboardLoading, setIsLeaderboardLoading] = useState(true);
  const [isStreakLoading, setIsStreakLoading] = useState(true);
  const [leaderboardError, setLeaderboardError] = useState<string | null>(null);
  const [streakError, setStreakError] = useState<string | null>(null);
  const hasLoadedRef = useRef(false);

  useEffect(() => {
    if (hasLoadedRef.current) return;
    hasLoadedRef.current = true;

    // Use module-level cache to share across all hook instances
    const now = Date.now();
    const cachedLeaderboard = leaderboardCache?.data;
    const cachedStreak = streakCache?.data;
    const leaderboardCacheTime = leaderboardCache?.timestamp || 0;
    const streakCacheTime = streakCache?.timestamp || 0;

    // Check if cached data is still valid
    if (cachedLeaderboard && now - leaderboardCacheTime < CACHE_DURATION) {
      setLeaderboard(cachedLeaderboard);
      setIsLeaderboardLoading(false);
    } else {
      loadLeaderboard();
    }

    if (cachedStreak && now - streakCacheTime < CACHE_DURATION) {
      setStreak(cachedStreak);
      setIsStreakLoading(false);
    } else {
      loadStreak();
    }
  }, []);

  const loadLeaderboard = async () => {
    try {
      setIsLeaderboardLoading(true);
      setLeaderboardError(null);
      const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
      const data = await profileService.getDailyProgressLeaderboard(today);

      // Update cache
      leaderboardCache = {
        data,
        timestamp: Date.now(),
      };

      setLeaderboard(data || []);
    } catch (error: any) {
      const errorMessage =
        error?.response?.data?.detail ||
        error?.message ||
        "Failed to load leaderboard";
      setLeaderboardError(errorMessage);
      setLeaderboard([]);
    } finally {
      setIsLeaderboardLoading(false);
    }
  };

  const loadStreak = async () => {
    try {
      setIsStreakLoading(true);
      setStreakError(null);
      const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
      const data = await profileService.getMonthlyStreak(currentMonth);

      // Update cache
      streakCache = {
        data,
        timestamp: Date.now(),
      };

      setStreak(data);
    } catch (error: any) {
      const errorMessage =
        error?.response?.data?.detail ||
        error?.message ||
        "Failed to load streak";
      setStreakError(errorMessage);
      setStreak(null);
    } finally {
      setIsStreakLoading(false);
    }
  };

  return {
    leaderboard,
    streak,
    isLeaderboardLoading,
    isStreakLoading,
    leaderboardError,
    streakError,
    refreshLeaderboard: loadLeaderboard,
    refreshStreak: async () => {
      invalidateStreakCache();
      await loadStreak();
    },
  };
};
