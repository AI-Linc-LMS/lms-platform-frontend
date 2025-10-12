import React from "react";
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

const EnrolledCourseDetailPage: React.FC = () => {
  const clientId = import.meta.env.VITE_CLIENT_ID;
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();

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

  //console.log("course", course);
  // Check if course data is empty or missing required fields
  const isCourseDataEmpty =
    !course ||
    !course.course_title ||
    !course.course_description ||
    !course.instructors ||
    !course.modules ||
    course.modules.length === 0;

  if (!courseId) {
    return (
      <div className="p-4">
        <p className="text-xl mb-4">Course ID not found</p>
        <PrimaryButton onClick={() => navigate("/")}>
          Back to Courses
        </PrimaryButton>
      </div>
    );
  }

  if (error?.message === "Request failed with status code 403") {
    return (
      <>
        <BackToHomeButton />
        <div className="p-4 flex items-center justify-center">
          <div className="w-full max-w-md rounded-3xl border border-[var(--primary-200)] bg-white p-8 shadow-xl">
            <div className="text-center">
              <div className="w-16 h-16 bg-[var(--primary-400)] rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="32"
                  height="32"
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

              <h2 className="text-2xl font-bold text-gray-800 mb-2">
                Book Your Seat
              </h2>
              {course?.course_title ? (
                <h3 className="text-lg font-semibold text-gray-700 mb-4">
                  {course.course_title}
                </h3>
              ) : (
                <p className="text-gray-600 mb-4">
                  Secure your learning seat today
                </p>
              )}

              <div className="rounded-xl p-4 mb-6 border border-[var(--primary-200)] bg-[#E9F7FA]">
                <div className="text-3xl font-bold text-[var(--primary-400)] mb-1">
                  ₹499
                </div>
                <div className="text-sm text-gray-600">
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
                <p className="text-xs text-yellow-700">
                  Only a few seats left for this batch
                </p>
              </div>

              <ul className="text-left text-gray-700 mb-6 space-y-2">
                <li className="flex items-center">
                  <svg
                    className="w-5 h-5 text-green-500 mr-2"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    ></path>
                  </svg>
                  Reserved seat in live sessions
                </li>
                <li className="flex items-center">
                  <svg
                    className="w-5 h-5 text-green-500 mr-2"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    ></path>
                  </svg>
                  Priority access to course materials
                </li>
                <li className="flex items-center">
                  <svg
                    className="w-5 h-5 text-green-500 mr-2"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    ></path>
                  </svg>
                  Direct mentor interaction
                </li>
                <li className="flex items-center">
                  <svg
                    className="w-5 h-5 text-green-500 mr-2"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    ></path>
                  </svg>
                  Certificate upon completion
                </li>
              </ul>

              <div className="flex gap-3">
                <button
                  onClick={() => navigate("/")}
                  className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 font-medium transition-colors"
                >
                  Maybe Later
                </button>
                <PrimaryButton
                  className="flex-1 !px-3 sm:!px-4 !py-2 sm:!py-3 !rounded-xl !text-sm sm:!text-base"
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

  // Show skeleton for all components when course data is empty
  if (isCourseDataEmpty) {
    return (
      <>
        <BackToHomeButton />
        <div className="flex flex-col gap-4 p-4">
          {!isLoading && (
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-md">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg
                    className="h-5 w-5 text-yellow-400"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-yellow-700">
                    Course data is currently unavailable. Please try refreshing
                    the page or contact support if the issue persists.
                  </p>
                </div>
              </div>
            </div>
          )}
          <div className="flex flex-col md:flex-row w-full gap-4">
            <div className="w-full">
              <CourseContent course={course} isLoading={true} error={null} />
            </div>
            <div className="flex flex-col gap-4 w-full md:w-auto">
              <div className="w-full rounded-3xl bg-[#EFF9FC] border border-[var(--primary-200)] p-3 md:p-4 shadow-sm animate-pulse">
                <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2 mb-6"></div>
                <div className="flex flex-col md:flex-row items-center justify-center gap-4">
                  <div className="w-32 h-32 bg-gray-200 rounded-full"></div>
                  <div className="w-32 h-32 bg-gray-200 rounded-full"></div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                  {[...Array(4)].map((_, index) => (
                    <div key={index} className="flex flex-col items-center">
                      <div className="h-6 bg-gray-200 rounded w-12 mb-2"></div>
                      <div className="h-4 bg-gray-200 rounded w-16"></div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="w-full rounded-3xl bg-white p-3 md:p-4 shadow-sm animate-pulse">
                <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2 mb-6"></div>
                <div className="overflow-hidden rounded-xl border border-gray-300">
                  <table className="w-full text-center border-collapse">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="border-b border-gray-300 px-2 py-3 text-xs text-gray-600">
                          Standing
                        </th>
                        <th className="border-b border-l border-gray-300 px-2 text-xs text-gray-600">
                          Name
                        </th>
                        <th className="border-b border-l border-gray-300 px-2 text-xs text-gray-600">
                          Marks
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {[...Array(6)].map((_, index) => (
                        <tr key={index}>
                          <td className="border-b border-gray-300 px-2 py-2">
                            <div className="h-4 bg-gray-200 rounded w-10 mx-auto"></div>
                          </td>
                          <td className="border-b border-l border-gray-300 px-2 py-2">
                            <div className="h-4 bg-gray-200 rounded w-32 mx-auto"></div>
                          </td>
                          <td className="border-b border-l border-gray-300 px-2 py-2">
                            <div className="h-4 bg-gray-200 rounded w-16 mx-auto"></div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <BackToHomeButton />
      <div className="flex flex-col md:flex-row w-full gap-4 p-4">
        <div className="w-full">
          <CourseContent course={course} isLoading={isLoading} error={error} />
        </div>
        <div className="flex flex-col gap-4 w-full md:w-auto">
          <DashboardPieChart
            data={data}
            isLoading={isLoadingDashboard}
            error={errorDashboard}
          />
          <EnrolledLeaderBoard courseId={parseInt(courseId)} />
        </div>
      </div>
    </>
  );
};

export default EnrolledCourseDetailPage;
