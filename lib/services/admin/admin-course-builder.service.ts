import apiClient from "../api";
import { config } from "../../config";
import { AxiosError } from "axios";

// Define interfaces for course-related data
export interface CourseData {
  title: string;
  description: string;
  slug?: string; // Optional on update; omit when unchanged to avoid backend uniqueness false positive
  difficulty_level?: string; // Valid values: 'Easy', 'Medium', 'Hard'
  rating?: number; // Course rating 0-5
  is_pro?: boolean;
  is_free?: boolean;
  enrollment_enabled?: boolean;
  tags?: string | string[]; // Tags as comma-separated string or array
  [key: string]: string | number | boolean | string[] | undefined;
}

export interface ModuleData {
  title: string;
  weekno: number;
  description?: string;
  [key: string]: string | number | undefined;
}

export interface SubmoduleData {
  title: string;
  description: string;
  order: number;
  [key: string]: string | number | undefined;
}

export interface ContentData {
  title: string;
  content_type: BackendContentType;
  content_id?: number;
  video_content?: number | null;
  article_content?: number | null;
  quiz_content?: number | null;
  assignment_content?: number | null;
  coding_problem_content?: number | null;
  order: number;
  duration_in_minutes: number;
  marks?: number;
}

export type ContentIdType = "video" | "article" | "quiz" | "assignment" | "coding_problem";
export type BackendContentType =
  | "VideoTutorial"
  | "Article"
  | "Quiz"
  | "Assignment"
  | "CodingProblem";

export interface VideoTutorialPayload {
  title: string;
  difficulty_level?: string;
  video_url: string;
  description?: string;
  transcript?: string;
}

export interface ArticlePayload {
  title: string;
  difficulty_level?: string;
  content: string;
}

export interface AssignmentPayload {
  title: string;
  difficulty_level?: string;
  question: string;
}

export interface CodingProblemPayload {
  title: string;
  difficulty_level?: string;
  problem_statement: string;
  input_format?: string;
  output_format?: string;
  sample_input?: string;
  sample_output?: string;
  constraints?: string;
  test_cases?: unknown[];
  solution?: Record<string, unknown>;
  template_code?: Record<string, unknown>;
  time_limit?: number;
  memory_limit?: number;
  tags?: string;
}

export interface MCQPayload {
  question_text: string;
  difficulty_level?: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_option: "A" | "B" | "C" | "D";
  explanation?: string;
  topic?: string;
  skills?: string;
}

export interface QuizPayload {
  title: string;
  instructions?: string;
  durating_in_minutes?: number;
  difficulty_level?: string;
  mcqs?: number[];
}

export const contentTypeMap: Record<ContentIdType, BackendContentType> = {
  video: "VideoTutorial",
  article: "Article",
  quiz: "Quiz",
  assignment: "Assignment",
  coding_problem: "CodingProblem",
};

export const backendToUiContentType = (
  value?: string | null
): ContentIdType => {
  switch ((value ?? "").toLowerCase()) {
    case "videotutorial":
    case "video":
      return "video";
    case "quiz":
      return "quiz";
    case "assignment":
      return "assignment";
    case "codingproblem":
    case "coding_problem":
    case "coding":
      return "coding_problem";
    case "article":
    default:
      return "article";
  }
};

// Error handling type
interface ApiErrorPayload {
  detail?: string;
  error?: string;
  message?: string;
  [key: string]: unknown;
}

