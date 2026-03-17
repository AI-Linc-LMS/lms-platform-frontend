import apiClient from "../api";
import { config } from "../../config";
import type { UserProfile } from "../profile.service";

export interface AdminSavedResume {
  id: number;
  display_name: string;
  file_url: string;
  created_at: string;
}

export const adminProfileService = {
  /** Fetch a student's profile (admin view). */
  getStudentProfile: async (studentId: number): Promise<UserProfile & { id: number }> => {
    const response = await apiClient.get<UserProfile & { id: number }>(
      `/admin-dashboard/api/clients/${config.clientId}/student-profile/${studentId}/`
    );
    return response.data;
  },

  /** Fetch a student's saved resumes. */
  getStudentResumes: async (studentId: number): Promise<AdminSavedResume[]> => {
    const response = await apiClient.get<AdminSavedResume[]>(
      `/admin-dashboard/api/clients/${config.clientId}/student-profile/${studentId}/resumes/`
    );
    return response.data;
  },

  /** Fetch a student's resume PDF as blob for preview. */
  getStudentResumePdfBlob: async (
    studentId: number,
    resumeId: number
  ): Promise<Blob> => {
    const response = await apiClient.get(
      `/admin-dashboard/api/clients/${config.clientId}/student-profile/${studentId}/resumes/${resumeId}/view/`,
      { responseType: "blob" }
    );
    return response.data;
  },

  /** Fetch and return blob URL for student resume preview. */
  getStudentResumePdfBlobUrl: async (
    studentId: number,
    resumeId: number
  ): Promise<string> => {
    const blob = await adminProfileService.getStudentResumePdfBlob(
      studentId,
      resumeId
    );
    return URL.createObjectURL(blob);
  },
};
