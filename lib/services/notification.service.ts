import apiClient from "./api";
import { AxiosError } from "axios";

export interface Notification {
  id: number;
  notification_type: string;
  title: string;
  message: string;
  action_url: string | null;
  metadata: Record<string, unknown>;
  is_read: boolean;
  created_at: string;
}

export interface NotificationListResponse {
  count: number;
  results: Notification[];
}

export interface ApiErrorPayload {
  error?: string;
  message?: string;
  detail?: string;
  [key: string]: unknown;
}

export const getNotifications = async (
  clientId: string | number,
  page = 1,
  limit = 20
): Promise<NotificationListResponse> => {
  try {
    const response = await apiClient.get<NotificationListResponse>(
      `/notification/api/clients/${clientId}/notifications/`,
      { params: { page, limit } }
    );
    return response.data;
  } catch (err) {
    const error = err as AxiosError<ApiErrorPayload>;
    const message =
      (error.response?.data?.error as string) ||
      (error.response?.data?.message as string) ||
      (error.response?.data?.detail as string) ||
      "Failed to fetch notifications";
    throw new Error(message);
  }
};

export const markAsRead = async (
  clientId: string | number,
  notificationId: number
): Promise<Notification> => {
  try {
    const response = await apiClient.patch<Notification>(
      `/notification/api/clients/${clientId}/notifications/${notificationId}/read/`
    );
    return response.data;
  } catch (err) {
    const error = err as AxiosError<ApiErrorPayload>;
    const message =
      (error.response?.data?.error as string) ||
      (error.response?.data?.message as string) ||
      (error.response?.data?.detail as string) ||
      "Failed to mark notification as read";
    throw new Error(message);
  }
};

export const markAllAsRead = async (
  clientId: string | number
): Promise<{ marked_count: number }> => {
  try {
    const response = await apiClient.post<{ marked_count: number }>(
      `/notification/api/clients/${clientId}/notifications/mark-all-read/`
    );
    return response.data;
  } catch (err) {
    const error = err as AxiosError<ApiErrorPayload>;
    const message =
      (error.response?.data?.error as string) ||
      (error.response?.data?.message as string) ||
      (error.response?.data?.detail as string) ||
      "Failed to mark all as read";
    throw new Error(message);
  }
};

export const getUnreadCount = async (
  clientId: string | number
): Promise<number> => {
  try {
    const response = await apiClient.get<{ unread_count: number }>(
      `/notification/api/clients/${clientId}/notifications/unread-count/`
    );
    return response.data.unread_count;
  } catch (err) {
    const error = err as AxiosError<ApiErrorPayload>;
    const message =
      (error.response?.data?.error as string) ||
      (error.response?.data?.message as string) ||
      (error.response?.data?.detail as string) ||
      "Failed to fetch unread count";
    throw new Error(message);
  }
};

export const notificationService = {
  getNotifications,
  markAsRead,
  markAllAsRead,
  getUnreadCount,
};
