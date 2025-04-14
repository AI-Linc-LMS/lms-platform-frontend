import { ReactNode } from "react";

export interface CourseStat {
  icon: ReactNode;
  value: string;
  total: string;
}

export interface Course {
  id: number;
  title: string;
  subtitle: string;
  description: string;
  stats: CourseStat[];
  trustedBy?: string[];
  onExplore: () => void;
} 