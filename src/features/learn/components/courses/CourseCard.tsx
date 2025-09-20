import React, { useEffect, useState } from "react";
import { Course } from "../../types/course.types";
import { useNavigate } from "react-router-dom";

import { enrollInCourse } from "../../../../services/continue-course-learning/continueCourseApis";
import CourseCardV2 from "./course-card-v2/CourseCardV2";
import CardHelper from "./CardHelperNonExpanded";
import CardHelperExpanded from "./CardHelperExpanded";

interface CourseCardProps {
  course?: Course;
  className?: string;
  isLoading?: boolean;
  error?: Error | null;
  clientId?: number;
  enrolled?: boolean;
  isExpanded: boolean; // ✅ comes from parent
  onToggleExpand: () => void; // ✅ controlled by parent
}

const CourseCard: React.FC<CourseCardProps> = ({
  course,
  className = "",
  isLoading = false,
  error = null,
  clientId = 1,
  enrolled = false,
  isExpanded,
  onToggleExpand,
}) => {
  const navigate = useNavigate();
  const [isEnrolling, setIsEnrolling] = useState(false);
  const [showSuccessToast, setShowSuccessToast] = useState(false);

  const isFree = course?.is_free === true || Number(course?.price) === 0;
  const backendSaysEnrolled = course?.is_enrolled === true;
  const isInitiallyEnrolled = !!course && (backendSaysEnrolled || enrolled);
  const [isEnrolled, setIsEnrolled] = useState<boolean>(isInitiallyEnrolled);

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

    if (!isExpanded) {
      onToggleExpand(); // ✅ parent expands
      return;
    }

    if (isFree) {
      try {
        setIsEnrolling(true);
        await enrollInCourse(clientId, course.id);
        setIsEnrolled(true);
        setShowSuccessToast(true);
        window.dispatchEvent(new Event("course-enrolled"));
        setTimeout(() => {
          setShowSuccessToast(false);
          navigate(`/courses/${course.id}`);
        }, 900);
      } catch (err: unknown) {
        const status =
          typeof err === "object" &&
          err &&
          "response" in err &&
          (err as { response?: { status?: number } }).response?.status;
        const detail =
          typeof err === "object" &&
          err &&
          "response" in err &&
          (err as { response?: { data?: { detail?: string } } }).response?.data
            ?.detail;

        if (
          status === 409 ||
          (status === 400 &&
            typeof detail === "string" &&
            /already\s*enrolled/i.test(detail))
        ) {
          setIsEnrolled(true);
          window.dispatchEvent(new Event("course-enrolled"));
          navigate(`/courses/${course.id}`);
          return;
        }
        alert("Enrollment failed. Please try again.");
        return;
      } finally {
        setIsEnrolling(false);
      }
    } else {
      navigate(`/courses/${course.id}`);
    }
  };

  const handleIconAction = (action: string) => {
    const showNotification = (
      message: string,
      type: "success" | "error" | "info" = "info"
    ) => {
      const existingNotification = document.querySelector(".notification");
      if (existingNotification) existingNotification.remove();

      const notification = document.createElement("div");
      notification.className = `notification notification-${type}`;
      notification.textContent = message;

      const bgColors = {
        success: "#10b981",
        error: "#ef4444",
        info: "#3b82f6",
      };
      notification.style.cssText = `
        position: fixed; top: 20px; right: 20px; left: 20px; margin: 0 auto;
        max-width: 300px; padding: 16px 24px; border-radius: 8px; color: white; 
        font-weight: 600; z-index: 1000; transform: translateY(-100%); 
        transition: transform 0.3s ease; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        background: ${bgColors[type]}; text-align: center;
      `;

      document.body.appendChild(notification);
      setTimeout(() => (notification.style.transform = "translateY(0)"), 100);
      setTimeout(() => {
        notification.style.transform = "translateY(-100%)";
        setTimeout(() => notification.parentNode && notification.remove(), 300);
      }, 4000);
    };

    switch (action) {
      case "syllabus":
        showNotification("Opening course syllabus...", "info");
        break;
      case "preview":
        showNotification("Loading video preview...", "info");
        break;
      case "mentor":
        showNotification("Connecting you with a mentor...", "info");
        break;
      case "certificate":
        showNotification("Loading sample certificate...", "info");
        break;
    }
  };

  const totalCounts = {
    videos: course?.stats?.video?.total || 0,
    articles: course?.stats?.article?.total || 0,
    problems: course?.stats?.coding_problem?.total || 0,
    quizzes: course?.stats?.quiz?.total || 0,
    assignments: course?.stats?.assignment?.total || 0,
  };

  const courseRating = course?.rating;
  const coursePrice = course?.price;
  const courseLevel = course?.difficulty_level;
  const courseDuration = course?.duration_in_hours;

  if (isLoading || !course || error) {
    return (
      <div
        className={`bg-white rounded-2xl border border-blue-100 shadow-lg max-w-md w-full overflow-hidden animate-pulse ${className}`}
      >
        <div className="p-5 border-b border-gray-100">
          <div className="flex items-center justify-between mb-2">
            <div className="h-8 bg-gray-200 rounded w-3/4"></div>
            <div className="w-9 h-9 bg-gray-200 rounded-full"></div>
          </div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
        <div className="p-4">
          <div className="flex justify-between items-center mb-4">
            <div className="flex gap-1.5">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-5 bg-gray-200 rounded w-12"></div>
              ))}
            </div>
            <div className="h-4 bg-gray-200 rounded w-16"></div>
          </div>
          <div className="h-10 bg-gray-200 rounded w-full"></div>
        </div>
      </div>
    );
  }

  if (isEnrolled) {
    return (
      <CourseCardV2 course={course} enrolled={true} className={className} />
    );
  }

  return (
    <>
      {!isExpanded && onToggleExpand ? (
        <CardHelper
          course={course}
          isExpanded={false}
          isEnrolling={isEnrolling}
          handlePrimaryClick={handlePrimaryClick}
          handleIconAction={handleIconAction}
          courseDuration={courseDuration}
          courseLevel={courseLevel}
          totalCounts={totalCounts}
          coursePrice={coursePrice}
          courseRating={courseRating}
          toggleExpanded={onToggleExpand}
          showSuccessToast={showSuccessToast}
        />
      ) : (
        <CardHelperExpanded
          course={course}
          isExpanded={true}
          isEnrolling={isEnrolling}
          handlePrimaryClick={handlePrimaryClick}
          handleIconAction={handleIconAction}
          courseDuration={courseDuration}
          courseLevel={courseLevel}
          totalCounts={totalCounts}
          coursePrice={coursePrice}
          courseRating={courseRating}
          toggleExpanded={onToggleExpand} // ✅ parent handler
          showSuccessToast={showSuccessToast}
        />
      )}
    </>
  );
};

export default CourseCard;
