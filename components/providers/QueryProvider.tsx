"use client";

import { useEffect, useState } from "react";
import {
  QueryClient,
  QueryClientProvider,
  type QueryClientConfig,
} from "@tanstack/react-query";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { createSyncStoragePersister } from "@tanstack/query-sync-storage-persister";

/**
 * The app's single QueryClient, with a PERSISTED cache.
 *
 * Before this the app had no client-side data cache at all (no React Query, no SWR; the Redux store
 * is a stub), so every navigation refetched cold and every screen re-showed a skeleton even when you
 * had just come from it. Persisting to localStorage additionally fixes the "left the tab for a while,
 * now everything takes forever" case: cached screens paint instantly from the last known data and
 * revalidate in the background instead of blocking on a cold network round-trip.
 */
const QUERY_CONFIG: QueryClientConfig = {
  defaultOptions: {
    queries: {
      // Serve cached data instantly for a minute, revalidating in the background.
      staleTime: 60_000,
      // Keep it around long enough that a return-after-lunch still paints from cache.
      gcTime: 24 * 60 * 60 * 1000,
      // The tab-return refetch is handled deliberately per-screen (see useVisibilityRefresh); having
      // every mounted query also refetch on focus is what produced the return-to-tab request storm.
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
      retry: 1,
    },
  },
};

const CACHE_KEY = "ailinc-query-cache";
// Bump to invalidate every persisted entry after a shape change.
const CACHE_BUSTER = "v1";

export function QueryProvider({ children }: { children: React.ReactNode }) {
  // useState so the client is created once per mount and never re-created on re-render.
  const [queryClient] = useState(() => new QueryClient(QUERY_CONFIG));

  // A logout dispatches "auth-user-changed": drop every cached query so the
  // next account on this machine can never see the previous account's data.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const onAuthChange = () => queryClient.clear();
    window.addEventListener("auth-user-changed", onAuthChange);
    return () => window.removeEventListener("auth-user-changed", onAuthChange);
  }, [queryClient]);
  const [persister] = useState(() =>
    typeof window === "undefined"
      ? null
      : createSyncStoragePersister({ storage: window.localStorage, key: CACHE_KEY })
  );

  // SSR/prerender pass: no storage, so provide the client WITHOUT persistence.
  // Rendering bare children here left the server tree with no QueryClient at
  // all, which crashes any useQuery in a statically prerendered page.
  if (!persister) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  }

  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{
        persister,
        maxAge: 24 * 60 * 60 * 1000,
        buster: CACHE_BUSTER,
        dehydrateOptions: {
          // Never persist a failed/pending query — only successful data is worth restoring.
          shouldDehydrateQuery: (query) => query.state.status === "success",
        },
      }}
    >
      {children}
    </PersistQueryClientProvider>
  );
}
