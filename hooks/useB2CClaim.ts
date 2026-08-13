"use client";

import { useCallback, useState } from "react";
import { b2cService } from "@/lib/services/b2c.service";

/**
 * Spending a free allowance, in one place.
 *
 * Deliberately shaped like `useAssessmentPurchase.buy` so a card can treat "pay" and "use a free
 * one" as two routes to the same outcome, rather than two different kinds of thing.
 *
 * `onOwned` fires only after the server confirms the grant. There is no optimistic path: there is
 * a small fixed number of these and no way to give one back, so telling a learner they spent one
 * before the server agrees is a promise we may not be able to keep.
 */
export function useB2CClaim() {
  const [claimingKey, setClaimingKey] = useState<string | null>(null);

  const claim = useCallback(
    async (
      featureKey: string,
      objectId: number,
      busyKey: string,
      handlers: {
        onOwned: (remaining: number) => void;
        /** The allowance ran out — most often spent in another tab. Offer the price instead. */
        onExhausted: () => void;
        onFailed: (message: string) => void;
      },
    ) => {
      setClaimingKey(busyKey);
      try {
        const result = await b2cService.claim(featureKey, objectId);
        handlers.onOwned(result.remaining);
      } catch (err) {
        const status = (err as { response?: { status?: number } })?.response?.status;
        if (status === 402) handlers.onExhausted();
        else if (status === 404) handlers.onFailed("That isn't available to claim.");
        else handlers.onFailed("Couldn't use your free allowance. Please try again.");
      } finally {
        setClaimingKey(null);
      }
    },
    [],
  );

  return { claim, claimingKey };
}
