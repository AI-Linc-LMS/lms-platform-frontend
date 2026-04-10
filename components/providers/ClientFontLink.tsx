"use client";

import { useEffect } from "react";
import type { ClientInfo } from "@/lib/services/client.service";
import { isAllowedFontImportUrl } from "@/lib/theme/fontImportAllowlist";
import { normalizeThemeSettings } from "@/lib/theme/normalizeThemeSettings";
import { useClientInfo } from "@/lib/contexts/ClientInfoContext";

const LINK_ID = "tenant-font-import";

export function ClientFontLink({
  initialClient,
}: {
  initialClient?: ClientInfo | null;
}) {
  const { clientInfo } = useClientInfo();
  const source = clientInfo ?? initialClient ?? null;
  const normalized = normalizeThemeSettings(source?.theme_settings);
  const href = normalized.fontImportUrl?.trim() ?? "";

  useEffect(() => {
    const existing = document.getElementById(LINK_ID);
    if (existing) {
      existing.remove();
    }
    if (!href || !isAllowedFontImportUrl(href)) {
      return;
    }
    const link = document.createElement("link");
    link.id = LINK_ID;
    link.rel = "stylesheet";
    link.href = href;
    link.crossOrigin = "anonymous";
    document.head.appendChild(link);
    return () => {
      link.remove();
    };
  }, [href]);

  return null;
}
