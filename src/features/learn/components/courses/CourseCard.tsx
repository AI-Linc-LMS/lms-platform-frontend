import React from "react";
import { Course } from "../../types/course.types";
import PrimaryButton from "../../../../commonComponents/common-buttons/primary-button/PrimaryButton";
import { useNavigate } from "react-router-dom";

interface CourseCardProps {
  course: Course;
  className?: string;
}

const CourseCard: React.FC<CourseCardProps> = ({ course, className = "" }) => {
  const navigate = useNavigate();

  const handleExploreClick = () => {
    // Create URL-friendly version of the course title
    const courseNameSlug = course.title.toLowerCase().replace(/\s+/g, '-');
    // Navigate to the course detail page with the course name
    navigate(`/courses/${courseNameSlug}`);
  };

  return (
    <div
      className={`w-full border border-[#80C9E0] p-3 rounded-3xl my-4 bg-white ${className}`}
    >
      <div className="flex flex-row gap-6 items-center justify-between">
        <div>
          <h1 className="font-bold font-sans text-xl">{course.title}</h1>
          <p className="text-gray-600 font-normal text-[15px]">{course.subtitle}</p>
        </div>
        <div className="flex flex-wrap  gap-3 items-center">
          {course.stats.map((stat, index) => (
            <div
              key={index}
              className="w-16 h-16 rounded-lg p-1 bg-gray-200 flex flex-col items-center justify-center gap-3"
            >
              {stat.icon}
              <p className="font-semibold text-xs font-sans text-gray-600">
                {stat.total}
              </p>
            </div>
          ))}
        </div>
      </div>
      <div className="w-full my-5">
        <p className="text-gray-500">{course.description}</p>
      </div>
      <div className="flex flex-row gap-1 my-4">
      <h1>Trusted by :</h1>
      <div className="flex -space-x-2 mr-3 ">
        
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



      {/* <button
        className="w-full h-14 rounded-xl bg-[#255C79] text-white"
        onClick={course.onExplore}
      >
        Explore More
      </button> */}
      <PrimaryButton onClick={handleExploreClick}>
        Explore More
      </PrimaryButton>
    </div>
  );
};

export default CourseCard;
