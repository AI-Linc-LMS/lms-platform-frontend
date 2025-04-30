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
  bio: string; // Biography of the instructor
  linkedin?: string; // LinkedIn profile URL
  profile_pic_url?: string; // Profile picture URL
}

export interface Course {
  id: number;
  title: string;
  subtitle: string;
  description: string;
  difficulty_level: string; // e.g., "Medium"
  duration_in_hours: number; // Total duration of the course in hours
  enrolled_students: number[]; // Array of enrolled student IDs
  instructors: Instructor[]; // Array of instructors
  is_free: boolean; // Whether the course is free
  language: string; // Language of the course
  learning_objectives: string; // Learning objectives of the course
  preview_video_url?: string; // URL for the preview video
  price?: string; // Price of the course
  published: boolean; // Whether the course is published
  requirements: string; // Requirements for the course
  slug: string; // Slug for the course URL
  tags: string[]; // Tags associated with the course
  thumbnail: string; // Thumbnail image URL
  trustedBy?: string[]; // Trusted by (e.g., companies or individuals)
  level?: "Beginner" | "Intermediate" | "Advanced"; // Difficulty level
  progress?: CourseProgress; // Progress of the user in the course
  certificate_available: boolean; // Whether a certificate is available
  created_at: string; // Creation date
  updated_at: string; // Last updated date
}

export interface Submodule {
  id: number;
  title: string;
  description: string;
  order: number;
  video_count: number;
  quiz_count: number;
  assignment_count: number;
  coding_problem_count: number;
  text_count: number;
}

export interface Module {
  id: number;
  title: string;
  description: string;
  weekno: number;
  submodules: Submodule[];
}

export interface CourseContent {
  course_id: number;
  course_title: string;
  course_description: string;
  instructors: Instructor[];
  modules: Module[];
}