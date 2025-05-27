export interface TopicFormData {
  title: string;
  week: string;
  description: string;
}

export interface SubtopicFormData {
  title: string;
  description: string;
}

export interface Topic {
  id: string;
  title: string;
  week: string;
  description: string;
  subtopics: Subtopic[];
}

export interface Subtopic {
  id: string;
  title: string;
  description: string;
  contents: any[];
  video_count?: number;
  article_count?: number;
  quiz_count?: number;
  assignment_count?: number;
  coding_problem_count?: number;
  order?: number;
}

export interface Course {
  id: string;
  title: string;
  description: string;
  isPro: boolean;
} 

export type TabKey =
  | "videos"
  | "articles"
  | "problems"
  | "quiz"
  | "subjective"
  | "development";