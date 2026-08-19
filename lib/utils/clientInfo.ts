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
export const getClientInfo = cache(
  async (): Promise<ClientInfo> => {
    try {
      const res = await fetch(
        `${config.apiBaseUrl}/api/clients/${config.clientId}/client-info/`,
        {
          next: {
            revalidate: 120,
          },
        }
      );

      if (!res.ok) {
        return FALLBACK_CLIENT_INFO;
      }

      return res.json();
    } catch (err) {
      // API unreachable (e.g. ECONNREFUSED during build or when backend is down)
      return FALLBACK_CLIENT_INFO;
    }
  }
);
