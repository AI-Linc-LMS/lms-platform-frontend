import axios from "axios";
import { store } from "../redux/store";
import { logout } from "../redux/slices/userSlice";
import { SignupFormData } from "../features/auth/pages/Signup";

export interface LoginCredentials {
  email: string;
  password: string;
}


interface ApiError {
  response?: {
    data?: { detail?: string };
    status?: number;
  };
  message: string;
}


export interface UserData {
  profile_picture: string;
  phone_number: string;
  user: UserData;
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
  access_token: string;
  refresh_token: string;
}

const axiosAuthInstance = axios.create({
  baseURL: "https://be-app.ailinc.com/",
  headers: {
    "Content-Type": "application/json",
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
      console.log("Token expired or invalid. Logging out...");

      // Avoid multiple redirects
      if (window.location.pathname === "/login") {
        return Promise.reject(error);
      }

      // Clear all local storage
      localStorage.clear();

      // Dispatch logout action
      store.dispatch(logout());

      // Use direct page reload instead of setTimeout
      window.history.replaceState(null, "", "/login");
      window.location.reload();

      return Promise.reject(error);
    }

    return Promise.reject(error);
  }
);

export const login = async (
  credentials: LoginCredentials,
  clientId: number
): Promise<LoginResponse> => {
  try {
    const response = await axiosAuthInstance.post(
      `/accounts/clients/${clientId}/user/login/`,
      credentials
    );
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(error.response?.data?.message || "Login failed");
    }
    throw error;
  }
};

export const refreshToken = async (
  refresh_token: string,
  clientId: number
): Promise<RefreshTokenResponse> => {
  try {
    const response = await axiosAuthInstance.post(
      `/accounts/clients/${clientId}/user/refresh-token/`,
      {
        refresh_token,
      }
    );
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(error.response?.data?.message || "Token refresh failed");
    }
    throw error;
  }
};

export const googleLogin = async (googleToken: string, clientId: number) => {
  try {
    const response = await axiosAuthInstance.post(
      `/accounts/clients/${clientId}/user/login/google/`,
      { token: googleToken }
    );

    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      // Log detailed error information for debugging
      console.error("Google login API error:", {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message,
      });

      // For 500 errors, throw a more specific error
      if (error.response?.status === 500) {
        throw new Error(
          "Server error with this Google account. Please try another account or contact support."
        );
      }

      // For other errors, use the server's error message or a default
      throw new Error(
        error.response?.data?.message ||
          error.response?.data?.detail ||
          "Google login failed"
      );
    }
    throw error;
  }
};

export const signup = async (
  credentials: SignupFormData,
  clientId: number
) => {
  try {
    const response = await axiosAuthInstance.post(
      `/accounts/clients/${clientId}/user/signup/`,
      credentials
    );

    return response.data;
  } catch (error) {
    const axiosError = error as ApiError;
    throw new Error(axiosError?.response?.data?.detail || "Signup failed");
  }
};

export const resendOtp = async (email: string, clientId: number) => {
  try {
    const response = await axiosAuthInstance.post(
      `/accounts/clients/${clientId}/user/resend-verification-email/`,
      { email }
    );
    return response.data;
  } catch (error) {
    const axiosError = error as ApiError;
    throw new Error(axiosError?.response?.data?.detail || "Resend OTP failed");
  }
};

export const verifyOtp = async (otp: string, clientId: number, email: string) => {
  try {
    const response = await axiosAuthInstance.post(
      `/accounts/clients/${clientId}/user/verify-email/`,
      { otp, email }
    );
    return response.data;
    } catch (error) {
      const axiosError = error as ApiError;
      throw new Error(axiosError?.response?.data?.detail || "Verify OTP failed");
    }
};