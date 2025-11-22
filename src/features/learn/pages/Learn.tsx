import { useDispatch, useSelector } from "react-redux";
// import { useNavigate } from "react-router-dom";
import Leaderboard from "../components/LeaderboardTable";
import BasedLearningCourses from "../components/based-learning/BasedLearningCourses";
// import ContinueCourses from "../components/continue-learning/ContinueCourses";
// import ContinueCoursesDetails from "../components/continue-learning/ContinueCoursesDetails";
import WelcomeSection from "../components/WelcomeSection";
import EnrolledCourses from "../components/courses/EnrolledCourses";
import { RootState } from "../../../redux/store";
import { useCallback, useEffect, useRef } from "react";
import NoCourse from "../components/courses/NoCourse.tsx";
import { useEnrolledCourses } from "../hooks/useEnrolledCourses";
import { setCourses } from "../../../redux/slices/courseSlice.ts";
import SkeletonLoader from "../components/SkeletonLoader.tsx";
import Streak from "../components/Streak.tsx";
// import DailyProgress from "../components/DailyProgressTable.tsx";
import StreakTable from "../components/StreakTable.tsx";
import { useStreakData } from "../hooks/useStreakData";

const Learn = () => {
  const clientId = import.meta.env.VITE_CLIENT_ID;
  const numericClientId = Number(clientId) || 0;
  const courses = useSelector((state: RootState) => state.courses.courses);
  // Check if user has no enrolled courses
  const hasNoCourses = !courses || courses.length === 0;

  const dispatch = useDispatch();
  const lastManualRefreshRef = useRef(0);
  const MIN_REFRESH_WINDOW = 30_000;

  const {
    data,
    isLoading,
    refetch: refetchCourses,
  } = useEnrolledCourses(numericClientId);

  const { data: streakData, isLoading: isStreakLoading } = useStreakData(
    numericClientId || null
  );

  useEffect(() => {
    if (data) {
      dispatch(setCourses(data));
    }
  }, [data, dispatch]);

  const throttledRefetch = useCallback(() => {
    const now = Date.now();
    if (now - lastManualRefreshRef.current < MIN_REFRESH_WINDOW) {
      return;
    }
    lastManualRefreshRef.current = now;
    void refetchCourses();
  }, [refetchCourses]);

  // Only refetch on visibility change when tab becomes visible (throttled)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        throttledRefetch();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [throttledRefetch]);

  // Remove route-based refetch to avoid unnecessary API calls
  // Courses are cached and will refetch based on staleTime

  return (
    <div className="w-full min-h-screen">
      {/* Full width container */}
      {hasNoCourses ? (
        isLoading ? (
          <SkeletonLoader />
        ) : (
          <NoCourse />
        )
      ) : (
        <div className="w-full p-0 md:px-4 md:py-2">
          <div
            className={`grid grid-cols-1 lg:grid-cols-[1fr_320px] xl:grid-cols-[1fr_384px] gap-6 w-full`}
          >
            {/* Left Column - Takes all available space */}
            <div className="min-w-0 space-y-4 md:space-y-6 overflow-hidden">
              <WelcomeSection />

              <div className="relative">
                {isStreakLoading ? (
                  <SkeletonLoader />
                ) : (
                  <Streak
                    clientId={numericClientId}
                    dataOverride={streakData ?? null}
                  />
                )}
              </div>
              <EnrolledCourses isLoading={isLoading} />

              <div className="space-y-4">
                {/* <ContinueCourses />
                        <ContinueCoursesDetails clientId={clientId} /> */}
              </div>

              <div className="space-y-4">
                <BasedLearningCourses clientId={numericClientId} />
              </div>
            </div>

            {/* Right Column - Free-flowing sidebar */}
            <div className="w-full space-y-6">
              <div className="space-y-6">
                <Leaderboard clientId={numericClientId} />

                <div className="space-y-6">
                  <div className="bg-white/80 backdrop-blur-md border border-[var(--primary-100)] rounded-3xl p-6 shadow-xl hover:shadow-2xl transition-all duration-300">
                    <StreakTable
                      clientId={numericClientId}
                      dataOverride={streakData ?? null}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Learn;
