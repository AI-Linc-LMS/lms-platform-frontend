import { Course } from "../../../../types/course.types";

// Extended interface for backend course data that includes additional fields
interface ExtendedCourse extends Omit<Course, 'enrolled_students'> {
  trusted_by?: Array<{ name: string } | string>;
  tags?: Array<{ name: string } | string>;
  difficulty_level?: string;
  certificate_available?: boolean;
  duration_in_hours?: number;
  enrolled_students?: {
    total: number;
    students_profile_pic?: string[];
  };
  stats?: {
    video: { total: number; completed?: number };
    article: { total: number; completed?: number };
    coding_problem: { total: number; completed?: number };
    quiz: { total: number; completed?: number };
    assignment: { total: number; completed?: number };
  };
}

// Type utility to work with both Course and ExtendedCourse
type CourseData = Course | ExtendedCourse;

// Type guards and utility functions
export const hasExtendedProps = (course: CourseData): course is ExtendedCourse => {
  return 'trusted_by' in course || 'difficulty_level' in course || 'certificate_available' in course;
};

// Utility functions to generate dynamic data based on course information

export const generateDynamicStreak = (courseId: number): number => {
  // Generate a consistent streak based on course ID to avoid random changes
  const seed = courseId * 7;
  return Math.floor((seed % 21) + 1); // 1-21 days
};

export const generateDynamicBadges = (course: CourseData): number => {
  const extCourse = course as ExtendedCourse;
  const videosCompleted = extCourse.stats?.video?.completed || 0;
  const quizzesCompleted = extCourse.stats?.quiz?.completed || 0;
  const assignmentsCompleted = extCourse.stats?.assignment?.completed || 0;
  
  // Calculate badges based on completion
  let badges = 0;
  if (videosCompleted > 0) badges++;
  if (quizzesCompleted > 0) badges++;
  if (assignmentsCompleted > 0) badges++;
  if (videosCompleted >= 5) badges++;
  if (quizzesCompleted >= 3) badges++;
  
  return Math.max(badges, 1); // At least 1 badge
};

export const generateRecentActivity = (course: CourseData) => {
  const activities = [
    `Completed: "Introduction to ${course.title.split(' ')[0]}"`,
    `Earned: "${course.title.split(' ')[0]} Basics" badge`,
    `Watched: "Advanced ${course.title.split(' ')[0]} Techniques"`,
    `Completed quiz: "${course.title.split(' ')[0]} Fundamentals"`,
  ];
  
  const randomIndex = course.id % activities.length;
  return activities[randomIndex];
};

export const generateNextLesson = (course: CourseData) => {
  const lessons = [
    {
      title: `Advanced ${course.title.split(' ')[0]} Creation`,
      description: `Learn to create interactive ${course.title.split(' ')[0].toLowerCase()} with multiple data sources`,
      duration: Math.floor((course.id % 20) + 5), // 5-24 minutes
    },
    {
      title: `${course.title.split(' ')[0]} Best Practices`,
      description: `Master the industry standards for ${course.title.split(' ')[0].toLowerCase()} development`,
      duration: Math.floor((course.id % 15) + 10), // 10-24 minutes
    },
    {
      title: `Real-world ${course.title.split(' ')[0]} Projects`,
      description: `Apply your knowledge to practical ${course.title.split(' ')[0].toLowerCase()} scenarios`,
      duration: Math.floor((course.id % 25) + 8), // 8-32 minutes
    },
  ];
  
  const randomIndex = course.id % lessons.length;
  return lessons[randomIndex];
};

export const generateTrustedByCompanies = (course: CourseData) => {
  const extCourse = course as ExtendedCourse;
  // If course already has trusted_by data, use it
  if (extCourse.trusted_by && extCourse.trusted_by.length > 0) {
    return extCourse.trusted_by;
  }
  
  // Generate based on course type/title
  const allCompanies = [
    { name: "Microsoft", color: "bg-blue-500" },
    { name: "Google", color: "bg-blue-600" },
    { name: "Amazon", color: "bg-orange-500" },
    { name: "Apple", color: "bg-gray-600" },
    { name: "Meta", color: "bg-blue-700" },
    { name: "Netflix", color: "bg-red-600" },
    { name: "Tesla", color: "bg-red-500" },
    { name: "IBM", color: "bg-blue-700" },
    { name: "Oracle", color: "bg-red-700" },
    { name: "Salesforce", color: "bg-blue-400" },
  ];
  
  // Select 2-4 companies based on course ID
  const numCompanies = Math.floor((course.id % 3) + 2); // 2-4 companies
  const startIndex = course.id % (allCompanies.length - numCompanies);
  
  return allCompanies.slice(startIndex, startIndex + numCompanies);
};

export const generateCourseTags = (course: CourseData) => {
  const extCourse = course as ExtendedCourse;
  // If course already has tags, use them
  if (extCourse.tags && extCourse.tags.length > 0) {
    return extCourse.tags;
  }
  
  // Generate tags based on course title and difficulty
  const baseTags = [];
  const title = course.title.toLowerCase();
  
  if (title.includes('excel') || title.includes('data')) {
    baseTags.push("Data Analysis", "Business Intelligence", "Spreadsheets");
  } else if (title.includes('python') || title.includes('programming')) {
    baseTags.push("Programming", "Software Development", "Coding");
  } else if (title.includes('design') || title.includes('ui')) {
    baseTags.push("Design", "User Experience", "Creative");
  } else if (title.includes('marketing') || title.includes('business')) {
    baseTags.push("Marketing", "Business", "Strategy");
  } else {
    baseTags.push("Professional Skills", "Career Development", "Industry Knowledge");
  }
  
  // Add difficulty-based tags
  if (extCourse.difficulty_level === "Beginner") {
    baseTags.push("Beginner Friendly");
  } else if (extCourse.difficulty_level === "Advanced") {
    baseTags.push("Advanced Level");
  }
  
  // Add certificate tag if available
  if (extCourse.certificate_available) {
    baseTags.push("Certificate Included");
  }
  
  // Return up to 3 tags
  return baseTags.slice(0, 3).map(tag => ({ name: tag }));
};

export const calculateProgress = (course: CourseData) => {
  const extCourse = course as ExtendedCourse;
  const videosCompleted = extCourse.stats?.video?.completed || 0;
  const videosTotal = extCourse.stats?.video?.total || 1;
  const quizzesCompleted = extCourse.stats?.quiz?.completed || 0;
  const quizzesTotal = extCourse.stats?.quiz?.total || 1;
  
  // Calculate weighted progress (videos 70%, quizzes 30%)
  const videoProgress = (videosCompleted / videosTotal) * 0.7;
  const quizProgress = (quizzesCompleted / quizzesTotal) * 0.3;
  
  return Math.round((videoProgress + quizProgress) * 100);
};

export const getTimeAgo = (courseId: number): string => {
  const hours = Math.floor((courseId % 72) + 1); // 1-72 hours ago
  
  if (hours <= 24) {
    return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  } else {
    const days = Math.floor(hours / 24);
    return `${days} day${days > 1 ? 's' : ''} ago`;
  }
};
