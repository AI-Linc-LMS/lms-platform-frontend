import apiClient from "./api";
import { config } from "../config";

export interface Instructor {
  id: number;
  name: string;
  bio: string;
  profile_pic_url: string;
  linkedin: string;
}

export interface TrustedBy {
  id: number;
  name: string;
  logo_url: string;
}

export interface Course {
  id: number;
  title: string;
  subtitle?: string;
  description: string;
  slug: string;
  requirements?: string;
  learning_objectives?: string;
  language: string;
  difficulty_level: string;
  duration_in_hours?: number;
  price: string;
  is_free: boolean;
  certificate_available: boolean;
  thumbnail?: string | null;
  preview_video_url?: string | null;
  published: boolean;
  enrollment_enabled: boolean;
  created_at: string;
  updated_at: string;
  tags: string[];
  client: number;
  liked_by: number[];
  is_enrolled: boolean;
  instructors: Instructor[];
  trusted_by: TrustedBy[];
  enrolled_students: {
    total: number;
    students_profile_pic: string[];
  };
  stats: {
    video: { total: number };
    quiz: { total: number };
    article: { total: number };
    assignment: { total: number };
    coding_problem: { total: number };
  };
  rating?: number; // Average rating (0-5)
  rating_count?: number; // Number of ratings
}

export interface Module {
  id: number;
  weekno: number;
  title: string;
  completion_percentage: number;
  submodules: SubModule[];
}

export interface SubModule {
  id: number;
  title: string;
  description: string;
  order: number;
  video_count: number;
  quiz_count: number;
  article_count: number;
  coding_problem_count: number;
  assignment_count: number;
}

export interface CourseDetail {
  course_id: number;
  course_title: string;
  course_description: string;
  instructors: Instructor[];
  enrolled_students: number;
  liked_count: number;
  is_liked_by_current_user: boolean;
  is_certified: boolean;
  updated_at: string;
  modules: Module[];
}

export interface CourseDashboard {
  completion_percentage: number;
  total_modules: number;
  completed_modules: number;
  total_contents: number;
  completed_contents: number;
  article_progress?: number;
  quiz_progress?: number;
  video_progress?: number;
  assignment_progress?: number;
  coding_problem_progress?: number;
  total_progress?: number;
}

export interface Content {
  id: number;
  content_type: string;
  content_id: number;
  title: string;
  order: number;
  is_completed: boolean;
}

export interface SubModuleContentItem {
  id: number;
  title: string;
  content_type: string;
  order: number;
  duration_in_minutes: number;
  marks: number;
  status: "complete" | "incomplete" | "pending";
  submissions: number | null;
  obtainedMarks: number | null;
}

export interface SubModuleDetailResponse {
  status: string;
  courseId: number;
  moduleName: string;
  weekNo: number;
  submoduleId: number;
  submoduleName: string;
  data: SubModuleContentItem[];
}

export interface SubModuleDetail {
  id: number;
  title: string;
  description: string;
  order: number;
  contents: Content[];
}

export interface VideoTutorialDetail {
  id: number;
  title: string;
  video_url: string;
  description: string;
  difficulty_level: string;
}

export interface ContentDetail {
  id: number;
  content_type: string;
  content_title: string;
  duration_in_minutes: number;
  order: number;
  status: "complete" | "incomplete" | "pending";
  marks: number;
  details: VideoTutorialDetail | any;
  next_content?: {
    id: number;
    content_type: string;
  } | null;
  previous_content?: {
    id: number;
    content_type: string;
  } | null;
}

export interface LikeResponse {
  liked: boolean;
  likes_count: number;
}

export interface LeaderboardEntry {
  name: string;

  score: number;
  rank: number;
}

