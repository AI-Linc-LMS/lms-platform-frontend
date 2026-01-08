import { cache } from "react";
import type { ClientInfo } from "@/lib/services/client.service";

export const getClientInfo = cache(
  async (host?: string): Promise<ClientInfo> => {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/clients/${process.env.NEXT_PUBLIC_CLIENT_ID}/client-info/`,
      {
        next: {
          revalidate: 86400, // 24 hours
        },
      }
    );

    if (!res.ok) {
      throw new Error("Failed to fetch client info");
    }

    return res.json();
  }
);
