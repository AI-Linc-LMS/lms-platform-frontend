import { Course } from "../../../../types/final-course.types";

// Storage utilities for cross-component persistence
const RATING_STORAGE_KEY = "course_ratings";
const DIFFICULTY_STORAGE_KEY = "course_difficulties";
const COMPANIES_STORAGE_KEY = "course_companies";
const LEARNING_OBJECTIVES_STORAGE_KEY = "course_learning_objectives";
const STUDENT_STATS_STORAGE_KEY = "course_student_stats";
const JOB_PLACEMENT_STORAGE_KEY = "course_job_placement";
const WHATS_INCLUDED_STORAGE_KEY = "course_whats_included";
const COURSE_TAGS_STORAGE_KEY = "course_tags";
const COURSE_FEATURES_STORAGE_KEY = "course_features";
const COURSE_REQUIREMENTS_STORAGE_KEY = "course_requirements";
const COURSE_INSTRUCTORS_STORAGE_KEY = "course_instructors";
const COURSE_DURATION_STORAGE_KEY = "course_duration_hours";

// Export storage keys for external access
export { COURSE_TAGS_STORAGE_KEY };

// Rating utilities
export const getStoredRating = (courseId: number): number | null => {
  try {
    const storedRatings = localStorage.getItem(RATING_STORAGE_KEY);
    if (storedRatings) {
      const ratings = JSON.parse(storedRatings);
      return ratings[courseId] || null;
    }
  } catch (error) {
    console.warn("Error reading stored ratings:", error);
  }
  return null;
};

export const setStoredRating = (courseId: number, rating: number): void => {
  try {
    const storedRatings = localStorage.getItem(RATING_STORAGE_KEY);
    const ratings = storedRatings ? JSON.parse(storedRatings) : {};
    ratings[courseId] = rating;
    localStorage.setItem(RATING_STORAGE_KEY, JSON.stringify(ratings));
  } catch (error) {
    console.warn("Error storing rating:", error);
  }
};

// Difficulty utilities
export const getStoredDifficulty = (courseId: number): string | null => {
  try {
    const storedDifficulties = localStorage.getItem(DIFFICULTY_STORAGE_KEY);
    if (storedDifficulties) {
      const difficulties = JSON.parse(storedDifficulties);
      return difficulties[courseId] || null;
    }
  } catch (error) {
    console.warn("Error reading stored difficulties:", error);
  }
  return null;
};

export const setStoredDifficulty = (
  courseId: number,
  difficulty: string
): void => {
  try {
    const storedDifficulties = localStorage.getItem(DIFFICULTY_STORAGE_KEY);
    const difficulties = storedDifficulties
      ? JSON.parse(storedDifficulties)
      : {};
    difficulties[courseId] = difficulty;
    localStorage.setItem(DIFFICULTY_STORAGE_KEY, JSON.stringify(difficulties));
  } catch (error) {
    console.warn("Error storing difficulty:", error);
  }
};

export const getEffectiveRating = (course: {
  id: number;
  rating?: number;
}): number => {
  // Use backend rating first, then localStorage, then default to 4.8
  if (course.rating !== undefined && course.rating !== null) {
    return course.rating;
  }
  const storedRating = getStoredRating(course.id);
  if (storedRating !== null) {
    return storedRating;
  }
  return 4.8; // Default fallback
};

export const getEffectiveDifficulty = (course: {
  id: number;
  difficulty_level?: string;
}): string => {
  // Use backend difficulty first, then localStorage, then default based on course ID
  if (
    course.difficulty_level &&
    ["Easy", "Medium", "Hard"].includes(course.difficulty_level)
  ) {
    return course.difficulty_level;
  }
  const storedDifficulty = getStoredDifficulty(course.id);
  if (storedDifficulty !== null) {
    return storedDifficulty;
  }
  // Generate consistent default difficulty based on course ID
  const difficultyOptions = ["Easy", "Medium", "Hard"];
  return difficultyOptions[course.id % 3];
};

