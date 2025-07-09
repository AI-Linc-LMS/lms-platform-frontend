import axiosInstance from "../axiosInstance";

//getting all courses
export const getAllCourse = async (clientId: number) => {
  try {
    const res = await axiosInstance.get(`/lms/clients/${clientId}/courses/`);

    return res.data;
  } catch (error) {
    if (error instanceof Error) {
      // AxiosError type guard
      const axiosError = error as {
        response?: { data?: any; status?: number };
        message: string;
      };

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

//getting course by id
export const getCourseById = async (clientId: number, courseId: number) => {
  try {
    const res = await axiosInstance.get(
      `/lms/clients/${clientId}/courses/${courseId}/`
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
        "Failed to fetch Course By Id"
      );
    } else {
      throw new Error("An unknown error occurred");
    }
  }
};

//getting course content (videos, quizzes, etc.)
export const getCourseContent = async (
  clientId: number,
  courseId: number,
  contentId: number
) => {
  try {
    const res = await axiosInstance.get(
      `/lms/clients/${clientId}/courses/${courseId}/content/${contentId}/`
    );

    return res.data;
  } catch (error) {
    if (error instanceof Error) {
      // AxiosError type guard
      const axiosError = error as { response?: { data?: unknown; status?: number }; message: string };

    // You can throw a custom error if you want
      throw new Error(
        (typeof (axiosError.response?.data) === 'object' && axiosError.response?.data && 'detail' in axiosError.response.data
          ? (axiosError.response.data.detail as string)
          : undefined
        ) ||
        axiosError.message ||
        "Failed to fetch Course Content"
      );
    } else {
      throw new Error("An unknown error occurred");
    }
  }
};

//getting course leaderboard
export const getCourseLeaderboard = async (
  clientId: number,
  courseId: number
) => {
  try {
    const res = await axiosInstance.get(
      `/lms/clients/${clientId}/courses/${courseId}/leaderboard/`
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
        "Failed to fetch Course Leaderboard"
      );
    } else {
      throw new Error("An unknown error occurred");
    }
  }
};

//getting course dashboard (done)
export const getCourseDashboard = async (
  clientId: number,
  courseId: number
) => {
  try {
    const res = await axiosInstance.get(
      `/lms/clients/${clientId}/courses/${courseId}/user-course-dashboard`
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
        "Failed to fetch Course Dashboard"
      );
    } else {
      throw new Error("An unknown error occurred");
    }
  }
};

//getting course submodules by id
export const getSubmoduleById = async (
  clientId: number,
  courseId: number,
  submoduleId: number
) => {
  try {
    const res = await axiosInstance.get(
      `/lms/clients/${clientId}/courses/${courseId}/sub-module/${submoduleId}/`
    );

    return res.data;
  } catch (error: any) {
    // You can throw a custom error if you want
    throw new Error(
      error?.response?.data?.detail ||
        error?.message ||
        "Failed to fetch Submodule By Id"
    );
  }
};

export const getCommentsByContentId = async (
  clientId: number,
  courseId: number,
  contentId: number
) => {
  try {
    const res = await axiosInstance.get(
      `/lms/clients/${clientId}/courses/${courseId}/content/${contentId}/comment/`
    );
    return res.data;
  } catch (error: any) {
    throw new Error(
      error?.response?.data?.detail ||
        error?.message ||
        "Failed to fetch Comments By Content Id"
    );
  }
};

export const createComment = async (
  clientId: number,
  courseId: number,
  contentId: number,
  comment: string
) => {
  try {
    const res = await axiosInstance.post(
      `/lms/clients/${clientId}/courses/${courseId}/content/${contentId}/comment/`,
      { text: comment }
    );
    return res.data;
  } catch (error: any) {
    throw new Error(
      error?.response?.data?.detail ||
        error?.message ||
        "Failed to create Comment"
    );
  }
};

export const pastSubmissions = async (
  clientId: number,
  courseId: number,
  contentId: number
) => {
  try {
    const res = await axiosInstance.get(
      `/lms/clients/${clientId}/courses/${courseId}/content/${contentId}/past-submissions/`
    );
    return res.data;
  } catch (error: any) {
    throw new Error(
      error?.response?.data?.detail ||
        error?.message ||
        "Failed to fetch Past Submissions"
    );
  }
};
