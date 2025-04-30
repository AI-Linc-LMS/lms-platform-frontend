import axios from 'axios';
import { refreshToken } from './authApis';

const axiosInstance = axios.create({
  baseURL: 'https://be-app.ailinc.com/', 
  headers: {
    'Content-Type': 'application/json', 
  },
});

// Add a request interceptor to include the access token if available
axiosInstance.interceptors.request.use(
  (config) => {
    // Try to get token from user object first
    const user = localStorage.getItem('user');
    let token = null;
    
    if (user) {
      try {
        token = JSON.parse(user).access_token;
      } catch {
        token = null;
      }
    }
    
    // If token not found in user object, try getting the standalone token
    if (!token) {
      token = localStorage.getItem('token');
    }

    // For debugging
    console.log('Using token:', token ? 'Token found' : 'No token found');

    if (token) {
      // Add Authorization header if token exists
      config.headers['Authorization'] = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// Add a response interceptor to handle token refresh
let isRefreshing = false;
let failedQueue: { resolve: (value?: unknown) => void; reject: (reason?: unknown) => void }[] = [];

const processQueue = (error: Error | null, token: string | null = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  
  failedQueue = [];
};

axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    // For debugging
    console.error('API Error:', error.response?.status, error.response?.data);
    
    const originalRequest = error.config;

    // If the error status is 401 and the request hasn't been retried yet
    if (error.response?.status === 401 && 
        error.response?.data?.code === 'token_not_valid' && 
        !originalRequest._retry) {
      
      console.log('Token expired, attempting refresh...');
      
      if (isRefreshing) {
        // If token refresh is already in progress, add this request to the queue
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then(token => {
            originalRequest.headers['Authorization'] = `Bearer ${token}`;
            return axiosInstance(originalRequest);
          })
          .catch(err => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // Try to get refresh token from user object first
        const user = localStorage.getItem('user');
        let refreshTokenValue = null;

        if (user) {
          try {
            refreshTokenValue = JSON.parse(user).refresh_token;
            console.log('Found refresh token in user object');
          } catch {
            refreshTokenValue = null;
          }
        }
        
        // If no refresh token in user object, try the manual implementation
        if (!refreshTokenValue) {
          refreshTokenValue = localStorage.getItem('refresh_token');
          console.log('Using standalone refresh token:', refreshTokenValue ? 'Found' : 'Not found');
        }

        if (!refreshTokenValue) {
          // No refresh token available, redirect to login
          console.error('No refresh token available, redirecting to login');
          window.location.href = '/login';
          return Promise.reject(error);
        }

        // Get new access token
        console.log('Requesting new access token with refresh token');
        const newAccessToken = await refreshToken(refreshTokenValue);
        console.log('Successfully received new access token');
        
        // Update tokens in localStorage
        if (user) {
          const userData = JSON.parse(user);
          userData.access_token = newAccessToken;
          localStorage.setItem('user', JSON.stringify(userData));
        }
        localStorage.setItem('token', newAccessToken);

        // Update Authorization header for the original request
        originalRequest.headers['Authorization'] = `Bearer ${newAccessToken}`;
        
        // Process any requests that were queued during the token refresh
        processQueue(null, newAccessToken);
        
        console.log('Retrying original request with new token');
        // Return the original request with the new token
        return axiosInstance(originalRequest);
      } catch (refreshError) {
        // If token refresh fails, redirect to login
        console.error('Token refresh failed:', refreshError);
        processQueue(refreshError as Error, null);
        
        // Clear user data and redirect to login
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        localStorage.removeItem('refresh_token');
        window.location.href = '/login';
        
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;
