
import { useQuery } from '@tanstack/react-query';
import { getAllCourse } from '../../../services/enrolled-courses-content/courseContentApis';
import CourseCard from '../components/courses/CourseCard';
import EmptyCoursesState from '../components/courses/EmptyCoursesState';
import MobileFilters from '../components/courses/MobileFilters';
import DesktopFilters from '../components/courses/DesktopFilters';
import DesktopSearch from '../components/courses/DesktopSearch';
import { useCourseFilters } from '../hooks/useCourseFilters';
import { categoryOptions, levelOptions, priceOptions, ratingOptions } from '../components/courses/FilterOptions';
import { adaptCourses } from '../utils/courseAdapter';

// Main component
const Courses = () => {
  const clientId = Number(import.meta.env.VITE_CLIENT_ID) || 1;

  const { data: apiCourses, isLoading, error } = useQuery({
    queryKey: ['all-courses'],
    queryFn: () => getAllCourse(clientId),
  });

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
      <div className="mb-6">
        <h1 className="text-[#343A40] font-bold text-[18px] md:text-[22px] font-sans">
          Our Courses
        </h1>
        <p className="text-[#6C757D] font-sans font-normal text-[14px] md:text-[16px]">
          {hasNoCourses ? "No courses available at the moment" : "Here's the List of all our Courses"}
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