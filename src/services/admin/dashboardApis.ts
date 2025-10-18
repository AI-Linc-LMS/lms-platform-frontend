import axiosInstance from "../axiosInstance";

export const coreAdminDashboard = async (clientId: number, courseId?: number) => {
  try {
    const url = `/admin-dashboard/api/clients/${clientId}/core-admin-dashboard/`;
    const params = courseId ? { course_id: courseId } : {};
    const res = await axiosInstance.get(url, { params });
    return res.data;
  } catch (e) {
    throw new Error(
      e instanceof Error ? e.message : "Failed to core admin dashboard"
    );
  }
};
