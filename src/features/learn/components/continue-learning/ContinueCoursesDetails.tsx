import { useQuery } from "@tanstack/react-query";
import { CodeIcon, DocumentIcon, FAQIcon, VideoIcon } from "../../../../commonComponents/icons/learnIcons/CourseIcons";
import { getAllContinueCourseLearning } from "../../../../services/continue-course-learning/continueCourseApis";
import CourseCard from "./CourseCard";
import { CourseData, CourseIconData, CourseStats, ContinueCourse } from "./types";
import { useNavigate } from "react-router-dom";
import PrimaryButton from "../../../../commonComponents/common-buttons/primary-button/PrimaryButton";

// Empty state component
const EmptyContinueState = () => {
  const navigate = useNavigate();
  
  return (
    <div className="flex flex-col items-center justify-center py-12 px-6 bg-white rounded-3xl border border-[#80C9E0] shadow-sm transition-all duration-300 transform hover:scale-[1.01]">
      <svg className="w-20 h-20 text-[#2A8CB0] mb-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
      </svg>
      <h3 className="text-xl font-bold text-[#343A40] mb-2">No courses in progress</h3>
      <p className="text-[#6C757D] text-center max-w-md mb-8 font-sans text-[14px] md:text-[16px]">
        You haven't started any courses yet. Explore our catalog to find a course that interests you and begin your learning journey.
      </p>
      <PrimaryButton 
        onClick={() => navigate('/')} 
        className="max-w-xs transition-all duration-200 transform hover:scale-95"
      >
        Explore Courses
      </PrimaryButton>
    </div>
  );
};

const ContinueCoursesDetails = ({ clientId }: { clientId: number }) => {
  const navigate = useNavigate();
  const { data: continueCourses, isLoading, error } = useQuery({
    queryKey: ["continueCourses"],
    queryFn: () => getAllContinueCourseLearning(clientId),
  });

  // Remove console.log in production
  // console.log("continueCourses", continueCourses);
  
  const createIconData = (stats: CourseStats): CourseIconData[] => [
    { icon: <VideoIcon />, completed: stats.video.completed, total: stats.video.total },
    { icon: <DocumentIcon />, completed: stats.article.completed, total: stats.article.total },
    { icon: <CodeIcon />, completed: stats.coding_problem.completed, total: stats.coding_problem.total },
    { icon: <FAQIcon />, completed: stats.quiz.completed, total: stats.quiz.total },
    { icon: <CodeIcon />, completed: stats.assignment.completed, total: stats.assignment.total },
  ];

  // Loading state
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
        {[1, 2, 3, 4].map((index) => (
          <div key={index} className="w-full border-[#80C9E0] rounded-[16px] md:rounded-[22px] border-[1px] bg-[#F8F9FA] p-3 md:p-4 mt-3 md:mt-4 flex flex-col min-h-[280px] md:min-h-[300px] animate-pulse">
            <div className="h-6 bg-gray-200 rounded w-3/4 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
            <div className="grid grid-cols-4 gap-1 mb-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="w-full aspect-square rounded-lg bg-gray-200"></div>
              ))}
            </div>
            <div className="h-10 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="h-12 bg-gray-200 rounded w-full mb-4"></div>
            <div className="h-10 bg-gray-200 rounded w-1/3 mt-auto"></div>
          </div>
        ))}
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="text-red-500 p-6 bg-red-50 rounded-xl border border-red-200">
        Error loading courses. Please try again later.
      </div>
    );
  }

  // Empty state
  if (!continueCourses || continueCourses.length === 0) {
    return <EmptyContinueState />;
  }

  // Courses available
  const courses: CourseData[] = continueCourses.map((course: ContinueCourse) => ({
    title: course.title,
    description: course.description,
    category: course.difficulty_level,
    completed_modules: course.completed_modules,
    num_modules: course.num_modules,
    iconData: createIconData(course.stats),
    onContinue: () => {
      // console.log("Go to course detail page");
      navigate(`/courses/${course.id}`);
    },
  }));

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
      {courses.map((course, index) => (
        <CourseCard
          key={index}
          {...course}
        />
      ))}
    </div>
  );
};

export default ContinueCoursesDetails;
