import React from "react";
import { Course } from "../../types/course.types";
import PrimaryButton from "../../../../commonComponents/common-buttons/primary-button/PrimaryButton";

interface CourseCardProps {
  course: Course;
  className?: string;
}

const CourseCard: React.FC<CourseCardProps> = ({ course, className = "" }) => {
  return (
    <div
      className={`w-full border border-[#80C9E0] p-3 rounded-3xl my-4 bg-white ${className}`}
    >
      <div className="flex flex-row gap-6 items-center justify-between">
        <div>
          <h1 className="font-bold font-sans text-2xl">{course.title}</h1>
          <p className="text-gray-600 font-normal text-lg">{course.subtitle}</p>
        </div>
        <div className="flex flex-row gap-3 items-center">
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
      {course.trustedBy && course.trustedBy.length > 0 && (
        <div className="flex flex-row gap-2 my-4">
          <h1>Trusted:</h1>
          {course.trustedBy.map((trusted, index) => (
            <span key={index}>{trusted}</span>
          ))}
        </div>
      )}

      {/* <button
        className="w-full h-14 rounded-xl bg-[#255C79] text-white"
        onClick={course.onExplore}
      >
        Explore More
      </button> */}
      <PrimaryButton onClick={() => console.log("Primary Button Clicked")}>
        Explore More
      </PrimaryButton>
    </div>
  );
};

export default CourseCard;
