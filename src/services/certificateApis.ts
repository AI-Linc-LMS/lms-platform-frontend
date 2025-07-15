import  axiosInstance  from "./axiosInstance";

export interface Certificate {
  id: string;
  type: "assessment" | "workshop" | "assessment-workshop";
  name: string;
  issuedDate: string;
  studentName: string;
  studentEmail: string;
  score?: number;
  sessionNumber?: number;
}

export const getAvailableCertificates = async (clientId: number): Promise<Certificate[]> => {
  const response = await axiosInstance.get(`/api/clients/${clientId}/user-available-certificates`);
  return response.data;
}; 