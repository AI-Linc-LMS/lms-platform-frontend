import axiosInstance from "../axiosInstance";
export type ContentIdType = "video_content" | "quiz_content" | "article_content" | "coding_problem_content" | "assignment_content";
export type contentType =
  | "articles"
  | "video-tutorials"
  | "mcqs"
  | "assignments"
  | "coding-problems"
  | "development"
  | "quizzes";

export const getContent = async (
  clientId: number,
  contentType: contentType
) => {
  try {
    const res = await axiosInstance.get(
      `/admin-dashboard/api/clients/${clientId}/${contentType}/`
    );
    return res.data;
  } catch (error) {
    if (error instanceof Error) {
      // AxiosError type guard
      const axiosError = error as { response?: { data?: any; status?: number }; message: string };

      // You can throw a custom error if you want
      throw new Error(
        (axiosError.response?.data?.detail as string) ||
        axiosError.message ||
        "Failed to fetch all courses"
      );
    } else {
      throw new Error("An unknown error occurred");
    }
  }
};

export const getContentById = async (
  clientId: number,
  contentType: contentType,
  contentId: number
) => {
  try { 
    const res = await axiosInstance.get(
      `/admin-dashboard/api/clients/${clientId}/${contentType}/${contentId}/`
    );
    return res.data;
  } catch (error) {
    if (error instanceof Error) {
      // AxiosError type guard
      const axiosError = error as { response?: { data?: any; status?: number }; message: string };

      // You can throw a custom error if you want
      throw new Error(
        (axiosError.response?.data?.detail as string) ||
        axiosError.message ||
        "Failed to fetch content by id"
      );
    } else {
      throw new Error("An unknown error occurred");
    }
  }
};

export const updateContentById = async (
  clientId: number,
  contentType: contentType,
  contentId: number,
  contentData: any
) => {
  try {
    const res = await axiosInstance.patch(
      `/admin-dashboard/api/clients/${clientId}/${contentType}/${contentId}/`,
      contentData
    );
    return res.data;
  } catch (error) {
    if (error instanceof Error) {
      // AxiosError type guard
      const axiosError = error as { response?: { data?: any; status?: number }; message: string };

      // You can throw a custom error if you want
      throw new Error(
        (axiosError.response?.data?.detail as string) ||
        axiosError.message ||
        "Failed to update content by id"
      );
    } else {
      throw new Error("An unknown error occurred");
    }
  }
};

export const uploadContent = async (
  clientId: number,
  contentType: contentType,
  contentData: any
) => {
  try {
    const res = await axiosInstance.post(
      `/admin-dashboard/api/clients/${clientId}/${contentType}/`,
      contentData
    );
    return res.data;
  } catch (error) {
    if (error instanceof Error) {
      // AxiosError type guard
      const axiosError = error as { response?: { data?: any; status?: number }; message: string };

      // You can throw a custom error if you want
      throw new Error(
        (axiosError.response?.data?.detail as string) ||
        axiosError.message ||
        "Failed to upload content"
      );
    } else {
      throw new Error("An unknown error occurred");
    }
  }
};

export const deleteContentById = async (
  clientId: number,
  contentType: contentType,
  contentId: number
) => {
  try {
    const res = await axiosInstance.delete(
      `/admin-dashboard/api/clients/${clientId}/${contentType}/${contentId}/`
    );
    return res.data;
  } catch (error) {
    if (error instanceof Error) {
      // AxiosError type guard
      const axiosError = error as { response?: { data?: any; status?: number }; message: string };

      // You can throw a custom error if you want
      throw new Error(
        (axiosError.response?.data?.detail as string) ||
        axiosError.message ||
        "Failed to delete content by id"
      );
    } else {
      throw new Error("An unknown error occurred");
    }
  }
};

export const addContentToSubmodule = async (
  clientId: number,
  courseId: number,
  submoduleId: number,
) => {
  try {
    const res = await axiosInstance.post(
      `/admin-dashboard/api/clients/${clientId}/courses/${courseId}/submodules/${submoduleId}/contents/`
    );
    return res.data;
  } catch (error) {
    if (error instanceof Error) {
      // AxiosError type guard
      const axiosError = error as { response?: { data?: any; status?: number }; message: string };

      // You can throw a custom error if you want
      throw new Error(
        (axiosError.response?.data?.detail as string) ||
        axiosError.message ||
        "Failed to add content to submodule"
      );
    } else {
      throw new Error("An unknown error occurred");
    }
  }
};
