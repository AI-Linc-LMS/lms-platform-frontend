import apiClient from "../api";
import { config } from "../../config";
import { AxiosError } from "axios";

// Define interfaces for course-related data
export interface CourseData {
  title: string;
  description: string;
  slug: string; // Required field
  difficulty_level?: string; // Valid values: 'Easy', 'Medium', 'Hard'
  rating?: number; // Course rating 0-5
  is_pro?: boolean;
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
  content_type: ContentIdType;
  contentId: number;
  order: number;
  duration_in_minutes: number;
}

export type ContentIdType = "video" | "article" | "quiz" | "assignment" | "coding_problem";

// Error handling type
interface ApiErrorPayload {
  detail?: string;
  error?: string;
  message?: string;
  [key: string]: any;
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
      throw new Error(
        apiError.response?.data?.detail ||
          apiError.response?.data?.error ||
          apiError.response?.data?.message ||
          apiError.message ||
          "Failed to update course"
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
};

