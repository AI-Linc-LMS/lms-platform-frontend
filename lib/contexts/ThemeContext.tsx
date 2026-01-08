"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";

type ThemeMode = "light" | "dark";

interface ThemeContextType {
  mode: ThemeMode;
  toggleMode: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useThemeMode = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useThemeMode must be used within ThemeModeProvider");
  }
  return context;
};

interface ThemeModeProviderProps {
  children: ReactNode;
}

export const ThemeModeProvider: React.FC<ThemeModeProviderProps> = ({
  children,
}) => {
  const [mode, setMode] = useState<ThemeMode>(() => {
    if (typeof window !== "undefined") {
      return (localStorage.getItem("themeMode") as ThemeMode) || "light";
    }
    return "light";
  });

  /* 🔥 APPLY MODE TO CSS VARIABLES */
  useEffect(() => {
    const root = document.documentElement;

    if (mode === "dark") {
      root.style.setProperty("--backgroundColor", "var(--neutral800)");
      root.style.setProperty("--fontPrimary", "var(--fontLight)");
      root.style.setProperty("--fontSecondary", "var(--fontTertiary)");
    } else {
      root.style.setProperty("--backgroundColor", "var(--neutral50)");
      root.style.setProperty("--fontPrimary", "var(--fontPrimary)");
      root.style.setProperty("--fontSecondary", "var(--fontSecondary)");
    }

    localStorage.setItem("themeMode", mode);
  }, [mode]);

  const toggleMode = () => {
    setMode((prev) => (prev === "light" ? "dark" : "light"));
  };

  return (
    <ThemeContext.Provider value={{ mode, toggleMode }}>
      {children}
    </ThemeContext.Provider>
  );
};
