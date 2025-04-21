import React, { useState } from "react";
import { Course } from "../../types/course.types";
import CourseStatistics from "./CourseStatistics";
import CourseActions from "./CourseActions";
import CollapsibleCourseModule from "./CollapsibleCourseModule";
import { mockCourseContent } from "../../data/mockCourseContent";

interface CourseContentProps {
  course: Course;
}

const CourseContent: React.FC<CourseContentProps> = ({ course }) => {
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

  return (
    <div className="w-full bg-white rounded-3xl p-6 shadow-sm relative">
      <h1 className="font-semibold text-[25px] font-sans">{course.title}</h1>
      <p className="text-[14px] text-[#6C757D] font-normal">{course.description}</p>

      {/* Avatars */}
      <div className="flex -space-x-2 mr-3 my-4">
        {course.teacherAvatar.slice(0, 5).map((avatar, index) => (
          <div
            key={index}
            className="w-12 h-12 rounded-full bg-gray-300 border-2 border-white overflow-hidden cursor-pointer transition-transform hover:z-10"
            onMouseEnter={(e) => handleMouseEnter(index, e)}
            onMouseLeave={handleMouseLeave}
          >
            <img
              src={avatar || "/api/placeholder/32/32"}
              alt="Teacher avatar"
              className="w-full h-full object-cover"
            />
          </div>
        ))}
      </div>

      {/* Tooltip bubble */}
      {tooltipInfo.visible && (
        <div
          className="fixed z-50 pointer-events-none"
          style={{
            left: `${tooltipInfo.x}px`,
            top: `${tooltipInfo.y - 80}px`,
          }}
        >
          <div className="custom-tooltip-bubble px-6 py-4 text-white shadow-xl min-w-[220px]">
            <p className="font-semibold text-[20px] leading-none">
              {course.teacherNames?.[tooltipInfo.index] || "Teacher Name"}
            </p>
            <p className="text-[#D1DBE8] text-[16px] mt-2 leading-tight">
              {course.teacherTitles?.[tooltipInfo.index] || "Instructor, Company"}
            </p>
          </div>
        </div>
      )}

      <CourseStatistics />
      <CourseActions />

      <div className="mt-8">
        {mockCourseContent.map((week) => (
          <CollapsibleCourseModule
            key={week.id}
            week={week}
            defaultOpen={week.id === "week-1"}
          />
        ))}
      </div>
    </div>
  );
};

export default CourseContent;
