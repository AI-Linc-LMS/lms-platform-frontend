import axiosInstance from "../axiosInstance";

//getting all courses
export const getAllCourse = async (clientId: number) => {
  try {
    const res = await axiosInstance.get(`/lms/clients/${clientId}/courses/`);

    console.log("All Courses API response:", res.data);
    return res.data;
  } catch (error: any) {
    console.error("Failed to fetch all courses:", error);
    console.error("Error details:", {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
    });

    // You can throw a custom error if you want
    throw new Error(
      error?.response?.data?.detail ||
        error?.message ||
        "Failed to fetch all courses"
    );
  }
};


//getting course by id
export const getCourseById = async (clientId: number, courseId: number) => {
  try {
    const res = await axiosInstance.get(`/lms/clients/${clientId}/courses/${courseId}/`);

    console.log("Course By Id API response:", res.data);
    return res.data;
  } catch (error: any) {
    console.error("Failed to fetch Course By Id:", error);
    console.error("Error details:", {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
    });

    // You can throw a custom error if you want
    throw new Error(
      error?.response?.data?.detail ||
        error?.message ||
        "Failed to fetch Course By Id"
    );
  }
};

//getting course content (videos, quizzes, etc.)
export const getCourseContent = async (clientId: number, courseId: number, contentId: number) => {
  try {
    const res = await axiosInstance.get(
      `/lms/clients/${clientId}/courses/${courseId}/content/${contentId}/`
    );

    console.log("Course Content API response:", res.data);
    return res.data;
  } catch (error: any) {
    console.error("Failed to fetch Course Content:", error);
    console.error("Error details:", {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
    });

    // You can throw a custom error if you want
    throw new Error(
      error?.response?.data?.detail ||
        error?.message ||
        "Failed to fetch Course Content"
    );
  }
}

//getting course leaderboard
export const getCourseLeaderboard = async (clientId: number, courseId: number) => {
  try {
    const res = await axiosInstance.get(`/lms/clients/${clientId}/courses/${courseId}/leaderboard/`);
    console.log("Course Leaderboard API response:", res.data);
    return res.data;

  } catch (error: any) {
    console.error("Failed to fetch Course Leaderboard:", error);
    console.error("Error details:", {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
    });

    // You can throw a custom error if you want
    throw new Error(
      error?.response?.data?.detail ||
        error?.message ||
        "Failed to fetch Course Leaderboard"
    );
  }
}

//getting course dashboard (done)
export const getCourseDashboard = async (clientId: number, courseId: number) => {
  try {
    const res = await axiosInstance.get(`/lms/clients/${clientId}/courses/${courseId}/user-course-dashboard`);
    console.log("Course Dashboard API response:", res.data);
    return res.data;

  } catch (error: any) {
    console.error("Failed to fetch Course Dashboard:", error);
    console.error("Error details:", {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
    });

    // You can throw a custom error if you want
    throw new Error(
      error?.response?.data?.detail ||
        error?.message ||
        "Failed to fetch Course Dashboard"
    );
  }
}

//getting course submodules by id
export const getSubmoduleById = async (clientId: number, courseId: number, submoduleId: number) => {
  try {
    const res = await axiosInstance.get(`/lms/clients/${clientId}/courses/${courseId}/sub-module/${submoduleId}/`);

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
}