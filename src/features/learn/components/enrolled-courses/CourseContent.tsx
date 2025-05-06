import React, { useState } from "react";
import { Instructor, Module, Submodule } from "../../types/course.types";
import CourseStatistics from "./CourseStatistics";
import CourseActions from "./CourseActions";
import CollapsibleCourseModule from "./CollapsibleCourseModule";
import { useQuery } from "@tanstack/react-query";
import { getCourseById } from "../../../../services/courses-content/courseContentApis";

interface CourseContentProps {
  courseId: number;
}

const CourseContent: React.FC<CourseContentProps> = ({ courseId }) => {
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

  const { data: course, isLoading, error } = useQuery({
    queryKey: ["course", courseId],
    queryFn: () => getCourseById(1, courseId),
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

  if (isLoading) {
    return <div className="p-4">Loading...</div>;
  }

  if (error || !course) {
    return <div className="p-4">Error loading course</div>;
  }

  return (
    <div className="w-full bg-white rounded-3xl p-4 md:p-6 shadow-sm relative">
      <h1 className="font-semibold text-xl md:text-[25px] font-sans">{course.course_title ?? "Course Title"}</h1>
      <p className="text-sm md:text-[14px] text-[#6C757D] font-normal">{course.course_description ?? "Course Description"}</p>

      {/* Avatars */}
      <div className="flex -space-x-2 mr-3 my-3 md:my-4 overflow-x-auto">
        
        {course.instructors.map((instructor: Instructor, index: number) => (
          <div
            key={instructor.id}
            className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-gray-300 border-2 border-white overflow-hidden cursor-pointer transition-transform hover:z-10 flex-shrink-0"
            onMouseEnter={(e) => handleMouseEnter(index, e)}
            onMouseLeave={handleMouseLeave}
          >
            <img
              src={instructor.profile_pic_url}
              alt={instructor.name}
              className="w-full h-full object-cover"
            />
          </div>
        ))}
      </div>

      {/* Tooltip bubble */}
      {tooltipInfo.visible && course.instructors[tooltipInfo.index] && (
        <div
          className="absolute z-50 pointer-events-none transform -translate-x-1/2"
          style={{
            left: `${tooltipInfo.x}px`,
            top: `${tooltipInfo.y - 130}px`,
          }}
        >
          <div className="custom-tooltip-bubble px-4 md:px-6 py-3 md:py-4 text-white shadow-xl min-w-[120px]">
            <p className="font-semibold text-base md:text-[12px] leading-none">
              {course.instructors[tooltipInfo.index].name}
            </p>
            <p className="text-[#D1DBE8] text-xs md:text-[12px] mt-2 leading-tight">
              {course.instructors[tooltipInfo.index].bio}
            </p>
          </div>
        </div>
      )}

      <CourseStatistics course={course} />
      <CourseActions />

      <div className="mt-4 md:mt-8">
        {course.modules.map((module: Module) => (
          <CollapsibleCourseModule
            key={module.id}
            week={{
              id: courseId.toString(),
              weekNo: module.weekno,
              title: module.title,
              completed: module.completion_percentage,
              modules: module.submodules.map((submodule: Submodule) => ({
                id: submodule.id.toString(),
                title: submodule.title,
                content: [
                  { type: "video", title: "Videos", count: submodule.video_count },
                  { type: "article", title: "Articles", count: submodule.article_count },
                  { type: "problem", title: "Problems", count: submodule.coding_problem_count },
                  { type: "quiz", title: "Quizzes", count: submodule.quiz_count },
                ]
              }))
            }}
            defaultOpen={module.weekno === 1}
          />
        ))}
      </div>
    </div>
  );
};

export default CourseContent;
