export type Instructor = {
  id: string;
  name: string;
  designation: string;
};

export type LessonContentType = 'video' | 'article' | 'problem' | 'assignment' | 'quiz';

export type VideoContent = {
  id: string;
  type: 'video';
  title: string;
  description: string;
  marks: number;
  duration: number; // in minutes
  url: string;
};

export type ArticleContent = {
  id: string;
  type: 'article';
  title: string;
  content: string;
  marks: number;
  url: string;
};

export type ProblemContent = {
  id: string;
  type: 'problem';
  title: string;
  description: string;
  questions: any[];
};

export type AssignmentContent = {
  id: string;
  type: 'assignment';
  title: string;
  description: string;
  questions: any[];
};

export interface QuizOption {
  id: string;
  text: string;
  isCorrect: boolean;
}

export interface QuizQuestion {
  id: string;
  questionText: string;
  marks: number;
  options: QuizOption[];
  explanation: string;
}

export interface QuizContent {
  id: string;
  type: 'quiz';
  title: string;
  description: string;
  questions: QuizQuestion[];
}

export type LessonContent = VideoContent | ArticleContent | ProblemContent | AssignmentContent | QuizContent;

export type Lesson = {
  id: string;
  title: string;
  description?: string;
  contents: LessonContent[];
};

export type Module = {
  id: string;
  title: string;
  description?: string;
  week: number;
  lessons: Lesson[];
};

export type Course = {
  id: string;
  title: string;
  description: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  instructors: Instructor[];
  modules: Module[];
  createdAt: Date;
  updatedAt: Date;
}; 