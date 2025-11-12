import { useCallback, useEffect, useMemo, useState } from "react";
import type { StreakData } from "../services/dashboardApis";

const STORAGE_KEY_PREFIX = "streak_congratulated_date";

const getLocalDateString = (date: Date) => {
  const offsetMs = date.getTimezoneOffset() * 60 * 1000;
  const localTime = new Date(date.getTime() - offsetMs);
  return localTime.toISOString().split("T")[0];
};

interface UseStreakCongratulationsOptions {
  streakData?: StreakData;
  userId?: number | string | null;
}

/**
 * Hook to manage streak congratulations modal.
 * Shows congratulations only once per user per day when streak is updated.
 */
export const useStreakCongratulations = ({
  streakData,
  userId,
}: UseStreakCongratulationsOptions) => {
  const [showCongratulations, setShowCongratulations] = useState(false);

  const storageKey = useMemo(() => {
    return `${STORAGE_KEY_PREFIX}_${userId ?? "anonymous"}`;
  }, [userId]);

  const latestCompletionDate = useMemo(() => {
    if (!streakData?.streak) return null;

    const completedDates = Object.entries(streakData.streak)
      .filter(([, completed]) => completed)
      .map(([date]) => date)
      .sort();

    return completedDates[completedDates.length - 1] ?? null;
  }, [streakData?.streak]);

  const today = useMemo(() => getLocalDateString(new Date()), []);

  useEffect(() => {
    if (!streakData?.current_streak || !latestCompletionDate) {
      return;
    }

    const lastCelebratedDate = localStorage.getItem(storageKey);

    // Only celebrate when the latest completion is for today and we haven't celebrated it yet
    if (
      latestCompletionDate === today &&
      lastCelebratedDate !== latestCompletionDate
    ) {
      setShowCongratulations(true);
      localStorage.setItem(storageKey, latestCompletionDate);
    }

    // Ensure we do not re-show for previous days
    if (!showCongratulations && lastCelebratedDate === null) {
      localStorage.setItem(storageKey, latestCompletionDate);
    }
  }, [
    latestCompletionDate,
    storageKey,
    streakData?.current_streak,
    today,
    showCongratulations,
  ]);

  const handleClose = useCallback(() => {
    setShowCongratulations(false);
  }, []);

  return {
    showCongratulations,
    handleClose,
    latestCompletionDate,
  };
};
