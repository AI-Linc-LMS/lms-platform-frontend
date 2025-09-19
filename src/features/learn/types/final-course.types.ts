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
  price: string;
  is_free: boolean;

  // Course metadata (from backend)
  difficulty_level: string; // "Medium", "Beginner", "Advanced"
  duration_in_hours: number;
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

  is_liked_by_current_user?: boolean;
  liked_count?: number;
  last_accessed?: string;

  //feilds to be added
  tags: string[];
  rating?: number;
  trusted_by: string[];
  certificate_available?: string[];
  achievements?: Achievements[];
  badges?: number;
  streak?: number | undefined;
  recent_activity?: string[];
  progress_percentage?: number;
  next_lesson?: {
    id: number;
    title: string;
    description: string;
  };
  whats_included?: string[];
  features?: string[];
}

export enum Achievements {
  FIRST_STEP = "FIRST_STEP",
  QUIZ_MASTER = "QUIZ_MASTER",
  FIVE_WEEK_MASTER = "5_WEEK_MASTER",
  EXPERT = "EXPERT",
  CERTIFIED = "CERTIFIED",
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
