export interface PersonalInfo {
  firstName: string;
  lastName: string;
  imageUrl?: string;
  title?: string;
  email: string;
  phone: string;
  address?: string;
  location?: string;
  website?: string;
  relevantExperience?: string;
  totalExperience?: string;
  // Links
  linkedin?: string;
  twitter?: string;
  github?: string;
  hackerrank?: string;
  hackerearth?: string;
  codechef?: string;
  leetcode?: string;
  cssbattle?: string;
  // About
  summary: string; // About me
  careerObjective?: string; // Career objective
}

export interface Experience {
  id: string;
  jobTitle: string;
  company: string;
  location: string;
  startDate: string;
  endDate: string;
  isCurrentJob: boolean;
  years?: number; // Years of experience
  description: string;
}

export interface Education {
  id: string;
  degree: string;
  institution: string;
  location: string;
  area?: string; // Field of study area
  grade?: string; // GPA or grade
  startDate: string;
  graduationDate: string;
  isCurrentlyStudying: boolean;
  gpa?: string;
  description?: string;
}

export type SkillCategory = "Language" | "Framework" | "Technologies" | "Libraries" | "Database" | "Practices" | "Tools";

export interface Skill {
  id: string;
  name: string;
  category: SkillCategory;
  level: "Beginner" | "Intermediate" | "Advanced" | "Expert";
  priority: number; // Higher priority = shows first
}

export interface Project {
  id: string;
  name: string;
  description: string;
  technologies: string[];
  link?: string;
  startDate: string;
  endDate: string;
}

export interface Activity {
  id: string;
  name: string;
  organization: string;
  startDate: string;
  endDate: string;
  isCurrent: boolean;
  involvements: string[]; // Array of involvement descriptions
  achievements: string[]; // Array of achievement descriptions
}

export interface Volunteering {
  id: string;
  organization: string;
  role: string;
  startDate: string;
  endDate: string;
  isCurrent: boolean;
  description: string;
}

export interface Award {
  id: string;
  title: string;
  organization: string;
  date: string;
  description?: string;
}

export type ColorScheme = "Professional Blue" | "Modern Green" | "Creative Purple" | "Classic Navy";

export interface ResumeData {
  personalInfo: PersonalInfo;
  experience: Experience[];
  education: Education[];
  skills: Skill[];
  projects: Project[];
  activities: Activity[];
  volunteering: Volunteering[];
  awards: Award[];
  selectedTemplate: string;
  themeColor?: string; // Legacy support
  colorScheme?: ColorScheme; // New preset color schemes
  sectionOrder?: string[]; // Order of sections in sidebar and resume
}

export interface ResumeTemplate {
  id: string;
  name: string;
  preview: string;
  component: React.ComponentType<{ 
    data: ResumeData; 
    isPrint?: boolean; 
    themeColor?: string;
    colorScheme?: ColorScheme;
  }>;
}
