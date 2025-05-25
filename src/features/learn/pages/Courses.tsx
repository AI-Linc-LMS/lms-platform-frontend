import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { getAllCourse } from '../../../services/enrolled-courses-content/courseContentApis';
import { VideoIcon, DocumentIcon, CodeIcon, FAQIcon } from '../../../commonComponents/icons/learnIcons/CourseIcons';
import PrimaryButton from '../../../commonComponents/common-buttons/primary-button/PrimaryButton';

// Assignment Icon since it's missing from CourseIcons
const AssignmentIcon = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 16 16"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M3.83594 2C3.83594 1.72386 4.0598 1.5 4.33594 1.5H11.1693C11.3007 1.5 11.4267 1.55268 11.5205 1.64645L13.6897 3.81569C13.7835 3.90946 13.8359 4.03533 13.8359 4.16667V13.5C13.8359 13.7761 13.6121 14 13.3359 14H4.33594C4.0598 14 3.83594 13.7761 3.83594 13.5V2ZM4.83594 2.5V13H12.8359V4.33333L10.8359 2.33333H4.83594Z"
      fill="#495057"
    />
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M6.33594 6.5C6.33594 6.22386 6.5598 6 6.83594 6H10.3359C10.6121 6 10.8359 6.22386 10.8359 6.5C10.8359 6.77614 10.6121 7 10.3359 7H6.83594C6.5598 7 6.33594 6.77614 6.33594 6.5Z"
      fill="#495057"
    />
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M6.33594 9.5C6.33594 9.22386 6.5598 9 6.83594 9H10.3359C10.6121 9 10.8359 9.22386 10.8359 9.5C10.8359 9.77614 10.6121 10 10.3359 10H6.83594C6.5598 10 6.33594 9.77614 6.33594 9.5Z"
      fill="#495057"
    />
  </svg>
);

// Define course type
interface Instructor {
  id: number;
  name: string;
  profile_pic?: string;
}

interface Course {
  id: number;
  title: string;
  description: string;
  stats: {
    video: { total: number };
    article: { total: number };
    coding_problem: { total: number };
    quiz: { total: number };
    assignment: { total: number };
  };
  instructors?: Instructor[];
  enrolled_students?: number;
}

// Stats block for showing counts of different content types
const StatBlock = ({ icon, count, label }: { icon: React.ReactNode, count: number, label: string }) => {
  // Ensure count is a number
  const displayCount = typeof count === 'object' ? 0 : Number(count) || 0;
  
  return (
    <div className="bg-[#F8F9FA] hover:bg-[#E9ECEF] rounded-xl p-2 md:p-3 flex flex-col items-center justify-center relative group transition-all duration-200">
      <div className="mb-1 md:mb-2">{icon}</div>
      <span className="text-center text-[#495057] font-medium text-sm md:text-base">{displayCount}</span>

      {/* Tooltip that appears on hover */}
      <div className="absolute opacity-0 group-hover:opacity-100 bottom-full left-1/2 transform -translate-x-1/2 mb-1 px-2 py-1 bg-[#343A40] text-white text-xs rounded pointer-events-none transition-opacity duration-200">
        {label}
        <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-[#343A40]"></div>
      </div>
    </div>
  );
};

// Course card component
const CourseCard = ({ course }: { course: Course }) => {
  const navigate = useNavigate();

  const handleEnrollClick = () => {
    navigate(`/courses/${course.id}`);
  };

  // Placeholder for stats counts
  const totalCounts = {
    videos: course.stats?.video?.total || 0,
    articles: course.stats?.article?.total || 0,
    problems: course.stats?.coding_problem?.total || 0,
    quizzes: course.stats?.quiz?.total || 0,
    assignments: course.stats?.assignment?.total || 0
  };

  return (
    <div className="w-full border border-[#80C9E0] p-4 rounded-2xl md:rounded-3xl bg-white flex flex-col h-full shadow-sm transition-all duration-300 transform hover:scale-[1.01]">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 md:gap-4 items-center">
        <div>
          <h1 className="font-bold font-sans text-lg text-[#343A40]">{course.title}</h1>
          <p className="text-[#6C757D] font-normal text-sm md:text-md mt-1">{course.description}</p>
        </div>
        <div className="grid grid-cols-5 gap-2 mt-3 lg:mt-0">
          <StatBlock icon={<VideoIcon />} count={totalCounts.videos} label="Videos" />
          <StatBlock icon={<DocumentIcon />} count={totalCounts.articles} label="Articles" />
          <StatBlock icon={<CodeIcon />} count={totalCounts.problems} label="Coding Problems" />
          <StatBlock icon={<FAQIcon />} count={totalCounts.quizzes} label="Quizzes" />
          <StatBlock icon={<AssignmentIcon />} count={totalCounts.assignments} label="Assignments" />
        </div>
      </div>

      <div className="w-full my-4">
        <p className="text-[#495057] text-sm md:text-base">{course.description}</p>
      </div>

      <div className="mt-auto pt-3 border-t border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            {course.instructors && course.instructors.length > 0 && (
              <>
                <div className="flex -space-x-2">
                  {course.instructors.slice(0, 3).map((instructor: Instructor, idx: number) => (
                    <img
                      key={idx}
                      src={instructor.profile_pic || 'https://via.placeholder.com/30'}
                      alt={instructor.name || 'Instructor'}
                      className="w-8 h-8 rounded-full border-2 border-white object-cover"
                      title={instructor.name}
                    />
                  ))}
                </div>
                <span className="ml-2 text-xs text-gray-600">
                  {course.enrolled_students ? `${course.enrolled_students} enrolled` : 'Trusted by experts'}
                </span>
              </>
            )}
          </div>
          <PrimaryButton
            onClick={handleEnrollClick}
            className="text-sm rounded-xl"
          >
            Enroll Now
          </PrimaryButton>
        </div>
      </div>
    </div>
  );
};

