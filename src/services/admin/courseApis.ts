import axiosInstance from "../axiosInstance";
import { ContentIdType } from "./contentApis";

// Define interfaces for course-related data
export interface CourseData {
  title: string;
  description: string;
  slug: string; // Required field
  difficulty_level?: string; // Valid values: 'Easy', 'Medium', 'Hard'
  is_pro?: boolean;
  [key: string]: string | number | boolean | undefined; // More specific type for index signature
}

export interface ModuleData {
  title: string;
  weekno: number;
  description?: string;
  [key: string]: string | number | undefined; // More specific type for index signature
}

export interface SubmoduleData {
  title: string;
  description: string;
  order: number;
  [key: string]: string | number | undefined; // More specific type for index signature
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

export const getCourses = async (clientId: number) => {
  try {
    const res = await axiosInstance.get(
      `/admin-dashboard/api/clients/${clientId}/courses/`
    );
    console.log("get admin Course:", res);
    return res.data;
  } catch (error: unknown) {
    const apiError = error as ApiError;
    console.error("Failed to fetch all courses:", apiError);
    console.error("Error details:", {
      message: apiError.message,
      response: apiError.response?.data,
      status: apiError.response?.status,
    });

    throw new Error(
      apiError.response?.data?.detail ||
        apiError.message ||
        "Failed to fetch all courses"
    );
  }
};

export const createCourse = async (
  clientId: number,
  courseData: CourseData
) => {
  try {
    const res = await axiosInstance.post(
      `/admin-dashboard/api/clients/${clientId}/courses/`,
      courseData
    );
    console.log("create course", res);
    return res.data;
  } catch (error: unknown) {
    const apiError = error as ApiError;
    console.error("Failed to create course:", apiError);
    console.error("Error details:", {
      message: apiError.message,
      response: apiError.response?.data,
      status: apiError.response?.status,
    });

    throw new Error(
      apiError.response?.data?.detail ||
        apiError.message ||
        "Failed to create course"
    );
  }
};

export const updateCourse = async (
  clientId: number,
  courseId: number,
  courseData: CourseData
) => {
  try {
    const res = await axiosInstance.patch(
      `/admin-dashboard/api/clients/${clientId}/courses/${courseId}/`,
      courseData
    );
    console.log("update course", res);
    return res.data;
  } catch (error: unknown) {
    const apiError = error as ApiError;
    console.error("Failed to update course:", apiError);
    console.error("Error details:", {
      message: apiError.message,
      response: apiError.response?.data,
      status: apiError.response?.status,
    });

    throw new Error(
      apiError.response?.data?.detail ||
        apiError.message ||
        "Failed to update course"
    );
  }
};

export const deleteCourse = async (clientId: number, courseId: number) => {
  try {
    const res = await axiosInstance.delete(
      `/admin-dashboard/api/clients/${clientId}/courses/${courseId}/`
    );
    console.log("delete course", res);
    return res.data;
  } catch (error: unknown) {
    const apiError = error as ApiError;
    console.error("Failed to delete course:", apiError);
    console.error("Error details:", {
      message: apiError.message,
      response: apiError.response?.data,
      status: apiError.response?.status,
    });

    throw new Error(
      apiError.response?.data?.detail ||
        apiError.message ||
        "Failed to delete course"
    );
  }
};

export const getCourseModules = async (clientId: number, courseId: number) => {
  try {
    const res = await axiosInstance.get(
      `/admin-dashboard/api/clients/${clientId}/courses/${courseId}/modules/`
    );
    console.log("get admin Course modules:", res);
    return res.data;
  } catch (error: unknown) {
    const apiError = error as ApiError;
    console.error("Failed to fetch course modules:", apiError);
    console.error("Error details:", {
      message: apiError.message,
      response: apiError.response?.data,
      status: apiError.response?.status,
    });
    throw new Error(
      apiError.response?.data?.detail ||
        apiError.message ||
        "Failed to fetch course modules"
    );
  }
};

export const createCourseModule = async (
  clientId: number,
  courseId: number,
  moduleData: ModuleData
) => {
  try {
    const res = await axiosInstance.post(
      `/admin-dashboard/api/clients/${clientId}/courses/${courseId}/modules/`,
      moduleData
    );
    console.log("create course module", res);
    return res.data;
  } catch (error: unknown) {
    const apiError = error as ApiError;
    console.error("Failed to create course module:", apiError);
    console.error("Error details:", {
      message: apiError.message,
      response: apiError.response?.data,
      status: apiError.response?.status,
    });
    throw new Error(
      apiError.response?.data?.detail ||
        apiError.message ||
        "Failed to create course module"
    );
  }
};

export const updateCourseModule = async (
  clientId: number,
  courseId: number,
  moduleId: number,
  moduleData: ModuleData
) => {
  try {
    const res = await axiosInstance.patch(
      `/admin-dashboard/api/clients/${clientId}/courses/${courseId}/modules/${moduleId}/`,
      moduleData
    );
    console.log("update course module", res);
    return res.data;
  } catch (error: unknown) {
    const apiError = error as ApiError;
    console.error("Failed to update course module:", apiError);
    console.error("Error details:", {
      message: apiError.message,
      response: apiError.response?.data,
      status: apiError.response?.status,
    });
    throw new Error(
      apiError.response?.data?.detail ||
        apiError.message ||
        "Failed to update course module"
    );
  }
};

export const deleteCourseModule = async (
  clientId: number,
  courseId: number,
  moduleId: number
) => {
  try {
    const res = await axiosInstance.delete(
      `/admin-dashboard/api/clients/${clientId}/courses/${courseId}/modules/${moduleId}/`
    );
    console.log("delete course module", res);
    return res.data;
  } catch (error: unknown) {
    const apiError = error as ApiError;
    console.error("Failed to delete course module:", apiError);
    console.error("Error details:", {
      message: apiError.message,
      response: apiError.response?.data,
      status: apiError.response?.status,
    });
    throw new Error(
      apiError.response?.data?.detail ||
        apiError.message ||
        "Failed to delete course module"
    );
  }
};

export const getCourseSubmodules = async (
  clientId: number,
  courseId: number,
  moduleId: number
) => {
  try {
    const res = await axiosInstance.get(
      `/admin-dashboard/api/clients/${clientId}/courses/${courseId}/modules/${moduleId}/submodules/`
    );
    console.log("get admin Course submodules:", res);
    return res.data;
  } catch (error: unknown) {
    const apiError = error as ApiError;
    console.error("Failed to fetch course submodules:", apiError);
    console.error("Error details:", {
      message: apiError.message,
      response: apiError.response?.data,
      status: apiError.response?.status,
    });
    throw new Error(
      apiError.response?.data?.detail ||
        apiError.message ||
        "Failed to fetch course submodules"
    );
  }
};

export const createCourseSubmodule = async (
  clientId: number,
  courseId: number,
  moduleId: number,
  submoduleData: SubmoduleData
) => {
  try {
    const res = await axiosInstance.post(
      `/admin-dashboard/api/clients/${clientId}/courses/${courseId}/modules/${moduleId}/submodules/`,
      submoduleData
    );
    console.log("create course submodule", res);
    return res.data;
  } catch (error: unknown) {
    const apiError = error as ApiError;
    console.error("Failed to create course submodule:", apiError);
    console.error("Error details:", {
      message: apiError.message,
      response: apiError.response?.data,
      status: apiError.response?.status,
    });
    throw new Error(
      apiError.response?.data?.detail ||
        apiError.message ||
        "Failed to create course submodule"
    );
  }
};

export const updateCourseSubmodule = async (
  clientId: number,
  courseId: number,
  moduleId: number,
  submoduleId: number,
  submoduleData: SubmoduleData
) => {
  try {
    const res = await axiosInstance.patch(
      `/admin-dashboard/api/clients/${clientId}/courses/${courseId}/modules/${moduleId}/submodules/${submoduleId}/`,
      submoduleData
    );
    console.log("update course submodule", res);
    return res.data;
  } catch (error: unknown) {
    const apiError = error as ApiError;
    console.error("Failed to update course submodule:", apiError);
    console.error("Error details:", {
      message: apiError.message,
      response: apiError.response?.data,
      status: apiError.response?.status,
    });
    throw new Error(
      apiError.response?.data?.detail ||
        apiError.message ||
        "Failed to update course submodule"
    );
  }
};

export const deleteCourseSubmodule = async (
  clientId: number,
  courseId: number,
  moduleId: number,
  submoduleId: number
) => {
  try {
    const res = await axiosInstance.delete(
      `/admin-dashboard/api/clients/${clientId}/courses/${courseId}/modules/${moduleId}/submodules/${submoduleId}/`
    );
    console.log("delete course submodule", res);
    return res.data;
  } catch (error: unknown) {
    const apiError = error as ApiError;
    console.error("Failed to delete course submodule:", apiError);
    console.error("Error details:", {
      message: apiError.message,
      response: apiError.response?.data,
      status: apiError.response?.status,
    });
    throw new Error(
      apiError.response?.data?.detail ||
        apiError.message ||
        "Failed to delete course submodule"
    );
  }
};

export const viewCourseDetails = async (clientId: number, courseId: number) => {
  try {
    const res = await axiosInstance.get(
      `/admin-dashboard/api/clients/${clientId}/courses/${courseId}/view-course-details/`
    );
    console.log("get admin Course details:", res);
    return res.data;
  } catch (error: unknown) {
    const apiError = error as ApiError;
    console.error("Failed to fetch view course details:", apiError);
    console.error("Error details:", {
      message: apiError.message,
      response: apiError.response?.data,
      status: apiError.response?.status,
    });
    throw new Error(
      apiError.response?.data?.detail ||
        apiError.message ||
        "Failed to fetch course details"
    );
  }
};
export interface ContentData {
  title: string;
  content_type: ContentIdType;
  contentId: number;
  order: number;
  duration_in_minutes: number;
}

export const addSubmoduleContent = async (
  clientId: number,
  courseId: number,
  submoduleId: number,
  contentData: ContentData
) => {
  try {
    const res = await axiosInstance.post(
      `/admin-dashboard/api/clients/${clientId}/courses/${courseId}/submodules/${submoduleId}/contents/`,
      contentData
    );
    console.log("add admin Submodule content:", res);
    return res.data;
  } catch (error: unknown) {
    const apiError = error as ApiError;
    console.error("Failed to add submodule content:", apiError);
    console.error("Error details:", {
      message: apiError.message,
      response: apiError.response?.data,
      status: apiError.response?.status,
    });
    throw new Error(
      apiError.response?.data?.detail ||
        apiError.message ||
        "Failed to add submodule content"
    );
  }
};

export const getSubmoduleContent = async (
  clientId: number,
  courseId: number,
  submoduleId: number
) => {
  try {
    const res = await axiosInstance.get(
      `/admin-dashboard/api/clients/${clientId}/courses/${courseId}/submodules/${submoduleId}/contents/`
    );
    console.log("get admin Submodule content:", res);
    return res.data;
  } catch (error: unknown) {
    const apiError = error as ApiError;
    console.error("Failed to fetch submodule content:", apiError);
    console.error("Error details:", {
      message: apiError.message,
      response: apiError.response?.data,
      status: apiError.response?.status,
    });
    throw new Error(
      apiError.response?.data?.detail ||
        apiError.message ||
        "Failed to fetch submodule content"
    );
  }
};

export const deleteSubmoduleContent = async (
  clientId: number,
  courseId: number,
  submoduleId: number,
  contentId: number
) => {
  try {
    const res = await axiosInstance.delete(
      `/admin-dashboard/api/clients/${clientId}/courses/${courseId}/submodules/${submoduleId}/contents/${contentId}/`
    );
    console.log("delete submodule content:", res);
    return res.data;
  } catch (error: unknown) {
    const apiError = error as ApiError;
    console.error("Failed to delete submodule content:", apiError);
    console.error("Error details:", {
      message: apiError.message,
      response: apiError.response?.data,
      status: apiError.response?.status,
    });
    throw new Error(
      apiError.response?.data?.detail ||
        apiError.message ||
        "Failed to delete submodule content"
    );
  }
};

// Note: PUT and PATCH are not exactly the same
// PUT is for complete replacement of a resource
// PATCH is for partial updates to a resource
// This API seems to use PUT for updates, which is common in many REST APIs
