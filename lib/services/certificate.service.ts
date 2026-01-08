import apiClient from "./api";
import { config } from "../config";
import { AxiosError } from "axios";

export interface ApiErrorPayload {
  error?: string;
  message?: string;
  detail?: string;
  [key: string]: any;
}

export interface Certificate {
  id: number;
  course_id: number;
  course_title: string;
  certificate_url: string;
  issued_at: string;
}

/**
 * Get all available certificates for the current user
 */
export const getAvailableCertificates = async (): Promise<Certificate[]> => {
  try {
    const response = await apiClient.get(
      `/api/clients/${config.clientId}/user-available-certificates/`
    );
    return response.data || [];
  } catch (err) {
    const error = err as AxiosError<ApiErrorPayload>;
    const message =
      error.response?.data?.error ||
      error.response?.data?.message ||
      error.response?.data?.detail ||
      "Failed to fetch certificates";
    throw new Error(message);
  }
};

export const certificateService = {
  getAvailableCertificates,
};
