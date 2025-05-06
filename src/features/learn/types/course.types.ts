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
  id: number;
  name: string;
  bio: string;
  linkedin: string;
  profile_pic_url: string;
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
  title: string;
  description: string;
  enrolled_students: number;
  instructors: Instructor[];
  is_certified: boolean;
  modules: Module[];
  updated_at?: string;
} 