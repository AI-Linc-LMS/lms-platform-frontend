import axiosInstance from "../axiosInstance";

// Define interfaces for different content types
export interface BaseContentData {
  title: string;
  description: string;
  order: number;
}

export interface VideoContentData extends BaseContentData {
  video_url: string;
  duration_seconds?: number;
  thumbnail_url?: string;
}

export interface ArticleContentData extends BaseContentData {
  content: string;
  estimated_read_time?: number;
}

export interface QuizContentData extends BaseContentData {
  questions: QuizQuestion[];
  time_limit_minutes?: number;
  passing_score?: number;
  attempts_allowed?: number;
}

export interface QuizQuestion {
  question_text: string;
  options: string[];
  correct_option: number;
  explanation?: string;
  points?: number;
}

export interface AssignmentContentData extends BaseContentData {
  instructions: string;
  due_date?: string;
  max_score?: number;
  submission_type?: 'file' | 'text' | 'link';
}

export interface CodingProblemContentData extends BaseContentData {
  problem_statement: string;
  sample_input?: string;
  sample_output?: string;
  constraints?: string;
  test_cases?: TestCase[];
  starter_code?: Record<string, string>; // Language code -> starter code
  time_limit_ms?: number;
  memory_limit_mb?: number;
}

export interface TestCase {
  input: string;
  output: string;
  is_hidden?: boolean;
}

// Error handling type
interface ApiError extends Error {
  response?: {
    data?: {
      detail?: string;
      [key: string]: unknown;
    };
    status?: number;
  };
}

// Generic function to create content
export const createContent = async <T>(
  clientId: number,
  courseId: number,
  moduleId: number,
  submoduleId: number,
  contentType: string,
  contentData: T
) => {
  try {
    const res = await axiosInstance.post(
      `/admin-dashboard/api/clients/${clientId}/courses/${courseId}/modules/${moduleId}/submodules/${submoduleId}/content/${contentType}/`,
      contentData
    );
    console.log(`Create ${contentType} content:`, res);
    return res.data;
  } catch (error: unknown) {
    const apiError = error as ApiError;
    console.error(`Failed to create ${contentType} content:`, apiError);
    console.error("Error details:", {
      message: apiError.message,
      response: apiError.response?.data,
      status: apiError.response?.status,
    });
    throw new Error(
      apiError.response?.data?.detail ||
        apiError.message ||
        `Failed to create ${contentType} content`
    );
  }
};

// Specialized functions for different content types
export const createVideoContent = async (
  clientId: number,
  courseId: number,
  moduleId: number,
  submoduleId: number,
  videoData: VideoContentData
) => {
  return createContent(clientId, courseId, moduleId, submoduleId, 'video', videoData);
};

export const createArticleContent = async (
  clientId: number,
  courseId: number,
  moduleId: number,
  submoduleId: number,
  articleData: ArticleContentData
) => {
  return createContent(clientId, courseId, moduleId, submoduleId, 'article', articleData);
};

export const createQuizContent = async (
  clientId: number,
  courseId: number,
  moduleId: number,
  submoduleId: number,
  quizData: QuizContentData
) => {
  return createContent(clientId, courseId, moduleId, submoduleId, 'quiz', quizData);
};

export const createAssignmentContent = async (
  clientId: number,
  courseId: number,
  moduleId: number,
  submoduleId: number,
  assignmentData: AssignmentContentData
) => {
  return createContent(clientId, courseId, moduleId, submoduleId, 'assignment', assignmentData);
};

export const createCodingProblemContent = async (
  clientId: number,
  courseId: number,
  moduleId: number,
  submoduleId: number,
  codingProblemData: CodingProblemContentData
) => {
  return createContent(clientId, courseId, moduleId, submoduleId, 'coding_problem', codingProblemData);
};

