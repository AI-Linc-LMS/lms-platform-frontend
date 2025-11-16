import { useCallback, useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { RootState } from "../redux/store";
import { getMonthlyStreak } from "../services/activityTrackingApi";

/**
 * Determines whether to show the streak congratulations modal for today,
 * and ensures it only shows once per day per user via localStorage gating.
 */
export function useMonthlyStreakCongrats() {
  const user = useSelector((state: RootState) => state.user);
  const clientInfo = useSelector((state: RootState) => state.clientInfo);

  const [shouldShow, setShouldShow] = useState(false);
  const [currentStreak, setCurrentStreak] = useState<number>(0);
  const [completionDate, setCompletionDate] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

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

  useEffect(() => {
    let isMounted = true;
    const fetchStreak = async () => {
      try {
        setLoading(true);
        setError(null);
        const clientId =
          clientInfo?.data?.id ?? Number(import.meta.env.VITE_CLIENT_ID);
        if (!clientId) {
          setLoading(false);
          return;
        }
        const data = await getMonthlyStreak(Number(clientId));
        if (!isMounted) return;
        setCurrentStreak(data.current_streak ?? 0);
        const didCompleteToday = Boolean(data.streak?.[todayKey]);
        const alreadyShown = localStorage.getItem(storageKey) === "1";
        if (didCompleteToday && !alreadyShown) {
          setCompletionDate(todayKey);
          setShouldShow(true);
        } else {
          setShouldShow(false);
        }
      } catch (e: any) {
        if (!isMounted) return;
        setError(e?.message || "Failed to load monthly streak");
        setShouldShow(false);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    fetchStreak();
    return () => {
      isMounted = false;
    };
  }, [clientInfo?.data?.id, storageKey, todayKey]);

  const markShown = useCallback(() => {
    try {
      localStorage.setItem(storageKey, "1");
    } catch {
      // ignore storage failures
    }
    setShouldShow(false);
  }, [storageKey]);

  return {
    shouldShow,
    markShown,
    currentStreak,
    completionDate,
    loading,
    error,
  };
}


