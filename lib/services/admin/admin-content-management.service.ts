import apiClient from "../api";
import { config } from "../../config";
import { AxiosError } from "axios";

export interface ApiErrorPayload {
  error?: string;
  message?: string;
  detail?: string;
  [key: string]: any;
}

export type ContentType =
  | "Quiz"
  | "Article"
  | "Assignment"
  | "CodingProblem"
  | "DevCodingProblem"
  | "VideoTutorial";

export interface ContentCountByType {
  Quiz: number;
  Article: number;
  Assignment: number;
  CodingProblem: number;
  DevCodingProblem: number;
  VideoTutorial: number;
}

export interface ContentListItem {
  id: number;
  title: string;
  type: ContentType;
  is_verified: boolean;
}

export interface ContentDetails {
  id: number;
  title: string;
  type: ContentType;
  is_verified: boolean;
  order: number;
  duration_in_minutes: number;
  marks: number;
  created_at: string;
  updated_at: string;
  content_details: {
    id: number;
    title: string;
    [key: string]: any;
  };
}

export interface VerifyContentPayload {
  is_verified: boolean;
}

export interface VerifyContentResponse {
  message: string;
  content: {
    id: number;
    title: string;
    type: ContentType;
    is_verified: boolean;
  };
}

/**
 * Get content count by type for a client
 */
export const getContentCountByType = async (
  clientId: string | number
): Promise<ContentCountByType> => {
  try {
    const response = await apiClient.get(
      `/admin-dashboard/api/clients/${clientId}/contents/type-count/`
    );
    return response.data;
  } catch (err) {
    const error = err as AxiosError<ApiErrorPayload>;
    const message =
      error.response?.data?.error ||
      error.response?.data?.message ||
      error.response?.data?.detail ||
      "Failed to fetch content count by type";
    throw new Error(message);
  }
};

/**
 * Get all contents for a client
 */
export const getContents = async (
  clientId: string | number
): Promise<ContentListItem[]> => {
  try {
    const response = await apiClient.get(
      `/admin-dashboard/api/clients/${clientId}/contents/`
    );
    return response.data;
  } catch (err) {
    const error = err as AxiosError<ApiErrorPayload>;
    const message =
      error.response?.data?.error ||
      error.response?.data?.message ||
      error.response?.data?.detail ||
      "Failed to fetch contents";
    throw new Error(message);
  }
};

/**
 * Get full details of a specific content
 */
export const getContentDetails = async (
  clientId: string | number,
  contentId: number
): Promise<ContentDetails> => {
  try {
    const response = await apiClient.get(
      `/admin-dashboard/api/clients/${clientId}/contents/${contentId}/`
    );
    return response.data;
  } catch (err) {
    const error = err as AxiosError<ApiErrorPayload>;
    const message =
      error.response?.data?.error ||
      error.response?.data?.message ||
      error.response?.data?.detail ||
      "Failed to fetch content details";
    throw new Error(message);
  }
};

/**
 * Verify or unverify a content
 */
export const verifyContent = async (
  clientId: string | number,
  contentId: number,
  payload: VerifyContentPayload
): Promise<VerifyContentResponse> => {
  try {
    const response = await apiClient.patch(
      `/admin-dashboard/api/clients/${clientId}/contents/${contentId}/verify/`,
      payload
    );
    return response.data;
  } catch (err) {
    const error = err as AxiosError<ApiErrorPayload>;
    const message =
      error.response?.data?.error ||
      error.response?.data?.message ||
      error.response?.data?.detail ||
      "Failed to verify/unverify content";
    throw new Error(message);
  }
};

export const adminContentManagementService = {
  getContentCountByType,
  getContents,
  getContentDetails,
  verifyContent,
};