// Get all content for a submodule
export const getSubmoduleContent = async (
  clientId: number,
  courseId: number,
  moduleId: number,
  submoduleId: number
) => {
  try {
    const res = await axiosInstance.get(
      `/admin-dashboard/api/clients/${clientId}/courses/${courseId}/modules/${moduleId}/submodules/${submoduleId}/content/`
    );
    console.log("Get submodule content:", res);
    return res.data;
  } catch (error: unknown) {
    const apiError = error as ApiError;
    console.error("Failed to get submodule content:", apiError);
    console.error("Error details:", {
      message: apiError.message,
      response: apiError.response?.data,
      status: apiError.response?.status,
    });
    throw new Error(
      apiError.response?.data?.detail ||
        apiError.message ||
        "Failed to get submodule content"
    );
  }
};

// Get specific content by ID
export const getContentById = async (
  clientId: number,
  courseId: number,
  moduleId: number,
  submoduleId: number,
  contentId: number
) => {
  try {
    const res = await axiosInstance.get(
      `/admin-dashboard/api/clients/${clientId}/courses/${courseId}/modules/${moduleId}/submodules/${submoduleId}/content/${contentId}/`
    );
    console.log("Get content by ID:", res);
    return res.data;
  } catch (error: unknown) {
    const apiError = error as ApiError;
    console.error("Failed to get content by ID:", apiError);
    console.error("Error details:", {
      message: apiError.message,
      response: apiError.response?.data,
      status: apiError.response?.status,
    });
    throw new Error(
      apiError.response?.data?.detail ||
        apiError.message ||
        "Failed to get content by ID"
    );
  }
};

// Update content
export const updateContent = async <T>(
  clientId: number,
  courseId: number,
  moduleId: number,
  submoduleId: number,
  contentId: number,
  contentType: string,
  contentData: T
) => {
  try {
    const res = await axiosInstance.patch(
      `/admin-dashboard/api/clients/${clientId}/courses/${courseId}/modules/${moduleId}/submodules/${submoduleId}/content/${contentId}/`,
      contentData
    );
    console.log(`Update ${contentType} content:`, res);
    return res.data;
  } catch (error: unknown) {
    const apiError = error as ApiError;
    console.error(`Failed to update ${contentType} content:`, apiError);
    console.error("Error details:", {
      message: apiError.message,
      response: apiError.response?.data,
      status: apiError.response?.status,
    });
    throw new Error(
      apiError.response?.data?.detail ||
        apiError.message ||
        `Failed to update ${contentType} content`
    );
  }
};

// Delete content
export const deleteContent = async (
  clientId: number,
  courseId: number,
  moduleId: number,
  submoduleId: number,
  contentId: number
) => {
  try {
    const res = await axiosInstance.delete(
      `/admin-dashboard/api/clients/${clientId}/courses/${courseId}/modules/${moduleId}/submodules/${submoduleId}/content/${contentId}/`
    );
    console.log("Delete content:", res);
    return res.data;
  } catch (error: unknown) {
    const apiError = error as ApiError;
    console.error("Failed to delete content:", apiError);
    console.error("Error details:", {
      message: apiError.message,
      response: apiError.response?.data,
      status: apiError.response?.status,
    });
    throw new Error(
      apiError.response?.data?.detail ||
        apiError.message ||
        "Failed to delete content"
    );
  }
};

// Upload file for content (e.g., video file, image, document)
export const uploadContentFile = async (
  clientId: number,
  courseId: number,
  moduleId: number,
  submoduleId: number,
  contentType: string,
  file: File
) => {
  try {
    // Create FormData for file upload
    const formData = new FormData();
    formData.append('file', file);

    const res = await axiosInstance.post(
      `/admin-dashboard/api/clients/${clientId}/courses/${courseId}/modules/${moduleId}/submodules/${submoduleId}/content/upload/${contentType}/`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    console.log(`Upload ${contentType} file:`, res);
    return res.data;
  } catch (error: unknown) {
    const apiError = error as ApiError;
    console.error(`Failed to upload ${contentType} file:`, apiError);
    console.error("Error details:", {
      message: apiError.message,
      response: apiError.response?.data,
      status: apiError.response?.status,
    });
    throw new Error(
      apiError.response?.data?.detail ||
        apiError.message ||
        `Failed to upload ${contentType} file`
    );
  }
}; 