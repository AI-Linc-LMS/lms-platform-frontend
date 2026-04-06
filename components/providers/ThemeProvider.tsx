"use client";

import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { ThemeProvider as MuiThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import { createTheme } from "@mui/material/styles";
import { theme as baseTheme } from "@/lib/theme";
import { isRtl } from "@/lib/i18n";
import { client28MuiPrimary, isClient28Theme } from "@/lib/theme/client28-theme";

interface ThemeProviderProps {
  children: React.ReactNode;
  /** From server `getClientInfo` so MUI matches CSS vars before client fetch completes. */
  initialClientId?: number;
}

export function ThemeProvider({
  children,
  initialClientId,
}: ThemeProviderProps) {
  const { i18n } = useTranslation();
  const lng = i18n.language || "en";
  const direction = isRtl(lng) ? "rtl" : "ltr";

  const theme = useMemo(() => {
    const palette = isClient28Theme(initialClientId)
      ? {
          ...baseTheme.palette,
          primary: { ...baseTheme.palette.primary, ...client28MuiPrimary },
        }
      : baseTheme.palette;
    return createTheme({
      ...baseTheme,
      direction,
      palette,
    });
  }, [direction, initialClientId]);

  return (
    <MuiThemeProvider theme={theme}>
      <CssBaseline />
      {children}
    </MuiThemeProvider>
  );
}
