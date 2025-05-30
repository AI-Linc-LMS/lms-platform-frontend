import { ReactNode } from "react";

export interface CourseIconData {
  icon: ReactNode;
  completed: number;
  total: number;
}

export interface CourseStats {
  video: { completed: number; total: number };
  article: { completed: number; total: number };
  coding_problem: { completed: number; total: number };
  quiz: { completed: number; total: number };
  assignment: { completed: number; total: number };
}

export interface ContinueCourse {
  id: number;
  title: string;
  description: string;
  difficulty_level: string;
  completed_modules: number;
  num_modules: number;
  stats: CourseStats;
}

export interface CourseData {
  title: string;
  description: string;
  category: string;
  completed_modules: number;
  num_modules: number;
  //moduleName: string;
  iconData: CourseIconData[];
  onContinue: () => void;
}
