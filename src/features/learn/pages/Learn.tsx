import { useSelector } from "react-redux";
// import { useNavigate } from "react-router-dom";
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
// import { FiPlayCircle, FiArrowRight, FiClock, FiCheckCircle, FiTrendingUp } from "react-icons/fi";
// Props type for the overlay card component
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
  // const navigate = useNavigate();
  // Get enrolled courses from Redux store
  const courses = useSelector((state: RootState) => state.courses.courses);
  // Check if user has no enrolled courses
  const hasNoCourses = !courses || courses.length === 0;

  return (
    <div className="flex flex-col md:flex-row gap-4 w-full">
      {/* Left Column */}
      <div className="w-full md:w-3/4 space-y-4 gap-4">
        <WelcomeSection />
        
        {/* Assessments Section */}
        {/* <div className="bg-gradient-to-r from-[#EFF9FC] to-[#E0F4F8] rounded-2xl p-6 border border-[#80C9E0]">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-3">
                <FiTrendingUp className="h-6 w-6 text-[#2C5F7F]" />
                <h2 className="text-xl font-bold text-[#2C5F7F]">
                  Test Your Skills
                </h2>
              </div>
              <p className="text-[#2C5F7F] mb-4">
                Take our comprehensive assessments to evaluate your knowledge and get personalized feedback. Choose from free and paid options.
              </p> */}
              
              {/* Quick Assessment Info */}
              {/* <div className="flex flex-wrap gap-4 text-sm">
                <div className="flex items-center gap-1">
                  <FiCheckCircle className="h-4 w-4 text-green-600" />
                  <span className="text-gray-700">Free Options Available</span>
                </div>
                <div className="flex items-center gap-1">
                  <FiClock className="h-4 w-4 text-[#2C5F7F]" />
                  <span className="text-gray-700">30-60 minutes</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-[#2C5F7F]">🏆</span>
                  <span className="text-gray-700">Earn Certificates</span>
                </div>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => navigate('/assessments')}
                className="inline-flex items-center gap-2 px-6 py-3 bg-[#2C5F7F] text-white rounded-xl font-medium hover:bg-[#1a4a5f] transition-colors shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                <FiPlayCircle className="h-4 w-4" />
                View All Assessments
                <FiArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div> */}

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
      <div className="w-full md:w-1/4 space-y-4 gap-4">
        {hasNoCourses ? (
          <EnrollToCourseOverlay
            title="Enroll to a Course to Unlock Weekly & Daily Progress"
            className="min-h-[600px]"
          >
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
