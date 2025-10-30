import { useState, useEffect, useCallback } from "react";

const STORAGE_KEY = "streak_congratulated_date";

/**
 * Hook to manage streak congratulations modal
 * Shows congratulations only once per day when streak is updated
 */
export const useStreakCongratulations = (currentStreak: number | undefined) => {
  const [showCongratulations, setShowCongratulations] = useState(false);
  const [previousStreak, setPreviousStreak] = useState<number | null>(null);

  // Check if we've already shown congratulations today
  const hasShownTodaysCongratulations = useCallback(() => {
    const lastDate = localStorage.getItem(STORAGE_KEY);
    const today = new Date().toDateString();
    return lastDate === today;
  }, []);

  // Mark that we've shown congratulations today
  const markCongratulationsShown = useCallback(() => {
    const today = new Date().toDateString();
    localStorage.setItem(STORAGE_KEY, today);
  }, []);

  // Check if streak increased and we haven't shown congratulations today
  useEffect(() => {
    if (currentStreak !== undefined) {
      // If this is the first time we're seeing the streak, just store it
      if (previousStreak === null) {
        setPreviousStreak(currentStreak);
        return;
      }

      // If streak increased and we haven't shown congratulations today
      if (
        currentStreak > previousStreak &&
        !hasShownTodaysCongratulations()
      ) {
        setShowCongratulations(true);
        markCongratulationsShown();
      }

      // Update previous streak
      setPreviousStreak(currentStreak);
    }
  }, [currentStreak, previousStreak, hasShownTodaysCongratulations, markCongratulationsShown]);

  const handleClose = useCallback(() => {
    setShowCongratulations(false);
  }, []);

  return {
    showCongratulations,
    handleClose,
  };
};
