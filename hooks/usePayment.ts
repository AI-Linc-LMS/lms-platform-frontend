"use client";

import { useCallback, useRef, useState } from "react";
import { useAuth } from "@/lib/auth/auth-context";
import { useClientInfo } from "@/lib/contexts/ClientInfoContext";
import { config } from "@/lib/config";
import {
  paymentService,
  PaymentType,
  VerifyPaymentRequest,
} from "@/lib/services/payment.service";
import { loadRazorpayScript } from "@/lib/utils/razorpay";

/**
 * Opening a Razorpay checkout for one purchase.
 *
 * Three things this hook deliberately does NOT do, each of which it used to:
 *
 * 1. **It does not send an amount.** The server prices the order from the product itself and
 *    ignores anything the client sends. The field's mere existence in the request is how "any
 *    course for a rupee" happened once already, so it is gone from the contract entirely.
 * 2. **It does not leave a card spinning.** `isProcessing` was reset only in `ondismiss` and the
 *    outer catch — never after a successful payment, and never after `payment.failed`. Any
 *    surface trusting the flag stayed loading forever once a payment went through.
 * 3. **It does not report a successful payment as a failure.** If the money reached Razorpay but
 *    the verify call fails, the webhook still settles it server-side. Telling a learner their
 *    payment failed, when they have been charged and will get access, is the worst thing this
 *    hook can say.
 */

/** Which outcome the caller is being told about. `settling` is NOT a failure. */
export type PaymentOutcome =
  | { kind: "verified"; response: unknown }
  | { kind: "settling"; message: string }
  | { kind: "failed"; message: string }
  | { kind: "dismissed" };

export interface PaymentOptions {
  typeId: string;
  paymentType: PaymentType;
  description: string;
  /** Identifies WHICH item is mid-flight, so one card spins instead of the whole grid. */
  busyKey?: string;
  onOutcome?: (outcome: PaymentOutcome) => void;
}

const SETTLING_MESSAGE =
  "Payment received. We're confirming it now — refresh in a moment and it will be there.";

export const usePayment = () => {
  const { user } = useAuth();
  const { clientInfo } = useClientInfo();
  const [busyKey, setBusyKey] = useState<string | null>(null);
  // A ref, not state: a double-click fires again before React has re-rendered, so a state flag
  // is too slow to stop a second Razorpay order being opened.
  const inFlight = useRef(false);

  const handlePayment = useCallback(
    async (options: PaymentOptions) => {
      const report = (outcome: PaymentOutcome) => options.onOutcome?.(outcome);
      const finish = () => {
        inFlight.current = false;
        setBusyKey(null);
      };

      if (inFlight.current) return;
      inFlight.current = true;
      setBusyKey(options.busyKey ?? options.typeId);

      try {
        const clientId = Number(config.clientId);
        if (!clientId) throw new Error("Invalid client ID");

        const scriptLoaded = await loadRazorpayScript();
        if (!scriptLoaded) {
          throw new Error("Couldn't reach the payment provider. Check your connection and retry.");
        }

        // The server derives amount AND currency from the product. We send only what is bought.
        const orderData = await paymentService.createOrder(clientId, {
          type_id: options.typeId,
          payment_type: options.paymentType,
          notes: { description: options.description, userId: user?.id },
        });

        if (!orderData?.order_id || !orderData?.key) {
          throw new Error("Couldn't start the payment. Please try again.");
        }

        const rzpOptions: Record<string, unknown> = {
          key: orderData.key,
          amount: orderData.amount,
          currency: orderData.currency || "INR",
          name: clientInfo?.name || "AI LINC",
          description: options.description,
          order_id: orderData.order_id,
          handler: async function (response: Record<string, string>) {
            const verificationData: VerifyPaymentRequest = {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            };
            try {
              const verifyRes = await paymentService.verifyPayment(clientId, verificationData);
              const ok =
                verifyRes.status === "VERIFIED" ||
                verifyRes.message?.toLowerCase().includes("success");
              if (ok) {
                report({ kind: "verified", response: verifyRes });
              } else {
                // The provider took the money; our confirmation disagreed. The webhook is the
                // source of truth and will settle it — "catching up", not "failed".
                report({ kind: "settling", message: SETTLING_MESSAGE });
              }
            } catch {
              report({ kind: "settling", message: SETTLING_MESSAGE });
            } finally {
              finish();
            }
          },
          modal: {
            ondismiss: function () {
              finish();
              report({ kind: "dismissed" });
            },
          },
          prefill: {
            name: `${user?.first_name || ""} ${user?.last_name || ""}`.trim() || "User",
            email: user?.email || "",
            contact: user?.phone || "",
          },
          theme: { color: "#6366f1" },
        };

        const RazorpayCtor = (
          window as unknown as {
            Razorpay: new (o: unknown) => {
              open: () => void;
              on: (e: string, cb: (r: { error?: { description?: string } }) => void) => void;
            };
          }
        ).Razorpay;
        const rzp = new RazorpayCtor(rzpOptions);
        rzp.on("payment.failed", function (response) {
          // This one IS a real failure — the charge did not go through.
          finish();
          report({
            kind: "failed",
            message: response?.error?.description || "The payment didn't go through.",
          });
        });
        rzp.open();
      } catch (error: unknown) {
        finish();
        report({
          kind: "failed",
          message: error instanceof Error ? error.message : "Couldn't start the payment.",
        });
      }
    },
    [user, clientInfo],
  );

  return {
    handlePayment,
    /** Which item is mid-payment, or null. Lets one card spin instead of the whole grid. */
    busyKey,
    /** Convenience for single-item surfaces. */
    isProcessing: busyKey !== null,
  };
};
