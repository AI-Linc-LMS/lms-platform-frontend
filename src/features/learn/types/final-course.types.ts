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
  difficulty_level: string; // "Easy", "Medium", "Advanced"
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
    students_profile_pic?: string[];
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
    coding_problem: {
      total: number;
      completed: number;
    };
    quiz: {
      total: number;
      completed: number;
    };
    assignment: {
      total: number;
      completed: number;
    };
  };

  // Social features (from backend)
  liked_by: unknown[];

  instructors: Array<{
    id?: number; // backend may send empty objects []
    name?: string;
    bio?: string;
    profile_pic_url?: string;
    linkedin_profile?: string;
  }>;

  // Timestamps (from backend)
  created_at: string;
  updated_at: string;

  // Optional states (frontend-calculated or backend-extra)
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

  // New/updated fields based on backend
  tags: string[];
  rating?: number;
  trusted_by: string[];
  certificate_available: boolean; // backend sends boolean not array
  achievements: {
    [key: string]: {
      achieved: boolean;
      info: string;
    };
  };
  badges?: number;

  // Updated streak handling
  streak: Record<string, boolean>; // e.g. { "2025-09-23": false, ... }
  streak_count: number;

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
