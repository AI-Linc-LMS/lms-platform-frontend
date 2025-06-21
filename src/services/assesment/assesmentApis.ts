import axiosInstance from "../axiosInstance";

interface ApiError {
  response?: { 
    data?: { detail?: string }; 
    status?: number 
  };
  message: string;
}

export const getInstructions = async (clientId: number, assessmentId: string) => {
  try {
    const res = await axiosInstance.get(
      `/assessment/api/client/${clientId}/assessment-details/${assessmentId}/`
    );
    return res.data;
  } catch (error) {
    if (error instanceof Error) {
      // AxiosError type guard
      const axiosError = error as ApiError;
      console.error("Failed to fetch all courses:", error);
      console.error("Error details:", {
        message: axiosError.message,
        response: axiosError.response?.data,
        status: axiosError.response?.status,
      });

      // You can throw a custom error if you want
      throw new Error(
        (axiosError.response?.data?.detail as string) ||
          axiosError.message ||
          "Failed to fetch all courses"
      );
    } else {
      throw new Error("An unknown error occurred");
    }
  }
};

export const startAssessment = async (
  clientId: number,
  assessmentId: string,
  phoneNumber?: string
) => {
  try {
    const res = await axiosInstance.get(
      `assessment/api/client/${clientId}/start-assessment/${assessmentId}/?phone_number=${phoneNumber ?? ""}`
    );
    return res.data;
  } catch (error) {
    if (error instanceof Error) {
      // AxiosError type guard
      const axiosError = error as ApiError;
      console.error("Failed to start assessment:", error);
      console.error("Error details:", {
        message: axiosError.message,
        response: axiosError.response?.data,
        status: axiosError.response?.status,
      });

      // You can throw a custom error if you want
      throw new Error(
        (axiosError.response?.data?.detail as string) ||
          axiosError.message ||
          "Failed to start assessment"
      );
    } else {
      throw new Error("An unknown error occurred");
    }
  }
};

export const submitFinalAssessment = async (
  clientId: number,
  assessmentId: string,
  userAnswers: QuizSectionResponse
) => {
  try {
    const res = await axiosInstance.put(
      `/assessment/api/client/${clientId}/assessment-submission/${assessmentId}/final/`,
      {
        response_sheet: userAnswers,
      }
    );
    return res.data;
  } catch (error) {
    if (error instanceof Error) {
      // AxiosError type guard
      const axiosError = error as ApiError;
      console.error("Failed to submit final assessment:", error);
      console.error("Error details:", {
        message: axiosError.message,
        response: axiosError.response?.data,
        status: axiosError.response?.status,
      });

      // You can throw a custom error if you want
      throw new Error(
        (axiosError.response?.data?.detail as string) ||
          axiosError.message ||
          "Failed to submit final assessment"
      );
    } else {
      throw new Error("An unknown error occurred");
    }
  }
};

export const updateAfterEachQuestion = async (
  clientId: number,
  assessmentId: string,
  userAnswers: QuizSectionResponse
) => {
  console.log("userAnswers", userAnswers);
  try {
    const res = await axiosInstance.post(
      `/assessment/api/client/${clientId}/assessment-submission/${assessmentId}/`,
      {
        response_sheet: userAnswers,
      }
    );
    return res.data;
  } catch (error) {
    if (error instanceof Error) {
      // AxiosError type guard
      const axiosError = error as ApiError;
      console.error("Failed to update after each question:", error);
      console.error("Error details:", {
        message: axiosError.message,
        response: axiosError.response?.data,
        status: axiosError.response?.status,
      });

      // You can throw a custom error if you want
      throw new Error(
        (axiosError.response?.data?.detail as string) ||
          axiosError.message ||
          "Failed to update after each question"
      );
    } else {
      throw new Error("An unknown error occurred");
    }
  }
};

export const getAssessmentStatus = async (
  clientId: number,
  assessmentId: string
) => {
  try {
    const res = await axiosInstance.get(
      `assessment/api/client/${clientId}/scholarship-assessment-status/${assessmentId}/`
    );
    return res.data;
  } catch (error) {
    if (error instanceof Error) {
      // AxiosError type guard
      const axiosError = error as ApiError;
      console.error("Failed to get assessment status:", error);
      console.error("Error details:", {
        message: axiosError.message,
        response: axiosError.response?.data,
        status: axiosError.response?.status,
      });

      // You can throw a custom error if you want
      throw new Error(
        (axiosError.response?.data?.detail as string) ||
          axiosError.message ||
          "Failed to get assessment status"
      );
    } else {
      throw new Error("An unknown error occurred");
    }
  }
};

export const redeemScholarship = async (
  clientId: number,
  assessmentId: string
) => {
  try {
    const res = await axiosInstance.post(
      `/assessment/api/client/${clientId}/redeem-scholarship/${assessmentId}/`
    );
    return res.data;
  } catch (error) {
    if (error instanceof Error) {
      // AxiosError type guard
      const axiosError = error as ApiError;
      console.error("Failed to redeem scholarship:", error);
      console.error("Error details:", {
        message: axiosError.message,
        response: axiosError.response?.data,
        status: axiosError.response?.status,
      });
    }
  }
};
