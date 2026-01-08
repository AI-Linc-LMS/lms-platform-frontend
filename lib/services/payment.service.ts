import apiClient from "./api";
import { config } from "../config";

export enum PaymentType {
  COURSE = "COURSE",
  ASSESSMENT = "ASSESSMENT",
}

export interface CreateOrderRequest {
  amount: string;
  currency: string;
  type_id: string;
  payment_type: PaymentType;
  notes?: Record<string, any>;
}

export interface OrderResponse {
  order_id: string;
  amount: number;
  currency: string;
  key: string;
  name: string;
  description: string;
  prefill: {
    name: string;
    email: string;
    contact: string;
  };
}

export interface VerifyPaymentRequest {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

export interface VerifyPaymentResponse {
  transaction_id: string;
  status: string;
  amount: number;
  payment_id: string;
  order_id: string;
  message: string;
}

export const paymentService = {
  createOrder: async (clientId: number, data: CreateOrderRequest): Promise<OrderResponse> => {
    const endpoint = `/payment-gateway/api/clients/${clientId}/create-order/`;
    const response = await apiClient.post(endpoint, data);
    return response.data;
  },

  verifyPayment: async (clientId: number, data: VerifyPaymentRequest): Promise<VerifyPaymentResponse> => {
    const endpoint = `/payment-gateway/api/clients/${clientId}/verify-payment/`;
    const response = await apiClient.post(endpoint, data);
    return response.data;
  },
};







