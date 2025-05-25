import { Course } from '../types/course.types';

interface ApiCourse {
  id: number;
  title: string;
  description: string;
  categories?: string[];
  level?: string;
  price?: number;
  rating?: number;
  [key: string]: unknown; // Allow any other properties from API with more specific type
}

/**
 * Adapts API course data to include properties needed for filtering and sorting
 * This is a temporary solution until the API provides these fields
 */
export const adaptCourses = (courses: ApiCourse[]): Course[] => {
  if (!courses || !Array.isArray(courses)) return [];
  
  return courses.map(course => {
    // Extract existing data
    const adaptedCourse: Course = {
      ...course as unknown as Course, // Safe cast since we're adding missing fields
      // Add sample data for demonstration if not present in API
      categories: course.categories || getDemoCategories(course.title),
      level: course.level || getDemoLevel(course.id),
      price: course.price !== undefined ? course.price : getDemoPrice(course.id),
      rating: course.rating !== undefined ? course.rating : getDemoRating(course.id),
    };
    
    return adaptedCourse;
  });
};

// Helper functions to generate demo data for testing filters
function getDemoCategories(title: string): string[] {
  const titleLower = title?.toLowerCase() || '';
  const categories = [];
  
  // Assign categories based on title keywords (just for demo)
  if (titleLower.includes('web') || titleLower.includes('react') || titleLower.includes('javascript')) {
    categories.push('front_end');
  }
  
  if (titleLower.includes('node') || titleLower.includes('python') || titleLower.includes('api')) {
    categories.push('back_end');
  }
  
  if (titleLower.includes('full') || titleLower.includes('stack') || 
      (categories.includes('front_end') && categories.includes('back_end'))) {
    categories.push('full_stack');
  }
  
  if (titleLower.includes('design') || titleLower.includes('ui') || titleLower.includes('ux')) {
    categories.push('ui_ux');
  }
  
  if (titleLower.includes('data') || titleLower.includes('analytics') || titleLower.includes('machine')) {
    categories.push('data_science');
  }
  
  if (titleLower.includes('market') || titleLower.includes('seo') || titleLower.includes('content')) {
    categories.push('marketing');
  }
  
  if (titleLower.includes('business') || titleLower.includes('management') || titleLower.includes('finance')) {
    categories.push('business');
  }
  
  // If no categories detected, assign a random one
  if (categories.length === 0) {
    const allCategories = ['full_stack', 'front_end', 'back_end', 'ui_ux', 'data_science', 'marketing', 'business'];
    categories.push(allCategories[Math.floor(Math.random() * allCategories.length)]);
  }
  
  return categories;
}

function getDemoLevel(id: number): string {
  // Use course ID to deterministically assign a level
  const levels = ['beginner', 'intermediate', 'pro'];
  return levels[id % 3];
}

function getDemoPrice(id: number): number {
  // Even IDs are free, odd IDs are paid
  return id % 2 === 0 ? 0 : 29.99 + (id % 5) * 10;
}

function getDemoRating(id: number): number {
  // Generate a rating between 2.5 and 5.0
  return 2.5 + (id % 6) * 0.5;
} 