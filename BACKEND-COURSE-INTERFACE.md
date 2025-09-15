# Backend API Course Interface Documentation

## Overview
This document defines the exact Course interface that the frontend expects from the backend API. Please implement all these fields in your course endpoints.

## Course Interface

```typescript
interface Course {
  // REQUIRED CORE FIELDS
  id: number;                    // Unique course identifier
  title: string;                 // Course name/title
  description: string;           // Course description

  // PRICING & ACCESS
  price?: number;                // Course price in USD (optional, defaults to 0)
  is_free?: boolean;             // Whether course is free (optional, defaults to false)

  // COURSE METADATA
  difficulty_level?: string;      // "Beginner" | "Intermediate" | "Advanced"
  duration_in_hours?: number;    // Total course duration in hours
  rating?: number;               // Course rating 0-5 (optional)
  certificate_available?: boolean; // Whether completion certificate is available

  // USER ENROLLMENT STATUS
  is_enrolled?: boolean;         // Whether current user is enrolled
  enrolled_students?: {          // Student enrollment details
    total: number;               // Total enrolled students count
    students_profile_pic?: string[]; // Array of student profile picture URLs (max 5)
  };

  // COURSE STATISTICS & PROGRESS
  stats?: {
    video: { 
      total: number;             // Total number of video lessons
      completed?: number;        // Number completed by current user (if enrolled)
    };
    article: { 
      total: number;             // Total number of articles
      completed?: number;        // Number completed by current user (if enrolled)
    };
    coding_problem: { 
      total: number;             // Total coding problems
      completed?: number;        // Number completed by current user (if enrolled)
    };
    quiz: { 
      total: number;             // Total quizzes
      completed?: number;        // Number completed by current user (if enrolled)
    };
    assignment: { 
      total: number;             // Total assignments
      completed?: number;        // Number completed by current user (if enrolled)
    };
  };

  // COMPANY ENDORSEMENTS
  trusted_by?: Array<{
    name: string;                // Company name (e.g., "Microsoft", "Google")
    color?: string;              // Optional hex color for company branding
  }>;

  // COURSE TAGS/CATEGORIES
  tags?: Array<{
    name: string;                // Tag name (e.g., "Data Analysis", "Programming")
    color?: string;              // Optional hex color for tag styling
  }>;

  // INSTRUCTOR INFORMATION
  instructors?: Array<{
    id: string;                  // Instructor unique ID
    name: string;                // Instructor full name
    bio?: string;                // Instructor biography
    profile_pic_url?: string;    // Instructor profile picture URL
    linkedin_profile?: string;   // LinkedIn profile URL
  }>;

  // COURSE STRUCTURE
  modules?: Array<{
    id: number;                  // Module unique ID
    title: string;               // Module title
    weekno: number;              // Week number (1-based)
    completion_percentage: number; // Module completion % for enrolled user (0-100)
    submodules: Array<{
      id: number;                // Submodule unique ID
      title: string;             // Submodule title
      description: string;       // Submodule description
      order: number;             // Display order within module
      article_count: number;     // Number of articles in this submodule
      assignment_count: number;  // Number of assignments
      coding_problem_count: number; // Number of coding problems
      quiz_count: number;        // Number of quizzes
      video_count: number;       // Number of videos
    }>;
  }>;

  // FOR ENROLLED STUDENTS ONLY
  next_lesson?: {
    title: string;               // Next recommended lesson title
    description: string;         // Lesson description
    duration: number;            // Lesson duration in minutes
  };

  // USER INTERACTION DATA
  is_liked_by_current_user?: boolean; // Whether current user liked the course
  liked_count?: number;         // Total number of likes

  // PROGRESS TRACKING (FOR ENROLLED USERS)
  progress_percentage?: number; // Overall course completion % (0-100)
  recent_activity?: string;     // Latest activity description
  current_streak_days?: number; // Current learning streak in days
  badges_earned?: number;       // Number of badges earned in this course
  last_accessed?: string;       // ISO date string of last access

  // TIMESTAMPS
  created_at?: string;          // Course creation date (ISO string)
  updated_at?: string;          // Last update date (ISO string)
}
```

## API Endpoint Examples

### GET /api/courses
Returns array of courses for course listing pages.
**Required fields**: `id`, `title`, `description`, `price`, `is_free`, `difficulty_level`, `duration_in_hours`, `rating`, `enrolled_students.total`, `trusted_by`

### GET /api/courses/:id
Returns detailed course information.
**Required fields**: All fields as applicable

### GET /api/user/enrolled-courses
Returns courses the current user is enrolled in.
**Required fields**: All fields + enrollment-specific data like `progress_percentage`, `stats.*.completed`, `recent_activity`, `current_streak_days`, `badges_earned`, `last_accessed`

## Important Notes

1. **Optional Fields**: All fields marked with `?` are optional. Frontend has fallbacks.

2. **Enrolled vs Non-enrolled**: 
   - Non-enrolled users don't need: `stats.*.completed`, `progress_percentage`, `recent_activity`, `current_streak_days`, `badges_earned`, `last_accessed`, `next_lesson`
   - These fields should only be included for enrolled users

3. **Dynamic Generation**: If any optional fields are missing, frontend will generate placeholder data

4. **Consistent Data Types**: Please maintain exact data types as specified

5. **Performance**: Consider pagination for course lists and lazy-loading for detailed course data

## Frontend Usage
This interface is used in:
- Course listing pages
- Course detail pages  
- Student dashboard
- Course cards (collapsed/expanded states)
- Progress tracking components

Please implement this interface exactly as specified to ensure frontend compatibility.
