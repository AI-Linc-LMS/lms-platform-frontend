"use client";

import { createContext, useCallback, useContext, useMemo, useSyncExternalStore } from "react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils/cn";
import { type ScorecardThemeMode } from "@/lib/theme/scorecard-tokens";

interface ScorecardThemeContext {
  mode: ScorecardThemeMode;
  setMode: (mode: ScorecardThemeMode) => void;
  toggle: () => void;
}

const ScorecardThemeCtx = createContext<ScorecardThemeContext | null>(null);

const STORAGE_KEY = "sc:theme-mode";

function readStoredMode(): ScorecardThemeMode {
  if (typeof window === "undefined") return "light";
  const stored = window.localStorage.getItem(STORAGE_KEY);
  if (stored === "dark" || stored === "light") return stored;
  return window.matchMedia?.("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function subscribe(cb: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  const onStorage = (e: StorageEvent) => {
    if (e.key === STORAGE_KEY) cb();
  };
  const media = window.matchMedia?.("(prefers-color-scheme: dark)");
  window.addEventListener("storage", onStorage);
  media?.addEventListener?.("change", cb);
  return () => {
    window.removeEventListener("storage", onStorage);
    media?.removeEventListener?.("change", cb);
  };
}

interface ScorecardThemeProviderProps {
  children: ReactNode;
  className?: string;
  /** Forces a mode and disables OS / localStorage detection. Useful for PDF render. */
  forcedMode?: ScorecardThemeMode;
}

export function ScorecardThemeProvider({ children, className, forcedMode }: ScorecardThemeProviderProps) {
  const subscribed = useSyncExternalStore(
    subscribe,
    readStoredMode,
    () => "light" as ScorecardThemeMode,
  );
  const mode = forcedMode ?? subscribed;

  const setMode = useCallback((next: ScorecardThemeMode) => {
    if (forcedMode) return;
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, next);
      window.dispatchEvent(new StorageEvent("storage", { key: STORAGE_KEY, newValue: next }));
    }
  }, [forcedMode]);

  const toggle = useCallback(() => {
    setMode(mode === "dark" ? "light" : "dark");
  }, [mode, setMode]);

  const value = useMemo<ScorecardThemeContext>(
    () => ({ mode, setMode, toggle }),
    [mode, setMode, toggle]
  );

  return (
    <ScorecardThemeCtx.Provider value={value}>
      <div className={cn("sc-scope", mode === "dark" && "sc-dark", className)} data-sc-mode={mode}>
        {children}
      </div>
    </ScorecardThemeCtx.Provider>
  );
}

export function useScorecardTheme(): ScorecardThemeContext {
  const ctx = useContext(ScorecardThemeCtx);
  if (!ctx) {
    throw new Error("useScorecardTheme must be used inside <ScorecardThemeProvider>");
  }
  return ctx;
}
