"use client";

import { useEffect, useLayoutEffect, useMemo } from "react";
import type { ClientInfo } from "@/lib/services/client.service";
import { applyDocumentTheme } from "@/lib/theme/applyDocumentTheme";
import { normalizeThemeSettings } from "@/lib/theme/normalizeThemeSettings";
import { useClientInfo, useThemePreview } from "@/lib/contexts/ClientInfoContext";

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
  const { themeOverride } = useThemePreview();

  const source = clientInfo ?? initialClient ?? null;
  // `themeOverride` is set by the admin Branding page while editing - when
  // present, paint from the draft so every page reflects the unsaved change.
  const raw = themeOverride ?? source?.theme_settings;
  const themeKey = useMemo(() => {
    try {
      return JSON.stringify(raw ?? null);
    } catch {
      return "";
    }
  }, [raw]);

  useLayoutEffect(() => {
    applyDocumentTheme(normalizeThemeSettings(raw));
  }, [themeKey, raw]);

  // Enable color transitions only AFTER the first browser paint. The global
  // transition rule in globals.css is gated on `html[data-hydrated]`; without
  // this gate, any delta between the SSR-inlined `:root` vars and the
  // client-computed body inline vars animates over ~280 ms and shows as a
  // brief theme flash on refresh.
  useEffect(() => {
    if (typeof document === "undefined") return;
    const html = document.documentElement;
    if (html.dataset.hydrated === "1") return;
    const id = requestAnimationFrame(() => {
      html.dataset.hydrated = "1";
    });
    return () => cancelAnimationFrame(id);
  }, []);

  const appIconUrl = source?.app_icon_url ?? null;
  useEffect(() => {
    if (typeof document === "undefined") return;
    // Cache-bust so an in-place save in /admin/branding takes effect without a hard refresh.
    const href = appIconUrl ? `${appIconUrl}?v=${Date.now()}` : "/favicon.ico";
    const rels = ['link[rel="icon"]', 'link[rel="shortcut icon"]', 'link[rel="apple-touch-icon"]'];
    let updated = false;
    for (const sel of rels) {
      document.querySelectorAll<HTMLLinkElement>(sel).forEach((link) => {
        link.href = href;
        updated = true;
      });
    }
    if (!updated) {
      const link = document.createElement("link");
      link.rel = "icon";
      link.href = href;
      document.head.appendChild(link);
    }
  }, [appIconUrl]);

  return null;
}
