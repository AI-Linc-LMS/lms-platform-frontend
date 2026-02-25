"use client";

import { useEffect } from "react";
import { I18nextProvider } from "react-i18next";
import i18n, { supportedLngs } from "@/lib/i18n";

const STORAGE_KEY = "i18nextLng";

export function I18nProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const stored = typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEY) : null;
    if (stored && supportedLngs.includes(stored as (typeof supportedLngs)[number])) {
      i18n.changeLanguage(stored);
    }
  }, []);

  return <I18nextProvider i18n={i18n}>{children}</I18nextProvider>;
}
