"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
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

/**
 * `themeOverride` is the unsaved theme draft shown by the admin Branding page
 * live-preview. Kept in a SEPARATE context from ClientInfoContext so updating
 * it doesn't re-render every component that just wants `clientInfo` —
 * otherwise a single preset click thrashes the entire app (sidebar, top nav,
 * cards, modals, every MUI consumer of the rebuilt theme) for tens of seconds.
 *
 * Only `useTenantShellTheme`, `<ThemeProvider>`, and `<ClientThemeSync>`
 * subscribe here. Other components keep using `useClientInfo()` and are not
 * disturbed by theme-draft activity.
 */
interface ThemePreviewContextType {
  themeOverride: Record<string, unknown> | null;
  setThemeOverride: (next: Record<string, unknown> | null) => void;
}

const ThemePreviewContext = createContext<ThemePreviewContextType | undefined>(
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
  // If SSR already provided a real tenant payload (with theme_settings), we
  // can trust it for first paint and skip the redundant client refetch —
  // every refetch caused another `setClientInfo` → another `applyDocumentTheme`
  // → a visible theme flash on refresh. Only fetch when SSR is missing or
  // returned the fallback (no `id`).
  const hasUsableSsr = Boolean(
    initialClient && initialClient.id && initialClient.theme_settings
  );
  const [loading, setLoading] = useState(!hasUsableSsr);
  const [error, setError] = useState<Error | null>(null);
  const [themeOverride, setThemeOverride] = useState<
    Record<string, unknown> | null
  >(null);

  const refreshClientInfo = useCallback(async () => {
    const clientId = Number(config.clientId);
    const info = await initApp(clientId);
    // Merge so a partial client-info response cannot wipe SSR fields (e.g. logos) before re-fetch.
    setClientInfo((prev) => (prev ? { ...prev, ...info } : info));
  }, []);

  useEffect(() => {
    if (hasUsableSsr) {
      // SSR data already populated state; nothing to do until something
      // explicitly calls refreshClientInfo() (e.g. after a save).
      setLoading(false);
      return;
    }
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
    // hasUsableSsr is derived from `initialClient` which is stable for the
    // life of the provider — no need to re-run when refreshClientInfo
    // identity changes (it doesn't, since it's wrapped in useCallback).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Memoize the context value so reference identity stays stable across
  // unrelated re-renders (only changes when clientInfo / loading / error do).
  const clientInfoValue = useMemo(
    () => ({ clientInfo, loading, error, refreshClientInfo }),
    [clientInfo, loading, error, refreshClientInfo]
  );

  const themePreviewValue = useMemo(
    () => ({ themeOverride, setThemeOverride }),
    [themeOverride]
  );

  return (
    <ClientInfoContext.Provider value={clientInfoValue}>
      <ThemePreviewContext.Provider value={themePreviewValue}>
        {children}
      </ThemePreviewContext.Provider>
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

export function useThemePreview() {
  const context = useContext(ThemePreviewContext);
  if (context === undefined) {
    throw new Error(
      "useThemePreview must be used within a ClientInfoProvider (which also provides ThemePreviewContext)"
    );
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
