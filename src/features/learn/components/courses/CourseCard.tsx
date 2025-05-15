import React from "react";
import { Course } from "../../types/course.types";
import PrimaryButton from "../../../../commonComponents/common-buttons/primary-button/PrimaryButton";
import { useNavigate } from "react-router-dom";
import { VideoIcon, DocumentIcon, CodeIcon, FAQIcon } from "../../../../commonComponents/icons/learnIcons/CourseIcons";

// Add an AssignmentIcon component
const AssignmentIcon = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 16 16"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M3.83594 2C3.83594 1.72386 4.0598 1.5 4.33594 1.5H11.1693C11.3007 1.5 11.4267 1.55268 11.5205 1.64645L13.6897 3.81569C13.7835 3.90946 13.8359 4.03533 13.8359 4.16667V13.5C13.8359 13.7761 13.6121 14 13.3359 14H4.33594C4.0598 14 3.83594 13.7761 3.83594 13.5V2ZM4.83594 2.5V13H12.8359V4.33333L10.8359 2.33333H4.83594Z"
      fill="#495057"
    />
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M6.33594 6.5C6.33594 6.22386 6.5598 6 6.83594 6H10.3359C10.6121 6 10.8359 6.22386 10.8359 6.5C10.8359 6.77614 10.6121 7 10.3359 7H6.83594C6.5598 7 6.33594 6.77614 6.33594 6.5Z"
      fill="#495057"
    />
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M6.33594 9.5C6.33594 9.22386 6.5598 9 6.83594 9H10.3359C10.6121 9 10.8359 9.22386 10.8359 9.5C10.8359 9.77614 10.6121 10 10.3359 10H6.83594C6.5598 10 6.33594 9.77614 6.33594 9.5Z"
      fill="#495057"
    />
  </svg>
);

interface CourseCardProps {
  course?: Course; 
  className?: string;
  isLoading?: boolean; 
  error?: Error | null;
}

// Stat block component with hover effect
const StatBlock = ({ icon, count, label }: { icon: React.ReactNode, count: number, label: string }) => {
  return (
    <div className="bg-[#F8F9FA] hover:bg-[#E9ECEF] rounded-xl p-2 md:p-3 flex flex-col items-center justify-center relative group transition-all duration-200">
      <div className="mb-1 md:mb-2">{icon}</div>
      <span className="text-center text-[#495057] font-medium text-sm md:text-base">{count}</span>
      
      {/* Tooltip that appears on hover */}
      <div className="absolute opacity-0 group-hover:opacity-100 bottom-full left-1/2 transform -translate-x-1/2 mb-1 px-2 py-1 bg-[#343A40] text-white text-xs rounded pointer-events-none transition-opacity duration-200">
        {label}
        <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-[#343A40]"></div>
      </div>
    </div>
  );
};

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
      return { videos: 0, articles: 0, problems: 0, quizzes: 0, assignments: 0 };
    }
    
    return course.modules.reduce((acc, module) => {
      if (!module.submodules || !Array.isArray(module.submodules)) return acc;
      
      return module.submodules.reduce((subAcc, submodule) => {
        return {
          videos: subAcc.videos + (submodule.video_count || 0),
          articles: subAcc.articles + (submodule.article_count || 0),
          problems: subAcc.problems + (submodule.coding_problem_count || 0),
          quizzes: subAcc.quizzes + (submodule.quiz_count || 0),
          assignments: subAcc.assignments + (submodule.assignment_count || 0)
        };
      }, acc);
    }, { videos: 0, articles: 0, problems: 0, quizzes: 0, assignments: 0 });
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
          <div className="grid grid-cols-5 gap-1">
            {[...Array(5)].map((_, index) => (
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
        <div className="grid grid-cols-5 gap-2 md:gap-3 mt-3 lg:mt-0">
          <StatBlock 
            icon={<VideoIcon />} 
            count={totalCounts.videos} 
            label="Videos" 
          />
          <StatBlock 
            icon={<DocumentIcon />} 
            count={totalCounts.articles} 
            label="Articles" 
          />
          <StatBlock 
            icon={<CodeIcon />} 
            count={totalCounts.problems} 
            label="Coding Problems" 
          />
          <StatBlock 
            icon={<FAQIcon />} 
            count={totalCounts.quizzes} 
            label="Quizzes" 
          />
          <StatBlock 
            icon={<AssignmentIcon />} 
            count={totalCounts.assignments} 
            label="Assignments" 
          />
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
      <div className="mt-auto">
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