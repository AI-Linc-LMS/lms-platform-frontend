import { QuizSectionResponse } from "../../features/learn/hooks/useAssessment";
import axiosInstance from "../axiosInstance";

interface ApiError {
  response?: {
    data?: { detail?: string };
    status?: number;
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
  number_of_questions: number;
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
  metadata?: Record<string, any>;
}

export const getInstructions = async (
  clientId: number,
  assessmentId: string
): Promise<AssessmentDetails> => {
  try {
    const res = await axiosInstance.get(
      `/assessment/api/client/${clientId}/assessment-details/${assessmentId}/`
    );
    return res.data;
  } catch (error) {
    if (error instanceof Error) {
      // AxiosError type guard
      const axiosError = error as ApiError;

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
export const getAllAssessments = async (
  clientId: number
): Promise<AssessmentListItem[]> => {
  try {
    const res = await axiosInstance.get(
      `/assessment/api/client/${clientId}/active-assessments/`
    );
    return res.data;
  } catch {
    // If the API endpoint doesn't exist, return a static list of known assessments

    // Fallback list of known assessments - this can be configured
    const fallbackAssessments: AssessmentListItem[] = [
      {
        id: 1,
        title: "AI-Linc Scholarship Test",
        slug: "ai-linc-scholarship-test",
        description:
          "Complete this assessment to showcase your AI and full-stack development skills and qualify for our scholarship program.",
        duration_minutes: 30,
        is_paid: true,
        price: "00.00",
        is_active: true,
      },
      {
        id: 2,
        title: "AI-Linc Scholarship Test II",
        slug: "ai-linc-scholarship-test-2",
        description:
          "Advanced assessment to evaluate your technical expertise and problem-solving abilities in AI and development.",
        duration_minutes: 30,
        is_paid: true,
        price: "49.00",
        is_active: true,
      },
    ];

    return fallbackAssessments;
  }
};

export const startAssessment = async (
  clientId: number,
  assessmentId: string,
  phoneNumber?: string,
  referralCode?: string
) => {
  try {
    // Build query params correctly (single "?" followed by "&" separators)
    const params = new URLSearchParams();
    if (phoneNumber) {
      params.append("phone_number", phoneNumber);
    }
    if (referralCode) {
      params.append("ref", referralCode);
    }

    const queryString = params.toString();

    const res = await axiosInstance.get(
      `assessment/api/client/${clientId}/start-assessment/${assessmentId}/${
        queryString ? "?" + queryString : ""
      }`
    );
    return res.data;
  } catch (error) {
    if (error instanceof Error) {
      // AxiosError type guard
      const axiosError = error as ApiError;

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
  referralCode?: string,
  metadata?: Record<string, any>
) => {
  try {
    // Include metadata inside response_sheet if provided
    const responseSheet = metadata ? { ...userAnswers, metadata } : userAnswers;

    const payload: AssessmentSubmissionPayload = {
      response_sheet: responseSheet,
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
      throw new Error(
        (axiosError.response?.data?.detail as string) ||
          axiosError.message ||
          "Failed to redeem scholarship"
      );
    } else {
      throw new Error("An unknown error occurred");
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
  } catch {
    throw new Error("An unknown error occurred");
  }
};
