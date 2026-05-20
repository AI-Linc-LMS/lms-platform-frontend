"use client";

import { useEffect } from "react";
import type { ClientInfo } from "@/lib/services/client.service";
import { useClientInfo } from "@/lib/contexts/ClientInfoContext";

const ICON_RELS = ["icon", "shortcut icon", "apple-touch-icon"] as const;

/**
 * Keeps the browser-tab favicon in sync with `clientInfo.app_icon_url` without
 * a page reload. The SSR <link rel="icon"> tags in app/layout.tsx are static
 * HTML — when an admin uploads a new favicon and saves on the Branding page,
 * `refreshClientInfo()` updates the context but the head tags don't change
 * unless we mutate the DOM here.
 */
export function ClientFaviconSync({
  initialClient,
}: {
  initialClient?: ClientInfo | null;
}) {
  const { clientInfo } = useClientInfo();
  const url = clientInfo?.app_icon_url ?? initialClient?.app_icon_url ?? null;
  const cacheKey = clientInfo?.id ?? initialClient?.id ?? "";

  useEffect(() => {
    if (typeof document === "undefined") return;
    const href = url
      ? `${url}${url.includes("?") ? "&" : "?"}v=${cacheKey}-${Date.now()}`
      : `/favicon.ico?v=${Date.now()}`;

    for (const rel of ICON_RELS) {
      // Replace every matching tag — some browsers ignore additions and keep
      // the first one, so the safest path is delete-then-recreate.
      const existing = document.head.querySelectorAll(`link[rel="${rel}"]`);
      existing.forEach((el) => el.parentNode?.removeChild(el));
      const link = document.createElement("link");
      link.rel = rel;
      link.href = href;
      document.head.appendChild(link);
    }
  }, [url, cacheKey]);

  return null;
}
