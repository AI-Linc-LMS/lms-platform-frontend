import axios from 'axios';
import axiosInstance from './axiosInstance';

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

export interface RefreshTokenResponse {
  access: string;
}

export const login = async (credentials: LoginCredentials): Promise<LoginResponse> => {
  try {
    const response = await axiosInstance.post('/accounts/user/login/', credentials);
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
    const response = await axiosInstance.post(
      '/accounts/user/login/google/',
      { token: googleToken }
    );

    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(error.response?.data?.message || 'Google login failed');
    }
    throw error;
  }
};

export const refreshToken = async (refresh_token: string): Promise<string> => {
  try {
    // Create a separate axios instance to avoid the interceptors
    const response = await axios.post(
      'https://be-app.ailinc.com/accounts/user/token/refresh/',
      { refresh: refresh_token },
      {
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
    return response.data.access;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(error.response?.data?.message || 'Token refresh failed');
    }
    throw error;
  }
};

/**
 * Manually refresh the access token and update localStorage
 * Call this function when you need to manually refresh a token
 * @returns The new access token or null if refresh failed
 */
export const manualTokenRefresh = async (): Promise<string | null> => {
  try {
    console.log('Manually refreshing token...');
    
    // Get refresh token (try both storage methods)
    let refreshTokenValue = localStorage.getItem('refresh_token');
    
    if (!refreshTokenValue) {
      const user = localStorage.getItem('user');
      if (user) {
        try {
          refreshTokenValue = JSON.parse(user).refresh_token;
        } catch {
          refreshTokenValue = null;
        }
      }
    }
    
    if (!refreshTokenValue) {
      console.error('No refresh token found for manual refresh');
      return null;
    }
    
    // Get new access token
    const newAccessToken = await refreshToken(refreshTokenValue);
    
    // Update tokens in localStorage
    localStorage.setItem('token', newAccessToken);
    
    // Update token in user object if it exists
    const user = localStorage.getItem('user');
    if (user) {
      try {
        const userData = JSON.parse(user);
        userData.access_token = newAccessToken;
        localStorage.setItem('user', JSON.stringify(userData));
      } catch (e) {
        console.error('Failed to update user object with new token', e);
      }
    }
    
    console.log('Manual token refresh successful');
    return newAccessToken;
  } catch (error) {
    console.error('Manual token refresh failed:', error);
    return null;
  }
};
