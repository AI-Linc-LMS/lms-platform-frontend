import apiClient from "../api";
import { AxiosError } from "axios";

export interface SendNotificationPayload {
  /**
   * `course` is the retired legacy course tag. The server still accepts it so an older admin build
   * keeps working, but this build does not send it: `cohort` reaches the same learners (their
   * course's batch) and keeps reaching them once the tag is gone.
   */
  target_type: "individual" | "adaptive_course" | "cohort" | "client" | "course";
  student_ids?: number[];
  /** @deprecated see `target_type`. */
  course_id?: number;
  adaptive_course_id?: number;
  cohort_id?: number;
  title: string;
  message: string;
  action_url?: string;
}

export interface ApiErrorPayload {
  error?: string;
  message?: string;
  detail?: string;
  [key: string]: unknown;
}

export const sendCustomNotification = async (
  clientId: string | number,
  payload: SendNotificationPayload
): Promise<{ message: string }> => {
  try {
    const response = await apiClient.post<{ message: string }>(
      `/notification/api/clients/${clientId}/admin/send/`,
      payload
    );
    return response.data;
  } catch (err) {
    const error = err as AxiosError<ApiErrorPayload>;
    const message =
      (error.response?.data?.error as string) ||
      (error.response?.data?.message as string) ||
      (error.response?.data?.detail as string) ||
      "Failed to send notification";
    throw new Error(message);
  }
};

export const adminNotificationService = {
  sendCustomNotification,
};
