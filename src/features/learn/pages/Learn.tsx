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
            onClick={() => window.location.href = '/'}
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
    <div className="px-2 md:px-0">
      <WelcomeSection />
      <div className="flex flex-col md:flex-row justify-between mt-6 gap-6">
        <div className="flex flex-col w-full gap-8">
          {hasNoCourses ? (
            <EnrollToCourseOverlay title="Enroll to a Course to Unlock Stats">
              <TimeTrackingDashboard />
            </EnrollToCourseOverlay>
          ) : (
            <TimeTrackingDashboard />
          )}

          {/* EnrolledCourses and ContinueCourses always visible with their own empty states */}
          <EnrolledCourses />

          <div className="space-y-2">
            <ContinueCourses />
            <ContinueCoursesDetails clientId={clientId} />
          </div>

          <div className="space-y-2">
            <BasedLearningCourses clientId={clientId} />
          </div>
        </div>

        <div className="flex flex-col gap-6 w-full md:w-auto md:min-w-[300px] lg:min-w-[350px]">
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

          {/* Referrals component is always visible */}
          <Referrals />
        </div>
      </div>
    </div>
  );
}

export default Learn;