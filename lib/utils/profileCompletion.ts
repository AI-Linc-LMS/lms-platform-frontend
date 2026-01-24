import { UserProfile } from "@/lib/services/profile.service";

export interface ProfileCompletionResult {
  percentage: number;
  missingFields: string[];
  completedFields: number;
  totalFields: number;
}

const REQUIRED_FIELDS = [
  "first_name",
  "last_name",
  "email",
  "phone_number",
  "bio",
] as const;

const OPTIONAL_FIELDS = [
  "date_of_birth",
  "college_name",
  "degree_type",
  "branch",
  "graduation_year",
  "city",
  "state",
  "portfolio_website_url",
  "leetcode_url",
  "hackerrank_url",
  "kaggle_url",
  "medium_url",
  "social_links.github",
  "social_links.linkedin",
] as const;

const ARRAY_FIELDS = [
  "skills",
  "projects",
  "experience",
  "education",
  "certifications",
  "achievements",
] as const;

const FIELD_LABELS: Record<string, string> = {
  first_name: "First Name",
  last_name: "Last Name",
  email: "Email",
  phone_number: "Phone Number",
  bio: "Bio",
  date_of_birth: "Date of Birth",
  college_name: "College/University Name",
  degree_type: "Degree Type",
  branch: "Branch/Major",
  graduation_year: "Graduation Year",
  city: "City",
  state: "State",
  portfolio_website_url: "Portfolio Website",
  leetcode_url: "LeetCode Profile",
  hackerrank_url: "HackerRank Profile",
  kaggle_url: "Kaggle Profile",
  medium_url: "Medium Profile",
  "social_links.github": "GitHub Profile",
  "social_links.linkedin": "LinkedIn Profile",
  skills: "Skills",
  projects: "Projects",
  experience: "Experience",
  education: "Education",
  certifications: "Certifications",
  achievements: "Achievements",
};

function isFieldFilled(profile: UserProfile, field: string): boolean {
  if (field.includes(".")) {
    const [parent, child] = field.split(".");
    if (parent === "social_links") {
      return !!(profile.social_links?.[child as keyof typeof profile.social_links]);
    }
    return false;
  }

  const value = profile[field as keyof UserProfile];
  
  if (Array.isArray(value)) {
    return value.length > 0;
  }
  
  if (typeof value === "string") {
    return value.trim().length > 0;
  }
  
  return value !== null && value !== undefined;
}

export function calculateProfileCompletion(
  profile: UserProfile | null
): ProfileCompletionResult {
  if (!profile) {
    return {
      percentage: 0,
      missingFields: [],
      completedFields: 0,
      totalFields: REQUIRED_FIELDS.length + OPTIONAL_FIELDS.length + ARRAY_FIELDS.length,
    };
  }

  const missingFields: string[] = [];
  let completedFields = 0;
  const totalFields = REQUIRED_FIELDS.length + OPTIONAL_FIELDS.length + ARRAY_FIELDS.length;

  // Check required fields
  for (const field of REQUIRED_FIELDS) {
    if (isFieldFilled(profile, field)) {
      completedFields++;
    } else {
      missingFields.push(FIELD_LABELS[field] || field);
    }
  }

  // Check optional fields
  for (const field of OPTIONAL_FIELDS) {
    if (isFieldFilled(profile, field)) {
      completedFields++;
    } else {
      missingFields.push(FIELD_LABELS[field] || field);
    }
  }

  // Check array fields
  for (const field of ARRAY_FIELDS) {
    if (isFieldFilled(profile, field)) {
      completedFields++;
    } else {
      missingFields.push(FIELD_LABELS[field] || field);
    }
  }

  const percentage = Math.round((completedFields / totalFields) * 100);

  return {
    percentage,
    missingFields,
    completedFields,
    totalFields,
  };
}
