import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { getAllContinueCourseLearning } from "../../../services/continue-course-learning/continueCourseApis";
import { ContinueCourse } from "../components/continue-learning/types";
import ContinueCoursesCard from "../components/continue-learning/ContinueCoursesCard";
import LoadingSpinner from "../../../commonComponents/loading-spinner/LoadingSpinner";
import BackArrowIcon from "../../../commonComponents/icons/BackArrowIcon";

const ContinueLearningAll = () => {
  const navigate = useNavigate();
  const clientId = import.meta.env.VITE_CLIENT_ID;

  const { data: courses, isLoading, error } = useQuery({
    queryKey: ["continueCourses", clientId],
    queryFn: () => getAllContinueCourseLearning(clientId),
  });

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center p-8">
        <h2 className="text-xl font-bold text-red-600 mb-2">Error</h2>
        <p className="text-gray-700">Failed to load courses. Please try again later.</p>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="flex items-center mb-6">
        <button
          onClick={() => navigate('/learn')}
          className="mr-4 p-2 rounded-full hover:bg-gray-100"
        >
          <BackArrowIcon width={24} height={24} />
        </button>
        <div>
          <h1 className="text-[#343A40] font-bold text-2xl font-sans">
            Continue Learning
          </h1>
          <p className="text-[#6C757D] font-sans font-normal text-lg">
            Continue where you left from
          </p>
        </div>
      </div>

      {courses?.length === 0 ? (
        <div className="text-center p-10 border border-dashed border-gray-300 rounded-xl bg-gray-50">
          <h3 className="text-xl font-medium text-gray-700 mb-2">No courses in progress</h3>
          <p className="text-gray-500 mb-6">You don't have any courses in progress at the moment.</p>
          <button
            onClick={() => navigate('/courses')}
            className="bg-[#17627A] text-white py-2 px-6 rounded-lg transition-all duration-200 hover:bg-[#12536A]"
          >
            Browse Courses
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses?.map((course: ContinueCourse) => (
            <ContinueCoursesCard key={course.id} course={course} />
          ))}
        </div>
      )}
    </div>
  );
};

export default ContinueLearningAll; 