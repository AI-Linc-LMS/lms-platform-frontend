import axios from 'axios';

const API_BASE_URL = 'https://be-app.ailinc.com/';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface UserData {
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

export interface GoogleLoginResponse extends LoginResponse {
  // Add any additional Google-specific response fields if needed
}

const authAPI = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Enable sending cookies for CSRF
});

// Function to get CSRF token from cookies
const getCsrfToken = () => {
  const name = 'csrftoken';
  let cookieValue = null;
  if (document.cookie && document.cookie !== '') {
    const cookies = document.cookie.split(';');
    for (let i = 0; i < cookies.length; i++) {
      const cookie = cookies[i].trim();
      if (cookie.substring(0, name.length + 1) === (name + '=')) {
        cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
        break;
      }
    }
  }
  return cookieValue;
};

export const login = async (credentials: LoginCredentials): Promise<LoginResponse> => {
  try {
    const response = await authAPI.post('/accounts/user/login/', credentials);
    console.log('Login response:', response.data); 
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(error.response?.data?.message || 'Login failed');
    }
    throw error;
  }
};

export const googleLogin = async (googleToken: string): Promise<GoogleLoginResponse> => {
  try {
    const csrfToken = getCsrfToken();
    
    const response = await authAPI.post(
      '/accounts/user/login/google/',
      { token: googleToken },
      {
        headers: {
          'X-CSRFToken': csrfToken,
        },
      }
    );

    console.log('Google login response:', response.data);
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(error.response?.data?.message || 'Google login failed');
    }
    throw error;
  }
};
