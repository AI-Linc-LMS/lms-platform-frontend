import { cache } from "react";
import { config } from "@/lib/config";
import type { ClientInfo } from "@/lib/services/client.service";

const FALLBACK_CLIENT_INFO: ClientInfo = {
  name: "LMS Platform",
  features: [],
};

// Tenant identity is baked in per Netlify site via NEXT_PUBLIC_CLIENT_ID, so
// this needs no request data. Keeping it request-independent is what lets the
// root layout stay statically renderable (ISR via revalidate below) — awaiting
// headers() for a host this function never used forced every route dynamic.
//
// FAILURE SEMANTICS MATTER HERE. Next.js ISR keeps serving the previous good
// page only when regeneration THROWS; a render that "succeeds" with fallback
// branding REPLACES the tenant's branded shell in the CDN for every visitor
// until a later revalidation. So: once any fetch has succeeded in this
// process, failures re-serve the last good payload; with no good payload yet,
// failures THROW (the deploy keeps the previous page / the build fails
// loudly) instead of baking an unbranded "LMS Platform" shell.
let lastGoodClientInfo: ClientInfo | null = null;

export const getClientInfo = cache(async (): Promise<ClientInfo> => {
  // A missing tenant id is a misconfigured site: fail the build/render, never
  // mask it with fallback branding. (Reading config.clientId throws.)
  const clientId = config.clientId;
  try {
    const res = await fetch(
      `${config.apiBaseUrl}/api/clients/${clientId}/client-info/`,
      {
        next: {
          revalidate: 120,
        },
      }
    );
    if (!res.ok) {
      throw new Error(`client-info responded ${res.status}`);
    }
    const data = (await res.json()) as ClientInfo;
    lastGoodClientInfo = data;
    return data;
  } catch (err) {
    if (lastGoodClientInfo) return lastGoodClientInfo;
    throw err;
  }
});

export { FALLBACK_CLIENT_INFO };
