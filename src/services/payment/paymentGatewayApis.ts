import axiosInstance from "../axiosInstance";

export interface CreateOrderRequest {
  amount: number;
  currency?: string;
  receipt?: string;
  notes?: Record<string, string>;
  assessment_id?: string;
  user_email?: string;
  scholarship_percentage?: number;
}

export interface CreateOrderResponse {
  id: string;
  entity: string;
  amount: number;
  amount_paid: number;
  amount_due: number;
  currency: string;
  receipt: string;
  offer_id?: string;
  status: string;
  attempts: number;
  notes: Record<string, string>;
  created_at: number;
}

export interface VerifyPaymentRequest {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

export interface VerifyPaymentResponse {
  success: boolean;
  message: string;
  payment_details?: Record<string, unknown>;
}

interface ApiError {
  response?: { 
    data?: { detail?: string }; 
    status?: number 
  };
  message: string;
}

export const createOrder = async (
  orderData: CreateOrderRequest
): Promise<CreateOrderResponse> => {
  try {
    // Get clientId from environment or use default
    const clientId = import.meta.env.VITE_CLIENT_ID || '1';
    const response = await axiosInstance.post(
      `/payment-gateway/api/clients/${clientId}/create-order/`,
      orderData
    );
    return response.data;
  } catch (error) {
    if (error instanceof Error) {
      const axiosError = error as ApiError;
      console.error("Failed to create order:", error);
      console.error("Error details:", {
        message: axiosError.message,
        response: axiosError.response?.data,
        status: axiosError.response?.status,
      });

      throw new Error(
        (axiosError.response?.data?.detail as string) ||
          axiosError.message ||
          "Failed to create order"
      );
    } else {
      throw new Error("An unknown error occurred");
    }
  }
};

export const verifyPayment = async (
  paymentData: VerifyPaymentRequest
): Promise<VerifyPaymentResponse> => {
  try {
    // Get clientId from environment or use default
    const clientId = import.meta.env.VITE_CLIENT_ID || '1';
    const response = await axiosInstance.post(
      `/payment-gateway/api/clients/${clientId}/verify-payment/`,
      paymentData
    );
    return response.data;
  } catch (error) {
    if (error instanceof Error) {
      const axiosError = error as ApiError;
      console.error("Failed to verify payment:", error);
      console.error("Error details:", {
        message: axiosError.message,
        response: axiosError.response?.data,
        status: axiosError.response?.status,
      });

      throw new Error(
        (axiosError.response?.data?.detail as string) ||
          axiosError.message ||
          "Failed to verify payment"
      );
    } else {
      throw new Error("An unknown error occurred");
    }
  }
}; 