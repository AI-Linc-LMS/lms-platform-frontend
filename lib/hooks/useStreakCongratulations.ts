"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { MonthlyStreak } from "@/lib/services/profile.service";

/**
 * Check if we should show the congratulations modal
 * Returns true if:
 * 1. Today's day is in the monthly_days array (user has activity today)
 * 2. We haven't shown the modal today yet
 * 3. The streak count is greater than 0
 */
export function useStreakCongratulations(
  streak: MonthlyStreak | null,
  isLoading: boolean = false,
  refreshStreak?: () => Promise<void>
) {
  const [showModal, setShowModal] = useState(false);
  const lastCheckedDateRef = useRef<string | null>(null);
  const previousStreakRef = useRef<number | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const checkStreak = useCallback(() => {
    // Don't check if still loading or no streak data
    if (isLoading || !streak) return;

    // Clear any existing timer
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    const today = new Date();
    const todayDay = today.getDate(); // Day of month (1-31)
    const todayDateKey = today.toISOString().split("T")[0]; // YYYY-MM-DD for localStorage

    // Reset check if it's a new day
    if (lastCheckedDateRef.current !== todayDateKey) {
      lastCheckedDateRef.current = todayDateKey;
      // Reset previous streak on new day to allow showing modal again
      previousStreakRef.current = null;
    }

    const currentStreak = streak.current_streak ?? 0;
    const previousStreak = previousStreakRef.current ?? 0;

    // Check if streak has increased
    const streakIncreased = currentStreak > previousStreak && currentStreak > 0;

    // Check if today has activity - support both new streak object format and old monthly_days array
    let hasActivityToday = false;
    if (streak.streak && Object.keys(streak.streak).length > 0) {
      // New format: check streak object with date keys (YYYY-MM-DD)
      const todayDateKey = today.toISOString().split("T")[0]; // YYYY-MM-DD
      hasActivityToday = streak.streak[todayDateKey] === true;
    } else {
      // Old format: check monthly_days array
      hasActivityToday = streak.monthly_days?.includes(todayDay) ?? false;
    }

    // Show modal if:
    // 1. Streak has increased (and is greater than 0)
    // 2. OR (for backward compatibility) user has activity today and streak > 0
    // 3. We haven't shown the modal today
    const shouldShow = (streakIncreased || (hasActivityToday && currentStreak > 0)) && currentStreak > 0;

    if (shouldShow) {
      // Check if we've already shown the modal today
      const lastShownDate = localStorage.getItem("streak_congrats_shown_date");
      const hasShownToday = lastShownDate === todayDateKey;

      if (!hasShownToday) {
        // Small delay to ensure smooth user experience
        timerRef.current = setTimeout(() => {
          setShowModal(true);
          localStorage.setItem("streak_congrats_shown_date", todayDateKey);
          timerRef.current = null;
        }, 1000); // Show after 1 second
      }
    }

    // Update previous streak reference for next check
    previousStreakRef.current = currentStreak;
  }, [streak, isLoading]);

  useEffect(() => {
    checkStreak();

    // Cleanup timer on unmount
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [checkStreak]);

  const handleClose = () => {
    setShowModal(false);
  };

  const triggerCheck = useCallback(async () => {
    // Refresh streak data first if refresh function is provided
    if (refreshStreak) {
      await refreshStreak();
      // Wait a bit for the streak data to update, then check
      setTimeout(() => {
        checkStreak();
      }, 500);
    } else {
      // If no refresh function, check immediately
      checkStreak();
    }
  }, [refreshStreak, checkStreak]);

  return {
    showModal,
    streakCount: streak?.current_streak ?? 0,
    handleClose,
    triggerCheck,
  };
}
