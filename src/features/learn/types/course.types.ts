import { ReactNode } from "react";

export interface CourseStat {
  icon: ReactNode;
  value: string;
  total: string;
}

export interface CourseProgress {
  currentModule?: number;
  totalModules?: number;
  moduleTitle?: string;
  percentComplete?: number;
}

export interface Instructor {
  id: string;
  name: string;
  bio?: string;
  linkedin_profile?: string;
  profile_pic_url?: string;
  website?: string;
}

export interface InstructorSingle {
  id?: number; // backend may send empty objects []
  name?: string;
  bio?: string;
  profile_pic_url?: string;
  linkedin_profile?: string;
}

export interface Submodule {
  id: number;
  title: string;
  description: string;
  order: number;
  article_count: number;
  assignment_count: number;
  coding_problem_count: number;
  quiz_count: number;
  video_count: number;
}

export interface Module {
  id: number;
  title: string;
  weekno: number;
  completion_percentage: number;
  submodules: Submodule[];
}

export interface Course {
  id: number;
  course_id?: number;
  title: string;
  description: string;
  course_title?: string;
  course_description?: string;
  enrolled_students?: number;
  instructors?: Instructor[];
  is_certified?: boolean;
  modules?: Module[];
  updated_at?: string;
  created_at?: string;
  price?: number;
  rating?: number;
  level?: string;
  difficulty_level?: string;
  duration_in_hours?: number;
  categories?: string[];
  liked_count?: number;
  is_liked_by_current_user?: boolean;
  is_free?: boolean;
  is_enrolled?: boolean;
  benefits?: string[];
  learning_outcomes?: string[];
  thumbnail_url?: string;
  cover_image_url?: string;
  progress_percentage?: number; // 0 to 100
  streak?: number; // Number of consecutive days user has engaged with the course
  achievements?: string[]; // List of achievement badges earned in the course
  stats?: {
    video: { total: number };
    article: { total: number };
    coding_problem: { total: number };
    quiz: { total: number };
    assignment: { total: number };
  };
}
