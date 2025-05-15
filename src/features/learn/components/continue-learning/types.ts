import { ReactNode } from "react";

export interface CourseIconData {
  icon: ReactNode;
  completed: number;
  total: number;
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