"use client";

import { useEffect } from "react";
import { I18nextProvider } from "react-i18next";
import i18n, { supportedLngs } from "@/lib/i18n";

const STORAGE_KEY = "i18nextLng";

const DEFAULT_AR_CLIENT_ID = 28;

function getInitialLanguage(clientId?: number): "en" | "ar" {
  return clientId === DEFAULT_AR_CLIENT_ID ? "ar" : "en";
}

export function I18nProvider({
  children,
  clientId,
}: {
  children: React.ReactNode;
  clientId?: number;
}) {
  // Set initial language synchronously so server and client first render match (avoids hydration mismatch).
  const initialLang = getInitialLanguage(clientId);
  if (i18n.language !== initialLang) {
    i18n.language = initialLang;
  }

  useEffect(() => {
   if (clientId === DEFAULT_AR_CLIENT_ID) {
      i18n.changeLanguage("ar");
    }
    else if (clientId !== DEFAULT_AR_CLIENT_ID) {
      i18n.changeLanguage("en");
    }
  }, [clientId]);

  return <I18nextProvider i18n={i18n}>{children}</I18nextProvider>;
}
