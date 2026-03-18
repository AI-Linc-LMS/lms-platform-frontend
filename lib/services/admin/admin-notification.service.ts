import apiClient from "../api";
import { AxiosError } from "axios";

export interface SendNotificationPayload {
  target_type: "individual" | "course" | "client";
  student_ids?: number[];
  course_id?: number;
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