// Empty state component
const EmptyCoursesState = () => {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-6 bg-white rounded-3xl border border-[#80C9E0] shadow-sm transition-all duration-300 transform hover:scale-[1.01]">
      <svg className="w-20 h-20 text-[#2A8CB0] mb-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
      </svg>
      <h3 className="text-xl font-bold text-[#343A40] mb-2">No courses available</h3>
      <p className="text-[#6C757D] text-center max-w-md mb-8 font-sans text-[14px] md:text-[16px]">
        There are no courses available at the moment. Please check back later or contact our support team for assistance.
      </p>
    </div>
  );
};

// Search Icon Component
const SearchIcon = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 16 16"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M7.33333 12.6667C10.2789 12.6667 12.6667 10.2789 12.6667 7.33333C12.6667 4.38781 10.2789 2 7.33333 2C4.38781 2 2 4.38781 2 7.33333C2 10.2789 4.38781 12.6667 7.33333 12.6667Z"
      stroke="#6C757D"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M14 14L11.1 11.1"
      stroke="#6C757D"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

// Sort Icon Component
const SortIcon = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 16 16"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M2 4H14"
      stroke="#343A40"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
    <path
      d="M4 8H12"
      stroke="#343A40"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
    <path
      d="M6 12H10"
      stroke="#343A40"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
  </svg>
);

