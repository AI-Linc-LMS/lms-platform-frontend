"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { initApp, type ClientInfo } from "@/lib/services/client.service";
import { config } from "@/lib/config";

interface ClientInfoContextType {
  clientInfo: ClientInfo | null;
  loading: boolean;
  error: Error | null;
  refreshClientInfo: () => Promise<void>;
}

const ClientInfoContext = createContext<ClientInfoContextType | undefined>(
  undefined
);

export function ClientInfoProvider({
  children,
  initialClient,
}: {
  children: React.ReactNode;
  /** SSR client-info for first paint (theme, etc.) until `initApp` completes. */
  initialClient?: ClientInfo | null;
}) {
  const [clientInfo, setClientInfo] = useState<ClientInfo | null>(
    initialClient ?? null
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const refreshClientInfo = useCallback(async () => {
    const clientId = Number(config.clientId);
    const info = await initApp(clientId);
    setClientInfo(info);
  }, []);

  useEffect(() => {
    const fetchClientInfo = async () => {
      try {
        setLoading(true);
        await refreshClientInfo();
      } catch (err) {
        setError(
          err instanceof Error ? err : new Error("Failed to load client info")
        );
      } finally {
        setLoading(false);
      }
    };

    fetchClientInfo();
  }, [refreshClientInfo]);

  return (
    <ClientInfoContext.Provider
      value={{ clientInfo, loading, error, refreshClientInfo }}
    >
      {children}
    </ClientInfoContext.Provider>
  );
}

export function useClientInfo() {
  const context = useContext(ClientInfoContext);
  if (context === undefined) {
    throw new Error("useClientInfo must be used within a ClientInfoProvider");
  }
  return context;
}

/** When true, hide all leaderboards and streak UI (feature name: no_leaderboard_view). */
export function useHideLeaderboardView(): boolean {
  const { clientInfo } = useClientInfo();
  return Boolean(
    clientInfo?.features?.some((f) => f.name === "no_leaderboard_view")
  );
}
