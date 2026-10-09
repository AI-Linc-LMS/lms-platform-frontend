import apiClient from "../api";
import { config } from "../../config";
import type { UserProfile } from "../profile.service";

export interface AdminSavedResume {
  id: number;
  display_name: string;
  file_url: string;
  created_at: string;
}

/** A resume still living in the builder: real, but with no file anyone can open. */
export interface AdminResumeDocument {
  id: number;
  display_name: string;
  updated_at?: string;
}

/**
 * The shared answer to "has this learner saved a resume?", from `accounts.resume_presence`.
 * The same payload Manage Students uses, so the profile section cannot contradict the column.
 */
export interface AdminResumePresence {
  has_saved_resume: boolean;
  resumes: AdminSavedResume[];
  documents: AdminResumeDocument[];
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
  getStudentResumes: async (studentId: number): Promise<AdminResumePresence> => {
    const response = await apiClient.get<AdminResumePresence>(
      `/admin-dashboard/api/clients/${config.clientId}/student-profile/${studentId}/resumes/`
    );
    const d = response.data;
    // Tolerate the old bare-array shape for one deploy, so a stale backend degrades to "PDFs
    // only" instead of rendering an empty section.
    if (Array.isArray(d)) return { has_saved_resume: d.length > 0, resumes: d, documents: [] };
    return { has_saved_resume: !!d?.has_saved_resume, resumes: d?.resumes ?? [], documents: d?.documents ?? [] };
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
