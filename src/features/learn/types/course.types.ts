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

export interface Course {
  id: number;
  title: string;
  subtitle: string;
  description: string;
  stats: CourseStat[];
  trustedBy?: string[];
  level?: "Beginner" | "Intermediate" | "Advanced";
  teacherAvatar: string[];
  teacherNames?: string[]; // Add this property
  teacherTitles?: string[];
  progress?: CourseProgress;
  onExplore: () => void;
} 