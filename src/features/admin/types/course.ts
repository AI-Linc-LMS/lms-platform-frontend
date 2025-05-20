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
  contents: Array<{
    id: string;
    type: 'videos' | 'articles' | 'problems' | 'quiz' | 'subjective' | 'development';
    // add other fields as needed
  }>;
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