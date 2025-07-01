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

export const getAssesmentStudentResults = async (clientId: string) => {
  try {
    const response = await axiosInstance.get(`/admin-dashboard/api/clients/${clientId}/assessment-submissions/`);
    return response.data;
  } catch (error) {
    console.error('Failed to fetch assessment student results:', error);
    throw error;
  }
}