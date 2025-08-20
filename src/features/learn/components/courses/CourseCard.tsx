import React, { useState } from "react";
import { Course } from "../../types/course.types";
import PrimaryButton from "../../../../commonComponents/common-buttons/primary-button/PrimaryButton";
import { useNavigate } from "react-router-dom";
import { VideoIcon, DocumentIcon, CodeIcon, FAQIcon } from "../../../../commonComponents/icons/learnIcons/CourseIcons";
import { AssignmentIcon } from './CourseIcons';
import { enrollInCourse } from "../../../../services/continue-course-learning/continueCourseApis";

// Stats block for showing counts of different content types
const StatBlock = ({ icon, count, label }: { icon: React.ReactNode, count: number, label: string }) => {
  // Ensure count is a number
  const displayCount = typeof count === 'object' ? 0 : Number(count) || 0;

  return (
    <div className="bg-[#F8F9FA] hover:bg-[#E9ECEF] rounded-xl p-2 md:p-3 flex flex-col items-center justify-center relative group transition-all duration-200 overflow-visible">
      <div className="mb-1 md:mb-2">{icon}</div>
      <span className="text-center text-[#495057] font-medium text-sm md:text-base">{displayCount}</span>

      {/* Tooltip that appears on hover */}
      <div className="absolute opacity-0 group-hover:opacity-100 bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-[#343A40] text-white text-xs rounded pointer-events-none transition-opacity duration-200 z-[99999] whitespace-nowrap">
        {label}
        <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-[#343A40]"></div>
      </div>
    </div>
  );
};

interface CourseCardProps {
  course?: Course;
  className?: string;
  isLoading?: boolean;
  error?: Error | null;
  clientId?: number;
}

const CourseCard: React.FC<CourseCardProps> = ({ course, className = "", isLoading = false, error = null, clientId = 1 }) => {
  const navigate = useNavigate();
  const [isEnrolling, setIsEnrolling] = useState(false);
  const [showSuccessToast, setShowSuccessToast] = useState(false);

  const isFree = course?.is_free === true || course?.price === 0;

  // Prevent duplicate enroll API calls per course per client (persists in localStorage)
  const storageKey = `enrolled_course_ids_${clientId}`;
  const getEnrolledIds = (): Set<number> => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (!raw) return new Set<number>();
      const parsed = JSON.parse(raw) as number[];
      return new Set<number>(Array.isArray(parsed) ? parsed : []);
    } catch {
      return new Set<number>();
    }
  };
  const saveEnrolledIds = (ids: Set<number>) => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(Array.from(ids)));
    } catch {
      // ignore storage errors
    }
  };

  const isInitiallyEnrolled = !!course && getEnrolledIds().has(course.id);
  const [isEnrolled, setIsEnrolled] = useState<boolean>(isInitiallyEnrolled);

  const handlePrimaryClick = async () => {
    if (!course) return;

    if (isEnrolled) {
      navigate(`/courses/${course.id}`);
      return;
    }

    if (isFree) {
      const enrolledIds = getEnrolledIds();
      if (enrolledIds.has(course.id)) {
        setIsEnrolled(true);
        navigate(`/courses/${course.id}`);
        return;
      }

      try {
        setIsEnrolling(true);
        await enrollInCourse(clientId, course.id);
        enrolledIds.add(course.id);
        saveEnrolledIds(enrolledIds);
        setIsEnrolled(true);
        setShowSuccessToast(true);
        setTimeout(() => {
          setShowSuccessToast(false);
          navigate(`/courses/${course.id}`);
        }, 900);
      } catch {
        // Fall back to navigation if enroll fails
        navigate(`/courses/${course.id}`);
      } finally {
        setIsEnrolling(false);
      }
    } else {
      // Paid or non-free: navigate to detail (enrollment handled elsewhere)
      navigate(`/courses/${course.id}`);
    }
  };

  // Placeholder for stats counts
  const totalCounts = {
    videos: course?.stats?.video?.total || 0,
    articles: course?.stats?.article?.total || 0,
    problems: course?.stats?.coding_problem?.total || 0,
    quizzes: course?.stats?.quiz?.total || 0,
    assignments: course?.stats?.assignment?.total || 0
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
      className={`w-full border border-[#80C9E0] p-4 rounded-2xl md:rounded-3xl bg-white flex flex-col h-full overflow-visible ${className}`}
    >
      {showSuccessToast && (
        <div className="fixed top-4 right-4 z-50">
          <div className="flex items-center gap-3 px-4 py-3 bg-green-600 text-white rounded-xl shadow-lg">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            <span className="text-sm font-medium">Successfully enrolled! Redirecting…</span>
          </div>
        </div>
      )}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 md:gap-4 items-center overflow-visible">
        <div>
            <h1 className="font-bold font-sans text-lg text-[#343A40]">{course.title}</h1>
            <p className="text-[#6C757D] font-normal text-sm md:text-md mt-1">
            {course.description && course.description.length > 70
              ? course.description.slice(0, 70) + "..."
              : course.description}
            </p>
        </div>
        <div className="grid grid-cols-5 gap-2 mt-3 lg:mt-0 overflow-visible">
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
        <p className="text-[#495057] text-sm md:text-base">
          {course.description && course.description.length > 130
              ? course.description.slice(0, 130) + "..."
              : course.description}</p>
      </div>
      <div className="flex flex-row gap-2 mb-4 items-center text-sm md:text-base">
        <h1 className="text-[#343A40] font-medium">Instructors:</h1>
        <div className="flex -space-x-2 mr-3">
          {course.instructors?.slice(0, 5).map((instructor, index) => (
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
          onClick={handlePrimaryClick}
          className="w-full text-sm md:text-base rounded-xl"
          disabled={isEnrolling}
        >
          {isEnrolling ? 'Processing…' : (isEnrolled ? 'Explore More' : 'Enroll Now')}
        </PrimaryButton>
      </div>
    </div>
  );
};

export default CourseCard;