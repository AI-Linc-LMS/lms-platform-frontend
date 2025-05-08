import axios from 'axios';
import { store } from '../redux/store';
import { logout } from '../redux/slices/authSlice';

export interface LoginCredentials {
  email: string;
 password: string;
}

export interface UserData {
  name: string;
  role: string;
  id: string;
  email: string;
  full_name: string;
  username: string;
}

export interface LoginResponse {
  access_token: string;
  refresh_token: string;
  user: UserData;
}

const axiosAuthInstance = axios.create({
  baseURL: 'https://be-app.ailinc.com/', 
  headers: {
    'Content-Type': 'application/json', 
  },
});

// Add a response interceptor to handle token expiration
axiosAuthInstance.interceptors.response.use(
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

export const login = async (credentials: LoginCredentials, clientId: number): Promise<LoginResponse> => {
  try {
    const response = await axiosAuthInstance.post(`/accounts/clients/${clientId}/user/login/`, credentials);
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(error.response?.data?.message || 'Login failed');
    }
    throw error;
  }
};

export const googleLogin = async (googleToken: string) => {
  try {
    const response = await axiosAuthInstance.post(
      '/accounts/user/login/google/',
      { token: googleToken }
    );

    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      // Log detailed error information for debugging
      console.error('Google login API error:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message
      });
      
      // For 500 errors, throw a more specific error
      if (error.response?.status === 500) {
        throw new Error('Server error with this Google account. Please try another account or contact support.');
      }
      
      // For other errors, use the server's error message or a default
      throw new Error(error.response?.data?.message || error.response?.data?.detail || 'Google login failed');
    }
    throw error;
  }
};
