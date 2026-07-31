"use client";

import { useCallback, useState } from "react";
import { PaymentType } from "@/lib/services/payment.service";
import { usePayment } from "@/hooks/usePayment";
import type { Assessment } from "@/lib/services/assessment.service";

/**
 * Buying an assessment, in one place.
 *
 * The card and the detail page both need this, and the failure mode of duplicating it is not
 * cosmetic: the backend gates six separate routes, so a surface that opens checkout with the
 * wrong payment type or the wrong id quietly buys nothing and leaves the learner charged with
 * no access.
 */

/** What the backend sends with a 402 so the client never has to re-fetch the product to charge. */
export interface PurchaseRequiredPayload {
  payment_required?: boolean;
  payment_type?: string;
  type_id?: string;
  price?: string | null;
  currency?: string;
  title?: string;
}

/**
 * A 402 from ANY assessment route, or null if this error is something else.
 *
 * Read from the error rather than from the assessment, because the two can disagree: a card
 * rendered before a price landed, or an admin pricing an assessment while the page is open, both
 * produce a 402 on a card that says "Start".
 */
export function readPurchaseRequired(err: unknown): PurchaseRequiredPayload | null {
  const resp = (err as { response?: { status?: number; data?: PurchaseRequiredPayload } })?.response;
  if (resp?.status !== 402) return null;
  if (!resp.data?.payment_required) return null;
  return resp.data;
}

export function useAssessmentPurchase() {
  const { handlePayment } = usePayment();
  const [buyingSlug, setBuyingSlug] = useState<string | null>(null);

  /**
   * Open checkout for `assessment`.
   *
   * `onOwned` fires only once the server has confirmed the payment settled — never optimistically.
   * Money is involved: telling a learner they own an assessment before the webhook lands is a
   * promise the platform may not be able to keep, and the assessment they then cannot open is a
   * support ticket rather than a refresh.
   */
  const buy = useCallback(
    (
      assessment: Pick<Assessment, "id" | "slug" | "title">,
      handlers: {
        onOwned: () => void;
        onSettling: (message: string) => void;
        onFailed: (message: string) => void;
      },
    ) => {
      setBuyingSlug(assessment.slug);
      void handlePayment({
        typeId: String(assessment.id),
        paymentType: PaymentType.ASSESSMENT,
        description: assessment.title,
        busyKey: assessment.slug,
        onOutcome: (outcome) => {
          setBuyingSlug(null);
          if (outcome.kind === "verified") handlers.onOwned();
          else if (outcome.kind === "settling") handlers.onSettling(outcome.message);
          else if (outcome.kind === "failed") handlers.onFailed(outcome.message);
          // "dismissed" is the learner closing the Razorpay sheet. Deliberately silent — they
          // know they closed it, and a toast telling them so reads as an error.
        },
      });
    },
    [handlePayment],
  );

  return { buy, buyingSlug };
}
