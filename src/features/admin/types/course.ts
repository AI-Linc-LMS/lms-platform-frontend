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
}

export interface Course {
  id: string;
  title: string;
  description: string;
  isPro: boolean;
} 