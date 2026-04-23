import axios, {
  AxiosInstance,
  AxiosError,
  InternalAxiosRequestConfig,
} from "axios";
import Cookies from "js-cookie";
import { config } from "../config";
import { getClientDeviceClass } from "../utils/assessment-device";

// Create axios instance
const apiClient: AxiosInstance = axios.create({
  baseURL: config.apiBaseUrl,
});

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
      delete config.headers["Content-Type"];
    }
    const path = `${config.baseURL ?? ""}${config.url ?? ""}`;
    if (
      typeof window !== "undefined" &&
      path.includes("/assessment") &&
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
