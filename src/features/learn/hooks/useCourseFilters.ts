import { useState, useMemo } from "react";
import { Course } from "../types/course.types";

export interface CourseFilters {
  searchQuery: string;
  sortBy: string;
  selectedCategories: string[];
  selectedLevels: string[];
  selectedPrices: string[];
  selectedRatings: string[];
}

export const useCourseFilters = (courses: Course[] | undefined) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("most_popular");
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
    setSearchQuery("");
  };

  // Apply filters to courses
  const filteredCourses = useMemo(() => {
    if (!courses || !Array.isArray(courses)) return [];

    return courses.filter((course) => {
      // Search query filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const titleMatch = course.title?.toLowerCase().includes(query);
        const descMatch = course.description?.toLowerCase().includes(query);

        if (!titleMatch && !descMatch) {
          return false;
        }
      }

      // Category filter
      if (selectedCategories.length > 0 && course.categories) {
        // Check if the course belongs to any of the selected categories
        if (
          !selectedCategories.some((cat) => course.categories?.includes(cat))
        ) {
          return false;
        }
      }

      // Level/Difficulty filter
      if (selectedLevels.length > 0 && course.level) {
        if (!selectedLevels.includes(course.level)) {
          return false;
        }
      }

      // Price filter
      if (selectedPrices.length > 0 && course.price !== undefined) {
        const isPaid = course.price > 0;
        const courseType = isPaid ? "paid" : "free";
        if (!selectedPrices.includes(courseType)) {
          return false;
        }
      }

      // Rating filter
      if (selectedRatings.length > 0 && course.rating !== undefined) {
        if (selectedRatings.includes("4_up") && course.rating < 4) {
          return false;
        }
        if (
          selectedRatings.includes("3_up") &&
          course.rating < 3 &&
          !selectedRatings.includes("4_up")
        ) {
          // If 4+ is also selected, we don't need to check 3+ (since 4+ is more restrictive)
          return false;
        }
      }

      return true;
    });
  }, [
    courses,
    searchQuery,
    selectedCategories,
    selectedLevels,
    selectedPrices,
    selectedRatings,
  ]);

  // Apply sorting to filtered courses
  const sortedAndFilteredCourses = useMemo(() => {
    if (!filteredCourses.length) return [];

    return [...filteredCourses].sort((a, b) => {
      switch (sortBy) {
        case "most_popular":
          // Sort by enrolled students (most popular)
          return (b.enrolled_students || 0) - (a.enrolled_students || 0);

        case "highest_rated": {
          // Sort by rating
          const ratingA = a.rating || 0;
          const ratingB = b.rating || 0;
          return ratingB - ratingA;
        }

        case "newest": {
          // Sort by creation date (newest first)
          // First try created_at, fallback to updated_at
          const dateFieldA = a.created_at || a.updated_at || "";
          const dateFieldB = b.created_at || b.updated_at || "";
          const dateA = dateFieldA ? new Date(dateFieldA).getTime() : 0;
          const dateB = dateFieldB ? new Date(dateFieldB).getTime() : 0;
          return dateB - dateA;
        }

        case "price_low_high": {
          // Sort by price low to high
          const priceA = a.price || 0;
          const priceB = b.price || 0;
          return priceA - priceB;
        }

        case "price_high_low": {
          // Sort by price high to low
          const priceA = a.price || 0;
          const priceB = b.price || 0;
          return priceB - priceA;
        }

        default:
          return 0;
      }
    });
  }, [filteredCourses, sortBy]);

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
    filteredCourses: sortedAndFilteredCourses,
  };
};
