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
            <svg width="109" height="108" viewBox="0 0 109 108" fill="none" xmlns="http://www.w3.org/2000/svg">
              <g filter="url(#filter0_d_369_4399)">
                <rect x="8.5" y="8" width="92" height="92" rx="46" fill="#D7EFF6" />
                <path fill-rule="evenodd" clip-rule="evenodd" d="M40.5271 48.4168V45.7201C40.5271 38.0033 46.7828 31.7476 54.4996 31.7476C62.2164 31.7476 68.4721 38.0033 68.4721 45.7201V48.4168C68.9416 48.4498 69.3842 48.4928 69.8005 48.5488C71.6637 48.7993 73.2325 49.3352 74.4785 50.5811C75.7245 51.8271 76.2604 53.3959 76.5109 55.2591C76.7522 57.0538 76.7521 59.3356 76.7521 62.1665V62.3936C76.7521 65.2246 76.7522 67.5064 76.5109 69.301C76.2604 71.1642 75.7245 72.733 74.4785 73.979C73.2325 75.2249 71.6637 75.7608 69.8005 76.0114C68.0059 76.2526 65.7241 76.2526 62.8932 76.2526H46.106C43.2751 76.2526 40.9933 76.2526 39.1986 76.0114C37.3354 75.7608 35.7666 75.2249 34.5207 73.979C33.2747 72.733 32.7388 71.1642 32.4883 69.301C32.247 67.5064 32.247 65.2246 32.2471 62.3937V62.1665C32.247 59.3356 32.247 57.0537 32.4883 55.2591C32.7388 53.3959 33.2747 51.8271 34.5207 50.5811C35.7666 49.3352 37.3354 48.7993 39.1986 48.5488C39.615 48.4928 40.0575 48.4498 40.5271 48.4168ZM43.6321 45.7201C43.6321 39.7181 48.4976 34.8526 54.4996 34.8526C60.5015 34.8526 65.3671 39.7181 65.3671 45.7201V48.3147C64.5939 48.3075 63.7698 48.3075 62.8932 48.3076H46.106C45.2293 48.3075 44.4053 48.3075 43.6321 48.3147V45.7201ZM36.7162 52.7767C37.2891 52.2038 38.0935 51.8303 39.6124 51.6261C41.176 51.4159 43.2483 51.4126 46.2196 51.4126H62.7796C65.7509 51.4126 67.8232 51.4159 69.3868 51.6261C70.9057 51.8303 71.71 52.2038 72.2829 52.7767C72.8558 53.3496 73.2293 54.154 73.4336 55.6729C73.6438 57.2364 73.6471 59.3087 73.6471 62.2801C73.6471 65.2514 73.6438 67.3237 73.4336 68.8872C73.2293 70.4062 72.8558 71.2105 72.2829 71.7834C71.71 72.3563 70.9057 72.7298 69.3868 72.934C67.8232 73.1443 65.7509 73.1476 62.7796 73.1476H46.2196C43.2483 73.1476 41.176 73.1443 39.6124 72.934C38.0935 72.7298 37.2891 72.3563 36.7162 71.7834C36.1433 71.2105 35.7698 70.4062 35.5656 68.8872C35.3554 67.3237 35.3521 65.2514 35.3521 62.2801C35.3521 59.3087 35.3554 57.2364 35.5656 55.6729C35.7698 54.154 36.1433 53.3496 36.7162 52.7767Z" fill="#255C79" />
              </g>
              <defs>
                <filter id="filter0_d_369_4399" x="0.833333" y="0.333333" width="107.333" height="107.333" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
                  <feFlood flood-opacity="0" result="BackgroundImageFix" />
                  <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha" />
                  <feOffset />
                  <feGaussianBlur stdDeviation="3.83333" />
                  <feComposite in2="hardAlpha" operator="out" />
                  <feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.15 0" />
                  <feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_369_4399" />
                  <feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow_369_4399" result="shape" />
                </filter>
              </defs>
            </svg>

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