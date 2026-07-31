import apiClient from "./api";
import { config } from "../config";

export enum PaymentType {
  COURSE = "COURSE",
  ADAPTIVE_COURSE = "ADAPTIVE_COURSE",
  ASSESSMENT = "ASSESSMENT",
}

export interface CreateOrderRequest {
  /**
   * WHAT is being bought — never how much it costs.
   *
   * `amount` and `currency` used to be here. The server derives both from the product and
   * ignores whatever the client sends, so the fields were inert; but a price-shaped field in a
   * payment request is an invitation to reintroduce client-authored pricing, which is exactly
   * the bug that once let any course be bought for a rupee.
   */
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
  /**
   * The learner's own payments. Abandoned checkouts older than a few hours are hidden unless
   * `include: "all"` — otherwise the page is dominated by them.
   */
  listMyTransactions: async (
    clientId: number,
    params: { page?: number; limit?: number; include?: "all" } = {},
  ): Promise<MyTransactionsResponse> => {
    const res = await apiClient.get<MyTransactionsResponse>(
      `/payment-gateway/api/clients/${clientId}/my-transactions/`,
      { params },
    );
    return res.data;
  },

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

/** One row of the learner's own purchase history. Mirrors MyTransactionSerializer exactly. */
export interface MyTransaction {
  id: number;
  payment_type: string;
  payment_type_display: string;
  type_id: string;
  product_title: string;
  amount: string;
  currency: string;
  status: string;
  status_display: string;
  created_at: string;
  settled_at: string | null;
  refunded_at: string | null;
  refunded_amount: string | null;
  /** active | partially_refunded | revoked | refund_processing | none */
  access_state: string;
  razorpay_payment_id: string | null;
  error_message: string | null;
}

export interface MyTransactionsResponse {
  count: number;
  page: number;
  page_size: number;
  results: MyTransaction[];
}
