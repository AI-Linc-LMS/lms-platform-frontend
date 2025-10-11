import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import PrimaryButton from "../../../commonComponents/common-buttons/primary-button/PrimaryButton";
import DashboardPieChart from "../components/enrolled-courses/DashboardPieChart";
import BackToHomeButton from "../../../commonComponents/common-buttons/back-buttons/back-to-home-button/BackToHomeButton";
import CourseContent from "../components/enrolled-courses/CourseContent";
import EnrolledLeaderBoard from "../components/enrolled-courses/EnrolledLeader";
import {
  getCourseById,
  getCourseDashboard,
} from "../../../services/enrolled-courses-content/courseContentApis";
import { useQuery } from "@tanstack/react-query";
import { FaBook, FaChartPie, FaTrophy } from "react-icons/fa";

type TabType = "overview" | "dashboard" | "leaderboard";

const EnrolledCourseDetailPage: React.FC = () => {
  const clientId = import.meta.env.VITE_CLIENT_ID;
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabType>("overview");

  const {
    data: course,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["course", courseId],
    queryFn: () => getCourseById(clientId, parseInt(courseId!)),
  });

  const {
    data,
    isLoading: isLoadingDashboard,
    error: errorDashboard,
  } = useQuery({
    queryKey: ["DashboardPieChart", courseId],
    queryFn: () => getCourseDashboard(clientId, parseInt(courseId!)),
    refetchOnWindowFocus: true,
    refetchOnMount: true,
  });

  const isCourseDataEmpty =
    !course ||
    !course.course_title ||
    !course.course_description ||
    !course.instructors ||
    !course.modules ||
    course.modules.length === 0;

  // Responsive Tab Navigation
  const TabNavigation: React.FC = () => {
    const tabs = [
      { id: "overview" as TabType, label: "Course Content", icon: FaBook },
      { id: "dashboard" as TabType, label: "Dashboard", icon: FaChartPie },
      { id: "leaderboard" as TabType, label: "Leaderboard", icon: FaTrophy },
    ];

    return (
      <div className="bg-white rounded-2xl border border-gray-200 overflow-x-auto mb-6 scrollbar-hide">
        <div className="flex min-w-max sm:min-w-0">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-center gap-2 font-semibold text-sm sm:text-base transition-all duration-300 relative ${
                  isActive
                    ? "text-teal-600 bg-teal-50"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                }`}
              >
                <Icon
                  className={`text-base sm:text-lg ${
                    isActive ? "text-teal-600" : ""
                  }`}
                />
                <span className="hidden sm:inline">{tab.label}</span>
                <span className="sm:hidden">{tab.label.split(" ")[0]}</span>
                {isActive && (
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-teal-600" />
                )}
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  // Error or loading fallback UI
  if (!courseId) {
    return (
      <div className="p-4 sm:p-6">
        <p className="text-lg sm:text-xl mb-4">Course ID not found</p>
        <PrimaryButton onClick={() => navigate("/")}>
          Back to Courses
        </PrimaryButton>
      </div>
    );
  }

  // Handle restricted access (403)
  if (error?.message === "Request failed with status code 403") {
    return (
      <>
        <BackToHomeButton />
        <div className="p-4 flex items-center justify-center">
          <div className="w-full max-w-md rounded-3xl border border-[var(--primary-200)] bg-white p-6 sm:p-8 shadow-xl">
            <div className="text-center">
              <div className="w-14 h-14 sm:w-16 sm:h-16 bg-[var(--primary-400)] rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="28"
                  height="28"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="white"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                  <polyline points="9,22 9,12 15,12 15,22"></polyline>
                </svg>
              </div>

              <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-2">
                Book Your Seat
              </h2>
              <h3 className="text-base sm:text-lg font-semibold text-gray-700 mb-4">
                {course?.course_title || "Secure your learning seat today"}
              </h3>

              <div className="rounded-xl p-4 mb-6 border border-[var(--primary-200)] bg-[#E9F7FA]">
                <div className="text-2xl sm:text-3xl font-bold text-[var(--primary-400)] mb-1">
                  ₹499
                </div>
                <div className="text-xs sm:text-sm text-gray-600">
                  Secure your learning seat today
                </div>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-6 text-left">
                <div className="flex items-center mb-1">
                  <svg
                    className="w-5 h-5 text-yellow-600 mr-2"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                      clipRule="evenodd"
                    ></path>
                  </svg>
                  <span className="text-sm font-medium text-yellow-800">
                    Limited Seats Available!
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-yellow-700">
                  Only a few seats left for this batch
                </p>
              </div>

              <ul className="text-left text-gray-700 mb-6 space-y-2 text-sm sm:text-base">
                {[
                  "Reserved seat in live sessions",
                  "Priority access to course materials",
                  "Direct mentor interaction",
                  "Certificate upon completion",
                ].map((benefit) => (
                  <li key={benefit} className="flex items-center">
                    <svg
                      className="w-4 h-4 sm:w-5 sm:h-5 text-green-500 mr-2"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      ></path>
                    </svg>
                    {benefit}
                  </li>
                ))}
              </ul>

              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => navigate("/")}
                  className="flex-1 px-4 py-2 sm:py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 font-medium transition-colors"
                >
                  Maybe Later
                </button>
                <PrimaryButton
                  className="flex-1 !px-4 !py-2 sm:!py-3 !rounded-xl !text-sm sm:!text-base"
                  onClick={() =>
                    window.open(
                      "https://staging.ailinc.com/flagship-program-payment?data=dv_t0riqr_f.5ac86e41",
                      "_blank"
                    )
                  }
                >
                  Book My Seat
                </PrimaryButton>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  if (isCourseDataEmpty) {
    return (
      <>
        <BackToHomeButton />
        <div className="flex flex-col gap-4 p-4 sm:p-6">
          {!isLoading && (
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-md">
              <p className="text-sm sm:text-base text-yellow-700">
                Course data is currently unavailable. Please try refreshing the
                page or contact support if the issue persists.
              </p>
            </div>
          )}
          <CourseContent course={course} isLoading={true} error={null} />
        </div>
      </>
    );
  }

  return (
    <>
      <BackToHomeButton />
      <div className="p-4 sm:p-6 md:p-8 max-w-7xl mx-auto w-full">
        {/* Tabs */}
        <TabNavigation />

        {/* Tab Content */}
        <div className="min-h-screen">
          {activeTab === "overview" && (
            <CourseContent
              course={course}
              isLoading={isLoading}
              error={error}
            />
          )}

          {activeTab === "dashboard" && (
            <div className="bg-white rounded-2xl p-4 sm:p-6 border border-gray-200 overflow-x-auto">
              <DashboardPieChart
                data={data}
                isLoading={isLoadingDashboard}
                error={errorDashboard}
              />
            </div>
          )}

          {activeTab === "leaderboard" && (
            <div className="bg-white rounded-2xl p-4 sm:p-6 border border-gray-200 overflow-x-auto">
              <EnrolledLeaderBoard courseId={parseInt(courseId)} />
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default EnrolledCourseDetailPage;
