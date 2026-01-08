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
    }

    // Check if today is in the monthly_days array (user has activity today)
    const hasActivityToday = streak.monthly_days?.includes(todayDay) ?? false;

    // Only show if:
    // 1. User has activity today
    // 2. Current streak is greater than 0
    // 3. We haven't shown the modal today
    if (hasActivityToday && streak.current_streak > 0) {
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
