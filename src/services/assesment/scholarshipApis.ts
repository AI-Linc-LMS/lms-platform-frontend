import axiosInstance from "../axiosInstance";

export interface ScholarshipRedemptionData {
  message: string;
  percentage_scholarship: number;
  score: number;
  maximum_marks: number;
  payable_amount: number;
  total_amount: number;
  txn_status?: string; // "VERIFIED" = scholarship calculated, "PAID" = course purchased
  stats?: {
    total_questions: number;
    attempted_questions: number;
    correct_answers: number;
    score: number;
    incorrect_answers: number;
  };
}

interface ApiError {
  response?: { 
    data?: { detail?: string }; 
    status?: number 
  };
  message: string;
}

export const getScholarshipRedemptionDetails = async (
  clientId: string,
  assessmentId: string
): Promise<ScholarshipRedemptionData> => {
  try {
    const response = await axiosInstance.get(
      `/assessment/api/client/${clientId}/redeem-scholarship/${assessmentId}/`
    );
    return response.data;
  } catch (error) {
    if (error instanceof Error) {
      const axiosError = error as ApiError;

      throw new Error(
        (axiosError.response?.data?.detail as string) ||
          axiosError.message ||
          "Failed to fetch scholarship redemption details"
      );
    } else {
      throw new Error("An unknown error occurred");
    }
  }
}; 