export const adminCourseBuilderService = {
  getCourses: async () => {
    try {
      const res = await apiClient.get(
        `/admin-dashboard/api/clients/${config.clientId}/courses/`
      );
      return res.data;
    } catch (error: unknown) {
      const apiError = error as AxiosError<ApiErrorPayload>;
      throw new Error(
        apiError.response?.data?.detail ||
          apiError.response?.data?.error ||
          apiError.response?.data?.message ||
          apiError.message ||
          "Failed to fetch all courses"
      );
    }
  },

  createCourse: async (courseData: CourseData) => {
    try {
      const res = await apiClient.post(
        `/admin-dashboard/api/clients/${config.clientId}/courses/`,
        courseData
      );
      return res.data;
    } catch (error: unknown) {
      const apiError = error as AxiosError<ApiErrorPayload>;
      throw new Error(
        apiError.response?.data?.detail ||
          apiError.response?.data?.error ||
          apiError.response?.data?.message ||
          apiError.message ||
          "Failed to create course"
      );
    }
  },

  updateCourse: async (courseId: number, courseData: CourseData) => {
    try {
      const res = await apiClient.patch(
        `/admin-dashboard/api/clients/${config.clientId}/courses/${courseId}/`,
        courseData
      );
      return res.data;
    } catch (error: unknown) {
      const apiError = error as AxiosError<ApiErrorPayload>;
      const data = apiError.response?.data as Record<string, unknown> | undefined;
      const slugErrors = data?.slug as string[] | undefined;
      const message =
        (Array.isArray(slugErrors) && slugErrors[0]) ||
        apiError.response?.data?.detail ||
        apiError.response?.data?.error ||
        apiError.response?.data?.message ||
        apiError.message ||
        "Failed to update course";
      throw new Error(message);
    }
  },

  duplicateCourse: async (courseId: number) => {
    try {
      const res = await apiClient.post(
        `/admin-dashboard/api/clients/${config.clientId}/courses/${courseId}/duplicate/`
      );
      return res.data;
    } catch (error: unknown) {
      const apiError = error as AxiosError<ApiErrorPayload>;
      throw new Error(
        apiError.response?.data?.detail ||
          apiError.response?.data?.error ||
          apiError.response?.data?.message ||
          apiError.message ||
          "Failed to duplicate course"
      );
    }
  },

  publishCourse: async (courseId: number) => {
    try {
      const res = await apiClient.patch(
        `/admin-dashboard/api/clients/${config.clientId}/courses/${courseId}/`,
        { published: true }
      );
      return res.data;
    } catch (error: unknown) {
      const apiError = error as AxiosError<ApiErrorPayload>;
      throw new Error(
        apiError.response?.data?.detail ||
          apiError.response?.data?.error ||
          apiError.response?.data?.message ||
          apiError.message ||
          "Failed to publish course"
      );
    }
  },

  unpublishCourse: async (courseId: number) => {
    try {
      const res = await apiClient.patch(
        `/admin-dashboard/api/clients/${config.clientId}/courses/${courseId}/`,
        { published: false }
      );
      return res.data;
    } catch (error: unknown) {
      const apiError = error as AxiosError<ApiErrorPayload>;
      throw new Error(
        apiError.response?.data?.detail ||
          apiError.response?.data?.error ||
          apiError.response?.data?.message ||
          apiError.message ||
          "Failed to unpublish course"
      );
    }
  },

  deleteCourse: async (courseId: number) => {
    try {
      const res = await apiClient.delete(
        `/admin-dashboard/api/clients/${config.clientId}/courses/${courseId}/`
      );
      return res.data;
    } catch (error: unknown) {
      const apiError = error as AxiosError<ApiErrorPayload>;
      throw new Error(
        apiError.response?.data?.detail ||
          apiError.response?.data?.error ||
          apiError.response?.data?.message ||
          apiError.message ||
          "Failed to delete course"
      );
    }
  },

  getCourseModules: async (courseId: number) => {
    try {
      const res = await apiClient.get(
        `/admin-dashboard/api/clients/${config.clientId}/courses/${courseId}/modules/`
      );
      return res.data;
    } catch (error: unknown) {
      const apiError = error as AxiosError<ApiErrorPayload>;
      throw new Error(
        apiError.response?.data?.detail ||
          apiError.response?.data?.error ||
          apiError.response?.data?.message ||
          apiError.message ||
          "Failed to fetch course modules"
      );
    }
  },

  createCourseModule: async (courseId: number, moduleData: ModuleData) => {
    try {
      const res = await apiClient.post(
        `/admin-dashboard/api/clients/${config.clientId}/courses/${courseId}/modules/`,
        moduleData
      );
      return res.data;
    } catch (error: unknown) {
      const apiError = error as AxiosError<ApiErrorPayload>;
      throw new Error(
        apiError.response?.data?.detail ||
          apiError.response?.data?.error ||
          apiError.response?.data?.message ||
          apiError.message ||
          "Failed to create course module"
      );
    }
  },

  updateCourseModule: async (
    courseId: number,
    moduleId: number,
    moduleData: ModuleData
  ) => {
    try {
      const res = await apiClient.patch(
        `/admin-dashboard/api/clients/${config.clientId}/courses/${courseId}/modules/${moduleId}/`,
        moduleData
      );
      return res.data;
    } catch (error: unknown) {
      const apiError = error as AxiosError<ApiErrorPayload>;
      throw new Error(
        apiError.response?.data?.detail ||
          apiError.response?.data?.error ||
          apiError.response?.data?.message ||
          apiError.message ||
          "Failed to update course module"
      );
    }
  },

  deleteCourseModule: async (courseId: number, moduleId: number) => {
    try {
      const res = await apiClient.delete(
        `/admin-dashboard/api/clients/${config.clientId}/courses/${courseId}/modules/${moduleId}/`
      );
      return res.data;
    } catch (error: unknown) {
      const apiError = error as AxiosError<ApiErrorPayload>;
      throw new Error(
        apiError.response?.data?.detail ||
          apiError.response?.data?.error ||
          apiError.response?.data?.message ||
          apiError.message ||
          "Failed to delete course module"
      );
    }
  },

  getCourseSubmodules: async (courseId: number, moduleId: number) => {
    try {
      const res = await apiClient.get(
        `/admin-dashboard/api/clients/${config.clientId}/courses/${courseId}/modules/${moduleId}/submodules/`
      );
      return res.data;
    } catch (error: unknown) {
      const apiError = error as AxiosError<ApiErrorPayload>;
      throw new Error(
        apiError.response?.data?.detail ||
          apiError.response?.data?.error ||
          apiError.response?.data?.message ||
          apiError.message ||
          "Failed to fetch course submodules"
      );
    }
  },

  createCourseSubmodule: async (
    courseId: number,
    moduleId: number,
    submoduleData: SubmoduleData
  ) => {
    try {
      const res = await apiClient.post(
        `/admin-dashboard/api/clients/${config.clientId}/courses/${courseId}/modules/${moduleId}/submodules/`,
        submoduleData
      );
      return res.data;
    } catch (error: unknown) {
      const apiError = error as AxiosError<ApiErrorPayload>;
      throw new Error(
        apiError.response?.data?.detail ||
          apiError.response?.data?.error ||
          apiError.response?.data?.message ||
          apiError.message ||
          "Failed to create course submodule"
      );
    }
  },

  updateCourseSubmodule: async (
    courseId: number,
    moduleId: number,
    submoduleId: number,
    submoduleData: SubmoduleData
  ) => {
    try {
      const res = await apiClient.patch(
        `/admin-dashboard/api/clients/${config.clientId}/courses/${courseId}/modules/${moduleId}/submodules/${submoduleId}/`,
        submoduleData
      );
      return res.data;
    } catch (error: unknown) {
      const apiError = error as AxiosError<ApiErrorPayload>;
      throw new Error(
        apiError.response?.data?.detail ||
          apiError.response?.data?.error ||
          apiError.response?.data?.message ||
          apiError.message ||
          "Failed to update course submodule"
      );
    }
  },

  deleteCourseSubmodule: async (
    courseId: number,
    moduleId: number,
    submoduleId: number
  ) => {
    try {
      const res = await apiClient.delete(
        `/admin-dashboard/api/clients/${config.clientId}/courses/${courseId}/modules/${moduleId}/submodules/${submoduleId}/`
      );
      return res.data;
    } catch (error: unknown) {
      const apiError = error as AxiosError<ApiErrorPayload>;
      throw new Error(
        apiError.response?.data?.detail ||
          apiError.response?.data?.error ||
          apiError.response?.data?.message ||
          apiError.message ||
          "Failed to delete course submodule"
      );
    }
  },

  viewCourseDetails: async (courseId: number) => {
    try {
      const res = await apiClient.get(
        `/admin-dashboard/api/clients/${config.clientId}/courses/${courseId}/view-course-details/`
      );
      return res.data;
    } catch (error: unknown) {
      const apiError = error as AxiosError<ApiErrorPayload>;
      throw new Error(
        apiError.response?.data?.detail ||
          apiError.response?.data?.error ||
          apiError.response?.data?.message ||
          apiError.message ||
          "Failed to fetch course details"
      );
    }
  },

  addSubmoduleContent: async (
    courseId: number,
    submoduleId: number,
    contentData: ContentData
  ) => {
    try {
      const res = await apiClient.post(
        `/admin-dashboard/api/clients/${config.clientId}/courses/${courseId}/submodules/${submoduleId}/contents/`,
        contentData
      );
      return res.data;
    } catch (error: unknown) {
      const apiError = error as AxiosError<ApiErrorPayload>;
      throw new Error(
        apiError.response?.data?.detail ||
          apiError.response?.data?.error ||
          apiError.response?.data?.message ||
          apiError.message ||
          "Failed to add submodule content"
      );
    }
  },

  getSubmoduleContent: async (courseId: number, submoduleId: number) => {
    try {
      const res = await apiClient.get(
        `/admin-dashboard/api/clients/${config.clientId}/courses/${courseId}/submodules/${submoduleId}/contents/`
      );
      return res.data;
    } catch (error: unknown) {
      const apiError = error as AxiosError<ApiErrorPayload>;
      throw new Error(
        apiError.response?.data?.detail ||
          apiError.response?.data?.error ||
          apiError.response?.data?.message ||
          apiError.message ||
          "Failed to fetch submodule content"
      );
    }
  },

  deleteSubmoduleContent: async (
    courseId: number,
    submoduleId: number,
    contentId: number
  ) => {
    try {
      const res = await apiClient.delete(
        `/admin-dashboard/api/clients/${config.clientId}/courses/${courseId}/submodules/${submoduleId}/contents/${contentId}/`
      );
      return res.data;
    } catch (error: unknown) {
      const apiError = error as AxiosError<ApiErrorPayload>;
      throw new Error(
        apiError.response?.data?.detail ||
          apiError.response?.data?.error ||
          apiError.response?.data?.message ||
          apiError.message ||
          "Failed to delete submodule content"
      );
    }
  },

  updateSubmoduleContent: async (
    courseId: number,
    submoduleId: number,
    contentId: number,
    contentData: Partial<ContentData>
  ) => {
    try {
      const res = await apiClient.patch(
        `/admin-dashboard/api/clients/${config.clientId}/courses/${courseId}/submodules/${submoduleId}/contents/${contentId}/`,
        contentData
      );
      return res.data;
    } catch (error: unknown) {
      const apiError = error as AxiosError<ApiErrorPayload>;
      throw new Error(
        apiError.response?.data?.detail ||
          apiError.response?.data?.error ||
          apiError.response?.data?.message ||
          apiError.message ||
          "Failed to update submodule content"
      );
    }
  },

  createArticle: async (payload: ArticlePayload) => {
    const res = await apiClient.post(
      `/admin-dashboard/api/clients/${config.clientId}/articles/`,
      payload
    );
    return res.data;
  },

  getArticle: async (articleId: number) => {
    const res = await apiClient.get(
      `/admin-dashboard/api/clients/${config.clientId}/articles/${articleId}/`
    );
    return res.data;
  },

  updateArticle: async (articleId: number, payload: Partial<ArticlePayload>) => {
    const res = await apiClient.patch(
      `/admin-dashboard/api/clients/${config.clientId}/articles/${articleId}/`,
      payload
    );
    return res.data;
  },

  createVideoTutorial: async (payload: VideoTutorialPayload) => {
    const res = await apiClient.post(
      `/admin-dashboard/api/clients/${config.clientId}/video-tutorials/`,
      payload
    );
    return res.data;
  },

  getVideoTutorial: async (videoId: number) => {
    const res = await apiClient.get(
      `/admin-dashboard/api/clients/${config.clientId}/video-tutorials/${videoId}/`
    );
    return res.data;
  },

  updateVideoTutorial: async (
    videoId: number,
    payload: Partial<VideoTutorialPayload>
  ) => {
    const res = await apiClient.patch(
      `/admin-dashboard/api/clients/${config.clientId}/video-tutorials/${videoId}/`,
      payload
    );
    return res.data;
  },

  createAssignment: async (payload: AssignmentPayload) => {
    const res = await apiClient.post(
      `/admin-dashboard/api/clients/${config.clientId}/assignments/`,
      payload
    );
    return res.data;
  },

  getAssignment: async (assignmentId: number) => {
    const res = await apiClient.get(
      `/admin-dashboard/api/clients/${config.clientId}/assignments/${assignmentId}/`
    );
    return res.data;
  },

  updateAssignment: async (
    assignmentId: number,
    payload: Partial<AssignmentPayload>
  ) => {
    const res = await apiClient.patch(
      `/admin-dashboard/api/clients/${config.clientId}/assignments/${assignmentId}/`,
      payload
    );
    return res.data;
  },

  createCodingProblem: async (payload: CodingProblemPayload) => {
    const res = await apiClient.post(
      `/admin-dashboard/api/clients/${config.clientId}/coding-problems/`,
      payload
    );
    return res.data;
  },

  getCodingProblem: async (problemId: number) => {
    const res = await apiClient.get(
      `/admin-dashboard/api/clients/${config.clientId}/coding-problems/${problemId}/`
    );
    return res.data;
  },

  updateCodingProblem: async (
    problemId: number,
    payload: Partial<CodingProblemPayload>
  ) => {
    const res = await apiClient.patch(
      `/admin-dashboard/api/clients/${config.clientId}/coding-problems/${problemId}/`,
      payload
    );
    return res.data;
  },

  createMCQ: async (payload: MCQPayload) => {
    const res = await apiClient.post(
      `/admin-dashboard/api/clients/${config.clientId}/mcqs/`,
      payload
    );
    return res.data;
  },

  getMCQ: async (mcqId: number) => {
    const res = await apiClient.get(
      `/admin-dashboard/api/clients/${config.clientId}/mcqs/${mcqId}/`
    );
    return res.data;
  },

  updateMCQ: async (mcqId: number, payload: Partial<MCQPayload>) => {
    const res = await apiClient.patch(
      `/admin-dashboard/api/clients/${config.clientId}/mcqs/${mcqId}/`,
      payload
    );
    return res.data;
  },

  createQuiz: async (payload: QuizPayload) => {
    const res = await apiClient.post(
      `/admin-dashboard/api/clients/${config.clientId}/quizzes/`,
      payload
    );
    return res.data;
  },

  getQuiz: async (quizId: number) => {
    const res = await apiClient.get(
      `/admin-dashboard/api/clients/${config.clientId}/quizzes/${quizId}/`
    );
    return res.data;
  },

  updateQuiz: async (quizId: number, payload: Partial<QuizPayload>) => {
    const res = await apiClient.patch(
      `/admin-dashboard/api/clients/${config.clientId}/quizzes/${quizId}/`,
      payload
    );
    return res.data;
  },
};

