import axios from 'axios';

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


export const login = async (credentials: LoginCredentials): Promise<LoginResponse> => {
  try {
    const response = await axiosAuthInstance.post('/accounts/user/login/', credentials);
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
      throw new Error(error.response?.data?.message || 'Google login failed');
    }
    throw error;
  }
};
