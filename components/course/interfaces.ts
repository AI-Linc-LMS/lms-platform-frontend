export interface Instructor {
  id: number;
  name: string;
  profile_pic_url: string;
}

export interface Course {
  id: number;
  title: string;
  subtitle?: string;
  description: string;
  slug: string;
  difficulty_level: string;
  language: string;
  is_free: boolean;
  enrollment_enabled: boolean;
  certificate_available: boolean;
  is_enrolled: boolean;
  price: string;
  tags: string[];
  instructors: Instructor[];
  enrolled_students: {
    total: number;
    students_profile_pic: string[];
  };
  stats: {
    video: { total: number };
    quiz: { total: number };
    coding_problem: { total: number };
    article: { total: number };
    assignment?: { total: number };
  };
  rating?: number; // Average rating (0-5)
  rating_count?: number; // Number of ratings
  progress?: number; // Completion percentage (0-100)
  streak?: number; // Current streak days
}

export interface CourseCardProps {
  course: Course;
}
