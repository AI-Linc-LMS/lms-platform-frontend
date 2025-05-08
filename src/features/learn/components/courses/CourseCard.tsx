import React from "react";
import { Course } from "../../types/course.types";
import PrimaryButton from "../../../../commonComponents/common-buttons/primary-button/PrimaryButton";
import { useNavigate } from "react-router-dom";

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
      className={`w-29/30 border border-[#80C9E0] p-3 md:p-4 rounded-2xl md:rounded-3xl bg-white flex flex-col h-full ${className}`}
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-2 md:gap-3 items-center">
        <div>
          <h1 className="font-bold font-sans text-[16px] md:text-[18px]">{course.title}</h1>
          <p className="text-gray-600 font-normal text-[13px] md:text-[15px]">{course.description}</p>
        </div>
      </div>
      <div className="w-full my-3 md:my-4">
        <p className="text-gray-500 text-[13px] md:text-[15px]">{course.description}</p>
      </div>
      <div className="flex flex-row gap-1 mb-3 items-center text-[13px] md:text-[15px]">
        <h1>Instructors:</h1>
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
      <div className="mt-auto pt-2">
        <PrimaryButton onClick={handleExploreClick} className="text-[13px] md:text-[15px] py-1 md:py-2">
          Explore More
        </PrimaryButton>
      </div>
    </div>
  );
};

export default CourseCard;