import axiosInstance from "./axiosInstance";

interface ApiError {
  response?: {
    data?: { detail?: string };
    status?: number;
  };
  message: string;
}

export const getUser = async (clientId: number) => {
  try {
    const response = await axiosInstance.get(
      `/accounts/clients/${clientId}/user-profile/`
    );
    return response.data;
  } catch (error) {
    if (error instanceof Error) {
      // AxiosError type guard
      const axiosError = error as ApiError;
      console.error("Failed to fetch user:", error);
      console.error("Error details:", {
        message: axiosError.message,
        response: axiosError.response?.data,
        status: axiosError.response?.status,
      });

      // You can throw a custom error if you want
      throw new Error(
        (axiosError.response?.data?.detail as string) ||
          axiosError.message ||
          "Failed to fetch user"
      );
    } else {
      throw new Error("An unknown error occurred");
    }
  }
};

export const updateUser = async (clientId: number, userData: Record<string, unknown>) => {
  try {
    const response = await axiosInstance.post(
      `/accounts/clients/${clientId}/user-profile/`,
      userData
    );
    return response.data;
  } catch (error) {
    if (error instanceof Error) {
      // AxiosError type guard
      const axiosError = error as ApiError;
      console.error("Failed to update user:", error);
      console.error("Error details:", {
        message: axiosError.message,
        response: axiosError.response?.data,
        status: axiosError.response?.status,
      });

      // You can throw a custom error if you want
      throw new Error(
        (axiosError.response?.data?.detail as string) ||
          axiosError.message ||
          "Failed to update user"
      );
    } else {
      throw new Error("An unknown error occurred");
    }
  }
};
