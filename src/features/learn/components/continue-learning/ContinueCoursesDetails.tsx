import { useQuery } from "@tanstack/react-query";
import { CodeIcon, DocumentIcon, FAQIcon, VideoIcon } from "../../../../commonComponents/icons/learnIcons/CourseIcons";
import { getAllContinueCourseLearning } from "../../../../services/continue-course-learning/continueCourseApis";
import CourseCard from "./CourseCard";
import { CourseData, CourseIconData } from "./types";
import { useNavigate } from "react-router-dom";

const ContinueCoursesDetails = ({ clientId }: { clientId: number }) => {
  const navigate = useNavigate();
  const { data: continueCourses, isLoading, error } = useQuery({
    queryKey: ["continueCourses"],
    queryFn: () => getAllContinueCourseLearning(clientId),
  });

  console.log("continueCourses", continueCourses);
  const createIconData = (stats: any): CourseIconData[] => [
    { icon: <VideoIcon />, completed: stats.video.completed, total: stats.video.total },
    { icon: <DocumentIcon />, completed: stats.article.completed, total: stats.article.total },
    { icon: <CodeIcon />, completed: stats.coding_problem.completed, total: stats.coding_problem.total },
    { icon: <FAQIcon />, completed: stats.quiz.completed, total: stats.quiz.total },
    { icon: <CodeIcon />, completed: stats.assignment.completed, total: stats.assignment.total },
  ];

  if (isLoading || error) {
    return (
      <div>
        {
          error &&
          <div className="text-red-500">
            Error loading continue courses. Please try again later.
          </div>
        }
        {
          !continueCourses && <div className="text-center text-gray-500 p-4">
            No courses to continue. Start learning something new!
          </div>
        }
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
      </div>
    );
  }


  const courses: CourseData[] = continueCourses.map((course: any) => ({
    title: course.title,
    description: course.description,
    category: course.difficulty_level,
    completed_modules: course.completed_modules,
    num_modules: course.num_modules,
    iconData: createIconData(course.stats),
    onContinue: () => {
      console.log("Go to course detail page");
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