// Duration utilities
export const getStoredDuration = (courseId: number): number | null => {
  try {
    const storedDurations = localStorage.getItem(COURSE_DURATION_STORAGE_KEY);
    if (storedDurations) {
      const durations = JSON.parse(storedDurations);
      return durations[courseId] || null;
    }
  } catch (error) {
    console.warn("Error retrieving stored duration:", error);
  }
  return null;
};

export const setStoredDuration = (courseId: number, duration: number): void => {
  try {
    const storedDurations = localStorage.getItem(COURSE_DURATION_STORAGE_KEY);
    const durations = storedDurations ? JSON.parse(storedDurations) : {};
    durations[courseId] = duration;
    localStorage.setItem(
      COURSE_DURATION_STORAGE_KEY,
      JSON.stringify(durations)
    );
  } catch (error) {
    console.warn("Error storing duration:", error);
  }
};

export const getEffectiveDuration = (course: {
  id: number;
  duration_in_hours?: number;
}): number => {
  // Use backend duration first, then localStorage, then generate default based on course ID
  if (
    course.duration_in_hours !== undefined &&
    course.duration_in_hours !== null &&
    course.duration_in_hours > 0
  ) {
    return course.duration_in_hours;
  }
  const storedDuration = getStoredDuration(course.id);
  if (storedDuration !== null && storedDuration > 0) {
    return storedDuration;
  }
  // Generate consistent default duration between 8-40 hours based on course ID
  return Math.floor((course.id % 33) + 8);
};

// Company interface and utilities
export interface CompanyLogo {
  name: string;
  logoUrl: string;
  alt: string;
}

// Company utilities
export const getStoredCompanies = (courseId: number): string[] | null => {
  try {
    const storedCompanies = localStorage.getItem(COMPANIES_STORAGE_KEY);
    if (storedCompanies) {
      const companies = JSON.parse(storedCompanies);
      return companies[courseId] || null;
    }
  } catch (error) {
    console.warn("Error reading stored companies:", error);
  }
  return null;
};

export const setStoredCompanies = (
  courseId: number,
  companies: string[]
): void => {
  try {
    const storedCompanies = localStorage.getItem(COMPANIES_STORAGE_KEY);
    const companiesData = storedCompanies ? JSON.parse(storedCompanies) : {};
    companiesData[courseId] = companies;
    localStorage.setItem(COMPANIES_STORAGE_KEY, JSON.stringify(companiesData));
  } catch (error) {
    console.warn("Error storing companies:", error);
  }
};

// Complete company database with logos
export const COMPANY_DATABASE: Record<string, CompanyLogo> = {
  microsoft: {
    name: "Microsoft",
    logoUrl:
      "https://upload.wikimedia.org/wikipedia/commons/4/44/Microsoft_logo.svg",
    alt: "Microsoft",
  },
  ibm: {
    name: "IBM",
    logoUrl: "https://upload.wikimedia.org/wikipedia/commons/5/51/IBM_logo.svg",
    alt: "IBM",
  },
  cisco: {
    name: "Cisco",
    logoUrl:
      "https://upload.wikimedia.org/wikipedia/commons/0/08/Cisco_logo_blue_2016.svg",
    alt: "Cisco",
  },
  google: {
    name: "Google",
    logoUrl:
      "https://upload.wikimedia.org/wikipedia/commons/2/2f/Google_2015_logo.svg",
    alt: "Google",
  },
  amazon: {
    name: "Amazon",
    logoUrl:
      "https://upload.wikimedia.org/wikipedia/commons/a/a9/Amazon_logo.svg",
    alt: "Amazon",
  },
  apple: {
    name: "Apple",
    logoUrl:
      "https://upload.wikimedia.org/wikipedia/commons/f/fa/Apple_logo_black.svg",
    alt: "Apple",
  },
  meta: {
    name: "Meta",
    logoUrl:
      "https://upload.wikimedia.org/wikipedia/commons/7/7b/Meta_Platforms_Inc._logo.svg",
    alt: "Meta",
  },
  netflix: {
    name: "Netflix",
    logoUrl:
      "https://upload.wikimedia.org/wikipedia/commons/0/08/Netflix_2015_logo.svg",
    alt: "Netflix",
  },
  tesla: {
    name: "Tesla",
    logoUrl:
      "https://upload.wikimedia.org/wikipedia/commons/b/bb/Tesla_T_symbol.svg",
    alt: "Tesla",
  },
  oracle: {
    name: "Oracle",
    logoUrl:
      "https://upload.wikimedia.org/wikipedia/commons/5/50/Oracle_logo.svg",
    alt: "Oracle",
  },
  salesforce: {
    name: "Salesforce",
    logoUrl:
      "https://upload.wikimedia.org/wikipedia/commons/f/f9/Salesforce.com_logo.svg",
    alt: "Salesforce",
  },
};

