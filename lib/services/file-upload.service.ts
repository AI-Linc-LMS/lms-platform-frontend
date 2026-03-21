import apiClient from "./api";
import { config } from "../config";

export type FileUploadModule =
  | "assessment_screenshots"
  | "report_issue"
  | "profile_avatar"
  | "job_application"
  | "other";

export interface FileUploadResponse {
  id: number;
  url: string;
  filename: string;
  module: string;
  created_at: string;
}

/**
 * Upload a file (PDF, PNG, JPEG, GIF, WEBP) to S3.
 * Files are organized by module in the bucket.
 *
 * @param clientId - Client ID
 * @param file - File to upload
 * @param module - Module/category (e.g. assessment_screenshots, report_issue)
 * @returns Upload response with URL to use elsewhere
 */
export const uploadFile = async (
  clientId: number,
  file: File,
  module: FileUploadModule
): Promise<FileUploadResponse> => {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("module", module);

  const response = await apiClient.post<FileUploadResponse>(
    `/api/clients/${clientId}/upload/`,
    formData
  );
  return response.data;
};
