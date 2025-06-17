import axiosInstance from "../axiosInstance";

export const getWorkshopRegistrations = async (clientId: string) => {
  try {
    const response = await axiosInstance.get(`/api/clients/${clientId}/workshop-registrations/`);
    return response.data;
  } catch (error) {
    console.error('Failed to fetch workshop registrations:', error);
    throw error;
  }
}