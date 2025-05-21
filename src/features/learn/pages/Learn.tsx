import { useSelector } from "react-redux";
import Leaderboard from "../components/LeaderboardTable";
import TimeTrackingDashboard from "../components/graphs-components/TimeTrackingDashboard";
import BasedLearningCourses from "../components/based-learning/BasedLearningCourses";
import ContinueCourses from "../components/continue-learning/ContinueCourses";
import ContinueCoursesDetails from "../components/continue-learning/ContinueCoursesDetails";
import Referrals from "../components/referrals/Referrals";
import WelcomeSection from "../components/WelcomeSection";
import DailyProgress from "../components/DailyProgressTable";
import StreakTable from "../components/StreakTable";
import EnrolledCourses from "../components/courses/EnrolledCourses";
import { RootState } from "../../../redux/store";
import React, { ReactNode } from "react";
import LockSvg from "../../../commonComponents/icons/empty-state-handel/LockSvg";

// Props type for the overlay card component
interface EnrollToCourseOverlayProps {
  title: string;
  children: ReactNode;
  className?: string;
}

// Overlay card component to show over sections when no courses enrolled
const EnrollToCourseOverlay: React.FC<EnrollToCourseOverlayProps> = ({ title, children, className = "" }) => {
  return (
    <div className={`relative ${className}`}>
      {/* Blurred original content */}
      <div className="filter blur-sm opacity-40 pointer-events-none">
        {children}
      </div>

      {/* Overlay content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/1  rounded-xl">
        <div className=" p-6 rounded-xl  max-w-[90%] flex flex-col items-center">
          <div className="w-[60px] h-[60px] rounded-full bg-[#EFF9FC] flex items-center justify-center mb-4">
            <LockSvg />

          </div>
          <h3 className="text-lg font-bold text-gray-800 mb-2 text-center">{title}</h3>
          <button
            onClick={() => window.location.href = '/courses'}
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
  // Get enrolled courses from Redux store
  const courses = useSelector((state: RootState) => state.courses.courses);
  // Check if user has no enrolled courses
  const hasNoCourses = !courses || courses.length === 0;

  return (
    <div className="flex flex-col md:flex-row gap-4 w-full">
      {/* Left Column */}
      <div className="w-full md:w-2/3 space-y-4 gap-4">
        <WelcomeSection />
        {hasNoCourses ? (
          <EnrollToCourseOverlay title="Enroll to a Course to Unlock Stats">
            <TimeTrackingDashboard />
          </EnrollToCourseOverlay>
        ) : (
          <TimeTrackingDashboard />
        )}
        <EnrolledCourses />
        <div className="space-y-2">
          <ContinueCourses />
          <ContinueCoursesDetails clientId={clientId} />
        </div>
        <div className="space-y-2">
          <BasedLearningCourses clientId={clientId} />
        </div>
      </div>

      {/* Right Column */}
      <div className="w-full md:w-1/3 space-y-4 gap-4">
        {hasNoCourses ? (
          <EnrollToCourseOverlay title="Enroll to a Course to Unlock Weekly & Daily Progress" className="min-h-[600px]">
            <div className="flex flex-col gap-6 w-full">
              <Leaderboard clientId={clientId} />
              <DailyProgress clientId={clientId} />
              <StreakTable clientId={clientId} />
            </div>
          </EnrollToCourseOverlay>
        ) : (
          <>
            <Leaderboard clientId={clientId} />
            <DailyProgress clientId={clientId} />
            <StreakTable clientId={clientId} />
          </>
        )}
        <Referrals />
      </div>
    </div>
  );
};

export default Learn;
