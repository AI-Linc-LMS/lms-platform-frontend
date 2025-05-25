import { useState } from 'react';
import { Course } from '../types/course.types';

export interface CourseFilters {
  searchQuery: string;
  sortBy: string;
  selectedCategories: string[];
  selectedLevels: string[];
  selectedPrices: string[];
  selectedRatings: string[];
}

export const useCourseFilters = (courses: Course[] | undefined) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('most_popular');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  
  // Filter states
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedLevels, setSelectedLevels] = useState<string[]>([]);
  const [selectedPrices, setSelectedPrices] = useState<string[]>([]);
  const [selectedRatings, setSelectedRatings] = useState<string[]>([]);
  
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
  
  // Filter courses based on selected filters and search query
  const filteredCourses = courses ? courses.filter((course: Course) => {
    // Search filter
    if (searchQuery && !course.title.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    
    // Apply other filters if implemented in the future
    
    return true;
  }) : [];
  
  return {
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
  };
}; 