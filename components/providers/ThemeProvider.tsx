"use client";

import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { ThemeProvider as MuiThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import { createTheme } from "@mui/material/styles";
import { theme as baseTheme } from "@/lib/theme";
import { isRtl } from "@/lib/i18n";
import { useClientInfo } from "@/lib/contexts/ClientInfoContext";
import type { ClientInfo } from "@/lib/services/client.service";
import { normalizeThemeSettings } from "@/lib/theme/normalizeThemeSettings";

interface ThemeProviderProps {
  children: React.ReactNode;
  /** From server `getClientInfo` until context hydrates. */
  initialClient?: ClientInfo | null;
}

export function ThemeProvider({
  children,
  initialClient,
}: ThemeProviderProps) {
  const { i18n } = useTranslation();
  const { clientInfo } = useClientInfo();
  const lng = i18n.language || "en";
  const direction = isRtl(lng) ? "rtl" : "ltr";

  const source = clientInfo ?? initialClient ?? null;
  const t = normalizeThemeSettings(source?.theme_settings);

  const theme = useMemo(() => {
    const primary = {
      main:
        t.muiPrimaryMain ||
        t.primary500 ||
        baseTheme.palette.primary.main,
      light:
        t.muiPrimaryLight ||
        t.primary400 ||
        baseTheme.palette.primary.light,
      dark:
        t.muiPrimaryDark ||
        t.primary600 ||
        baseTheme.palette.primary.dark,
      contrastText:
        t.muiPrimaryContrastText || baseTheme.palette.primary.contrastText,
    };
    const fontFamily =
      t.fontFamilySans ||
      (typeof baseTheme.typography?.fontFamily === "string"
        ? baseTheme.typography.fontFamily
        : undefined);

    return createTheme({
      ...baseTheme,
      direction,
      palette: {
        ...baseTheme.palette,
        primary: { ...baseTheme.palette.primary, ...primary },
      },
      typography: {
        ...baseTheme.typography,
        ...(fontFamily ? { fontFamily } : {}),
      },
    });
  }, [direction, t]);

  return (
    <MuiThemeProvider theme={theme}>
      <CssBaseline />
      {children}
    </MuiThemeProvider>
  );
}