// Dropdown Component for Sort Menu
const SortDropdown = ({ selectedSort, setSelectedSort }: { selectedSort: string, setSelectedSort: (sort: string) => void }) => {
  const [isOpen, setIsOpen] = useState(false);
  
  const sortOptions = [
    { value: 'most_popular', label: 'Most Popular' },
    { value: 'highest_rated', label: 'Highest Rated' },
    { value: 'newest', label: 'Newest / Recently Added' },
    { value: 'price_low_high', label: 'Price - Low to High' },
    { value: 'price_high_low', label: 'Price - High to Low' }
  ];
  
  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 px-3 py-2 border border-[#DEE2E6] rounded-lg bg-white text-[#343A40] text-sm"
      >
        <SortIcon />
        <span>Sort</span>
      </button>
      
      {isOpen && (
        <div className="absolute right-0 mt-1 bg-white border border-[#DEE2E6] rounded-lg shadow-lg py-1 z-10 w-56 sm:right-0 sm:left-auto left-0 sm:origin-top-right origin-top-left">
          {sortOptions.map((option) => (
            <div 
              key={option.value}
              className={`px-4 py-2 text-sm cursor-pointer hover:bg-[#F8F9FA] flex items-center ${selectedSort === option.value ? 'text-[#343A40] font-medium' : 'text-[#495057]'}`}
              onClick={() => {
                setSelectedSort(option.value);
                setIsOpen(false);
              }}
            >
              {selectedSort === option.value && (
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                </svg>
              )}
              {option.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// Filter Category Component
const FilterCategory = ({ 
  title, 
  options, 
  selectedOptions, 
  setSelectedOptions 
}: { 
  title: string, 
  options: { id: string, label: string }[], 
  selectedOptions: string[],
  setSelectedOptions: (options: string[]) => void 
}) => {
  return (
    <div className="mb-5">
      <h3 className="font-medium text-[#343A40] mb-3">{title}</h3>
      <div className="space-y-2">
        {options.map((option) => (
          <div key={option.id} className="flex items-center">
            <input
              type="checkbox"
              id={option.id}
              checked={selectedOptions.includes(option.id)}
              onChange={(e) => {
                if (e.target.checked) {
                  setSelectedOptions([...selectedOptions, option.id]);
                } else {
                  setSelectedOptions(selectedOptions.filter(id => id !== option.id));
                }
              }}
              className="w-4 h-4 text-[#17627A] bg-gray-100 border-gray-300 rounded focus:ring-[#17627A] focus:ring-2"
            />
            <label htmlFor={option.id} className="ml-2 text-sm font-medium text-[#495057]">
              {option.label}
            </label>
          </div>
        ))}
      </div>
    </div>
  );
};

// Filter Toggle Icon Component
const FilterIcon = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 18 18"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M7.5 13.5H10.5"
      stroke="#343A40"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
    <path
      d="M4.5 9H13.5"
      stroke="#343A40"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
    <path
      d="M2.25 4.5H15.75"
      stroke="#343A40"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
  </svg>
);

// Main component
const Courses = () => {
  const clientId = Number(import.meta.env.VITE_CLIENT_ID) || 1;
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('most_popular');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  
  // Filter states
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedLevels, setSelectedLevels] = useState<string[]>([]);
  const [selectedPrices, setSelectedPrices] = useState<string[]>([]);
  const [selectedRatings, setSelectedRatings] = useState<string[]>([]);
  
  const categoryOptions = [
    { id: 'full_stack', label: 'Full Stack Development' },
    { id: 'front_end', label: 'Front-End Development' },
    { id: 'back_end', label: 'Back-End Development' },
    { id: 'ui_ux', label: 'UI/UX Design' },
    { id: 'data_science', label: 'Data Science & Analytics' },
    { id: 'marketing', label: 'Marketing' },
    { id: 'business', label: 'Business' },
  ];
  
  const levelOptions = [
    { id: 'beginner', label: 'Beginner' },
    { id: 'intermediate', label: 'Intermediate' },
    { id: 'pro', label: 'Pro' }
  ];
  
  const priceOptions = [
    { id: 'free', label: 'Free' },
    { id: 'paid', label: 'Paid' }
  ];
  
  const ratingOptions = [
    { id: '4_up', label: '4 and up' },
    { id: '3_up', label: '3 and up' }
  ];
  
  const toggleFilters = () => {
    setIsFilterOpen(!isFilterOpen);
  };
  
  const clearAllFilters = () => {
    setSelectedCategories([]);
    setSelectedLevels([]);
    setSelectedPrices([]);
    setSelectedRatings([]);
    setSearchQuery('');
  };
  
  const { data: courses, isLoading, error } = useQuery({
    queryKey: ['all-courses'],
    queryFn: () => getAllCourse(clientId),
  });
  
  // Filter courses based on selected filters and search query
  const filteredCourses = courses ? courses.filter((course: Course) => {
    // Search filter
    if (searchQuery && !course.title.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    
    // Apply other filters if implemented in the future
    
    return true;
  }) : [];
  

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
      
      {/* Mobile-only UI */}
      <div className="md:hidden">
        {/* Filters Button - Mobile UI */}
        <div className="mb-4">
          <button 
            className="flex items-center justify-between w-full p-3 bg-white border border-[#DEE2E6] rounded-lg text-[#343A40] shadow-sm"
            onClick={toggleFilters}
          >
            <div className="flex items-center space-x-2">
              <FilterIcon />
              <span className="font-medium">Filters</span>
            </div>
            <svg 
              className={`w-4 h-4 transition-transform duration-300 ${isFilterOpen ? 'rotate-180' : ''}`} 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24" 
              xmlns="http://www.w3.org/2000/svg"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
            </svg>
          </button>
        </div>
        
        {/* Filter Panel - Collapsible for Mobile */}
        <div className={`${isFilterOpen ? 'max-h-[1500px] opacity-100 mb-6' : 'max-h-0 opacity-0 overflow-hidden'} transition-all duration-500 ease-in-out`}>
          <div className="bg-white rounded-xl p-4 border border-[#DEE2E6]">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-[#343A40]">Filter By</h2>
              <button 
                onClick={clearAllFilters}
                className="text-sm text-[#17627A] hover:underline"
              >
                Clear All
              </button>
            </div>
            
            {/* Categories */}
            <FilterCategory 
              title="Categories" 
              options={categoryOptions} 
              selectedOptions={selectedCategories} 
              setSelectedOptions={setSelectedCategories} 
            />
            
            {/* Level/Difficulty */}
            <FilterCategory 
              title="Level/Difficulty" 
              options={levelOptions} 
              selectedOptions={selectedLevels} 
              setSelectedOptions={setSelectedLevels} 
            />
            
            {/* Price */}
            <FilterCategory 
              title="Price" 
              options={priceOptions} 
              selectedOptions={selectedPrices} 
              setSelectedOptions={setSelectedPrices} 
            />
            
            {/* Rating */}
            <FilterCategory 
              title="Rating" 
              options={ratingOptions} 
              selectedOptions={selectedRatings} 
              setSelectedOptions={setSelectedRatings} 
            />
          </div>
        </div>
        
        {/* Search Input - Mobile */}
        <div className="mb-4 w-full">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <SearchIcon />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by courses"
              className="w-full py-3 pl-10 pr-4 border border-[#DEE2E6] rounded-lg text-[#495057] focus:outline-none focus:ring-2 focus:ring-[#17627A] focus:border-transparent"
            />
          </div>
        </div>
        
        {/* Sort Dropdown - Mobile */}
        <div className="mb-6">
          <SortDropdown selectedSort={sortBy} setSelectedSort={setSortBy} />
        </div>
      </div>
      
      {/* Desktop UI - Original Layout */}
      <div className="hidden md:block">
        <div className="flex flex-col md:flex-row gap-6 mb-8">
          {/* Filter Section - Desktop */}
          <div className="w-full md:w-1/4 lg:w-1/5">
            <div className="bg-white rounded-xl p-4 border border-[#DEE2E6]">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-bold text-[#343A40]">Filter By</h2>
                <button 
                  onClick={clearAllFilters}
                  className="text-sm text-[#17627A] hover:underline"
                >
                  Clear All
                </button>
              </div>
              
              {/* Categories */}
              <FilterCategory 
                title="Categories" 
                options={categoryOptions} 
                selectedOptions={selectedCategories} 
                setSelectedOptions={setSelectedCategories} 
              />
              
              {/* Level/Difficulty */}
              <FilterCategory 
                title="Level/Difficulty" 
                options={levelOptions} 
                selectedOptions={selectedLevels} 
                setSelectedOptions={setSelectedLevels} 
              />
              
              {/* Price */}
              <FilterCategory 
                title="Price" 
                options={priceOptions} 
                selectedOptions={selectedPrices} 
                setSelectedOptions={setSelectedPrices} 
              />
              
              {/* Rating */}
              <FilterCategory 
                title="Rating" 
                options={ratingOptions} 
                selectedOptions={selectedRatings} 
                setSelectedOptions={setSelectedRatings} 
              />
            </div>
          </div>
          
          {/* Courses Section - Desktop */}
          <div className="w-full md:w-3/4 lg:w-4/5">
            {/* Search and Sort - Desktop */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
              <div className="relative w-full sm:w-auto flex-1 max-w-md">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <SearchIcon />
                </div>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by courses"
                  className="w-full py-2 pl-10 pr-4 border border-[#DEE2E6] rounded-lg text-[#495057] focus:outline-none focus:ring-2 focus:ring-[#17627A] focus:border-transparent"
                />
              </div>
              
              <SortDropdown selectedSort={sortBy} setSelectedSort={setSortBy} />
            </div>
            
            {/* Course Cards */}
            {hasNoCourses ? (
              <EmptyCoursesState /> 
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {filteredCourses.map((course: Course) => (
                  <CourseCard key={course.id} course={course} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Course Cards - Mobile only */}
      <div className="md:hidden">
        {hasNoCourses ? (
          <EmptyCoursesState /> 
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {filteredCourses.map((course: Course) => (
              <CourseCard key={course.id} course={course} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Courses; 