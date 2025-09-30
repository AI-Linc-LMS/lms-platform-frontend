import { Course } from "../../../../types/final-course.types";

// Type utility to work with Course data
type CourseData = Course;

// Type guards and utility functions
export const hasExtendedProps = (course: CourseData): boolean => {
  return !!(
    course.trusted_by ||
    course.difficulty_level ||
    course.certificate_available
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
    `Completed: "Introduction to ${course.title.split(" ")[0]}"`,
    `Earned: "${course.title.split(" ")[0]} Basics" badge`,
    `Watched: "Advanced ${course.title.split(" ")[0]} Techniques"`,
    `Completed quiz: "${course.title.split(" ")[0]} Fundamentals"`,
  ];

  const randomIndex = course.id % activities.length;
  return activities[randomIndex];
};

export const generateNextLesson = (course: CourseData) => {
  const lessons = [
    {
      title: `Advanced ${course.title.split(" ")[0]} Creation`,
      description: `Learn to create interactive ${course.title
        .split(" ")[0]
        .toLowerCase()} with multiple data sources`,
      duration: Math.floor((course.id % 20) + 5), // 5-24 minutes
    },
    {
      title: `${course.title.split(" ")[0]} Best Practices`,
      description: `Master the industry standards for ${course.title
        .split(" ")[0]
        .toLowerCase()} development`,
      duration: Math.floor((course.id % 15) + 10), // 10-24 minutes
    },
    {
      title: `Real-world ${course.title.split(" ")[0]} Projects`,
      description: `Apply your knowledge to practical ${course.title
        .split(" ")[0]
        .toLowerCase()} scenarios`,
      duration: Math.floor((course.id % 25) + 8), // 8-32 minutes
    },
  ];

  const randomIndex = course.id % lessons.length;
  return lessons[randomIndex];
};

export const generateTrustedByCompanies = (course: CourseData) => {
  // If course already has trusted_by data, use it
  if (course.trusted_by && course.trusted_by.length > 0) {
    return course.trusted_by;
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
  // If course already has tags, use them
  if (course.tags && course.tags.length > 0) {
    return course.tags;
  }

  // Generate tags based on course title and difficulty
  const baseTags = [];
  const title = course.title.toLowerCase();

  if (title.includes("excel") || title.includes("data")) {
    baseTags.push("Data Analysis", "Business Intelligence", "Spreadsheets");
  } else if (title.includes("python") || title.includes("programming")) {
    baseTags.push("Programming", "Software Development", "Coding");
  } else if (title.includes("design") || title.includes("ui")) {
    baseTags.push("Design", "User Experience", "Creative");
  } else if (title.includes("marketing") || title.includes("business")) {
    baseTags.push("Marketing", "Business", "Strategy");
  } else {
    baseTags.push(
      "Professional Skills",
      "Career Development",
      "Industry Knowledge"
    );
  }

  // Add difficulty-based tags
  if (course.difficulty_level === "Beginner") {
    baseTags.push("Beginner Friendly");
  } else if (course.difficulty_level === "Advanced") {
    baseTags.push("Advanced Level");
  }

  // Add certificate tag if available
  if (course.certificate_available) {
    baseTags.push("Certificate Included");
  }

  // Return up to 3 tags
  return baseTags.slice(0, 3).map((tag) => ({ name: tag }));
};

export const calculateProgress = (course: CourseData) => {
  const videosCompleted = course.stats?.video?.completed || 0;
  const videosTotal = course.stats?.video?.total || 0;
  const quizzesCompleted = course.stats?.quiz?.completed || 0;
  const quizzesTotal = course.stats?.quiz?.total || 0;

  if (videosTotal === 0 && quizzesTotal === 0) return 0;

  // Calculate weighted progress (videos 70%, quizzes 30%)
  const videoProgress =
    videosTotal > 0 ? (videosCompleted / videosTotal) * 0.7 : 0;
  const quizProgress =
    quizzesTotal > 0 ? (quizzesCompleted / quizzesTotal) * 0.3 : 0;

  // Return exact rounded value; do not force a minimum
  return Math.round((videoProgress + quizProgress) * 100);
};

export const getTimeAgo = (courseId: number): string => {
  const hours = Math.floor((courseId % 72) + 1); // 1-72 hours ago

  if (hours <= 24) {
    return `${hours} hour${hours > 1 ? "s" : ""} ago`;
  } else {
    const days = Math.floor(hours / 24);
    return `${days} day${days > 1 ? "s" : ""} ago`;
  }
};

export const formatPrice = (price: string): string => {
  const p = Number(price);
  if (isNaN(p) || p < 0) return "0";

  if (p >= 1000000) {
    return `${(p / 1000000).toFixed(p % 1000000 === 0 ? 0 : 1)}M`;
  } else {
    // keep full number for thousands instead of `K`
    return p.toString();
  }
};
