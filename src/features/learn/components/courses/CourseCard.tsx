import React, { useEffect, useState } from "react";
import { Course } from "../../types/course.types";
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
  enrolled?: boolean; // optional external flag to force Explore More
}

const CourseCard: React.FC<CourseCardProps> = ({ course, className = "", isLoading = false, error = null, clientId = 1, enrolled = false }) => {
  const navigate = useNavigate();
  const [isEnrolling, setIsEnrolling] = useState(false);
  const [showSuccessToast, setShowSuccessToast] = useState(false);

  const isFree = course?.is_free === true || course?.price === 0;
  const backendSaysEnrolled = course?.is_enrolled === true;

  const isInitiallyEnrolled = !!course && (backendSaysEnrolled || enrolled);
  const [isEnrolled, setIsEnrolled] = useState<boolean>(isInitiallyEnrolled);

  // Sync from external prop/backend if it changes to true
  useEffect(() => {
    if (backendSaysEnrolled && !isEnrolled) setIsEnrolled(true);
  }, [backendSaysEnrolled, isEnrolled]);
  useEffect(() => {
    if (enrolled && !isEnrolled) setIsEnrolled(true);
  }, [enrolled, isEnrolled]);

  const handlePrimaryClick = async () => {
    if (!course) return;

    if (isEnrolled) {
      navigate(`/courses/${course.id}`);
      return;
    }

    if (isFree) {
      try {
        setIsEnrolling(true);
        await enrollInCourse(clientId, course.id);
        setIsEnrolled(true);
        setShowSuccessToast(true);
        window.dispatchEvent(new Event('course-enrolled'));
        setTimeout(() => {
          setShowSuccessToast(false);
          navigate(`/courses/${course.id}`);
        }, 900);
      } catch (err: unknown) {
        const status = typeof err === 'object' && err && 'response' in err && (err as { response?: { status?: number } }).response?.status;
        const detail = typeof err === 'object' && err && 'response' in err && (err as { response?: { data?: { detail?: string } } }).response?.data?.detail;
        // Treat already-enrolled as success
        if (status === 409 || (status === 400 && typeof detail === 'string' && /already\s*enrolled/i.test(detail))) {
          setIsEnrolled(true);
          window.dispatchEvent(new Event('course-enrolled'));
          navigate(`/courses/${course.id}`);
          return;
        }
        alert('Enrollment failed. Please try again.');
        return;
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
            <h1 className="font-bold text-lg text-[#343A40]">{course.title}</h1>
            {isFree && (
              <div className="mt-1 flex items-center gap-2 bg-green-50 border border-green-200 text-green-700 rounded-xl px-4 py-2 w-fit">
                <span className="text-sm font-semibold">Free</span>
              </div>
            )}
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
        <button
          onClick={handlePrimaryClick}
          className={`w-full px-8 py-3 text-lg font-medium text-white ${!isEnrolled ? 'bg-green-600 hover:bg-green-700' : 'bg-[#255C79] hover:bg-[#1E4A63]'} rounded-xl  transition-colors duration-200`}
        >
          {isEnrolling ? 'Processing…' : (isEnrolled ? 'Explore More' : 'Enroll Now')}
        </button>
      </div>
    </div>
  );
};

export default CourseCard;