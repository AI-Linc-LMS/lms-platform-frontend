/**
 * Single source of truth for interview topics across every form that lets a user pick
 * one - QuickStartForm, ScheduleInterviewForm, and the admin templates page all import
 * from here. Add new topics to the array and they immediately appear everywhere.
 *
 * The CUSTOM_TOPIC_VALUE sentinel is used in <Select> bindings to flag "custom" mode
 * so the form swaps in a free-form TextField for the candidate / admin to type their own.
 */
export const INTERVIEW_TOPICS: readonly string[] = [
  "JavaScript",
  "React",
  "TypeScript",
  "Node.js",
  "Python",
  "SQL",
  "System Design",
  "Data Structures & Algorithms",
  "Algorithms",
  "Database Design",
  "Cloud Architecture",
  "Behavioral Questions",
  "Leadership & Management",
] as const;

export const CUSTOM_TOPIC_VALUE = "__CUSTOM__";
