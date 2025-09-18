import { Course } from "../../../../types/final-course.types";

// Type utility to work with Course data
type CourseData = Course;

// Type guards and utility functions
export const hasExtendedProps = (course: CourseData): boolean => {
  return !!(
    course.trusted_by?.length ||
    course.difficulty_level ||
    typeof course.certificate_available === 'boolean'
  );
};

// Utility functions to generate dynamic data based on course information

export const generateDynamicStreak = (courseId: number): number => {
  // Generate a consistent streak based on course ID to avoid random changes
  const seed = courseId * 7;
  return Math.floor((seed % 21) + 1); // 1-21 days
};

export const generateDynamicBadges = (course: CourseData): number => {
  const videosCompleted = course.stats?.video?.completed || 0;
  const quizzesCompleted = course.stats?.quiz?.completed || 0;
  const assignmentsCompleted = course.stats?.assignment?.completed || 0;
  
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

// Use backend-provided trusted_by as-is; do not generate mocks
export const generateTrustedByCompanies = (course: CourseData) => {
  return course.trusted_by || [];
};

// Use backend-provided tags; do not generate mocks
export const generateCourseTags = (course: CourseData) => {
  return course.tags || [];
};

export const calculateProgress = (course: CourseData) => {
  const videosCompleted = course.stats?.video?.completed || 0;
  const videosTotal = course.stats?.video?.total || 0;
  const quizzesCompleted = course.stats?.quiz?.completed || 0;
  const quizzesTotal = course.stats?.quiz?.total || 0;

  if (videosTotal === 0 && quizzesTotal === 0) return 0;

  // Calculate weighted progress (videos 70%, quizzes 30%)
  const videoProgress = videosTotal > 0 ? (videosCompleted / videosTotal) * 0.7 : 0;
  const quizProgress = quizzesTotal > 0 ? (quizzesCompleted / quizzesTotal) * 0.3 : 0;

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


export const formatPrice = (price: string): string => {
  const p = Number(price);
  if (isNaN(p) || p < 0) return "0";
  if (p >= 1000000) {
    return `${(p / 1000000).toFixed(p % 1000000 === 0 ? 0 : 1)}M`;
  } else if (p >= 1000) {
    return `${(p / 1000).toFixed(p % 1000 === 0 ? 0 : 1)}K`;
  } else {
    return p.toString();
  }
};
