import React, { useState } from "react";
import type { CourseContent, Module } from "../../types/course.types";
import CourseStatistics from "./CourseStatistics";
import CourseActions from "./CourseActions";
import CollapsibleCourseModule from "./CollapsibleCourseModule";

interface CourseContentProps {
  courseContent?: CourseContent; 
  isLoading?: boolean;
  error?: Error | null;
}

const CourseContent: React.FC<CourseContentProps> = ({ courseContent, isLoading, error }) => {
  const [tooltipInfo, setTooltipInfo] = useState<{
    visible: boolean;
    index: number;
    x: number;
    y: number;
  }>({
    visible: false,
    index: 0,
    x: 0,
    y: 0,
  });

  if (!courseContent) {
    return (
      <div className="flex justify-center items-center h-96">
        <p className="text-xl">Course data is not available</p>
      </div>
    );
  }

  const handleMouseEnter = (index: number, e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setTooltipInfo({
      visible: true,
      index,
      x: rect.left,
      y: rect.top,
    });
  };

  const handleMouseLeave = () => {
    setTooltipInfo((prev) => ({ ...prev, visible: false }));
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-96">
        <p className="text-xl">Loading course content...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-96">
        <p className="text-xl">Error loading course content</p>
      </div>
    );
  }


  return (
    <div className="w-full bg-white rounded-3xl p-6 shadow-sm relative">
      <h1 className="font-semibold text-[25px] font-sans">{courseContent?.course_title || "course title not available"}</h1>
      <p className="text-[14px] text-[#6C757D] font-normal">{courseContent?.course_description || "course description not available"}</p>

      {/* Avatars */}
      <div className="flex -space-x-2 mr-3 my-4">
        {courseContent.instructors?.map((instructor, index) => (
          <div
            key={index}
            className="w-12 h-12 rounded-full bg-gray-300 border-2 border-white overflow-hidden cursor-pointer transition-transform hover:z-10"
            onMouseEnter={(e) => handleMouseEnter(index, e)}
            onMouseLeave={handleMouseLeave}
          >
            <img
              src={instructor.profile_pic_url || "/api/placeholder/32/32"}
              alt="Teacher avatar"
              className="w-full h-full object-cover"
            />
          </div>
        ))}
      </div>

      {/* Tooltip bubble */}
      {tooltipInfo.visible && courseContent.instructors && (
        <div
          className="fixed z-50 pointer-events-none"
          style={{
            left: `${tooltipInfo.x}px`,
            top: `${tooltipInfo.y - 80}px`,
          }}
        >
          <div className="custom-tooltip-bubble px-6 py-4 text-white shadow-xl min-w-[220px]">
            <p className="font-semibold text-[20px] leading-none">
              {courseContent.instructors[tooltipInfo.index]?.name || "Teacher Name"}
            </p>
            <p className="text-[#D1DBE8] text-[16px] mt-2 leading-tight">
              {courseContent.instructors[tooltipInfo.index]?.bio || "Instructor, Company"}
            </p>
          </div>
        </div>
      )}

      <CourseStatistics />
      <CourseActions />

      <div className="mt-8">
        {courseContent?.modules?.map((module: Module) => (
          <CollapsibleCourseModule
            key={module.id}
            week={module} // Pass the module directly
          />
        ))}
      </div>
    </div>
  );
};

export default CourseContent;