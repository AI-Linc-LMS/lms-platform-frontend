import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";
import { store } from "../redux/store";
import { logout, setUser } from "../redux/slices/userSlice";
import { refreshToken } from "./authApis";

// Create a flag to prevent multiple concurrent refresh attempts
let isRefreshing = false;

// Define the interface for queued promises
interface QueueItem {
  resolve: (value: string | PromiseLike<string>) => void;
  reject: (reason?: unknown) => void;
}

// Extend AxiosRequestConfig to include retry flag
interface RetryRequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

// Store pending requests that should be retried after token refresh
let failedQueue: QueueItem[] = [];

// Function to process the queue of failed requests
const processQueue = (error: Error | null, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token as string);
    }
  });

  failedQueue = [];
};

const axiosInstance = axios.create({
  baseURL: "https://be-app.ailinc.com/",
  headers: {
    "Content-Type": "application/json",
  },
});

// Cache to avoid repeated localStorage reads and token parsing
let cachedToken: string | null = null;
let cacheTimestamp = 0;
const TOKEN_CACHE_TTL = 2000; // Cache token for 2 seconds to avoid excessive localStorage reads

// Check if service worker is active (cached to avoid repeated checks)
let serviceWorkerActive: boolean | null = null;
let serviceWorkerCheckTime = 0;
const SW_CHECK_TTL = 5000; // Check every 5 seconds

const isServiceWorkerActive = (): boolean => {
  const now = Date.now();
  if (
    serviceWorkerActive !== null &&
    now - serviceWorkerCheckTime < SW_CHECK_TTL
  ) {
    return serviceWorkerActive;
  }

  serviceWorkerActive = !!(
    navigator.serviceWorker && navigator.serviceWorker.controller
  );
  serviceWorkerCheckTime = now;
  return serviceWorkerActive;
};

// Optimized token retrieval with caching
const getCachedToken = (): string | null => {
  const now = Date.now();
  if (cachedToken && now - cacheTimestamp < TOKEN_CACHE_TTL) {
    return cachedToken;
  }

  try {
    const user = localStorage.getItem("user");
    if (user) {
      const parsed = JSON.parse(user);
      cachedToken = parsed.access_token || null;
      cacheTimestamp = now;
      return cachedToken;
    }
  } catch {
    cachedToken = null;
    cacheTimestamp = now;
  }

  return null;
};

// Clear token cache (call this on logout/token refresh)
export const clearTokenCache = () => {
  cachedToken = null;
  cacheTimestamp = 0;
};

// Add a request interceptor to include the access token if available
axiosInstance.interceptors.request.use(
  (config) => {
    // Use cached token to avoid expensive localStorage reads on every request
    const token = getCachedToken();

    if (token) {
      // Add Authorization header if token exists
      config.headers["Authorization"] = `Bearer ${token}`;
    }

    // Only add cache-busting headers if service worker is active (to prevent caching)
    // This avoids unnecessary headers when service worker is disabled
    // Use cached service worker check to avoid repeated property access
    if (
      isServiceWorkerActive() &&
      config.url &&
      (config.url.startsWith("/api/") || config.url.startsWith("api/"))
    ) {
      config.headers["Cache-Control"] = "no-cache, no-store, must-revalidate";
      config.headers["Pragma"] = "no-cache";
      config.headers["Expires"] = "0";
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// Add a response interceptor to handle token expiration
axiosInstance.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error: AxiosError) => {
    if (!error.config) {
      return Promise.reject(error);
    }

    const originalRequest = error.config as RetryRequestConfig;

    // Check if the error is due to an expired token (status 401)
    if (
      error.response &&
      error.response.status === 401 &&
      !originalRequest._retry
    ) {
      // Mark this request as already retried to prevent infinite loops
      originalRequest._retry = true;

      // If token refresh is already in progress, queue this request
      if (isRefreshing) {
        return new Promise<string>((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers = originalRequest.headers || {};
            originalRequest.headers["Authorization"] = `Bearer ${token}`;
            return axiosInstance(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      // Set refreshing flag
      isRefreshing = true;

      try {
        // Get user data with refresh token
        const userData = localStorage.getItem("user");
        if (!userData) {
          throw new Error("No user data found");
        }

        const user = JSON.parse(userData);
        const refreshTokenValue = user.refresh_token;

        if (!refreshTokenValue) {
          throw new Error("No refresh token found");
        }

        const clientId = import.meta.env.VITE_CLIENT_ID;

        if (!clientId) {
          throw new Error("Client ID not available, cannot refresh token");
        }

        //console.log('Attempting to refresh token due to 401 error');

        // Attempt to refresh the token
        const response = await refreshToken(refreshTokenValue, clientId);

        // Update tokens in user state
        const updatedUser = {
          ...user,
          access_token: response.access_token,
          refresh_token: response.refresh_token,
        };

        // Update localStorage
        localStorage.setItem("token", response.access_token);

        // Update Redux store
        store.dispatch(setUser(updatedUser));

        // Update token cache
        cachedToken = response.access_token;
        cacheTimestamp = Date.now();

        // Update auth header for the original request
        originalRequest.headers = originalRequest.headers || {};
        originalRequest.headers[
          "Authorization"
        ] = `Bearer ${response.access_token}`;

        // Process any queued requests
        processQueue(null, response.access_token);

        // Reset refreshing flag
        isRefreshing = false;

        //console.log('Token refresh successful, retrying original request');

        // Retry the original request
        return axiosInstance(originalRequest);
      } catch (refreshError) {
        // If refresh fails, clear user data and redirect to login
        //console.log('Token refresh failed. Logging out...', refreshError);

        // Process queued requests with error
        processQueue(refreshError as Error, null);

        // Avoid multiple redirects
        if (window.location.pathname === "/login") {
          // Reset refreshing flag
          isRefreshing = false;
          return Promise.reject(refreshError);
        }

        // Clear all local storage
        localStorage.clear();

        // Clear token cache
        clearTokenCache();

        // Dispatch logout action
        store.dispatch(logout());

        // Reset refreshing flag
        isRefreshing = false;

        // Use direct page reload instead of setTimeout
        window.history.replaceState(null, "", "/login");
        window.location.reload();

        return Promise.reject(refreshError);
      }
    }

    // For other errors, just reject the promise
    return Promise.reject(error);
  }
);

export default axiosInstance;
