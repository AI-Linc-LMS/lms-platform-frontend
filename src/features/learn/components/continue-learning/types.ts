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
  moduleNumber: number;
  totalModules: number;
  moduleName: string;
  iconData: CourseIconData[];
  onContinue: () => void;
} 