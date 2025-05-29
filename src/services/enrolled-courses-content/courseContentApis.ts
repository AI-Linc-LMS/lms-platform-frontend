import axiosInstance from "../axiosInstance";

//getting all courses
export const getAllCourse = async (clientId: number) => {
  try {
    const res = await axiosInstance.get(`/lms/clients/${clientId}/courses/`);

    console.log("All Courses API response:", res.data);
    return res.data;
  } catch (error) {
    if (error instanceof Error) {
      // AxiosError type guard
      const axiosError = error as {
        response?: { data?: any; status?: number };
        message: string;
      };
      console.error("Failed to fetch all courses:", error);
      console.error("Error details:", {
        message: axiosError.message,
        response: axiosError.response?.data,
        status: axiosError.response?.status,
      });

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

    console.log("Course By Id API response:", res.data);
    return res.data;
  } catch (error) {
    if (error instanceof Error) {
      // AxiosError type guard
      const axiosError = error as { response?: { data?: any; status?: number }; message: string };
      console.error("Failed to fetch Course By Id:", error);
      console.error("Error details:", {
        message: axiosError.message,
        response: axiosError.response?.data,
        status: axiosError.response?.status,
      });

      // You can throw a custom error if you want
      throw new Error(
        (axiosError.response?.data?.detail as string) ||
        error?.message ||
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

    console.log("Course Content API response:", res.data);
    return res.data;
  } catch (error) {
    if (error instanceof Error) {
      // AxiosError type guard
      const axiosError = error as { response?: { data?: unknown; status?: number }; message: string };
      console.error("Failed to fetch Course Content:", error);
      console.error("Error details:", {
        message: axiosError.message,
        response: axiosError.response?.data,
        status: axiosError.response?.status,
      });

    // You can throw a custom error if you want
      throw new Error(
        (axiosError.response?.data?.detail as string) ||
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
    console.log("Course Leaderboard API response:", res.data);
    return res.data;
  } catch (error) {
    if (error instanceof Error) {
      // AxiosError type guard
      const axiosError = error as { response?: { data?: any; status?: number }; message: string };
      console.error("Failed to fetch Course Leaderboard:", error);
      console.error("Error details:", {
        message: axiosError.message,
        response: axiosError.response?.data,
        status: axiosError.response?.status,
      });

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
    console.log("Course Dashboard API response:", res.data);
    return res.data;
  } catch (error) {
    if (error instanceof Error) {
      // AxiosError type guard
      const axiosError = error as { response?: { data?: any; status?: number }; message: string };
      console.error("Failed to fetch Course Dashboard:", error);
      console.error("Error details:", {
        message: axiosError.message,
        response: axiosError.response?.data,
        status: axiosError.response?.status,
      });

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

    console.log("Submodule By Id API response:", res.data);
    return res.data;
  } catch (error: any) {
    console.error("Failed to fetch Submodule By Id:", error);
    console.error("Error details:", {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
    });

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
    console.log("Comments By Content Id API response:", res.data);
    return res.data;
  } catch (error: any) {
    console.error("Failed to fetch Comments By Content Id:", error);
    console.error("Error details:", {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
    });

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
    console.log("Create Comment API response:", res.data);
    return res.data;
  } catch (error: any) {
    console.error("Failed to create Comment:", error);
    console.error("Error details:", {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
    });

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
    console.log("Past Submissions API response:", res.data);
    return res.data;
  } catch (error: any) {
    console.error("Failed to fetch Past Submissions:", error);
    console.error("Error details:", {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
    });

    throw new Error(
      error?.response?.data?.detail ||
        error?.message ||
        "Failed to fetch Past Submissions"
    );
  }
};