// Get all available companies for admin selection
export const getAllAvailableCompanies = (): string[] => {
  return Object.keys(COMPANY_DATABASE).map((key) => COMPANY_DATABASE[key].name);
};

// Get company logo data by name
export const getCompanyByName = (name: string): CompanyLogo | null => {
  const key = name.toLowerCase();
  return COMPANY_DATABASE[key] || null;
};

// Frontend companies (original default)
const FRONTEND_DEFAULT_COMPANIES = ["Microsoft", "IBM", "Cisco"];

export const getEffectiveCompanies = (course: {
  id: number;
  companies?: string[];
}): CompanyLogo[] => {
  // Priority: 1. Admin stored companies, 2. Backend companies, 3. Frontend default companies

  // Check localStorage first (admin changes)
  const storedCompanies = getStoredCompanies(course.id);
  if (storedCompanies && storedCompanies.length > 0) {
    return storedCompanies
      .map((name) => getCompanyByName(name))
      .filter(Boolean) as CompanyLogo[];
  }

  // Check backend companies if available
  if (course.companies && course.companies.length > 0) {
    return course.companies
      .map((name) => getCompanyByName(name))
      .filter(Boolean) as CompanyLogo[];
  }

  // Use frontend default companies
  return FRONTEND_DEFAULT_COMPANIES.map((name) =>
    getCompanyByName(name)
  ).filter(Boolean) as CompanyLogo[];
};

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

// === COURSE PROGRESS UTILITIES ===

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

// Learning Objectives utilities
export const getStoredLearningObjectives = (
  courseId: number
): string[] | null => {
  try {
    const stored = localStorage.getItem(LEARNING_OBJECTIVES_STORAGE_KEY);
    if (stored) {
      const objectives = JSON.parse(stored);
      return objectives[courseId] || null;
    }
  } catch (error) {
    console.warn("Error reading stored learning objectives:", error);
  }
  return null;
};

