"use client";

import { useState } from "react";
import { QueryClient, type QueryClientConfig } from "@tanstack/react-query";
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
  const [persister] = useState(() =>
    typeof window === "undefined"
      ? null
      : createSyncStoragePersister({ storage: window.localStorage, key: CACHE_KEY })
  );

  // SSR pass: no storage, so render without persistence rather than crashing.
  if (!persister) {
    return <>{children}</>;
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
