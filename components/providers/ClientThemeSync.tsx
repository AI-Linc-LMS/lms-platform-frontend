"use client";

import { useLayoutEffect, useMemo } from "react";
import type { ClientInfo } from "@/lib/services/client.service";
import { applyDocumentTheme } from "@/lib/theme/applyDocumentTheme";
import { normalizeThemeSettings } from "@/lib/theme/normalizeThemeSettings";
import { useClientInfo } from "@/lib/contexts/ClientInfoContext";

/**
 * Applies tenant CSS variables from client-info whenever `ClientInfoContext` updates
 * (or from SSR `initialClient` until fetch completes).
 */
export function ClientThemeSync({
  initialClient,
}: {
  initialClient?: ClientInfo | null;
}) {
  const { clientInfo } = useClientInfo();

  const source = clientInfo ?? initialClient ?? null;
  const raw = source?.theme_settings;
  const themeKey = useMemo(() => {
    try {
      return JSON.stringify(raw ?? null);
    } catch {
      return "";
    }
  }, [raw]);

  useLayoutEffect(() => {
    const latest = (clientInfo ?? initialClient ?? null)?.theme_settings;
    applyDocumentTheme(normalizeThemeSettings(latest));
  }, [themeKey, clientInfo, initialClient]);

  return null;
}
