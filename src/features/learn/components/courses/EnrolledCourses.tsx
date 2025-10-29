import React, { useEffect, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useDispatch, useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import { useLocation } from "react-router-dom";
import { getEnrolledCourses } from "../../../../services/enrolled-courses-content/coursesApis";
import { setCourses } from "../../../../redux/slices/courseSlice";
import { RootState } from "../../../../redux/store";
import { Course } from "../../types/final-course.types";
import PrimaryButton from "../../../../commonComponents/common-buttons/primary-button/PrimaryButton";
import CourseCardV2 from "./course-card-v2/CourseCardV2";

interface EnrolledCoursesProps {
  className?: string;
}

export const transformCourseData = (backendCourse: Course): Course => {
  // Backend data already matches our Course interface structure
  // Just ensure we have the expected data structure
  return {
    ...backendCourse,
    // Ensure instructor IDs are numbers as expected by interface
    instructors:
      backendCourse.instructors?.map((instructor) => ({
        id: instructor.id,
        name: instructor.name,
        bio: instructor.bio || "",
        profile_pic_url: instructor.profile_pic_url || undefined,
        linkedin_profile: instructor.linkedin_profile || undefined,
      })) || [],
    // Add frontend-specific fields with default values
    is_enrolled: true, // Since this is enrolled courses
    liked_count: backendCourse.liked_by?.length || 0,
    is_liked_by_current_user: false, // TODO: Check if current user liked
    rating: backendCourse.rating || 0, // Default rating - should come from backend
    // Generate modules from stats for backwards compatibility
    modules: [
      {
        id: 1,
        title: "Course Content",
        weekno: 1,
        completion_percentage: 0,
        submodules: [
          {
            id: 1,
            title: "Content Overview",
            description: "Course content statistics",
            order: 1,
            article_count: backendCourse.stats?.article?.total || 0,
            assignment_count: backendCourse.stats?.assignment?.total || 0,
            coding_problem_count:
              backendCourse.stats?.coding_problem?.total || 0,
            quiz_count: backendCourse.stats?.quiz?.total || 0,
            video_count: backendCourse.stats?.video?.total || 0,
          },
        ],
      },
    ],
  };
};

// Empty state component
const EmptyCoursesState = () => {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col items-center justify-center py-12 px-6 bg-white rounded-xl border border-[var(--primary-200)] shadow-sm transition-all duration-300 transform hover:scale-[1.01]">
      <svg
        className="w-20 h-20 text-[var(--primary-400)] mb-6"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
        />
      </svg>
      <h3 className="text-xl font-bold text-[var(--neutral-500)] mb-2">
        {t("dashboard.continueLearning.noCourses.title")}
      </h3>
      <p className="text-[var(--neutral-300)] text-center max-w-md mb-8  text-[14px] md:text-[16px]">
        {t("dashboard.continueLearning.noCourses.description")}
      </p>
      <PrimaryButton
        onClick={() => (window.location.href = "/")}
        className="max-w-xs transition-all duration-200 transform hover:scale-95"
      >
        {t("dashboard.continueLearning.noCourses.button")}
      </PrimaryButton>
    </div>
  );
};

