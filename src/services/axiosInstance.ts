import axios from 'axios';
import { store } from '../redux/store';
import { logout } from '../redux/slices/authSlice';

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
      } catch {
        token = null;
      }
    }

    if (token) {
      // Add Authorization header if token exists
      config.headers['Authorization'] = `Bearer ${token}`;
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
  (error) => {
    // Check if the error is due to an expired token (status 401)
    if (error.response && error.response.status === 401) {
      console.log('Token expired or invalid. Logging out...');
      
      // Clear user data from localStorage
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      
      // Dispatch logout action
      store.dispatch(logout());
      
      // Redirect to login page
      window.location.href = '/login';
    }
    
    return Promise.reject(error);
  }
);

export default axiosInstance;
