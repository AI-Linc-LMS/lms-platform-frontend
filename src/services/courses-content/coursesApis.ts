import axiosInstance from "../axiosInstance";

//getting enrolled courses
export const getEnrolledCourses = async (clientId: number) => {
  try {
    const response = await axiosInstance.get(
      `/api/clients/${clientId}/student/enrolled-courses/`
    );

    console.log("Enrolled Courses:", response.data); 
    return response.data;
  } catch (error: any) {
    // Log the error details
    console.error("Failed to fetch enrolled courses:", error);
    console.error("Error details:", {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
    });

    // You can throw a custom error if you want
    throw new Error(
      error?.response?.data?.detail ||
        error?.message ||
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
  } catch (error: any) {
    // Log the error details
    console.error("Failed to fetch continue learning courses:", error);
    console.error("Error details:", {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
    });

    // You can throw a custom error if you want
    throw new Error(
      error?.response?.data?.detail ||
        error?.message ||
        "Failed to fetch enrolled courses"
    );
  }
};
