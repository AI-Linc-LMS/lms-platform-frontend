import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import enCommon from "@/locales/en/common.json";

const STORAGE_KEY = "i18nextLng";


export const supportedLngs = ["en", "ar"] as const;
export type SupportedLng = (typeof supportedLngs)[number];

export const isRtl = (lng: string) => lng === "ar";

// Do not set lng from localStorage here: server has no localStorage, so initial render
// must use the same language (fallbackLng) on both server and client to avoid hydration mismatch.
// I18nProvider restores the stored language in useEffect after mount.
// Only English ships in the bundle. Arabic (145KB raw / ~35KB gz) used to be
// statically imported here, which put the full Arabic corpus into the shared
// chunk of every page for every tenant — nearly all of them English-only.
// ensureLanguageLoaded() pulls it in on demand.
i18n.use(initReactI18next).init({
  resources: {
    en: { common: enCommon as Record<string, unknown> },
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

/** Dynamic-import a non-default language's bundle before switching to it. */
export async function ensureLanguageLoaded(lng: string): Promise<void> {
  if (lng !== "ar" || i18n.hasResourceBundle("ar", "common")) return;
  const mod = await import("@/locales/ar/common.json");
  i18n.addResourceBundle(
    "ar",
    "common",
    ((mod as { default?: unknown }).default ?? mod) as Record<string, unknown>,
    true,
    true,
  );
}

/**
 * Restore the language a user picked in an earlier session. Runs client-side
 * only (I18nProvider effect): the server always renders fallbackLng so SSR and
 * the first client render agree, then this switches after mount.
 */
export async function restoreStoredLanguage(): Promise<void> {
  if (typeof window === "undefined") return;
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored || stored === i18n.language) return;
  if (!supportedLngs.includes(stored as SupportedLng)) return;
  await ensureLanguageLoaded(stored);
  await i18n.changeLanguage(stored);
}

export default i18n;
