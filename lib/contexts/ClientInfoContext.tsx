"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { initApp, type ClientInfo } from "@/lib/services/client.service";
import { config } from "@/lib/config";

interface ClientInfoContextType {
  clientInfo: ClientInfo | null;
  loading: boolean;
  error: Error | null;
}

const ClientInfoContext = createContext<ClientInfoContextType | undefined>(
  undefined
);

export function ClientInfoProvider({ children }: { children: React.ReactNode }) {
  const [clientInfo, setClientInfo] = useState<ClientInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchClientInfo = async () => {
      try {
        setLoading(true);
        const clientId = Number(config.clientId);
        const info = await initApp(clientId);
        setClientInfo(info);
      } catch (err) {
        setError(err instanceof Error ? err : new Error("Failed to load client info"));
      } finally {
        setLoading(false);
      }
    };

    fetchClientInfo();
  }, []); // Only run once on mount

  return (
    <ClientInfoContext.Provider value={{ clientInfo, loading, error }}>
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

