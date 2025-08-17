import axiosInstance from "../axiosInstance";

export const getAllThreads = async (clientId: number) => {
    const response = await axiosInstance.get(`/api/clients/${clientId}/student/community/threads/`);
    return response.data;
};
