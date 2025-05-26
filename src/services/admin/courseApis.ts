import axiosInstance from "../axiosInstance";

export const getCourses = async (clientId: number) => {
  try {
    const res = await axiosInstance.get(
      `/admin-dashboard/api/clients/${clientId}/courses/`
    );
    console.log("get admin Course:", res);
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

export const createCourse = async (clientId: number, courseData: any) => {
  try {
    const res = await axiosInstance.post(
      `/admin-dashboard/api/clients/${clientId}/courses/`,
      courseData
    );
    console.log("create course", res);
    return res.data;
  } catch (error: any) {
    console.error("Failed to fetch create courses:", error);
    console.error("Error details:", {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
    });

    // You can throw a custom error if you want
    throw new Error(
      error?.response?.data?.detail ||
        error?.message ||
        "Failed to fetch create courses"
    );
  }
};

export const updateCourse = async (
  clientId: number,
  courseId: number,
  courseData: any
) => {
  try {
    const res = await axiosInstance.put(
      `/admin-dashboard/api/clients/${clientId}/courses/${courseId}/`,
      courseData
    );
    console.log("update course", res);
    return res.data;
  } catch (error: any) {
    console.error("Failed to fetch update courses:", error);
    console.error("Error details:", {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
    });

    // You can throw a custom error if you want
    throw new Error(
      error?.response?.data?.detail ||
        error?.message ||
        "Failed to fetch update courses"
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
  } catch (error: any) {
    console.error("Failed to fetch delete courses:", error);
    console.error("Error details:", {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
    });

    // You can throw a custom error if you want
    throw new Error(
      error?.response?.data?.detail ||
        error?.message ||
        "Failed to fetch delete courses"
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
  } catch (error: any) {
    console.error("Failed to fetch get course modules:", error);
    console.error("Error details:", {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
    });
    throw new Error(
      error?.response?.data?.detail ||
        error?.message ||
        "Failed to fetch get course modules"
    );
  }
};

export const createCourseModule = async (
  clientId: number,
  courseId: number,
  moduleData: any
) => {
  try {
    const res = await axiosInstance.post(
      `/admin-dashboard/api/clients/${clientId}/courses/${courseId}/modules/`,
      moduleData
    );
    console.log("create course module", res);
    return res.data;
  } catch (error: any) {
    console.error("Failed to fetch create course module:", error);
    console.error("Error details:", {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
    });
    throw new Error(
      error?.response?.data?.detail ||
        error?.message ||
        "Failed to fetch create course module"
    );
  }
};

export const updateCourseModule = async (
  clientId: number,
  courseId: number,
  moduleId: number,
  moduleData: any
) => {
  try {
    const res = await axiosInstance.put(
      `/admin-dashboard/api/clients/${clientId}/courses/${courseId}/modules/${moduleId}/`,
      moduleData
    );
    console.log("update course module", res);
    return res.data;
  } catch (error: any) {
    console.error("Failed to fetch update course module:", error);
    console.error("Error details:", {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
    });
    throw new Error(
      error?.response?.data?.detail ||
        error?.message ||
        "Failed to fetch update course module"
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
  } catch (error: any) {
    console.error("Failed to fetch delete course module:", error);
    console.error("Error details:", {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
    });
    throw new Error(
      error?.response?.data?.detail ||
        error?.message ||
        "Failed to fetch delete course module"
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
  } catch (error: any) {
    console.error("Failed to fetch get course submodules:", error);
    console.error("Error details:", {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
    });
    throw new Error(
      error?.response?.data?.detail ||
        error?.message ||
        "Failed to fetch get course submodules"
    );
  }
};

export const createCourseSubmodule = async (
  clientId: number,
  courseId: number,
  moduleId: number,
  submoduleData: any
) => {
  try {
    const res = await axiosInstance.post(
      `/admin-dashboard/api/clients/${clientId}/courses/${courseId}/modules/${moduleId}/submodules/`,
      submoduleData
    );
    console.log("create course submodule", res);
    return res.data;
  } catch (error: any) {
    console.error("Failed to fetch create course submodule:", error);
    console.error("Error details:", {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
    });
    throw new Error(
      error?.response?.data?.detail ||
        error?.message ||
        "Failed to fetch create course submodule"
    );
  }
};

export const updateCourseSubmodule = async (
  clientId: number,
  courseId: number,
  moduleId: number,
  submoduleId: number,
  submoduleData: any
) => {
  try {
    const res = await axiosInstance.put(
      `/admin-dashboard/api/clients/${clientId}/courses/${courseId}/modules/${moduleId}/submodules/${submoduleId}/`,
      submoduleData
    );
    console.log("update course submodule", res);
    return res.data;
  } catch (error: any) {
    console.error("Failed to fetch update course submodule:", error);
    console.error("Error details:", {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
    });
    throw new Error(
      error?.response?.data?.detail ||
        error?.message ||
        "Failed to fetch update course submodule"
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
  } catch (error: any) {
    console.error("Failed to fetch delete course submodule:", error);
    console.error("Error details:", {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
    });
    throw new Error(
      error?.response?.data?.detail ||
        error?.message ||
        "Failed to fetch delete course submodule"
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
  } catch (error: any) {
    console.error("Failed to fetch view course details:", error);
    console.error("Error details:", {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
    });
    throw new Error(
      error?.response?.data?.detail ||
        error?.message ||
        "Failed to fetch view courses"
    );
  }
};
