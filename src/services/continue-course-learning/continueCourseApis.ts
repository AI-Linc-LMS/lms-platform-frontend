import axiosInstance from "../axiosInstance";

export const getAllContinueCourseLearning = async (clientId: number) => {
  const response = await axiosInstance.get(
    `/api/clients/${clientId}/student/continue-learning-courses/`
  );
  return response.data;
};

export const getAllRecommendedCourse = async (clientId: number) => {
  const res = await axiosInstance.get(
    `api/clients/${clientId}/student/recommended-courses/`
  );
  return res.data;
};

// Enroll in a course (LMS endpoint)
export const enrollInCourse = async (clientId: number, courseId: number) => {
  const res = await axiosInstance.post(
    `lms/clients/${clientId}/courses/${courseId}/enroll/`,
    {}
  );
  return res.data;
};
