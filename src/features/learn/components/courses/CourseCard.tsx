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
      const courseNameSlug = course.title.toLowerCase().replace(/\s+/g, "-");
      navigate(`/courses/${courseNameSlug}/${course.id}`);
    }
  };

  if (isLoading || !course || error) {
    // Skeleton loader
    return (
      <div
        className={`w-full border border-[#80C9E0] p-3 rounded-3xl bg-white flex flex-col h-full animate-pulse ${className}`}
      >
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-center">
          <div>
            <div className="h-6 bg-gray-200 rounded w-3/4 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
          <div className="grid grid-cols-4 gap-1">
            {[...Array(4)].map((_, index) => (
              <div
                key={index}
                className="w-full aspect-square rounded-lg p-1 bg-gray-200 flex flex-col items-center justify-center"
              >
                <div className="h-6 w-6 bg-gray-300 rounded-full"></div>
                <div className="h-4 bg-gray-300 rounded w-3/4 mt-1"></div>
              </div>
            ))}
          </div>
        </div>
        <div className="w-full my-5">
          <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
        </div>
        <div className="flex flex-row gap-1 mb-4">
          <div className="h-4 bg-gray-200 rounded w-20"></div>
          <div className="flex -space-x-2 mr-3">
            {[...Array(5)].map((_, index) => (
              <div
                key={index}
                className="w-8 h-8 rounded-full bg-gray-300 border-2 border-white"
              ></div>
            ))}
          </div>
        </div>
        <div className="mt-4">
          <div className="h-10 bg-gray-200 rounded w-full"></div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`w-full border border-[#80C9E0] p-3 rounded-3xl my-4 bg-white flex flex-col min-h-[300px] ${className}`}
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-center">
        <div>
          <h1 className="font-bold font-sans text-[18px]">{course.title}</h1>
          <p className="text-gray-600 font-normal text-[15px]">{course.subtitle}</p>
        </div>
        {/* <div className="grid grid-cols-4 gap-1">
          {course.stats.map((stat, index) => (
            <div
              key={index}
              className="w-full aspect-square rounded-lg p-1 bg-gray-200 flex flex-col items-center justify-center"
            >
              {stat.icon}
              <p className="font-semibold text-xs font-sans text-gray-600 mt-1">
                {stat.total}
              </p>
            </div>
          ))}
        </div> */}
      </div>
      <div className="w-full my-5">
        <p className="text-gray-500">{course.description}</p>
      </div>
      <div className="flex flex-row gap-1 mb-4">
        <h1>Trusted by :</h1>
        <div className="flex -space-x-2 mr-3">
          {course.trustedBy?.slice(0, 5).map((avatar, index) => (
            <div key={index} className="w-8 h-8 rounded-full bg-gray-300 border-2 border-white overflow-hidden">
              <img
                src={avatar || "/api/placeholder/32/32"}
                alt="Student avatar"
                className="w-full h-full object-cover"
              />
            </div>
          ))}
        </div>
      </div>
      <div className="mt-auto">
        <PrimaryButton onClick={handleExploreClick}>
          Explore More
        </PrimaryButton>
      </div>
    </div>
  );
};

export default CourseCard;