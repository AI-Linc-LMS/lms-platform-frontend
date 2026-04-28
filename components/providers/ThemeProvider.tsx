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

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const raw = (hex || "").trim().replace(/^#/, "");
  if (raw.length === 6 && /^[0-9a-fA-F]{6}$/.test(raw)) {
    return {
      r: parseInt(raw.slice(0, 2), 16),
      g: parseInt(raw.slice(2, 4), 16),
      b: parseInt(raw.slice(4, 6), 16),
    };
  }
  if (raw.length === 3 && /^[0-9a-fA-F]{3}$/.test(raw)) {
    return {
      r: parseInt(raw[0] + raw[0], 16),
      g: parseInt(raw[1] + raw[1], 16),
      b: parseInt(raw[2] + raw[2], 16),
    };
  }
  return null;
}

function luminance({ r, g, b }: { r: number; g: number; b: number }): number {
  const f = (v: number) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
}

function contrast(a: string, b: string): number {
  const aa = hexToRgb(a);
  const bb = hexToRgb(b);
  if (!aa || !bb) return 0;
  const l1 = luminance(aa);
  const l2 = luminance(bb);
  const hi = Math.max(l1, l2);
  const lo = Math.min(l1, l2);
  return (hi + 0.05) / (lo + 0.05);
}

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
    const backgroundDefault =
      t.navBackground ||
      t.surfaceBlueLight ||
      baseTheme.palette.background.default;
    const backgroundPaper =
      t.cardBg ||
      t.surfaceBlueLight ||
      t.neutral100 ||
      baseTheme.palette.background.paper;
    const textPrimary =
      t.fontPrimary ||
      t.fontDark ||
      baseTheme.palette.text.primary;
    const safeTextPrimary =
      contrast(textPrimary, backgroundDefault) >= 4.5
        ? textPrimary
        : contrast("#ffffff", backgroundDefault) > contrast("#111827", backgroundDefault)
          ? "#ffffff"
          : "#111827";
    const textSecondary =
      t.fontSecondary ||
      baseTheme.palette.text.secondary;
    const safeTextSecondary =
      contrast(textSecondary, backgroundDefault) >= 3.8
        ? textSecondary
        : contrast("#cbd5e1", backgroundDefault) > contrast("#6b7280", backgroundDefault)
          ? "#cbd5e1"
          : "#6b7280";

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
        background: {
          ...baseTheme.palette.background,
          default: backgroundDefault,
          paper: backgroundPaper,
        },
        text: {
          ...baseTheme.palette.text,
          primary: safeTextPrimary,
          secondary: safeTextSecondary,
        },
      },
      typography: {
        ...baseTheme.typography,
        ...(fontFamily ? { fontFamily } : {}),
      },
      components: {
        ...baseTheme.components,
        MuiInputBase: {
          ...baseTheme.components?.MuiInputBase,
          styleOverrides: {
            ...baseTheme.components?.MuiInputBase?.styleOverrides,
            root: {
              ...(baseTheme.components?.MuiInputBase?.styleOverrides as any)?.root,
              color: "var(--font-primary)",
            },
            input: {
              ...(baseTheme.components?.MuiInputBase?.styleOverrides as any)?.input,
              color: "var(--font-primary)",
              WebkitTextFillColor: "var(--font-primary)",
              caretColor: "var(--font-primary)",
              "&::placeholder": {
                color: "var(--font-tertiary)",
                opacity: 1,
              },
              "&:-webkit-autofill, &:-webkit-autofill:hover, &:-webkit-autofill:focus": {
                WebkitTextFillColor: "var(--font-primary)",
                caretColor: "var(--font-primary)",
                WebkitBoxShadow: "0 0 0 1000px var(--card-bg) inset",
                borderRadius: 8,
                transition: "background-color 5000s ease-in-out 0s",
              },
            },
          },
        },
        MuiInputLabel: {
          ...baseTheme.components?.MuiInputLabel,
          styleOverrides: {
            ...baseTheme.components?.MuiInputLabel?.styleOverrides,
            root: {
              ...(baseTheme.components?.MuiInputLabel?.styleOverrides as any)?.root,
              color: "var(--font-secondary)",
              "&.Mui-focused": {
                color: "var(--accent-indigo)",
              },
            },
          },
        },
        MuiFormHelperText: {
          ...baseTheme.components?.MuiFormHelperText,
          styleOverrides: {
            ...baseTheme.components?.MuiFormHelperText?.styleOverrides,
            root: {
              ...(baseTheme.components?.MuiFormHelperText?.styleOverrides as any)?.root,
              color: "var(--font-secondary)",
            },
          },
        },
        MuiOutlinedInput: {
          ...baseTheme.components?.MuiOutlinedInput,
          styleOverrides: {
            ...baseTheme.components?.MuiOutlinedInput?.styleOverrides,
            root: {
              ...(baseTheme.components?.MuiOutlinedInput?.styleOverrides as any)?.root,
              backgroundColor: "var(--card-bg)",
            },
            notchedOutline: {
              ...(baseTheme.components?.MuiOutlinedInput?.styleOverrides as any)
                ?.notchedOutline,
              borderColor: "var(--border-default)",
            },
          },
        },
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
