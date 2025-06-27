import  { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useLocation, useNavigate } from 'react-router-dom';
import { getAllCourse } from '../../../services/enrolled-courses-content/courseContentApis';
import CourseCard from '../components/courses/CourseCard';
import EmptyCoursesState from '../components/courses/EmptyCoursesState';
import MobileFilters from '../components/courses/MobileFilters';
import DesktopFilters from '../components/courses/DesktopFilters';
import DesktopSearch from '../components/courses/DesktopSearch';
import AssessmentBanner from '../components/assessment/AssessmentBanner';
import AssessmentSuccessNotification from '../components/assessment/AssessmentSuccessNotification';
import { useCourseFilters } from '../hooks/useCourseFilters';
import { categoryOptions, levelOptions, priceOptions, ratingOptions } from '../components/courses/FilterOptions';
import { adaptCourses } from '../utils/courseAdapter';
import { FiPlayCircle, FiArrowRight, FiClock, FiCheckCircle } from 'react-icons/fi';

// Main component
const Courses = () => {
  const clientId = Number(import.meta.env.VITE_CLIENT_ID) || 1;
  const location = useLocation();
  const navigate = useNavigate();
  const [showAssessmentNotification, setShowAssessmentNotification] = useState(false);
  const [assessmentResults, setAssessmentResults] = useState<{
    score: number;
    correctAnswers: number;
    totalQuestions: number;
  } | null>(null);

  const { data: apiCourses, isLoading, error } = useQuery({
    queryKey: ['all-courses'],
    queryFn: () => getAllCourse(clientId),
  });

  // Check for assessment completion results
  useEffect(() => {
    if (location.state?.assessmentCompleted) {
      setAssessmentResults({
        score: location.state.score,
        correctAnswers: location.state.correctAnswers,
        totalQuestions: location.state.totalQuestions,
      });
      setShowAssessmentNotification(true);
      
      // Clear the state to prevent showing notification on refresh
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  // Adapt API data to include fields needed for filtering
  const courses = adaptCourses(apiCourses || []);

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
    filteredCourses
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
          <h2 className="text-xl font-bold text-red-600 mb-2">Error loading courses</h2>
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
        <h1 className="text-[#343A40] font-bold text-[18px] md:text-[22px] font-sans">
          Our Courses & Assessments
        </h1>
        <p className="text-[#6C757D] font-sans font-normal text-[14px] md:text-[16px]">
          {hasNoCourses ? "No courses available at the moment" : "Here's the List of all our Courses and available Assessments"}
        </p>
      </div>

      {/* Assessments Section */}
      <div className="mb-8">
        <div className="bg-gradient-to-r from-[#EFF9FC] to-[#E0F4F8] rounded-2xl p-6 border border-[#80C9E0]">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <FiPlayCircle className="h-6 w-6 text-[#2C5F7F]" />
                <h2 className="text-xl font-bold text-[#2C5F7F]">
                  Available Assessments
                </h2>
              </div>
              <p className="text-[#2C5F7F] mb-4">
                Test your skills with our comprehensive assessments. Choose from free and paid options to evaluate your knowledge and get personalized feedback.
              </p>
              
              {/* Quick Assessment Info */}
              <div className="flex flex-wrap gap-4 text-sm">
                <div className="flex items-center gap-1">
                  <FiCheckCircle className="h-4 w-4 text-green-600" />
                  <span className="text-gray-700">Free Assessments Available</span>
                </div>
                <div className="flex items-center gap-1">
                  <FiClock className="h-4 w-4 text-[#2C5F7F]" />
                  <span className="text-gray-700">30-60 minute duration</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-[#2C5F7F]">🏆</span>
                  <span className="text-gray-700">Certificates available</span>
                </div>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => navigate('/assessments')}
                className="inline-flex items-center gap-2 px-6 py-3 bg-[#2C5F7F] text-white rounded-xl font-medium hover:bg-[#1a4a5f] transition-colors shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                <FiPlayCircle className="h-4 w-4" />
                View All Assessments
                <FiArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Assessment Banner */}
      <AssessmentBanner />

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
                <CourseCard key={course.id} course={course} />
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
              <CourseCard key={course.id} course={course} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Courses; 