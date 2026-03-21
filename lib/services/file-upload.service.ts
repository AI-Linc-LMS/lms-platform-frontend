import apiClient from "@/lib/services/api";

export const FILE_UPLOAD_MODULES = [
  "assessment_screenshots",
  "report_issue",
  "profile_avatar",
  "job_application",
  "other",
] as const;

export type FileUploadModule = (typeof FILE_UPLOAD_MODULES)[number];

export interface UploadFileResult {
  id: number;
  url: string;
  filename: string;
  module: string;
  created_at: string;
}

/**
 * POST multipart/form-data to the general file upload API.
 * Auth and FormData boundary are handled by apiClient interceptors.
 */
export async function uploadFile(
  clientId: number,
  file: File,
  module: FileUploadModule
): Promise<UploadFileResult> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("module", module);

  const response = await apiClient.post<UploadFileResult>(
    `/api/clients/${clientId}/upload/`,
    formData
  );

  return response.data;
}
