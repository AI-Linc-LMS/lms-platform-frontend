import { QuizSectionResponse } from "../../features/learn/hooks/useAssessment";
import axiosInstance from "../axiosInstance";

interface ApiError {
  response?: { 
    data?: { detail?: string }; 
    status?: number 
  };
  message: string;
}

// Interface for assessment details from backend
export interface AssessmentDetails {
  id: number;
  title: string;
  slug: string;
  instructions: string;
  description: string;
  duration_minutes: number;
  is_paid: boolean;
  price: string;
  is_active: boolean;
  created_at: string;
  status: "not_started" | "in_progress" | "submitted";
  txn_status?: "paid" | "pending" | "failed" | null;
}

// Interface for assessment list item
export interface AssessmentListItem {
  id: number;
  title: string;
  slug: string;
  description: string;
  duration_minutes: number;
  is_paid: boolean;
  price: string;
  is_active: boolean;
}

// Interface for assessment submission payload
interface AssessmentSubmissionPayload {
  response_sheet: QuizSectionResponse;
  referral_code?: string;
}

export const getInstructions = async (clientId: number, assessmentId: string): Promise<AssessmentDetails> => {
  try {
    const res = await axiosInstance.get(
      `/assessment/api/client/${clientId}/assessment-details/${assessmentId}/`
    );
    return res.data;
  } catch (error) {
    if (error instanceof Error) {
      // AxiosError type guard
      const axiosError = error as ApiError;
      console.error("Failed to fetch assessment details:", error);
      console.error("Error details:", {
        message: axiosError.message,
        response: axiosError.response?.data,
        status: axiosError.response?.status,
      });

      // You can throw a custom error if you want
      throw new Error(
        (axiosError.response?.data?.detail as string) ||
          axiosError.message ||
          "Failed to fetch assessment details"
      );
    } else {
      throw new Error("An unknown error occurred");
    }
  }
};

// New API to get all available assessments
export const getAllAssessments = async (clientId: number): Promise<AssessmentListItem[]> => {
  try {
    const res = await axiosInstance.get(
      `/assessment/api/client/${clientId}/active-assessments/`
    );
    return res.data;
  } catch (error) {
    // If the API endpoint doesn't exist, return a static list of known assessments
    console.warn("Assessments list API not available, using fallback list:", error);
    
    // Fallback list of known assessments - this can be configured
    const fallbackAssessments: AssessmentListItem[] = [
      {
        id: 1,
        title: "AI-Linc Scholarship Test",
        slug: "ai-linc-scholarship-test",
        description: "Complete this assessment to showcase your AI and full-stack development skills and qualify for our scholarship program.",
        duration_minutes: 30,
        is_paid: true,
        price: "00.00",
        is_active: true,
      },
      {
        id: 2,
        title: "AI-Linc Scholarship Test II",
        slug: "ai-linc-scholarship-test-2",
        description: "Advanced assessment to evaluate your technical expertise and problem-solving abilities in AI and development.",
        duration_minutes: 30,
        is_paid: true,
        price: "49.00",
        is_active: true,
      }
    ];
    
    return fallbackAssessments;
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
  userAnswers: QuizSectionResponse,
  referralCode?: string
) => {
  try {
    const payload: AssessmentSubmissionPayload = {
      response_sheet: userAnswers,
    };

    // Add referral code if provided
    if (referralCode) {
      payload.referral_code = referralCode;
    }

    const res = await axiosInstance.put(
      `/assessment/api/client/${clientId}/assessment-submission/${assessmentId}/final/`,
      payload
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
  userAnswers: QuizSectionResponse,
  referralCode?: string
) => {
  console.log("userAnswers", userAnswers);
  try {
    const payload: AssessmentSubmissionPayload = {
      response_sheet: userAnswers,
    };

    // Add referral code if provided
    if (referralCode) {
      payload.referral_code = referralCode;
    }

    const res = await axiosInstance.post(
      `/assessment/api/client/${clientId}/assessment-submission/${assessmentId}/`,
      payload
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
    const res = await axiosInstance.get(
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

export const getRoadmapPaymentStatus = async (
  clientId: number,
  programId: string
) => {
  try {
    const res = await axiosInstance.get(
      `/assessment/api/client/${clientId}/payment-status/${programId}/`
    );
    return res.data;
  } catch (error) {
    if (error instanceof Error) {
      // AxiosError type guard
      const axiosError = error as ApiError;
      console.error("Failed to get roadmap payment status:", error);
      console.error("Error details:", {
        message: axiosError.message,
        response: axiosError.response?.data,
        status: axiosError.response?.status,
      });
    }
  }
};
