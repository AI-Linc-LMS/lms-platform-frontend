import { useCallback, useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { useQuery } from "@tanstack/react-query";
import { RootState } from "../redux/store";
import { getMonthlyStreak } from "../services/activityTrackingApi";

/**
 * Determines whether to show the streak congratulations modal for today,
 * and ensures it only shows once per day per user via localStorage gating.
 * Uses useQuery for automatic refetching capability.
 */
export function useMonthlyStreakCongrats() {
  const user = useSelector((state: RootState) => state.user);
  const clientInfo = useSelector((state: RootState) => state.clientInfo);

  const [shouldShow, setShouldShow] = useState(false);
  const [currentStreak, setCurrentStreak] = useState<number>(0);
  const [completionDate, setCompletionDate] = useState<string | null>(null);

  const todayKey = useMemo(() => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }, []);

  const storageKey = useMemo(() => {
    const userId = user?.id ?? "anonymous";
    return `streakCongratsShown:${userId}:${todayKey}`;
  }, [todayKey, user?.id]);

  const clientId =
    clientInfo?.data?.id ?? Number(import.meta.env.VITE_CLIENT_ID);

  // Use useQuery for automatic refetching capability
  const {
    data: streakData,
    isLoading: loading,
    error: queryError,
    refetch,
  } = useQuery({
    queryKey: ["monthlyStreak", clientId],
    queryFn: () => getMonthlyStreak(Number(clientId)),
    enabled: !!clientId,
    staleTime: 0, // Always refetch to get latest streak data
    gcTime: 0, // Don't cache to ensure fresh data
  });

  // Automatically re-evaluate shouldShow whenever query data changes
  useEffect(() => {
    if (!streakData) {
      setShouldShow(false);
      setCurrentStreak(0);
      return;
    }

    setCurrentStreak(streakData.current_streak ?? 0);
    const didCompleteToday = Boolean(streakData.streak?.[todayKey]);
    const alreadyShown = localStorage.getItem(storageKey) === "1";

    if (didCompleteToday && !alreadyShown) {
      setCompletionDate(todayKey);
      setShouldShow(true);
    } else {
      setShouldShow(false);
    }
  }, [streakData, todayKey, storageKey]);

  const markShown = useCallback(() => {
    try {
      localStorage.setItem(storageKey, "1");
    } catch {
      // ignore storage failures
    }
    setShouldShow(false);
  }, [storageKey]);

  const error = queryError
    ? (queryError as Error)?.message || "Failed to load monthly streak"
    : null;

  return {
    shouldShow,
    markShown,
    currentStreak,
    completionDate,
    loading,
    error,
    refetch, // Expose refetch function for manual triggering after content completion
  };
}


