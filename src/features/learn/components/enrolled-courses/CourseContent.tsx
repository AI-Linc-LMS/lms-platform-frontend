import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Course,
  Instructor,
  Module,
  Submodule,
} from "../../types/course.types";
import CourseStatistics from "./CourseStatistics";
import CourseActions from "./CourseActions";
import CollapsibleCourseModule from "./CollapsibleCourseModule";
import { FaLinkedin } from "react-icons/fa";

interface CourseContentProps {
  course: Course;
  isLoading: boolean;
  error: Error | null;
}

// Modify the InstructorsSection to include more instructors
const InstructorsSection: React.FC = () => {
  const { t } = useTranslation();
  // Define mock instructors specific to this course
  const mockInstructors: Instructor[] = [
    {
      id: "1",
      name: "Yamini Bandi",
      bio: "AI Product Development Specialist with expertise in Agentic AI systems and innovative digital product design.",
      linkedin_profile: "https://www.linkedin.com/in/yaminibandi",
      profile_pic_url:
        "https://media.licdn.com/dms/image/v2/D5603AQGnJXGVLD3l6A/profile-displayphoto-shrink_800_800/B56ZUU9NlaGsBs-/0/1739813346507?e=1758153600&v=beta&t=CZixxbB8N4P00hjhzaC0EZqF1MZp7KJqSYNK76lkXQs",
      website: "https://yaminibandi.ai",
    },
    {
      id: "2",
      name: "Shubham Lal",
      bio: "Senior AI Engineer with extensive experience in building autonomous agents and intelligent product ecosystems.",
      linkedin_profile: "https://www.linkedin.com/in/shubhamlal/",
      profile_pic_url:
        "https://lh3.googleusercontent.com/a/ACg8ocJSPMwGcKIWqYE1LDeBo_N1Z5pYriaPsNJSwLFAbPQ4N9lmnNIs=s96-c",
      website: "https://shubhamlal.tech",
    },
    {
      id: "3",
      name: "Divyansh Dubey",
      bio: "Machine Learning Research Lead specializing in advanced AI algorithms and autonomous system design.",
      linkedin_profile: "https://www.linkedin.com/in/divyansh-dubey/",
      profile_pic_url:
        "https://media.licdn.com/dms/image/v2/C4D03AQFTKsUzbzTaow/profile-displayphoto-shrink_800_800/profile-displayphoto-shrink_800_800/0/1661867320805?e=1758153600&v=beta&t=WYy1yfOd1S6UjcyKj2Vnl2U9Zsipw7QjmsfwdhipcrY",
      website: "https://emilyrodriguez.ai",
    },
    {
      id: "4",
      name: "Abirami Sukumaran",
      bio: "AI Product Manager with expertise in developing intelligent software solutions and AI strategy.",
      linkedin_profile: "https://www.linkedin.com/in/abiramisukumaran/",
      profile_pic_url:
        "https://media.licdn.com/dms/image/v2/C5603AQFGooYQlpfsiA/profile-displayphoto-shrink_800_800/profile-displayphoto-shrink_800_800/0/1600277251078?e=1758153600&v=beta&t=TateWcCJTZWeS3FHwfTJ209ajFfUFEKofgNqFM3c5DQ",
      website: "https://alexchen.tech",
    },
  ];

  const [isExpanded, setIsExpanded] = useState(false);

  // Determine which instructors to display
  const displayedInstructors = isExpanded
    ? mockInstructors
    : mockInstructors.slice(0, 2);

  return (
    <div className="mt-6 bg-white rounded-2xl p-4 md:p-6 border border-gray-100 shadow-sm">
      <div className="flex flex-col md:flex-row justify-between items-center mb-4 md:mb-5">
        <h2 className="text-lg md:text-xl font-semibold text-gray-800 mb-2 md:mb-0">
          {t("course.courseInstructors")}
        </h2>
        {mockInstructors.length > 2 && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-xs md:text-sm text-blue-600 hover:text-blue-800 transition-colors"
          >
            {isExpanded ? t("common.collapse") : `${t("common.viewAll")} (${mockInstructors.length})`}
          </button>
        )}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-5">
        {displayedInstructors.map((instructor) => (
          <div
            key={instructor.id}
            className="bg-white rounded-xl p-3 md:p-4 text-center border border-gray-100 hover:shadow-sm transition-all"
          >
            <div className="mb-2 md:mb-3">
              <img
                src={instructor.profile_pic_url || "/default-avatar.png"}
                alt={instructor.name}
                className="w-20 h-20 md:w-24 md:h-24 rounded-full object-cover mx-auto"
              />
            </div>
            <h3 className="text-base md:text-lg font-semibold text-gray-800 mb-1">
              {instructor.name}
            </h3>
            <p className="text-xs md:text-sm text-gray-600 mb-2 line-clamp-2">
              {instructor.bio}
            </p>
            {instructor.linkedin_profile && (
              <a
                href={instructor.linkedin_profile}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center text-[#0A66C2] hover:text-[#005582] transition-colors text-xs md:text-sm"
              >
                <FaLinkedin className="mr-1 w-4 h-4" /> {t("course.linkedinProfile")}
              </a>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

const CourseContent: React.FC<CourseContentProps> = ({
  course,
  isLoading,
  error,
}) => {
  const { t } = useTranslation();
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

  const clientId = import.meta.env.VITE_CLIENT_ID;

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
      <div className="w-full bg-white rounded-3xl p-4 md:p-6 shadow-sm animate-pulse">
        {/* Title skeleton */}
        <div className="h-8 bg-gray-200 rounded w-3/4 mb-2"></div>
        <div className="h-4 bg-gray-200 rounded w-1/2 mb-6"></div>

        {/* Avatars skeleton */}
        <div className="flex -space-x-2 mr-3 my-3 md:my-4">
          {[...Array(5)].map((_, index) => (
            <div
              key={index}
              className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-gray-200 border-2 border-white"
            />
          ))}
        </div>

        {/* Course statistics skeleton */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 my-6">
          {[...Array(4)].map((_, index) => (
            <div key={index} className="space-y-2">
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              <div className="h-6 bg-gray-200 rounded w-3/4"></div>
            </div>
          ))}
        </div>

        {/* Course actions skeleton */}
        <div className="h-12 bg-gray-200 rounded-lg mb-8"></div>

        {/* Modules skeleton */}
        <div className="space-y-4">
          {[...Array(3)].map((_, index) => (
            <div key={index} className="border border-gray-200 rounded-lg p-4">
              <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
              <div className="space-y-2">
                {[...Array(2)].map((_, subIndex) => (
                  <div
                    key={subIndex}
                    className="h-4 bg-gray-200 rounded w-full"
                  ></div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full bg-white rounded-3xl p-4 md:p-6 shadow-sm">
        <div className="flex flex-col items-center justify-center py-8">
          <svg
            className="w-16 h-16 text-red-500 mb-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">
            {t("course.errorLoadingCourse")}
          </h2>
          <p className="text-gray-600 text-center max-w-md">
            {t("course.errorLoadingMessage")}
          </p>
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="w-full bg-white rounded-3xl p-4 shadow-sm">
        <div className="flex flex-col items-center justify-center py-8">
          <svg
            className="w-16 h-16 text-gray-400 mb-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">
            {t("course.noCourseFound")}
          </h2>
          <p className="text-gray-600 text-center max-w-md">
            {t("course.noCourseFoundMessage")}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full bg-white rounded-3xl p-4 md:p-6 shadow-sm relative">
      <h1 className="font-semibold text-xl md:text-[25px]">
        {course.course_title}
      </h1>
      <p className="text-sm md:text-[14px] text-[var(--neutral-300)] font-normal">
        {course.course_description}
      </p>

      {/* Avatars */}
      <div className="flex -space-x-2 mr-3 my-3 md:my-4 overflow-x-auto">
        {course?.instructors?.map((instructor: Instructor, index: number) => (
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
      {tooltipInfo.visible && course?.instructors?.[tooltipInfo.index] && (
        <div
          className="absolute z-50 pointer-events-none transform -translate-x-1/2"
          style={{
            left: `${tooltipInfo.x}px`,
            top: `${tooltipInfo.y - 130}px`,
          }}
        >
          <div className="custom-tooltip-bubble px-4 md:px-6 py-3 md:py-4 text-[var(--font-light)] shadow-xl min-w-[120px]">
            <p className="font-semibold text-base md:text-[12px] leading-none">
              {course?.instructors?.[tooltipInfo.index]?.name}
            </p>
            <p className="text-[#D1DBE8] text-xs md:text-[12px] mt-2 leading-tight">
              {course?.instructors?.[tooltipInfo.index]?.bio}
            </p>
          </div>
        </div>
      )}

      <CourseStatistics course={course} />
      <CourseActions
        courseId={course.course_id ?? 3}
        clientId={clientId}
        likeCount={course.liked_count ?? 100}
        isLiked={course.is_liked_by_current_user ?? false}
      />

      {/* Always show InstructorsSection with mock data */}
      <InstructorsSection />

      <div className="mt-4 md:mt-8">
        {course?.modules?.map((module: Module) => (
          <CollapsibleCourseModule
            key={module.id}
            week={{
              id: `${course.course_id}`,
              weekNo: module.weekno,
              title: module.title,
              completed: module.completion_percentage,
              modules: module.submodules.map((submodule: Submodule) => ({
                id: `${submodule.id}`,
                title: submodule.title,
                content: [
                  {
                    type: "video",
                    title: "Videos",
                    count: submodule.video_count,
                  },
                  {
                    type: "article",
                    title: "Articles",
                    count: submodule.article_count,
                  },
                  {
                    type: "problem",
                    title: "Problems",
                    count: submodule.coding_problem_count,
                  },
                  {
                    type: "quiz",
                    title: "Quizzes",
                    count: submodule.quiz_count,
                  },
                ],
              })),
            }}
            defaultOpen={module.weekno === 1}
          />
        ))}
      </div>
    </div>
  );
};

export default CourseContent;
