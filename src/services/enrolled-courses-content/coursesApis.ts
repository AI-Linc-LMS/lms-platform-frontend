import axiosInstance from "../axiosInstance";

//getting enrolled courses
export const getEnrolledCourses = async (clientId: number) => {
  try {
    const response = await axiosInstance.get(
      `/api/clients/${clientId}/student/enrolled-courses/`
    );

    return response.data;
  } catch (error: unknown) {
    // Type guard for axios error
    const axiosError = error as {
      response?: { data?: { detail?: string }; status?: number };
      message?: string;
    };
    
    // Log the error details
    console.error("Failed to fetch enrolled courses:", error);
    console.error("Error details:", {
      message: axiosError.message,
      response: axiosError.response?.data,
      status: axiosError.response?.status,
    });

    // You can throw a custom error if you want
    throw new Error(
      axiosError?.response?.data?.detail ||
        axiosError?.message ||
        "Failed to fetch enrolled courses"
    );
  }
};

//getting continue learning courses
export const getContinueLearningCourses = async (clientId: number) => {
  try {
    const response = await axiosInstance.get(
      `/api/clients/${clientId}/student/continue-learning-courses/`
    );

    console.log("Continue Learning Courses:", response.data); // Log the response data
    return response.data;
  } catch (error: unknown) {
    // Type guard for axios error
    const axiosError = error as {
      response?: { data?: { detail?: string }; status?: number };
      message?: string;
    };
    
    // Log the error details
    console.error("Failed to fetch continue learning courses:", error);
    console.error("Error details:", {
      message: axiosError.message,
      response: axiosError.response?.data,
      status: axiosError.response?.status,
    });

    // You can throw a custom error if you want
    throw new Error(
      axiosError?.response?.data?.detail ||
        axiosError?.message ||
        "Failed to fetch enrolled courses"
    );
  }
};

//enrolling in a course
export const enrollInCourse = async (clientId: number, courseId: number) => {
  try {
    const response = await axiosInstance.post(
      `/api/clients/${clientId}/student/enroll-course/`,
      { course_id: courseId }
    );

    console.log("Course enrollment response:", response.data);
    return response.data;
  } catch (error: unknown) {
    // Type guard for axios error
    const axiosError = error as {
      response?: { data?: { detail?: string }; status?: number };
      message?: string;
    };
    
    // Log the error details
    console.error("Failed to enroll in course:", error);
    console.error("Error details:", {
      message: axiosError.message,
      response: axiosError.response?.data,
      status: axiosError.response?.status,
    });

    // You can throw a custom error if you want
    throw new Error(
      axiosError?.response?.data?.detail ||
        axiosError?.message ||
        "Failed to enroll in course"
    );
  }
};
