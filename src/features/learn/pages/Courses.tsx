import { useEffect, useState, useMemo, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "react-router-dom";
import { getAllCourse } from "../../../services/enrolled-courses-content/courseContentApis";
import CourseCard from "../components/courses/CourseCard";
import EmptyCoursesState from "../components/courses/EmptyCoursesState";
import MobileFilters from "../components/courses/MobileFilters";
import DesktopFilters from "../components/courses/DesktopFilters";
import DesktopSearch from "../components/courses/DesktopSearch";
// import AssessmentBanner from '../components/assessment/AssessmentBanner';
import AssessmentSuccessNotification from "../components/assessment/AssessmentSuccessNotification";
import { useCourseFilters } from "../hooks/useCourseFilters";
import { useTranslatedFilterOptions } from "../components/courses/useTranslatedFilterOptions";
import { adaptCourses } from "../utils/courseAdapter";
import { useTranslation } from "react-i18next";
// import { FiPlayCircle, FiArrowRight, FiClock, FiCheckCircle } from 'react-icons/fi';

interface AssessmentLocationState {
  assessmentCompleted?: boolean;
  score?: number;
  correctAnswers?: number;
  totalQuestions?: number;
}

// Main component
const Courses = () => {
  const { t } = useTranslation();
  const {
    categoryOptions,
    levelOptions,
    priceOptions,
    ratingOptions,
  } = useTranslatedFilterOptions();
  const clientId = Number(import.meta.env.VITE_CLIENT_ID) || 1;
  const location = useLocation() as unknown as {
    state: AssessmentLocationState;
  };
  // const navigate = useNavigate();
  const [showAssessmentNotification, setShowAssessmentNotification] =
    useState(false);
  const [assessmentResults, setAssessmentResults] = useState({
    score: 0,
    correctAnswers: 0,
    totalQuestions: 0,
  } as { score: number; correctAnswers: number; totalQuestions: number } | null);

  const {
    data: apiCourses,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["all-courses"],
    queryFn: () => getAllCourse(clientId),
  });

  // Check for assessment completion results
  useEffect(() => {
    if (location.state?.assessmentCompleted) {
      setAssessmentResults({
        score: location.state.score || 0,
        correctAnswers: location.state.correctAnswers || 0,
        totalQuestions: location.state.totalQuestions || 0,
      });
      setShowAssessmentNotification(true);

      // Clear the state to prevent showing notification on refresh
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  // Adapt API data to include fields needed for filtering (memoized)
  const courses = useMemo(
    () => adaptCourses(apiCourses || []),
    [apiCourses]
  );
  const [expandedCourseId, setExpandedCourseId] = useState<number | null>(null);

  // Memoize toggle handler to prevent unnecessary re-renders
  const handleToggleExpand = useCallback((courseId: number) => {
    setExpandedCourseId((prev) => (prev === courseId ? null : courseId));
  }, []);

  const {
    searchQuery,
    setSearchQuery,
    sortBy,
    setSortBy,
    isFilterOpen,
    selectedCategories,
    setSelectedCategories,
    selectedLevels,
    setSelectedLevels,
    selectedPrices,
    setSelectedPrices,
    selectedRatings,
    setSelectedRatings,
    toggleFilters,
    clearAllFilters,
    filteredCourses,
  } = useCourseFilters(courses);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#17627A]"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <h2 className="text-xl font-bold text-red-600 mb-2">
            Error loading courses
          </h2>
          <p className="text-gray-600">Please try again later.</p>
        </div>
      </div>
    );
  }

  const hasNoCourses = !filteredCourses || filteredCourses.length === 0;

  return (
    <div className="px-4 md:px-6 py-6">
      {/* Assessment Success Notification */}
      {showAssessmentNotification && assessmentResults && (
        <AssessmentSuccessNotification
          score={assessmentResults.score}
          correctAnswers={assessmentResults.correctAnswers}
          totalQuestions={assessmentResults.totalQuestions}
          onClose={() => setShowAssessmentNotification(false)}
        />
      )}

      <div className="mb-6">
        <h1 className="text-[var(--neutral-500)] font-bold text-[18px] md:text-[22px] ">
          {t("courses.ourCoursesAndAssessments")}
        </h1>
        <p className="text-[var(--neutral-300)]  font-normal text-[14px] md:text-[16px]">
          {hasNoCourses
            ? t("courses.noCoursesAvailable")
            : t("courses.coursesListDescription")}
        </p>
      </div>

      {/* Mobile Filters */}
      <MobileFilters
        isFilterOpen={isFilterOpen}
        toggleFilters={toggleFilters}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        sortBy={sortBy}
        setSortBy={setSortBy}
        selectedCategories={selectedCategories}
        setSelectedCategories={setSelectedCategories}
        selectedLevels={selectedLevels}
        setSelectedLevels={setSelectedLevels}
        selectedPrices={selectedPrices}
        setSelectedPrices={setSelectedPrices}
        selectedRatings={selectedRatings}
        setSelectedRatings={setSelectedRatings}
        clearAllFilters={clearAllFilters}
        categoryOptions={categoryOptions}
        levelOptions={levelOptions}
        priceOptions={priceOptions}
        ratingOptions={ratingOptions}
      />

      {/* Desktop Layout */}
      <div className="hidden md:flex flex-col md:flex-row gap-6 mb-8">
        {/* Desktop Filters Sidebar */}
        <DesktopFilters
          selectedCategories={selectedCategories}
          setSelectedCategories={setSelectedCategories}
          selectedLevels={selectedLevels}
          setSelectedLevels={setSelectedLevels}
          selectedPrices={selectedPrices}
          setSelectedPrices={setSelectedPrices}
          selectedRatings={selectedRatings}
          setSelectedRatings={setSelectedRatings}
          clearAllFilters={clearAllFilters}
          categoryOptions={categoryOptions}
          levelOptions={levelOptions}
          priceOptions={priceOptions}
          ratingOptions={ratingOptions}
        />

        {/* Main Content Area */}
        <div className="w-full md:w-3/4 lg:w-4/5">
          {/* Desktop Search and Sort */}
          <DesktopSearch
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            sortBy={sortBy}
            setSortBy={setSortBy}
          />

          {/* Course Cards for Desktop */}
          {hasNoCourses ? (
            <EmptyCoursesState />
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {filteredCourses.map((course) => (
                <>
                  <CourseCard
                    key={`regular-${course.id}`}
                    course={course as any}
                    clientId={clientId}
                    isExpanded={expandedCourseId === course.id}
                    onToggleExpand={() => handleToggleExpand(course.id)}
                  />
                </>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Mobile Course Cards */}
      <div className="md:hidden">
        {hasNoCourses ? (
          <EmptyCoursesState />
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {filteredCourses.map((course) => (
              <CourseCard
                key={`regular-${course.id}`}
                course={course as any}
                clientId={clientId}
                isExpanded={expandedCourseId === course.id}
                onToggleExpand={() =>
                  setExpandedCourseId((prev) =>
                    prev === course.id ? null : course.id
                  )
                }
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Courses;
