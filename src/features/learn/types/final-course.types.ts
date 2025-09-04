/**
 * BACKEND API COURSE INTERFACE
 * This matches the exact structure from the backend API response.
 */
export interface Course {
  // Core course identifiers (from backend)
  id: number;
  title: string;
  description: string;
  slug: string;
  price: number;
  is_free: boolean;
  
  // Course metadata (from backend)
  difficulty_level: string; // "Medium", "Beginner", "Advanced"
  duration_in_hours: number;
  certificate_available: boolean;
  language: string;
  subtitle?: string | null;
  
  // Publishing status (from backend)
  published: boolean;
  client: number; // Client ID
  
  // Course content and requirements (from backend)
  learning_objectives: string;
  requirements: string;
  preview_video_url?: string | null;
  thumbnail?: string | null;
  
  // Enrollment and students (from backend)
  enrolled_students: {
    total: number;
    students_profile_pic?: string[]; // May not be in current backend response
  };
  
  // Course statistics (from backend)
  stats: {
    video: { 
      total: number; 
      completed: number; 
    };
    article: { 
      total: number; 
      completed: number; 
    };
    coding_problem?: { 
      total: number; 
      completed: number; 
    };
    quiz: { 
      total: number; 
      completed: number; 
    };
    assignment?: { 
      total: number; 
      completed: number; 
    };
  };
  
  // Social features (from backend)
  liked_by: unknown[]; // Array of users who liked
  
  // Company endorsements (from backend)
  trusted_by: Array<{
    name: string;
    color?: string;
  }>;
  
  // Course tags (from backend)
  tags: Array<{
    name: string;
    color?: string;
  }>;
  
  // Instructor information (from backend)
  instructors: Array<{
    id: number;
    name: string;
    bio: string;
    profile_pic_url?: string;
    linkedin_profile?: string;
  }>;
  
  // Timestamps (from backend)
  created_at: string; // "2025-08-09 13:59:56"
  updated_at: string; // "2025-08-25 16:32:58"
  
  // Frontend-specific fields (not from backend - nullable)
  rating?: number; // 0-5 star rating
  is_enrolled?: boolean;
  modules?: Array<{
    id: number;
    title: string;
    weekno: number;
    completion_percentage: number;
    submodules: Array<{
      id: number;
      title: string;
      description: string;
      order: number;
      article_count: number;
      assignment_count: number;
      coding_problem_count: number;
      quiz_count: number;
      video_count: number;
    }>;
  }>;
  next_lesson?: {
    title: string;
    description: string;
    duration: number;
  };
  is_liked_by_current_user?: boolean;
  liked_count?: number;
  progress_percentage?: number;
  recent_activity?: string;
  current_streak_days?: number;
  badges_earned?: number;
  last_accessed?: string;
}

// Type utilities for component use
export type CourseData = Course;

export const isCourseEnrolled = (course: Course): boolean => {
  return course.is_enrolled === true;
};

export const isCourseCompleted = (course: Course): boolean => {
  return course.progress_percentage === 100;
};

export const hasDetailedStats = (course: Course): boolean => {
  return course.stats?.video?.completed !== undefined;
};

export default Course;
