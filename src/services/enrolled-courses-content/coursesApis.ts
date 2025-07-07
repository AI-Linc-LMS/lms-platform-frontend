import axiosInstance from "../axiosInstance";

//getting enrolled courses
export const getEnrolledCourses = async (clientId: number) => {
  try {
    const response = await axiosInstance.get(
      `/api/clients/${clientId}/student/enrolled-courses/`
    );

    return response.data;
  } catch (error: unknown) {
    // Failed to fetch enrolled courses
    throw new Error(
      error instanceof Error ? error.message : "Failed to fetch enrolled courses"
    );
  }
};

//getting continue learning courses
export const getContinueLearningCourses = async (clientId: number) => {
  try {
    const response = await axiosInstance.get(
      `/api/clients/${clientId}/student/continue-learning-courses/`
    );

    return response.data;
  } catch (error: unknown) {
    // Failed to fetch continue learning courses
    throw new Error(
      error instanceof Error ? error.message : "Failed to fetch continue learning courses"
    );
  }
};

export const likeOrUnlikeCourse = async (clientId: number, courseId: number) => {
  try {
    const response = await axiosInstance.post(
      `/lms/clients/${clientId}/courses/${courseId}/toggle-like/`
    );
    return response.data;
  } catch (error: unknown) {
    // Failed to like or unlike course
    throw new Error(
      error instanceof Error ? error.message : "Failed to like or unlike course"
    );
  }
};

export const reportIssue = async (clientId: number, subject: string, description: string) => {
  try {
    const response = await axiosInstance.post(
      `/api/clients/${clientId}/report-issue/`,
      {
        subject,
        description
      }
    );
    return response.data;
  } catch (error: unknown) {
    // Failed to report issue
    throw new Error(
      error instanceof Error ? error.message : "Failed to report issue"
    );
  }
};