const EnrolledCourses: React.FC<EnrolledCoursesProps> = ({
  className = "",
}) => {
  const clientId = import.meta.env.VITE_CLIENT_ID;
  const dispatch = useDispatch();
  const { t } = useTranslation();
  const location = useLocation();
  const queryClient = useQueryClient();
  const Courses = useSelector(
    (state: RootState) => state.courses.courses
  ) as unknown as Course[];
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const { data, isLoading, error } = useQuery({
    queryKey: ["Courses"],
    queryFn: () => getEnrolledCourses(clientId),
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    refetchOnReconnect: true,
    staleTime: 0, // Consider data stale immediately
    gcTime: 1000 * 60 * 5, // Keep in cache for 5 minutes
  });

  //console.log("enrolled courses data:", data);

  useEffect(() => {
    if (data) {
      dispatch(setCourses(data));
    }
  }, [data, dispatch]);

  // Force refetch when page becomes visible (user returns from another page)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        // Page is now visible, invalidate and refetch courses
        queryClient.invalidateQueries({ queryKey: ["Courses"] });
        // Also refresh streak data when courses are refreshed
        queryClient.invalidateQueries({ queryKey: ["streakTable", clientId] });
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [queryClient, clientId]);

  // Refetch when navigating back to this component
  useEffect(() => {
    // Only invalidate if we're on a dashboard/learn page
    if (location.pathname === "/" || location.pathname.includes("/learn")) {
      queryClient.invalidateQueries({ queryKey: ["Courses"] });
      // Also refresh streak data when navigating back to dashboard/learn
      queryClient.invalidateQueries({ queryKey: ["streakTable", clientId] });
    }
  }, [location.pathname, queryClient, clientId]);

  const handleCarouselScroll = () => {
    const sc = scrollContainerRef.current;
    if (!sc) return;
    const scrollLeft = sc.scrollLeft;
    const children = Array.from(sc.children) as HTMLElement[];

    let activeDotIndex = 0;
    let minDiff = Infinity;

    children.forEach((child, index) => {
      const diff = Math.abs(child.offsetLeft - scrollLeft);
      if (diff < minDiff) {
        minDiff = diff;
        activeDotIndex = index;
      }
    });

    setActiveIndex(activeDotIndex);
  };

  const handleDotClick = (index: number) => {
    const scrollContainer = scrollContainerRef.current;
    if (scrollContainer && scrollContainer.children.length > index) {
      const cardElement = scrollContainer.children[index] as HTMLDivElement;
      if (cardElement) {
        scrollContainer.scrollTo({
          left: cardElement.offsetLeft,
          behavior: "smooth",
        });
      }
    }
  };

  if (isLoading) return <p>{t("courses.loading")}</p>;
  if (error) return <p>{t("courses.error")}</p>;

  // Handle empty courses array
  const hasNoCourses = !Courses || Courses.length === 0;

  return (
    <div className="overflow-visible">
      <div className="flex justify-between items-center">
        <div className="md:mb-4 mb-2">
          <h1 className="text-[var(--neutral-500)] font-bold text-[18px] md:text-[22px] ">
            {t("dashboard.continueLearning.title")}
          </h1>
          <p className="text-[var(--neutral-300)]  font-normal text-[14px] md:text-[16px]">
            {hasNoCourses
              ? t("dashboard.continueLearning.noCoursesSubtitle")
              : t("dashboard.continueLearning.subtitle")}
          </p>
        </div>
      </div>

      {hasNoCourses ? (
        <EmptyCoursesState />
      ) : (
        <>
          <div
            ref={scrollContainerRef}
            onScroll={handleCarouselScroll}
            className={`flex overflow-x-auto overflow-y-visible scroll-smooth space-x-4 transition-all duration-300 md:pt-8 pt-3 ${className}`}
            style={{ scrollSnapType: "x mandatory" }}
          >
            {Courses.map((course: Course) => (
              <div
                key={course.id}
                className="flex-shrink-0 w-full md:w-1/2 scroll-snap-align-start transition-transform duration-300 overflow-visible"
                style={{ scrollSnapAlign: "start" }}
              >
                <CourseCardV2 course={course} enrolled={true} />
              </div>
            ))}
          </div>
          {!hasNoCourses && (
            <div className="flex justify-center items-center space-x-3 pt-4">
              {Courses.map((_, index) => (
                <button
                  key={index}
                  onClick={() => handleDotClick(index)}
                  className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${
                    activeIndex === index
                      ? "bg-gray-400 scale-125"
                      : "bg-gray-300"
                  }`}
                  aria-label={`Go to slide ${index + 1}`}
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default EnrolledCourses;
