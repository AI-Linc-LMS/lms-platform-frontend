import axiosInstance from "../axiosInstance";

export const coreAdminDashboard = async (clientId: number) => {
  try {
    const res = await axiosInstance.get(
      `/admin-dashboard/api/clients/${clientId}/core-admin-dashboard/`
    );
    return res.data;
  } catch (e) {
    throw new Error(
      e instanceof Error ? e.message : "Failed to core admin dashboard"
    );
  }
};
