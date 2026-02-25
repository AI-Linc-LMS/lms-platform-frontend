import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import enCommon from "@/locales/en/common.json";
import arCommon from "@/locales/ar/common.json";

const STORAGE_KEY = "i18nextLng";


export const supportedLngs = ["en", "ar"] as const;
export type SupportedLng = (typeof supportedLngs)[number];

export const isRtl = (lng: string) => lng === "ar";

// Do not set lng from localStorage here: server has no localStorage, so initial render
// must use the same language (fallbackLng) on both server and client to avoid hydration mismatch.
// I18nProvider restores the stored language in useEffect after mount.
i18n.use(initReactI18next).init({
  resources: {
    en: { common: enCommon as Record<string, unknown> },
    ar: { common: arCommon as Record<string, unknown> },
  },
  defaultNS: "common",
  fallbackLng: "en",
  supportedLngs: [...supportedLngs],
  interpolation: {
    escapeValue: false,
  },
  react: {
    useSuspense: false,
  },
});

i18n.on("languageChanged", (lng) => {
  if (typeof window !== "undefined") {
    localStorage.setItem(STORAGE_KEY, lng);
  }
});

export default i18n;
