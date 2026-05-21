import { cache } from "react";
import { config } from "@/lib/config";
import type { ClientInfo } from "@/lib/services/client.service";

const FALLBACK_CLIENT_INFO: ClientInfo = {
  name: "LMS Platform",
  features: [],
};

export const getClientInfo = cache(
  async (host?: string): Promise<ClientInfo> => {
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
