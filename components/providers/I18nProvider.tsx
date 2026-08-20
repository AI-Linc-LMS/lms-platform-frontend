"use client";

import { useEffect } from "react";
import { I18nextProvider } from "react-i18next";
import i18n, { restoreStoredLanguage } from "@/lib/i18n";

export function I18nProvider({
  children,
  clientId: _clientId,
}: {
  children: React.ReactNode;
  clientId?: number;
}) {
  // Restore the language chosen in an earlier session (and lazy-load its
  // bundle). After mount only, so SSR and first client render both use the
  // fallback language and hydration stays consistent.
  useEffect(() => {
    void restoreStoredLanguage();
  }, []);

  return <I18nextProvider i18n={i18n}>{children}</I18nextProvider>;
}
