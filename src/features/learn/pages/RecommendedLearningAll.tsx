import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { getAllRecommendedCourse } from "../../../services/continue-course-learning/continueCourseApis";
import LoadingSpinner from "../../../commonComponents/loading-spinner/LoadingSpinner";
import BackArrowIcon from "../../../commonComponents/icons/BackArrowIcon";
import CourseCardV2 from "../components/courses/course-card-v2/CourseCardV2";
import Course from "../types/final-course.types";

const RecommendedLearningAll = () => {
  const navigate = useNavigate();
  const clientId = Number(import.meta.env.VITE_CLIENT_ID);

  const {
    data: courses,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["basedLearningCoursesAll", clientId],
    queryFn: () => getAllRecommendedCourse(clientId),
  });

  // Map backend data to UI props
  const mappedCourses = courses.slice(0, 5);

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
        <p className="text-gray-700">
          Failed to load recommended courses. Please try again later.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="flex items-center mb-6">
        <button
          onClick={() => navigate("/learn")}
          className="mr-4 p-2 rounded-full hover:bg-gray-100"
        >
          <BackArrowIcon width={24} height={24} />
        </button>
        <div>
          <h1 className="text-[#343A40] font-bold text-2xl ">
            Based On Your Learning
          </h1>
          <p className="text-[var(--netural-300)]  font-normal text-lg">
            Courses recommended based on your learning history
          </p>
        </div>
      </div>

      {!mappedCourses || mappedCourses.length === 0 ? (
        <div className="text-center p-10 border border-dashed border-gray-300 rounded-xl bg-gray-50">
          <h3 className="text-xl font-medium text-gray-700 mb-2">
            No recommended courses available
          </h3>
          <p className="text-gray-500 mb-6">
            We couldn't find any recommended courses based on your learning
            history.
          </p>
          <button
            onClick={() => navigate("/courses")}
            className="bg-[#17627A] text-white py-2 px-6 rounded-lg transition-all duration-200 hover:bg-[#12536A]"
          >
            Browse Courses
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {mappedCourses.map((course: Course) => (
            <CourseCardV2 key={course.id} course={course} />
          ))}
        </div>
      )}
    </div>
  );
};

export default RecommendedLearningAll;
