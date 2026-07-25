"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

type WizardTheme = "dark" | "light";

interface Ctx {
  theme: WizardTheme;
  toggle: () => void;
  setTheme: (t: WizardTheme) => void;
}

const STORAGE_KEY = "aw-wizard-theme";
const WizardThemeContext = createContext<Ctx | null>(null);

/**
 * Wraps the wizard in a `<div class="ailinc-wizard" data-aw-theme="...">` so the
 * scoped CSS in app/globals.css can branch on the data attribute. Theme
 * preference is persisted in localStorage under `aw-wizard-theme` (separate
 * from the main LMS theme - admins doing setup may prefer the wizard light
 * even if their app runs dark, or vice versa).
 *
 * Renders an invisible same-sized div on first SSR pass to keep the layout
 * stable; the actual theme attribute is stamped after hydration. This causes
 * a brief flash on first load - preferable to running an inline `<script>` in
 * page.tsx for a route that's already client-side rendered.
 */
export function WizardThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<WizardTheme>("dark");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    let initial: WizardTheme = "dark";
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved === "light" || saved === "dark") {
        initial = saved;
      } else if (
        typeof window !== "undefined" &&
        window.matchMedia?.("(prefers-color-scheme: light)").matches
      ) {
        initial = "light";
      }
    } catch {
      /* localStorage unavailable - fall back to dark */
    }
    setThemeState(initial);
    setMounted(true);
  }, []);

  const setTheme = useCallback((t: WizardTheme) => {
    setThemeState(t);
    try {
      localStorage.setItem(STORAGE_KEY, t);
    } catch {
      /* non-fatal */
    }
  }, []);

  const toggle = useCallback(() => {
    setTheme(theme === "dark" ? "light" : "dark");
  }, [theme, setTheme]);

  const value = useMemo<Ctx>(
    () => ({ theme, toggle, setTheme }),
    [theme, toggle, setTheme]
  );

  return (
    <WizardThemeContext.Provider value={value}>
      <div
        className="ailinc-wizard"
        data-aw-theme={mounted ? theme : "dark"}
        suppressHydrationWarning
      >
        {children}
      </div>
    </WizardThemeContext.Provider>
  );
}

export function useWizardTheme(): Ctx {
  const ctx = useContext(WizardThemeContext);
  if (!ctx) {
    // Defensive - components inside the wizard always have the provider, but
    // returning a no-op keeps the wizard usable if anyone refactors the tree.
    return {
      theme: "dark",
      toggle: () => {},
      setTheme: () => {},
    };
  }
  return ctx;
}
