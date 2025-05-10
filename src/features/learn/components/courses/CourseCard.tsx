import React from "react";
import { Course } from "../../types/course.types";
import PrimaryButton from "../../../../commonComponents/common-buttons/primary-button/PrimaryButton";
import { useNavigate } from "react-router-dom";
import { VideoIcon, DocumentIcon, CodeIcon, FAQIcon } from "../../../../commonComponents/icons/learnIcons/CourseIcons";

interface CourseCardProps {
  course?: Course; 
  className?: string;
  isLoading?: boolean; 
  error?: Error | null;
}

const CourseCard: React.FC<CourseCardProps> = ({ course, className = "", isLoading = false, error = null }) => {
  const navigate = useNavigate();

  const handleExploreClick = () => {
    if (course) {
      navigate(`/courses/${course.id}`);
    }
  };

  // Calculate total counts across all modules and submodules
  const calculateTotalCounts = (course?: Course) => {
    if (!course || !course.modules || !Array.isArray(course.modules)) {
      return { videos: 0, articles: 0, problems: 0, quizzes: 0 };
    }
    
    return course.modules.reduce((acc, module) => {
      if (!module.submodules || !Array.isArray(module.submodules)) return acc;
      
      return module.submodules.reduce((subAcc, submodule) => {
        return {
          videos: subAcc.videos + (submodule.video_count || 0),
          articles: subAcc.articles + (submodule.article_count || 0),
          problems: subAcc.problems + (submodule.coding_problem_count || 0),
          quizzes: subAcc.quizzes + (submodule.quiz_count || 0)
        };
      }, acc);
    }, { videos: 0, articles: 0, problems: 0, quizzes: 0 });
  };

  const totalCounts = calculateTotalCounts(course);

  if (isLoading || !course || error) {
    // Skeleton loader
    return (
      <div
        className={`w-full border border-[#80C9E0] p-3 md:p-4 rounded-2xl md:rounded-3xl bg-white flex flex-col h-full animate-pulse ${className}`}
      >
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-2 md:gap-3 items-center">
          <div>
            <div className="h-5 md:h-6 bg-gray-200 rounded w-3/4 mb-2"></div>
            <div className="h-3 md:h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
          <div className="grid grid-cols-4 gap-1">
            {[...Array(4)].map((_, index) => (
              <div
                key={index}
                className="w-full aspect-square rounded-lg p-1 bg-gray-200 flex flex-col items-center justify-center"
              >
                <div className="h-4 md:h-6 w-4 md:w-6 bg-gray-300 rounded-full"></div>
                <div className="h-3 md:h-4 bg-gray-300 rounded w-3/4 mt-1"></div>
              </div>
            ))}
          </div>
        </div>
        <div className="w-full my-3 md:my-4">
          <div className="h-3 md:h-4 bg-gray-200 rounded w-full mb-2"></div>
          <div className="h-3 md:h-4 bg-gray-200 rounded w-3/4"></div>
        </div>
        <div className="flex flex-row gap-1 mb-3">
          <div className="h-3 md:h-4 bg-gray-200 rounded w-16 md:w-20"></div>
          <div className="flex -space-x-2 mr-3">
            {[...Array(5)].map((_, index) => (
              <div
                key={index}
                className="w-6 md:w-8 h-6 md:h-8 rounded-full bg-gray-300 border-2 border-white"
              ></div>
            ))}
          </div>
        </div>
        <div className="mt-auto pt-2">
          <div className="h-8 md:h-10 bg-gray-200 rounded w-full"></div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`w-full border border-[#80C9E0] p-4 md:p-6 rounded-2xl md:rounded-3xl bg-white flex flex-col h-full ${className}`}
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 md:gap-4 items-center">
        <div>
          <h1 className="font-bold font-sans text-lg md:text-xl text-[#343A40]">{course.title}</h1>
          <p className="text-[#6C757D] font-normal text-sm md:text-base mt-1">{course.description}</p>
        </div>
        <div className="grid grid-cols-4 gap-2 md:gap-3 mt-3 lg:mt-0">
          <div className="bg-[#F8F9FA] rounded-xl p-2 md:p-3 flex flex-col items-center justify-center">
            <div className="mb-1 md:mb-2"><VideoIcon /></div>
            <span className="text-center text-[#495057] font-medium text-sm md:text-base">{totalCounts.videos}</span>
          </div>
          <div className="bg-[#F8F9FA] rounded-xl p-2 md:p-3 flex flex-col items-center justify-center">
            <div className="mb-1 md:mb-2"><DocumentIcon /></div>
            <span className="text-center text-[#495057] font-medium text-sm md:text-base">{totalCounts.articles}</span>
          </div>
          <div className="bg-[#F8F9FA] rounded-xl p-2 md:p-3 flex flex-col items-center justify-center">
            <div className="mb-1 md:mb-2"><CodeIcon /></div>
            <span className="text-center text-[#495057] font-medium text-sm md:text-base">{totalCounts.problems}</span>
          </div>
          <div className="bg-[#F8F9FA] rounded-xl p-2 md:p-3 flex flex-col items-center justify-center">
            <div className="mb-1 md:mb-2"><FAQIcon /></div>
            <span className="text-center text-[#495057] font-medium text-sm md:text-base">{totalCounts.quizzes}</span>
          </div>
        </div>
      </div>
      <div className="w-full my-4 md:my-6">
        <p className="text-[#495057] text-sm md:text-base">{course.description}</p>
      </div>
      <div className="flex flex-row gap-2 mb-4 items-center text-sm md:text-base">
        <h1 className="text-[#343A40] font-medium">Instructors:</h1>
        <div className="flex -space-x-2 mr-3">
          {course.instructors.slice(0, 5).map((instructor, index) => (
            <div key={index} className="w-6 md:w-8 h-6 md:h-8 rounded-full bg-gray-300 border-2 border-white overflow-hidden">
              <img
                src={instructor.profile_pic_url}
                alt={instructor.name}
                className="w-full h-full object-cover"
              />
            </div>
          ))}
        </div>
      </div>
      <div className="mt-auto pt-3">
        <PrimaryButton 
          onClick={handleExploreClick} 
          className="w-full text-sm md:text-base py-2 md:py-3 rounded-xl"
        >
          Explore More
        </PrimaryButton>
      </div>
    </div>
  );
};

export default CourseCard;