export const coursesService = {
  // List all courses
  getCourses: async (): Promise<Course[]> => {
    const response = await apiClient.get<Course[]>(
      `/lms/clients/${config.clientId}/courses/`
    );
    return response.data;
  },

  // Get course detail
  getCourseDetail: async (courseId: number): Promise<CourseDetail> => {
    const response = await apiClient.get<CourseDetail>(
      `/lms/clients/${config.clientId}/courses/${courseId}/`
    );
    return response.data;
  },

  // Enroll in course
  enrollInCourse: async (courseId: number): Promise<{ detail: string }> => {
    const response = await apiClient.post<{ detail: string }>(
      `/lms/clients/${config.clientId}/courses/${courseId}/enroll/`
    );
    return response.data;
  },

  // Toggle like/dislike course
  toggleLike: async (courseId: number): Promise<LikeResponse> => {
    const response = await apiClient.post<LikeResponse>(
      `/lms/clients/${config.clientId}/courses/${courseId}/toggle-like/`
    );
    return response.data;
  },

  // Get course leaderboard
  getCourseLeaderboard: async (
    courseId: number
  ): Promise<LeaderboardEntry[]> => {
    const response = await apiClient.get<LeaderboardEntry[]>(
      `/lms/clients/${config.clientId}/courses/${courseId}/leaderboard/`
    );
    return response.data;
  },

  // Get user course dashboard
  getUserCourseDashboard: async (
    courseId: number
  ): Promise<CourseDashboard> => {
    const response = await apiClient.get<CourseDashboard>(
      `/lms/clients/${config.clientId}/courses/${courseId}/user-course-dashboard/`
    );
    return response.data;
  },

  // Get submodule detail (old API format)
  getSubModule: async (
    courseId: number,
    submoduleId: number
  ): Promise<SubModuleDetail> => {
    const response = await apiClient.get<SubModuleDetail>(
      `/lms/clients/${config.clientId}/courses/${courseId}/sub-module/${submoduleId}/`
    );
    return response.data;
  },

  // Get submodule detail with content list (new API format)
  getSubModuleWithContents: async (
    courseId: number,
    submoduleId: number
  ): Promise<SubModuleDetailResponse> => {
    const response = await apiClient.get<SubModuleDetailResponse>(
      `/lms/clients/${config.clientId}/courses/${courseId}/sub-module/${submoduleId}/`
    );
    return response.data;
  },

  // Get content detail
  getContentDetail: async (
    courseId: number,
    contentId: number
  ): Promise<ContentDetail> => {
    const response = await apiClient.get<ContentDetail>(
      `/lms/clients/${config.clientId}/courses/${courseId}/content/${contentId}/`
    );
    return response.data;
  },

  // Get past submissions
  getPastSubmissions: async (
    courseId: number,
    contentId: number
  ): Promise<any[]> => {
    const response = await apiClient.get<any[]>(
      `/lms/clients/${config.clientId}/courses/${courseId}/content/${contentId}/past-submissions/`
    );
    return response.data;
  },

  // Add comment to content
  addComment: async (
    courseId: number,
    contentId: number,
    comment: string
  ): Promise<any> => {
    const response = await apiClient.post(
      `/lms/clients/${config.clientId}/courses/${courseId}/content/${contentId}/comment/`,
      { text: comment }
    );
    return response.data;
  },

  // Get comments for content
  getComments: async (courseId: number, contentId: number): Promise<any[]> => {
    const response = await apiClient.get<any[]>(
      `/lms/clients/${config.clientId}/courses/${courseId}/content/${contentId}/comment/`
    );
    return response.data;
  },

  // Create user activity
  // activityType should be the content type (e.g., "VideoTutorial", "Quiz")
  // actionType should be the action (e.g., "view", "start", "complete")
  // userAnswers is for Quiz completion - array of {questionId, isCorrect, questionIndex, selectedOption}
  createUserActivity: async (
    courseId: number,
    contentId: number,
    activityType: string, // Content type: VideoTutorial, Quiz, etc.
    metadata?: {
      activity_type?: string;
      userAnswers?: Array<{
        questionId: number | string;
        isCorrect: boolean;
        questionIndex: number;
        selectedOption: string;
      }>;
    } // Action type: view, start, complete
  ): Promise<any> => {
    // activity_type is passed as query parameter, e.g., /?activity_type=VideoTutorial
    const actionType = metadata?.activity_type || "view";

    // For Quiz with userAnswers, always send {"userAnswers": [...]} format
    // For "complete" action with VideoTutorial, send empty JSON object {}
    // For other actions, send the activity_type and metadata
    let requestBody: any;
    if (activityType === "Quiz" && metadata?.userAnswers) {
      // Quiz completion - send userAnswers in the exact format required
      requestBody = {
        userAnswers: metadata.userAnswers,
      };
    } else if (actionType === "complete") {
      requestBody = {};
    } else {
      requestBody = {
        activity_type: actionType,
        metadata: {
          activity_type: actionType,
          ...metadata,
        },
      };
    }

    const endpoint = `/activity/clients/${config.clientId}/courses/${courseId}/content/${contentId}/?activity_type=${activityType}`;

    const response = await apiClient.post(endpoint, requestBody);

    return response.data;
  },

  // Coding Problem: Run Code
  runCode: async (
    courseId: number,
    contentId: number,
    sourceCode: string,
    languageId: number,
    customInput?: string
  ): Promise<any> => {
    const endpoint = `/activity/clients/${config.clientId}/courses/${courseId}/content/${contentId}/?activity_type=CodingProblem&sub_type=runCode`;

    const payload: any = {
      source_code: sourceCode,
      language_id: languageId,
    };

    // Add custom input if provided
    if (customInput !== undefined) {
      payload.stdin = customInput;
    }

    const response = await apiClient.post(endpoint, payload);

    return response.data;
  },

  // Coding Problem: Submit Code
  submitCode: async (
    courseId: number,
    contentId: number,
    sourceCode: string,
    languageId: number
  ): Promise<any> => {
    const endpoint = `/activity/clients/${config.clientId}/courses/${courseId}/content/${contentId}/?activity_type=CodingProblem&sub_type=submitCode`;

    const response = await apiClient.post(endpoint, {
      source_code: sourceCode,
      language_id: languageId,
    });

    return response.data;
  },

  // Coding Problem: Get Previous Submissions
  getCodingSubmissions: async (
    courseId: number,
    contentId: number
  ): Promise<any[]> => {
    const response = await apiClient.get(
      `/lms/clients/${config.clientId}/courses/${courseId}/content/${contentId}/past-submissions/`
    );
    return response.data;
  },
};
