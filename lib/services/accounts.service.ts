import apiClient from "./api";
import { config } from "../config";
import Cookies from "js-cookie";

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface SignupData {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  password: string;
  confirm_password: string;
}

export interface AuthResponse {
  access_token: string;
  refresh_token: string;
  user: {
    id?: number;
    email: string;
    full_name?: string;
    username?: string;
    user_name?: string;
    first_name?: string;
    last_name?: string;
    role?: string;
    profile_picture?: string;
    profile_pic_url?: string;
    phone_number?: string;
  };
}

export interface UserProfile {
  id: number;
  user_name: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  profile_picture: string;
  role: string;
}

export const accountsService = {
  // Login
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    const response = await apiClient.post<AuthResponse>(
      `/accounts/clients/${config.clientId}/user/login/`,
      credentials
    );

    // Store tokens in cookies
    Cookies.set("access_token", response.data.access_token, { expires: 7 });
    Cookies.set("refresh_token", response.data.refresh_token, { expires: 30 });

    // Store role in cookies if available
    if (response.data.user?.role) {
      Cookies.set("user_role", response.data.user.role, { expires: 30 });
    }

    return response.data;
  },

  // Google Login
  googleLogin: async (token: string): Promise<AuthResponse> => {
    const response = await apiClient.post<AuthResponse>(
      `/accounts/clients/${config.clientId}/user/login/google/`,
      { token }
    );

    Cookies.set("access_token", response.data.access_token, { expires: 7 });
    Cookies.set("refresh_token", response.data.refresh_token, { expires: 30 });

    // Store role in cookies if available
    if (response.data.user?.role) {
      Cookies.set("user_role", response.data.user.role, { expires: 30 });
    }

    return response.data;
  },

  // Signup
  signup: async (data: SignupData): Promise<{ detail: string }> => {
    const response = await apiClient.post<{ detail: string }>(
      `/accounts/clients/${config.clientId}/user/signup/`,
      data
    );
    return response.data;
  },

  // Verify Email
  verifyEmail: async (
    email: string,
    otp: string
  ): Promise<{ detail: string }> => {
    const response = await apiClient.post<{ detail: string }>(
      `/accounts/clients/${config.clientId}/user/verify-email/`,
      { email, otp }
    );
    return response.data;
  },

  // Resend Verification Email
  resendVerificationEmail: async (
    email: string
  ): Promise<{ detail: string }> => {
    const response = await apiClient.post<{ detail: string }>(
      `/accounts/clients/${config.clientId}/user/resend-verification-email/`,
      { email }
    );
    return response.data;
  },

  // Forgot Password
  forgotPassword: async (email: string): Promise<{ detail: string }> => {
    const response = await apiClient.post<{ detail: string }>(
      `/accounts/clients/${config.clientId}/user/forgot-password/`,
      { email }
    );
    return response.data;
  },

  // Get User Profile
  getUserProfile: async (): Promise<UserProfile> => {
    const response = await apiClient.get<UserProfile>(
      `/accounts/clients/${config.clientId}/user-profile/`
    );

    // Update role in cookies if available from API response
    if (response.data.role) {
      Cookies.set("user_role", response.data.role, { expires: 30 });
    }

    return response.data;
  },

  // Update User Profile
  updateUserProfile: async (
    data: Partial<UserProfile>
  ): Promise<UserProfile> => {
    const response = await apiClient.put<UserProfile>(
      `/accounts/clients/${config.clientId}/user-profile/`,
      data
    );
    return response.data;
  },

  // Logout
  logout: async (): Promise<{ detail: string }> => {
    const refreshToken = Cookies.get("refresh_token");
    if (refreshToken) {
      await apiClient.post(
        `/accounts/clients/${config.clientId}/user/logout/`,
        { refresh: refreshToken }
      );
    }

    // Clear cookies
    Cookies.remove("access_token");
    Cookies.remove("refresh_token");
    Cookies.remove("user_role");

    return { detail: "Successfully logged out" };
  },
};
