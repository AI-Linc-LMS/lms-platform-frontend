import { CreateOrderResponse } from "../../features/learn/components/assessment/PaymentModal";
import axiosInstance from "../axiosInstance";


export interface VerifyPaymentRequest {
  order_id: string;
  payment_id: string;
  signature: string;
}


interface ApiError {
  response?: {
    data?: { detail?: string };
    status?: number;
  };
  message: string;
}

export const createOrder = async (
  clientId: number,
  amount: number
): Promise<CreateOrderResponse> => {
  try {
    const response = await axiosInstance.post(
      `/payment-gateway/api/clients/${clientId}/create-order/`,{
        amount: amount,
      }
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
  clientId: number,
  paymentData: VerifyPaymentRequest
) => {
  try {

    // Ensure all required fields are present
    const requestPayload = {
      order_id: paymentData.order_id,
      payment_id: paymentData.payment_id,
      signature: paymentData.signature,
    };

    // Alternative: Try with explicit JSON stringification
    const requestBody = JSON.stringify(requestPayload);

    console.log("=== PAYMENT VERIFICATION DEBUG ===");
    console.log("Original paymentData:", paymentData);
    console.log("Cleaned requestPayload:", requestPayload);
    console.log("Stringified requestBody:", requestBody);
    console.log("Field validation:", {
      "order_id exists": !!requestPayload.order_id,
      "payment_id exists": !!requestPayload.payment_id,
      "signature exists": !!requestPayload.signature,
      "order_id value": requestPayload.order_id,
      "payment_id value": requestPayload.payment_id,
      "signature value": requestPayload.signature
        ? `${requestPayload.signature.substring(0, 20)}...`
        : "MISSING",
    });

    console.log("Verify Payment API Call:", {
      url: `/payment-gateway/api/clients/${clientId}/verify-payment/`,
      payload: requestPayload,
      clientId: clientId,
    });

    const response = await axiosInstance.post(
      `/payment-gateway/api/clients/${clientId}/verify-payment/`,
      requestPayload,
      {
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      }
    );

    console.log("Verify Payment API Response:", response);
    return response;
  } catch (error) {
    if (error instanceof Error) {
      const axiosError = error as ApiError;
      console.error("=== PAYMENT VERIFICATION ERROR ===");
      console.error("Failed to verify payment:", error);
      console.error("Error details:", {
        message: axiosError.message,
        response: axiosError.response?.data,
        status: axiosError.response?.status,
        requestData: paymentData,
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
