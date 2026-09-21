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

// A dropped connection is not an outage. `next build` prerenders every page in fresh workers that
// have no good payload yet, so before these retries one transient failure (a TLS reset, a DNS
// answer from the wrong nameserver) failed the whole site build: on 2026-09-21 every Netlify
// production build did, on "fetch failed ... socket disconnected before secure TLS connection".
// Retry network errors and 5xx a few times; a 4xx is a misconfigured tenant and fails at once.
// A real outage still throws after the last attempt, so the loud-failure semantics above hold.
export const CLIENT_INFO_RETRY_DELAYS_MS = [500, 1500, 3000];

class ClientInfoHttpError extends Error {
  constructor(readonly status: number) {
    super(`client-info responded ${status}`);
  }
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function fetchClientInfo(clientId: string): Promise<ClientInfo> {
  for (let attempt = 0; ; attempt++) {
    try {
      const res = await fetch(`${config.apiBaseUrl}/api/clients/${clientId}/client-info/`, {
        next: {
          revalidate: 120,
        },
      });
      if (!res.ok) throw new ClientInfoHttpError(res.status);
      return (await res.json()) as ClientInfo;
    } catch (err) {
      const permanent = err instanceof ClientInfoHttpError && err.status < 500;
      if (permanent || attempt >= CLIENT_INFO_RETRY_DELAYS_MS.length) throw err;
      await sleep(CLIENT_INFO_RETRY_DELAYS_MS[attempt]);
    }
  }
}

export const getClientInfo = cache(async (): Promise<ClientInfo> => {
  // A missing tenant id is a misconfigured site: fail the build/render, never
  // mask it with fallback branding. (Reading config.clientId throws.)
  const clientId = config.clientId;
  try {
    const data = await fetchClientInfo(clientId);
    lastGoodClientInfo = data;
    return data;
  } catch (err) {
    if (lastGoodClientInfo) return lastGoodClientInfo;
    throw err;
  }
});

export { FALLBACK_CLIENT_INFO };
