import { Assessment } from "@/lib/services/assessment.service";

/**
 * Checks if an assessment is a psychometric assessment
 * by checking if the title or slug contains "psychometric" or "k-disha" (case-insensitive)
 */
export function isPsychometricAssessment(assessment: Assessment): boolean {
  const title = assessment.title?.toLowerCase() || "";
  const slug = assessment.slug?.toLowerCase() || "";
  
  return (
    title.includes("psychometric") || 
    slug.includes("psychometric") ||
    title.includes("k-disha") ||
    slug.includes("k-disha") ||
    title.includes("kdisha") ||
    slug.includes("kdisha")
  );
}

/**
 * Generates tags for psychometric assessments
 * Returns a mix of predefined tags and dynamic tags based on assessment data
 */
export function getPsychometricTags(
  assessment: Assessment
): Array<{ name: string; color: string }> {
  const tags: Array<{ name: string; color: string }> = [];
  
  // Predefined tags that are always included
  const predefinedTags = [
    { name: "Personality Assessment", color: "#7c3aed" },
    { name: "Behavioral Analysis", color: "#6366f1" },
    { name: "Self-Discovery", color: "#8b5cf6" },
  ];
  
  // Add predefined tags
  tags.push(...predefinedTags);
  
  // Dynamic tags based on assessment data
  const description = assessment.description?.toLowerCase() || "";
  const instructions = assessment.instructions?.toLowerCase() || "";
  const title = assessment.title?.toLowerCase() || "";
  
  // Check for career-related keywords
  if (
    description.includes("career") ||
    instructions.includes("career") ||
    title.includes("career")
  ) {
    tags.push({ name: "Career Guidance", color: "#a855f7" });
  }
  
  // Check for learning-related keywords
  if (
    description.includes("learning") ||
    instructions.includes("learning") ||
    description.includes("education")
  ) {
    tags.push({ name: "Learning Style", color: "#9333ea" });
  }
  
  // Check for work-related keywords
  if (
    description.includes("work") ||
    instructions.includes("work") ||
    description.includes("workplace")
  ) {
    tags.push({ name: "Work Style", color: "#7e22ce" });
  }
  
  // Limit to 4 tags maximum
  return tags.slice(0, 4);
}
