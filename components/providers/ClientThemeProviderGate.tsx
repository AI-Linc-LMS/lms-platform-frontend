"use client";

import dynamic from "next/dynamic";

const ClientThemeProvider = dynamic(
  () => import("@/components/providers/ClientThemeProvider"),
  { ssr: false }
);

/** Wraps theme CSS injection; `ssr: false` must live in a Client Component (not in `app/layout.tsx`). */
export function ClientThemeProviderGate({ client }: { client: unknown }) {
  return <ClientThemeProvider client={client} />;
}
