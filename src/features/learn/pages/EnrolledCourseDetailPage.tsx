import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import PrimaryButton from "../../../commonComponents/common-buttons/primary-button/PrimaryButton";
import DashboardPieChart from "../components/enrolled-courses/DashboardPieChart";
import BackToHomeButton from "../../../commonComponents/common-buttons/back-buttons/back-to-home-button/BackToHomeButton";
import CourseContent from "../components/enrolled-courses/CourseContent";
import EnrolledLeaderBoard from "../components/enrolled-courses/EnrolledLeader";
import { getCourseById } from "../../../services/enrolled-courses-content/courseContentApis";
import { useQuery } from "@tanstack/react-query";

const EnrolledCourseDetailPage: React.FC = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();

  const {
    data: course,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["course", courseId],
    queryFn: () => getCourseById(1, parseInt(courseId!)),
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
        <div className="p-4">
          <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded-md">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg
                  className="h-5 w-5 text-red-400"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">
                  This course is not assigned to you. Please contact your
                  administrator for access.
                </p>
              </div>
            </div>
          </div>
          <div className="mt-4">
            <PrimaryButton onClick={() => navigate("/")}>
              Back to Courses
            </PrimaryButton>
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
              <div className="w-full rounded-3xl bg-[#EFF9FC] border border-[#80C9E0] p-3 md:p-4 shadow-sm animate-pulse">
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
          <DashboardPieChart courseId={parseInt(courseId)} />
          <EnrolledLeaderBoard courseId={parseInt(courseId)} />
        </div>
      </div>
    </>
  );
};

export default EnrolledCourseDetailPage;