export const setStoredLearningObjectives = (
  courseId: number,
  objectives: string[]
): void => {
  try {
    const stored = localStorage.getItem(LEARNING_OBJECTIVES_STORAGE_KEY);
    const data = stored ? JSON.parse(stored) : {};
    data[courseId] = objectives;
    localStorage.setItem(LEARNING_OBJECTIVES_STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    console.warn("Error storing learning objectives:", error);
  }
};

// Student Stats utilities (rating data from learners)
export interface StudentStats {
  rating: number;
  totalLearners: number;
}

export const getStoredStudentStats = (
  courseId: number
): StudentStats | null => {
  try {
    const stored = localStorage.getItem(STUDENT_STATS_STORAGE_KEY);
    if (stored) {
      const stats = JSON.parse(stored);
      return stats[courseId] || null;
    }
  } catch (error) {
    console.warn("Error reading stored student stats:", error);
  }
  return null;
};

export const setStoredStudentStats = (
  courseId: number,
  stats: StudentStats
): void => {
  try {
    const stored = localStorage.getItem(STUDENT_STATS_STORAGE_KEY);
    const data = stored ? JSON.parse(stored) : {};
    data[courseId] = stats;
    localStorage.setItem(STUDENT_STATS_STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    console.warn("Error storing student stats:", error);
  }
};

// Job Placement utilities
export interface JobPlacement {
  totalLearners: number;
  companies: string[];
}

export const getStoredJobPlacement = (
  courseId: number
): JobPlacement | null => {
  try {
    const stored = localStorage.getItem(JOB_PLACEMENT_STORAGE_KEY);
    if (stored) {
      const placement = JSON.parse(stored);
      return placement[courseId] || null;
    }
  } catch (error) {
    console.warn("Error reading stored job placement:", error);
  }
  return null;
};

export const setStoredJobPlacement = (
  courseId: number,
  placement: JobPlacement
): void => {
  try {
    const stored = localStorage.getItem(JOB_PLACEMENT_STORAGE_KEY);
    const data = stored ? JSON.parse(stored) : {};
    data[courseId] = placement;
    localStorage.setItem(JOB_PLACEMENT_STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    console.warn("Error storing job placement:", error);
  }
};

// What's Included utilities
export const getStoredWhatsIncluded = (courseId: number): string[] | null => {
  try {
    const stored = localStorage.getItem(WHATS_INCLUDED_STORAGE_KEY);
    if (stored) {
      const included = JSON.parse(stored);
      return included[courseId] || null;
    }
  } catch (error) {
    console.warn("Error reading stored whats included:", error);
  }
  return null;
};

export const setStoredWhatsIncluded = (
  courseId: number,
  items: string[]
): void => {
  try {
    const stored = localStorage.getItem(WHATS_INCLUDED_STORAGE_KEY);
    const data = stored ? JSON.parse(stored) : {};
    data[courseId] = items;
    localStorage.setItem(WHATS_INCLUDED_STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    console.warn("Error storing whats included:", error);
  }
};

// Interface definitions for type safety
interface CourseStats {
  video: { total: number; completed?: number };
  article: { total: number; completed?: number };
  quiz: { total: number; completed?: number };
  assignment?: { total: number; completed?: number };
  coding_problem?: { total: number; completed?: number };
}

interface EnrolledStudents {
  total: number;
  students_profile_pic?: string[];
}

// Effective value functions with fallbacks
export const getEffectiveLearningObjectives = (course: {
  id: number;
  learning_objectives?: string;
  title?: string;
}): string[] => {
  // Check localStorage first (admin changes)
  const stored = getStoredLearningObjectives(course.id);
  if (stored && stored.length > 0) {
    return stored;
  }

  // Check backend data
  if (course.learning_objectives) {
    return course.learning_objectives.split("\n").filter((obj) => obj.trim());
  }

  // Generate default learning objectives
  const title = course.title?.toLowerCase() || "skills";
  const subject = title.split(" ")[0] || "skills";

  return [
    `Learn to build ${subject} projects that recruiters love to see in resumes`,
    `Master the most in-demand ${subject} tools in the industry`,
    `Used by 90% of Fortune 500 companies for ${subject} development`,
    `Boost your career with real-world ${subject} skills`,
  ];
};

export const getEffectiveStudentStats = (course: {
  id: number;
  rating?: number;
  enrolled_students?: EnrolledStudents;
}): StudentStats => {
  // Check localStorage first (admin changes)
  const stored = getStoredStudentStats(course.id);
  if (stored) {
    return stored;
  }

  // Use backend data if available
  const rating = getEffectiveRating(course);
  const totalLearners = course.enrolled_students?.total || 500;

  return { rating, totalLearners };
};

export const getEffectiveJobPlacement = (course: {
  id: number;
  enrolled_students?: EnrolledStudents;
}): JobPlacement => {
  // Check localStorage first (admin changes)
  const stored = getStoredJobPlacement(course.id);
  if (stored) {
    return stored;
  }

  // Generate default job placement data
  const totalLearners = course.enrolled_students?.total || 500;
  const companies = ["Deloitte", "TCS", "Accenture"];

  return { totalLearners, companies };
};

export const getEffectiveWhatsIncluded = (course: {
  id: number;
  whats_included?: string[];
  stats?: CourseStats;
}): string[] => {
  // Check localStorage first (admin changes)
  const stored = getStoredWhatsIncluded(course.id);
  if (stored && stored.length > 0) {
    return stored;
  }

  // Check backend data
  if (course.whats_included && course.whats_included.length > 0) {
    return course.whats_included;
  }

  // Generate default what's included based on course stats
  const stats = course.stats || {
    video: { total: 10 },
    article: { total: 5 },
    coding_problem: { total: 3 },
    quiz: { total: 2 },
    assignment: { total: 2 },
  };
  const items = [];

  if (stats.video.total > 0) {
    items.push(`${stats.video.total}+ HD Video Lessons`);
  }
  if (stats.article.total > 0) {
    items.push(`${stats.article.total} Articles & Resources`);
  }
  if (stats.coding_problem && stats.coding_problem.total > 0) {
    items.push(`${stats.coding_problem.total} Coding Problems`);
  }
  if (stats.quiz.total > 0) {
    items.push(`${stats.quiz.total} Quizzes & Assessments`);
  }
  if (stats.assignment && stats.assignment.total > 0) {
    items.push(`${stats.assignment.total} Practical Assignments`);
  }

  // Add generic items if needed
  if (items.length < 3) {
    items.push(
      "Real datasets & project templates",
      "Free resume template",
      "Lifetime access to course materials",
      "Certificate of completion"
    );
  }

  return items.slice(0, 4);
};

// Course Tags utilities
export const getStoredCourseTags = (courseId: number): string[] | null => {
  try {
    const stored = localStorage.getItem(COURSE_TAGS_STORAGE_KEY);
    if (stored) {
      const tags = JSON.parse(stored);
      return tags[courseId] || null;
    }
  } catch (error) {
    console.warn("Error reading stored course tags:", error);
  }
  return null;
};

export const setStoredCourseTags = (courseId: number, tags: string[]): void => {
  try {
    const stored = localStorage.getItem(COURSE_TAGS_STORAGE_KEY);
    const data = stored ? JSON.parse(stored) : {};
    data[courseId] = tags;
    localStorage.setItem(COURSE_TAGS_STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    console.warn("Error storing course tags:", error);
  }
};

// Default available tags for admin selection
// Default available tags for admin selection (curated professional tags)
export const DEFAULT_AVAILABLE_TAGS = [
  "Beginner Friendly",
  "Intermediate Level",
  "Advanced Level",
  "Industry Certificate",
  "Job Ready",
  "Skills Development",
  "Portfolio Building",
  "Hands-On Projects",
  "Real-World Applications",
  "Career Boost",
  "High Demand Skills",
  "Practical Learning",
  "Professional Growth",
  "Programming",
  "Software Development",
  "Data Analysis",
  "Business Intelligence",
  "Design",
  "User Experience",
  "Marketing",
  "Business Strategy",
];
export const getEffectiveCourseTags = (course: {
  id: number;
  tags?: string[];
  title?: string;
  difficulty_level?: string;
}): string[] => {
  // Check localStorage first (admin changes)
  const stored = getStoredCourseTags(course.id);
  if (stored && stored.length > 0) {
    console.log(
      `🏷️ Using stored tags for course ${course.id} (${course.title}):`,
      stored
    );
    return stored;
  }

  // Check backend tags if available
  if (course.tags && course.tags.length > 0) {
    console.log(
      `📚 Using backend tags for course ${course.id} (${course.title}):`,
      course.tags
    );
    return course.tags;
  }

  // Return empty array - no auto-generation of tags
  // All tags must be set through admin interface or backend
  console.log(
    `⚠️ No tags found for course ${course.id} (${course.title}) - tags must be set via admin interface`
  );
  return [];
};

// === DEBUGGING AND CLEANUP UTILITIES ===

// Utility to clear all stored tags (useful for debugging)
export const clearAllStoredTags = (): void => {
  try {
    localStorage.removeItem(COURSE_TAGS_STORAGE_KEY);
    console.log("🧹 Cleared all stored course tags from localStorage");
  } catch (error) {
    console.warn("Error clearing stored tags:", error);
  }
};

// Utility to remove problematic hardcoded tags from stored data
export const cleanUpHardcodedTags = (): void => {
  try {
    const stored = localStorage.getItem(COURSE_TAGS_STORAGE_KEY);
    if (stored) {
      const data = JSON.parse(stored);
      const problematicTags = [
        "data",
        "science",
        "complete",
        "course",
        "Career Boost",
        "Hands-On Projects",
        "Industry Certificate",
        "Data Analysis",
        "Business Intelligence",
        "Programming",
        "Software Development",
        "Design",
        "User Experience",
        "adsfdasfadf", // Specific problematic tag
        "sql",
        "SQL", // SQL related cleanup
      ];

      let cleaned = false;
      Object.keys(data).forEach((courseId) => {
        const originalTags = data[courseId] || [];
        const cleanedTags = originalTags.filter((tag: string) => {
          // Check for exact matches (case insensitive) and substring matches
          const isProblematic = problematicTags.some(
            (problematic) =>
              tag.toLowerCase() === problematic.toLowerCase() ||
              tag.toLowerCase().includes(problematic.toLowerCase()) ||
              tag === "adsfdasfadf" || // Exact match for this specific tag
              /^[a-z]{10,}$/.test(tag.toLowerCase()) // Random string pattern
          );
          return !isProblematic;
        });

        if (cleanedTags.length !== originalTags.length) {
          data[courseId] = cleanedTags;
          cleaned = true;
          console.log(`🧹 Cleaned tags for course ${courseId}:`, {
            before: originalTags,
            after: cleanedTags,
          });
        }
      });

      if (cleaned) {
        localStorage.setItem(COURSE_TAGS_STORAGE_KEY, JSON.stringify(data));
        console.log("✅ Cleaned up hardcoded tags from localStorage");
      } else {
        console.log("✨ No problematic tags found in localStorage");
      }
    } else {
      console.log("📂 No stored tags found in localStorage");
    }
  } catch (error) {
    console.warn("Error cleaning up tags:", error);
  }
};

// Run cleanup on module load to remove any existing problematic tags
if (typeof window !== "undefined") {
  // Only run in browser environment
  setTimeout(() => {
    cleanUpHardcodedTags();
  }, 1000);
}

// === COURSE FEATURES UTILITIES ===

// Course Features storage utilities
export const getStoredFeatures = (courseId: number): string[] | null => {
  try {
    const storedFeatures = localStorage.getItem(COURSE_FEATURES_STORAGE_KEY);
    if (storedFeatures) {
      const features = JSON.parse(storedFeatures);
      return features[courseId] || null;
    }
  } catch (error) {
    console.warn("Error reading stored features:", error);
  }
  return null;
};

export const setStoredFeatures = (
  courseId: number,
  features: string[]
): void => {
  try {
    const storedFeatures = localStorage.getItem(COURSE_FEATURES_STORAGE_KEY);
    const featuresData = storedFeatures ? JSON.parse(storedFeatures) : {};
    featuresData[courseId] = features;
    localStorage.setItem(
      COURSE_FEATURES_STORAGE_KEY,
      JSON.stringify(featuresData)
    );
    console.log(`💾 Stored features for course ${courseId}:`, features);
  } catch (error) {
    console.warn("Error storing features:", error);
  }
};

// Get effective course features (stored > backend > generated default)
export const getEffectiveFeatures = (course: {
  id: number;
  features?: string[];
  stats?: CourseStats;
}): string[] => {
  const storedFeatures = getStoredFeatures(course.id);

  if (storedFeatures) {
    console.log(
      `🎯 Using stored features for course ${course.id}:`,
      storedFeatures
    );
    return storedFeatures;
  }

  if (course.features && course.features.length > 0) {
    console.log(
      `📚 Using backend features for course ${course.id}:`,
      course.features
    );
    return course.features;
  }

  // Generate default features based on course stats
  const defaultFeatures = [];
  const stats = course.stats;

  if (stats?.video?.total && stats.video.total > 0) {
    defaultFeatures.push(`${stats.video.total}+ HD Video Lessons`);
  }
  if (stats?.article?.total && stats.article.total > 0) {
    defaultFeatures.push(`${stats.article.total} Articles & Resources`);
  }
  if (stats?.quiz?.total && stats.quiz.total > 0) {
    defaultFeatures.push(`${stats.quiz.total} Interactive Quizzes`);
  }
  if (stats?.coding_problem?.total && stats.coding_problem.total > 0) {
    defaultFeatures.push(`${stats.coding_problem.total} Coding Challenges`);
  }
  if (stats?.assignment?.total && stats.assignment.total > 0) {
    defaultFeatures.push(`${stats.assignment.total} Practical Projects`);
  }

  defaultFeatures.push("Certificate of Completion");
  defaultFeatures.push("Lifetime Access");
  defaultFeatures.push("Mobile & Desktop Access");

  console.log(
    `🔄 Generated default features for course ${course.id}:`,
    defaultFeatures
  );
  return defaultFeatures;
};

// === COURSE REQUIREMENTS UTILITIES ===

// Course Requirements storage utilities
export const getStoredRequirements = (courseId: number): string[] | null => {
  try {
    const storedRequirements = localStorage.getItem(
      COURSE_REQUIREMENTS_STORAGE_KEY
    );
    if (storedRequirements) {
      const requirements = JSON.parse(storedRequirements);
      return requirements[courseId] || null;
    }
  } catch (error) {
    console.warn("Error reading stored requirements:", error);
  }
  return null;
};

export const setStoredRequirements = (
  courseId: number,
  requirements: string[]
): void => {
  try {
    const storedRequirements = localStorage.getItem(
      COURSE_REQUIREMENTS_STORAGE_KEY
    );
    const requirementsData = storedRequirements
      ? JSON.parse(storedRequirements)
      : {};
    requirementsData[courseId] = requirements;
    localStorage.setItem(
      COURSE_REQUIREMENTS_STORAGE_KEY,
      JSON.stringify(requirementsData)
    );
    console.log(`💾 Stored requirements for course ${courseId}:`, requirements);
  } catch (error) {
    console.warn("Error storing requirements:", error);
  }
};

// Get effective course requirements (stored > backend > generated default)
export const getEffectiveRequirements = (course: {
  id: number;
  requirements?: string;
  difficulty_level?: string;
}): string[] => {
  const storedRequirements = getStoredRequirements(course.id);

  if (storedRequirements) {
    console.log(
      `🎯 Using stored requirements for course ${course.id}:`,
      storedRequirements
    );
    return storedRequirements;
  }

  if (course.requirements && course.requirements.trim()) {
    const requirementsArray = course.requirements
      .split("\n")
      .filter((req) => req.trim());
    if (requirementsArray.length > 0) {
      console.log(
        `📚 Using backend requirements for course ${course.id}:`,
        requirementsArray
      );
      return requirementsArray;
    }
  }

  // Generate default requirements based on difficulty
  const defaultRequirements = [];

  if (course.difficulty_level === "Easy") {
    defaultRequirements.push("No prior experience required");
    defaultRequirements.push("Basic computer literacy");
    defaultRequirements.push("Internet connection for online learning");
  } else if (course.difficulty_level === "Medium") {
    defaultRequirements.push("Basic understanding of the subject");
    defaultRequirements.push("Computer with reliable internet connection");
    defaultRequirements.push("Dedication to complete course assignments");
  } else if (course.difficulty_level === "Hard") {
    defaultRequirements.push("Prior experience in the field");
    defaultRequirements.push("Strong foundation in related concepts");
    defaultRequirements.push("Commitment to intensive learning");
  } else {
    defaultRequirements.push("Enthusiasm to learn");
    defaultRequirements.push("Computer with internet access");
    defaultRequirements.push("Time to complete course materials");
  }

  console.log(
    `🔄 Generated default requirements for course ${course.id}:`,
    defaultRequirements
  );
  return defaultRequirements;
};

// Manual cleanup function for immediate problematic tag removal
export const forceRemoveSpecificTag = (tagToRemove: string): void => {
  try {
    const stored = localStorage.getItem(COURSE_TAGS_STORAGE_KEY);
    if (stored) {
      const data = JSON.parse(stored);
      let cleaned = false;

      Object.keys(data).forEach((courseId) => {
        const originalTags = data[courseId] || [];
        const cleanedTags = originalTags.filter(
          (tag: string) => tag !== tagToRemove
        );

        if (cleanedTags.length !== originalTags.length) {
          data[courseId] = cleanedTags;
          cleaned = true;
          console.log(`🎯 Removed '${tagToRemove}' from course ${courseId}`);
        }
      });

      if (cleaned) {
        localStorage.setItem(COURSE_TAGS_STORAGE_KEY, JSON.stringify(data));
        console.log(
          `✅ Successfully removed '${tagToRemove}' from all courses`
        );
      }
    }
  } catch (error) {
    console.warn(`Error removing tag '${tagToRemove}':`, error);
  }
};

// Auto-cleanup problematic tags on module load (enhanced)
cleanUpHardcodedTags();

// Immediately remove the specific problematic tag
forceRemoveSpecificTag("adsfdasfadf");

// ============ INSTRUCTOR MANAGEMENT ============
// Instructor storage functions
export const setStoredInstructors = (
  courseId: number | string,
  instructors: Array<{
    id: number | undefined;
    name: string;
    profile_pic_url?: string;
  }>
) => {
  try {
    const stored = localStorage.getItem(COURSE_INSTRUCTORS_STORAGE_KEY);
    const data = stored ? JSON.parse(stored) : {};
    data[courseId] = instructors;
    localStorage.setItem(COURSE_INSTRUCTORS_STORAGE_KEY, JSON.stringify(data));
    console.log(`💾 Stored instructors for course ${courseId}:`, instructors);
  } catch (error) {
    console.warn("Error storing instructors:", error);
  }
};

export const getEffectiveInstructors = (course: {
  id: number | string;
  instructors?: Array<{
    id: number;
    name?: string | undefined;
    bio?: string;
    profile_pic_url?: string;
    linkedin_profile?: string;
  }>;
}): Array<{
  id?: number;
  name?: string | undefined;
  bio?: string;
  profile_pic_url?: string;
  linkedin_profile?: string;
}> => {
  try {
    // Function to normalize instructor images (handles specific instructor image corrections)
    const normalizeInstructor = (instructor: {
      id?: number;
      name?: string | undefined;
      bio?: string;
      profile_pic_url?: string;
      linkedin_profile?: string;
    }) => {
      const normalizedName = instructor.name ?? "";

      if (instructor.name === "Shubham Lal") {
        return {
          ...instructor,
          name: normalizedName,
          profile_pic_url:
            "https://lh3.googleusercontent.com/a/ACg8ocJSPMwGcKIWqYE1LDeBo_N1Z5pYriaPsNJSwLFAbPQ4N9lmnNIs=s96-c",
        };
      }

      return {
        ...instructor,
        name: normalizedName,
      };
    };

    // First check localStorage for admin overrides
    const stored = localStorage.getItem(COURSE_INSTRUCTORS_STORAGE_KEY);
    if (stored) {
      const data = JSON.parse(stored);
      if (data[course.id] && Array.isArray(data[course.id])) {
        const normalizedInstructors = data[course.id].map(normalizeInstructor);
        console.log(
          `📖 Using stored instructors for course ${course.id}:`,
          normalizedInstructors
        );
        return normalizedInstructors;
      }
    }

    // Fall back to course data
    const courseInstructors = course.instructors || [];
    if (courseInstructors.length > 0) {
      const normalizedInstructors = courseInstructors.map(normalizeInstructor);
      console.log(
        `📖 Using course instructors for course ${course.id}:`,
        normalizedInstructors
      );
      return normalizedInstructors;
    }

    // Default fallback
    const defaultInstructors = [
      {
        id: 1,
        name: "Shubham Lal",
        profile_pic_url:
          "https://lh3.googleusercontent.com/a/ACg8ocJSPMwGcKIWqYE1LDeBo_N1Z5pYriaPsNJSwLFAbPQ4N9lmnNIs=s96-c",
      },
    ];
    console.log(
      `📖 Using default instructors for course ${course.id}:`,
      defaultInstructors
    );
    return defaultInstructors;
  } catch (error) {
    console.warn("Error getting effective instructors:", error);
    return [
      {
        id: 1,
        name: "Shubham Lal",
        profile_pic_url:
          "https://lh3.googleusercontent.com/a/ACg8ocJSPMwGcKIWqYE1LDeBo_N1Z5pYriaPsNJSwLFAbPQ4N9lmnNIs=s96-c",
      },
    ];
  }
};
