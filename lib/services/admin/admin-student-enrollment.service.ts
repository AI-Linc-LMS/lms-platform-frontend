import apiClient from "../api";
import { config } from "../../config";
import { AxiosError } from "axios";

export interface ApiErrorPayload {
  error?: string;
  message?: string;
  detail?: string;
  [key: string]: any;
}

export type EnrollmentJobStatus = "PENDING" | "IN_PROGRESS" | "COMPLETED" | "FAILED";

export interface StudentData {
  name: string;
  email: string;
  phone?: string;
}

export interface EnrolledStudent {
  user_id: number;
  course_id: number;
}

export interface SkippedEnrollment {
  user_id: number;
  course_id: number;
}

export interface FailedStudent {
  student: StudentData;
  error: string;
}

export interface StudentEnrollmentJob {
  id: number;
  task_id: string;
  client: number;
  students: StudentData[];
  course_ids: number[];
  created_accounts: number[];
  enrolled_students: EnrolledStudent[];
  skipped_accounts: number[];
  skipped_enrollments: SkippedEnrollment[];
  failed_students: FailedStudent[];
  status: EnrollmentJobStatus;
  notes: string | null;
  error_details: Record<string, any>;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
}

export interface CreateEnrollmentJobRequest {
  students: StudentData[];
  course_ids: string; // Comma-separated string like "360,361,363"
}

export const adminStudentEnrollmentService = {
  // Create a new enrollment job
  createEnrollmentJob: async (
    data: CreateEnrollmentJobRequest
  ): Promise<StudentEnrollmentJob> => {
    try {
      const response = await apiClient.post<StudentEnrollmentJob>(
        `/admin-dashboard/api/clients/${config.clientId}/student-enrollment-jobs/`,
        data
      );
      return response.data;
    } catch (err) {
      const error = err as AxiosError<ApiErrorPayload>;
      const message =
        error.response?.data?.error ||
        error.response?.data?.message ||
        error.response?.data?.detail ||
        "Failed to create enrollment job";
      throw new Error(message);
    }
  },

  // Get job status by task_id
  getJobStatus: async (taskId: string): Promise<StudentEnrollmentJob> => {
    try {
      const response = await apiClient.get<StudentEnrollmentJob>(
        `/admin-dashboard/api/clients/${config.clientId}/student-enrollment-jobs/${taskId}/`
      );
      return response.data;
    } catch (err) {
      const error = err as AxiosError<ApiErrorPayload>;
      const message =
        error.response?.data?.error ||
        error.response?.data?.message ||
        error.response?.data?.detail ||
        "Failed to fetch job status";
      throw new Error(message);
    }
  },

  // List all enrollment jobs for the client
  listAllJobs: async (): Promise<StudentEnrollmentJob[]> => {
    try {
      const response = await apiClient.get<StudentEnrollmentJob[]>(
        `/admin-dashboard/api/clients/${config.clientId}/student-enrollment-jobs/`
      );
      return response.data;
    } catch (err) {
      const error = err as AxiosError<ApiErrorPayload>;
      const message =
        error.response?.data?.error ||
        error.response?.data?.message ||
        error.response?.data?.detail ||
        "Failed to fetch enrollment jobs";
      throw new Error(message);
    }
  },
};
