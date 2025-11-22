import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { store } from '../redux/store';
import { logout, setUser } from '../redux/slices/userSlice';
import { refreshToken } from './authApis';

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

// Function to decode JWT and get expiration time
const getTokenExpirationTime = (token: string): number => {
  try {
    // Split the token and get the payload part (second part)
    const base64Url = token.split('.')[1];
    if (!base64Url) return 0;
    
    // Replace characters for valid base64 and decode
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );

    // Parse the payload and get the exp field (in seconds)
    const { exp } = JSON.parse(jsonPayload);
    
    // Convert to milliseconds and return
    return exp ? exp * 1000 : 0;
  } catch {
    //console.error('Error decoding token:', error);
    return 0;
  }
};

// Function to check if token is expired
const isTokenExpired = (token: string): boolean => {
  const expirationTime = getTokenExpirationTime(token);
  
  // If we couldn't decode the token, assume it's valid (server will reject if it's not)
  if (!expirationTime) return false;
  
  // Check if current time is past expiration
  return Date.now() >= expirationTime;
};

// Function to check if token is about to expire (within 1 minute)
const isTokenAboutToExpire = (token: string): boolean => {
  const expirationTime = getTokenExpirationTime(token);
  
  // If we couldn't decode the token, assume it's valid
  if (!expirationTime) return false;
  
  // Check if token will expire within the next minute
  const timeUntilExpiration = expirationTime - Date.now();
  return timeUntilExpiration < 60 * 1000 && timeUntilExpiration > 0;
};

// Function to process the queue of failed requests
const processQueue = (error: Error | null, token: string | null = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token as string);
    }
  });
  
  failedQueue = [];
};

const axiosInstance = axios.create({
  baseURL: 'https://be-app.ailinc.com/', 
  headers: {
    'Content-Type': 'application/json', 
  },
});

// Add a request interceptor to include the access token if available
axiosInstance.interceptors.request.use(
  (config) => {
    const user = localStorage.getItem('user');
    let token = null;
    if (user) {
      try {
        token = JSON.parse(user).access_token;
        
        // Check token status before sending request
        if (token) {
          if (isTokenExpired(token)) {
            // Token is expired, attempt refresh before sending request
            //console.log('Token expired, request will be handled by response interceptor');
          } else if (isTokenAboutToExpire(token)) {
            // Token will expire soon, log warning but continue with request
            //console.log('Token is about to expire, consider refreshing soon');
          }
        }
      } catch {
        //console.error('Error parsing user data', error);
        token = null;
      }
    }

    if (token) {
      // Add Authorization header if token exists
      config.headers['Authorization'] = `Bearer ${token}`;
    }

    // Only add cache-busting headers if service worker is active (to prevent caching)
    // This avoids unnecessary headers when service worker is disabled
    if (
      "serviceWorker" in navigator &&
      navigator.serviceWorker.controller &&
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
    if (error.response && error.response.status === 401 && !originalRequest._retry) {
      // Mark this request as already retried to prevent infinite loops
      originalRequest._retry = true;
      
      // If token refresh is already in progress, queue this request
      if (isRefreshing) {
        return new Promise<string>((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then(token => {
            originalRequest.headers = originalRequest.headers || {};
            originalRequest.headers['Authorization'] = `Bearer ${token}`;
            return axiosInstance(originalRequest);
          })
          .catch(err => Promise.reject(err));
      }
      
      // Set refreshing flag
      isRefreshing = true;
      
      try {
        // Get user data with refresh token
        const userData = localStorage.getItem('user');
        if (!userData) {
          throw new Error('No user data found');
        }
        
        const user = JSON.parse(userData);
        const refreshTokenValue = user.refresh_token;
        
        if (!refreshTokenValue) {
          throw new Error('No refresh token found');
        }
        
        const clientId = import.meta.env.VITE_CLIENT_ID;
        
        if (!clientId) {
          throw new Error('Client ID not available, cannot refresh token');
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
        localStorage.setItem('token', response.access_token);
        
        // Update Redux store
        store.dispatch(setUser(updatedUser));
        
        // Update auth header for the original request
        originalRequest.headers = originalRequest.headers || {};
        originalRequest.headers['Authorization'] = `Bearer ${response.access_token}`;
        
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
        if (window.location.pathname === '/login') {
          // Reset refreshing flag
          isRefreshing = false;
          return Promise.reject(refreshError);
        }
        
        // Clear all local storage
        localStorage.clear();
        
        // Dispatch logout action
        store.dispatch(logout());
        
        // Reset refreshing flag
        isRefreshing = false;
        
        // Use direct page reload instead of setTimeout
        window.history.replaceState(null, '', '/login');
        window.location.reload();
        
        return Promise.reject(refreshError);
      }
    }
    
    // For other errors, just reject the promise
    return Promise.reject(error);
  }
);

export default axiosInstance;
