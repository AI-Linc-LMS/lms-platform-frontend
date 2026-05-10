"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { useTranslation } from "react-i18next";
import { useToast } from "@/components/common/Toast";
import { useAuth } from "@/lib/auth/auth-context";
import { communityService } from "@/lib/services/community.service";
import { config } from "@/lib/config";
import { DUMMY_IMPACT_BALANCE } from "@/lib/community/community-dummy-data";

interface ImpactEconomyState {
  points: number;
  tier: "Bronze" | "Silver" | "Gold";
  title: string;
  dailyQueries: number;
  dailyInteractions: number;
  refreshBalance: () => Promise<void>;
  setBalanceFromServer: (balance: number) => void;
  addPoints: (
    amount: number,
    reason: string,
    type: "query" | "interaction" | "validation" | "reply",
    opts?: { idempotencyKey?: string; silent?: boolean }
  ) => Promise<boolean>;
}

const ImpactEconomyContext = createContext<ImpactEconomyState | undefined>(
  undefined
);

const REASON_BY_TYPE: Record<
  "query" | "interaction" | "validation" | "reply",
  string
> = {
  query: "community_query",
  interaction: "community_interaction",
  validation: "community_validation",
  reply: "community_reply",
};

export function ImpactEconomyProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [points, setPoints] = useState(0);
  const [dailyQueries, setDailyQueries] = useState(0);
  const [dailyInteractions, setDailyInteractions] = useState(0);
  const { showToast } = useToast();
  const { t } = useTranslation("common");
  const { isAuthenticated, loading: authLoading, user } = useAuth();

  const getTierAndTitle = (pts: number) => {
    if (pts >= 1000) return { tier: "Gold" as const, title: "Mentor" };
    if (pts >= 500) return { tier: "Silver" as const, title: "Contributor" };
    return { tier: "Bronze" as const, title: "Learner" };
  };

  const { tier, title } = getTierAndTitle(points);

  const refreshBalance = useCallback(async () => {
    if (!isAuthenticated || authLoading || !user?.id) return;
    const data = await communityService.getImpactBalance();
    if (data) {
      setPoints(data.balance);
      const snap = data.daily_caps_snapshot;
      if (snap?.community_query)
        setDailyQueries(snap.community_query.used);
      if (snap?.community_interaction)
        setDailyInteractions(snap.community_interaction.used);
    } else if (config.communityDummyData) {
      setPoints(DUMMY_IMPACT_BALANCE);
      setDailyQueries(1);
      setDailyInteractions(4);
    }
  }, [isAuthenticated, authLoading, user?.id]);

  useEffect(() => {
    if (authLoading || !config.communityDummyData) return;
    if (isAuthenticated && user?.id) return;
    setPoints(520);
    setDailyQueries(0);
    setDailyInteractions(0);
  }, [authLoading, isAuthenticated, user?.id]);

  useEffect(() => {
    if (!authLoading && isAuthenticated && user?.id) {
      void refreshBalance();
    }
  }, [authLoading, isAuthenticated, user?.id, refreshBalance]);

  const setBalanceFromServer = useCallback((balance: number) => {
    setPoints((prev) => {
      const oldStatus = getTierAndTitle(prev);
      const newStatus = getTierAndTitle(balance);
      if (oldStatus.title !== newStatus.title && prev > 0) {
        setTimeout(() => {
          showToast(
            t("impact.promotionToast", { title: newStatus.title }),
            "success"
          );
        }, 400);
      }
      return balance;
    });
  }, [showToast, t]);

  const addPoints = useCallback(
    async (
      amount: number,
      reason: string,
      type: "query" | "interaction" | "validation" | "reply",
      opts?: { idempotencyKey?: string; silent?: boolean }
    ): Promise<boolean> => {
      const reasonCode = REASON_BY_TYPE[type];
      const res = await communityService.postImpactEvent({
        reason_code: reasonCode,
        idempotency_key: opts?.idempotencyKey,
      });
      if (!res) {
        showToast(t("impact.impactUnavailable"), "error");
        return false;
      }
      if (res.capped) {
        showToast(t("impact.dailyCapReached"), "error");
        return false;
      }
      if (!res.ok) {
        showToast(t("impact.impactUnavailable"), "error");
        return false;
      }
      const newBal = res.balance ?? 0;
      setPoints((prev) => {
        const oldStatus = getTierAndTitle(prev);
        const newStatus = getTierAndTitle(newBal);
        if (oldStatus.title !== newStatus.title && res.delta && res.delta > 0) {
          setTimeout(() => {
            showToast(
              t("impact.promotionToast", { title: newStatus.title }),
              "success"
            );
          }, 600);
        }
        return newBal;
      });
      const data = await communityService.getImpactBalance();
      if (data?.daily_caps_snapshot) {
        const snap = data.daily_caps_snapshot;
        if (snap.community_query) setDailyQueries(snap.community_query.used);
        if (snap.community_interaction)
          setDailyInteractions(snap.community_interaction.used);
      }
      if (!opts?.silent && res.delta && res.delta > 0) {
        showToast(t("impact.pointsEarned", { amount: res.delta, reason }), "success");
      }
      return true;
    },
    [showToast, t]
  );

  return (
    <ImpactEconomyContext.Provider
      value={{
        points,
        tier,
        title,
        dailyQueries,
        dailyInteractions,
        refreshBalance,
        setBalanceFromServer,
        addPoints,
      }}
    >
      {children}
    </ImpactEconomyContext.Provider>
  );
}

export const useImpactEconomy = () => {
  const context = useContext(ImpactEconomyContext);
  if (!context)
    throw new Error("useImpactEconomy must be used within ImpactEconomyProvider");
  return context;
};
