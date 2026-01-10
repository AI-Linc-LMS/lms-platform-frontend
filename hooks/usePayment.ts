"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth/auth-context";
import { useClientInfo } from "@/lib/contexts/ClientInfoContext";
import { config } from "@/lib/config";
import { 
  paymentService, 
  PaymentType, 
  VerifyPaymentRequest 
} from "@/lib/services/payment.service";
import { loadRazorpayScript } from "@/lib/utils/razorpay";
import { useRouter } from "next/navigation";

interface PaymentOptions {
  amount: string;
  currency: string;
  typeId: string;
  paymentType: PaymentType;
  description: string;
  onSuccess?: (response: any) => void;
  onError?: (error: any) => void;
  onDismiss?: () => void;
}

export const usePayment = () => {
  const { user } = useAuth();
  const { clientInfo } = useClientInfo();
  const [isProcessing, setIsProcessing] = useState(false);
  const router = useRouter();

  const handlePayment = async (options: PaymentOptions) => {
    try {
      setIsProcessing(true);
      const clientId = Number(config.clientId);

      if (!clientId) {
        throw new Error("Invalid client ID");
      }

      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        throw new Error("Razorpay SDK failed to load. Please check your connection.");
      }

      // 1. Create order
      const orderData = await paymentService.createOrder(clientId, {
        amount: options.amount,
        currency: options.currency || "INR",
        type_id: options.typeId,
        payment_type: options.paymentType,
        notes: {
          description: options.description,
          userId: user?.id,
        },
      });

      if (!orderData || !orderData.order_id || !orderData.key) {
        throw new Error("Failed to create payment order.");
      }

      // 2. Launch Razorpay
      const rzpOptions: any = {
        key: orderData.key,
        amount: orderData.amount, // backend might return amount in paise
        currency: orderData.currency || "INR",
        name: clientInfo?.name || "AI LINC",
        description: options.description,
        order_id: orderData.order_id,
        handler: async function (response: any) {
          try {
            const verificationData: VerifyPaymentRequest = {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            };

            // 3. Verify payment
            const verifyRes = await paymentService.verifyPayment(clientId, verificationData);

            if (verifyRes.status === "VERIFIED" || verifyRes.message?.toLowerCase().includes("success")) {
              if (options.onSuccess) {
                options.onSuccess(verifyRes);
              }
            } else {
              throw new Error(verifyRes.message || "Payment verification failed");
            }
          } catch (error: any) {
            if (options.onError) {
              options.onError(error);
            }
          }
        },
        modal: {
          ondismiss: function () {
            setIsProcessing(false);
            if (options.onDismiss) {
              options.onDismiss();
            }
          },
        },
        prefill: {
          name: `${user?.first_name || ""} ${user?.last_name || ""}`.trim() || "User",
          email: user?.email || "",
          contact: user?.phone || "",
        },
        theme: {
          color: "#6366f1", // primary color
        },
      };

      const rzp = new (window as any).Razorpay(rzpOptions);
      rzp.on("payment.failed", function (response: any) {
        if (options.onError) {
          options.onError(response.error);
        }
      });
      rzp.open();
    } catch (error: any) {
      setIsProcessing(false);
      if (options.onError) {
        options.onError(error);
      }
    }
  };

  return {
    handlePayment,
    isProcessing,
  };
};

