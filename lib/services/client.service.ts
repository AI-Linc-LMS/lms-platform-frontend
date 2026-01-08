import apiClient from "./api";
import { config } from "../config";

export interface ClientFeature {
  id: number;
  name: string;
}

export interface ClientInfo {
  id?: number;
  name?: string;
  slug?: string;
  app_logo_url?: string | null;
  app_icon_url?: string | null;
  is_active?: boolean;
  features?: ClientFeature[];
  theme_settings?: {
    colors?: {
      // Primary Colors
      "nav-background"?: string;
      "font-dark-nav"?: string;
      "font-light-nav"?: string;
      "primary-50"?: string;
      "primary-100"?: string;
      "primary-200"?: string;
      "primary-300"?: string;
      "primary-400"?: string;
      "primary-500"?: string;
      "primary-600"?: string;
      "primary-700"?: string;
      "primary-800"?: string;
      "primary-900"?: string;

      // Secondary Colors
      "secondary-50"?: string;
      "secondary-100"?: string;
      "secondary-200"?: string;
      "secondary-300"?: string;
      "secondary-400"?: string;
      "secondary-500"?: string;
      "nav-selected"?: string;
      "secondary-600"?: string;
      "secondary-700"?: string;

      // Accent Colors
      "accent-yellow"?: string;
      "accent-blue"?: string;
      "accent-green"?: string;
      "accent-red"?: string;
      "accent-orange"?: string;
      "accent-teal"?: string;
      "accent-purple"?: string;
      "accent-pink"?: string;

      // Neutral Colors
      "neutral-50"?: string;
      "neutral-100"?: string;
      "neutral-200"?: string;
      "neutral-300"?: string;
      "neutral-400"?: string;
      "neutral-500"?: string;
      "neutral-600"?: string;
      "neutral-700"?: string;
      "neutral-800"?: string;

      // Success Colors
      "success-50"?: string;
      "success-100"?: string;
      "success-500"?: string;

      // Warning Colors
      "warning-100"?: string;
      "warning-500"?: string;

      // Error Colors
      "error-100"?: string;
      "error-500"?: string;
      "error-600"?: string;

      // Font Colors
      "font-primary"?: string;
      "font-secondary"?: string;
      "font-tertiary"?: string;
      "font-light"?: string;
      "font-dark"?: string;
      "course-cta"?: string;
      "default-primary"?: string;

      // Card / surface background
      "card-bg"?: string;

      // Chart series colors
      "chart-articles"?: string;
      "chart-videos"?: string;
      "chart-problems"?: string;
      "chart-quiz"?: string;
      "chart-subjective"?: string;
      "chart-development"?: string;
    };
    [key: string]: any;
  };
  login_img_url?: string | null;
  login_logo_url?: string | null;
  show_footer?: boolean;
  pwa_manifest?: Record<string, any>;
  [key: string]: any; // Allow other properties from API
}

export const initApp = async (clientId: number): Promise<ClientInfo> => {
  try {
    const response = await apiClient.get<ClientInfo>(
      `/api/clients/${clientId}/client-info/`
    );
    return response.data;
  } catch (error: any) {
    const axiosError = error;
    throw new Error(
      axiosError?.response?.data?.detail ||
        axiosError?.message ||
        "App Init Error"
    );
  }
};

export interface ReportIssueRequest {
  issue_type: string;
  description: string;
  screenshot_url?: string;
  subject: string;
  course_id?: number;
  content_id?: number;
  page_url?: string;
}

export const reportIssue = async (
  clientId: number,
  issueData: ReportIssueRequest
): Promise<void> => {
  try {
    await apiClient.post(`/api/clients/${clientId}/report-issue/`, issueData);
  } catch (error: any) {
    const axiosError = error;
    throw new Error(
      axiosError?.response?.data?.detail ||
        axiosError?.message ||
        "Failed to report issue"
    );
  }
};
