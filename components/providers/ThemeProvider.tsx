"use client";

import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { ThemeProvider as MuiThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import { createTheme } from "@mui/material/styles";
import { theme as baseTheme } from "@/lib/theme";
import { isRtl } from "@/lib/i18n";

interface ThemeProviderProps {
  children: React.ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const { i18n } = useTranslation();
  const lng = i18n.language || "en";
  const direction = isRtl(lng) ? "rtl" : "ltr";

  const theme = useMemo(
    () => createTheme({ ...baseTheme, direction }),
    [direction]
  );

  return (
    <MuiThemeProvider theme={theme}>
      <CssBaseline />
      {children}
    </MuiThemeProvider>
  );
}
