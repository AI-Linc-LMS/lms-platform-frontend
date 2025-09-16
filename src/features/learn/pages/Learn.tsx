import { useSelector } from "react-redux";
import Leaderboard from "../components/LeaderboardTable";
import TimeTrackingDashboard from "../components/graphs-components/TimeTrackingDashboard";
import BasedLearningCourses from "../components/based-learning/BasedLearningCourses";
// import ContinueCourses from "../components/continue-learning/ContinueCourses";
// import ContinueCoursesDetails from "../components/continue-learning/ContinueCoursesDetails";
import WelcomeSection from "../components/WelcomeSection";
import DailyProgress from "../components/DailyProgressTable";
import StreakTable from "../components/StreakTable";
import EnrolledCourses from "../components/courses/EnrolledCourses";
import { RootState } from "../../../redux/store";
import React, { ReactNode } from "react";
import LockSvg from "../../../commonComponents/icons/empty-state-handel/LockSvg";

interface EnrollToCourseOverlayProps {
  title: string;
  children: ReactNode;
  className?: string;
}

// Overlay card component to show over sections when no courses enrolled
const EnrollToCourseOverlay: React.FC<EnrollToCourseOverlayProps> = ({
  title,
  children,
  className = "",
}) => {
  return (
    <div className={`relative w-full ${className}`}>
      {/* Blurred original content */}
      <div className="filter blur-sm opacity-40 pointer-events-none">
        {children}
      </div>

      {/* Overlay content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center backdrop-blur-sm rounded-xl z-10">
        <div className="p-6 rounded-xl max-w-[90%] flex flex-col items-center">
          <div className="w-[60px] h-[60px] rounded-full flex items-center justify-center mb-4">
            <LockSvg />
          </div>
          <h3 className="text-lg font-bold text-gray-800 mb-2 text-center">
            {title}
          </h3>
          <button
            onClick={() => (window.location.href = "/courses")}
            className="bg-[#17627A] text-white py-2 px-6 rounded-lg transition-all duration-200 hover:bg-[#12536A] text-center mt-4 font-medium text-sm"
          >
            View all Courses
          </button>
        </div>
      </div>
    </div>
  );
};

const Learn = () => {
  const clientId = import.meta.env.VITE_CLIENT_ID;
  const courses = useSelector((state: RootState) => state.courses.courses);
  // Check if user has no enrolled courses
  const hasNoCourses = !courses || courses.length === 0;

  return (
    <div className="w-full min-h-screen">
      {/* Full width container */}
      <div className="w-full px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] xl:grid-cols-[1fr_384px] gap-6 w-full">
          {/* Left Column - Takes all available space */}
          <div className="min-w-0 space-y-6 overflow-hidden">
            <WelcomeSection />

            <div className="relative">
              {hasNoCourses ? (
                <EnrollToCourseOverlay title="Enroll to a Course to Unlock Stats">
                  <TimeTrackingDashboard />
                </EnrollToCourseOverlay>
              ) : (
                <TimeTrackingDashboard />
              )}
            </div>

            <EnrolledCourses />

            <div className="space-y-4">
              {/* <ContinueCourses /> */}
              {/* <ContinueCoursesDetails clientId={clientId} /> */}
            </div>

            <div className="space-y-4">
              <BasedLearningCourses clientId={clientId} />
            </div>
          </div>

          {/* Right Column - Free-flowing sidebar */}
          <div className="w-full space-y-6">
            {hasNoCourses ? (
              <EnrollToCourseOverlay
                title="Enroll to a Course to Unlock Weekly & Daily Progress"
                className="min-h-[600px]"
              >
                <div className="space-y-6 w-full">
                  <Leaderboard clientId={clientId} />
                  <DailyProgress clientId={clientId} />
                  <StreakTable clientId={clientId} />
                </div>
              </EnrollToCourseOverlay>
            ) : (
              <div className="space-y-6">
                <Leaderboard clientId={clientId} />
                <DailyProgress clientId={clientId} />
                <StreakTable clientId={clientId} />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Learn;
