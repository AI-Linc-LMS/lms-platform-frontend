import { Course } from "../types/final-course.types";

/**
 * Calculates the definitive progress percentage for a course.
 * It first checks for a direct 'progress_percentage' from the API.
 * If unavailable, it calculates it based on completed videos and quizzes.
 * Ensures that any minimal progress (e.g., 0.5%) is shown as 1%.
 *
 * @param course - The course object from the API.
 * @returns The calculated progress percentage as a whole number.
 */
export const calculateCourseProgress = (course: Course): number => {
  // Priority 1: Use the progress percentage from the backend if it exists and is valid.
  if (
    typeof course.progress_percentage === "number" &&
    course.progress_percentage > 0
  ) {
    const roundedProgress = Math.round(course.progress_percentage);
    // If progress is very small but not zero, show at least 1%.
    if (roundedProgress === 0 && course.progress_percentage > 0) {
      return 1;
    }
    return roundedProgress;
  }

  // Priority 2: Calculate from detailed stats if 'progress_percentage' is not available.
  const totalVideos = course.stats?.video?.total || 0;
  const completedVideos = course.stats?.video?.completed || 0;
  const totalArticles = course.stats?.article?.total || 0;
  const completedArticles = course.stats?.article?.completed || 0;
  const totalCodingProblems = course.stats?.coding_problem?.total || 0;
  const completedCodingProblems = course.stats?.coding_problem?.completed || 0;
  const totalQuizzes = course.stats?.quiz?.total || 0;
  const completedQuizzes = course.stats?.quiz?.completed || 0;
  const totalAssignments = course.stats?.assignment?.total || 0;
  const completedAssignments = course.stats?.assignment?.completed || 0;

  const totalItems =
    totalVideos +
    totalArticles +
    totalCodingProblems +
    totalQuizzes +
    totalAssignments;
  if (totalItems === 0) {
    return 0; // No trackable items, so progress is 0.
  }

  const completedItems =
    completedVideos +
    completedArticles +
    completedCodingProblems +
    completedQuizzes +
    completedAssignments;
  const calculatedProgress = (completedItems / totalItems) * 100;

  // If calculation results in a tiny, non-zero progress, show 1%.
  if (calculatedProgress > 0 && calculatedProgress < 1) {
    return 1;
  }

  return Math.round(calculatedProgress);
};
