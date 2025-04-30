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
