import axios, {
  AxiosInstance,
  AxiosError,
  AxiosHeaders,
  InternalAxiosRequestConfig,
} from "axios";
import Cookies from "js-cookie";
import { config } from "../config";
import { getClientDeviceClass } from "../utils/assessment-device";

// Create axios instance
const apiClient: AxiosInstance = axios.create({
  baseURL: config.apiBaseUrl,
});

// Module flag so the response interceptor and any caller can tell that a
// logout is in progress. While set, 401s from in-flight requests are
// swallowed silently — the page is about to be replaced by /login anyway,
// and surfacing "Authentication credentials were not provided" toasts from
// half-completed dashboard fetches just confuses the user.
let isLoggingOut = false;
export function setLoggingOut(value: boolean) {
  isLoggingOut = value;
}
export function getIsLoggingOut() {
  return isLoggingOut;
}

// Request interceptor to add auth token and fix FormData uploads
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const method = (config.method || "get").toLowerCase();
    const token = Cookies.get("access_token");
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    // Only set JSON content-type for methods that send request bodies.
    if (
      config.headers &&
      ["post", "put", "patch", "delete"].includes(method) &&
      !(config.data instanceof FormData) &&
      !config.headers["Content-Type"]
    ) {
      config.headers["Content-Type"] = "application/json";
    }
    // When sending FormData, remove Content-Type so the browser sets it with the correct boundary.
    if (config.data instanceof FormData && config.headers) {
      const h = config.headers;
      if (h instanceof AxiosHeaders) {
        h.delete("Content-Type");
        h.delete("content-type");
      } else {
        const rec = h as Record<string, unknown>;
        delete rec["Content-Type"];
        delete rec["content-type"];
      }
    }
    const path = `${config.baseURL ?? ""}${config.url ?? ""}`;
    if (
      typeof window !== "undefined" &&
      path.includes("/assessment/api/client/") &&
      !path.includes("/active-assessments/") &&
      config.headers
    ) {
    }
    
    // config.headers["X-Client-Device-Type"] = getClientDeviceClass();
    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling and token refresh
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    // Handle 401 errors (unauthorized)
    if (error.response?.status === 401 && !originalRequest._retry) {
      // If a logout is in progress, drop the error silently. The page is
      // already navigating to /login; a refresh attempt or a surfaced
      // "credentials not provided" detail would just race the redirect.
      if (isLoggingOut) {
        return new Promise(() => {});
      }
      originalRequest._retry = true;

      const refreshToken = Cookies.get("refresh_token");
      if (refreshToken) {
        try {
          const response = await axios.post(
            `${config.apiBaseUrl}/accounts/token/refresh/`,
            { refresh: refreshToken }
          );

          const { access } = response.data;
          Cookies.set("access_token", access, { expires: 7 });

          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${access}`;
          }

          return apiClient(originalRequest);
        } catch (refreshError) {
          // Refresh failed, clear tokens and redirect to login
          Cookies.remove("access_token");
          Cookies.remove("refresh_token");
          if (typeof window !== "undefined") {
            window.location.href = "/login";
          }
          return Promise.reject(refreshError);
        }
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;
