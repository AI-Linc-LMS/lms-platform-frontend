// src/theme.ts
import { createTheme } from "@mui/material/styles";

const theme = createTheme({
  palette: {
    mode: "light",
    primary: {
      main: "#3b82f6",
      light: "#60a5fa",
      dark: "#2563eb",
      contrastText: "#ffffff",
    },
    secondary: {
      main: "#8b5cf6",
      light: "#a78bfa",
      dark: "#7c3aed",
      contrastText: "#ffffff",
    },
    success: {
      main: "#10b981",
      light: "#34d399",
      dark: "#059669",
    },
    warning: {
      main: "#f59e0b",
      light: "#fbbf24",
      dark: "#d97706",
    },
    error: {
      main: "#ef4444",
      light: "#f87171",
      dark: "#dc2626",
    },
    grey: {
      50: "#f8f9fa",
      100: "#f1f3f5",
      200: "#e9ecef",
      300: "#dee2e6",
      400: "#ced4da",
      500: "#6c757d",
      600: "#495057",
      700: "#343a40",
      800: "#212529",
      900: "#1f2937",
    },
    background: {
      default: "#f8f9fa",
      paper: "#ffffff",
    },
  },
  typography: {
    button: {
      textTransform: "none",
      fontWeight: 500,
    },
    fontFamily: '"Lato", "Inter", "Segoe UI", -apple-system, BlinkMacSystemFont, "Helvetica Neue", Arial, sans-serif',
    h1: {
      fontWeight: 700,
      fontSize: "2.25rem",
      lineHeight: 1.2,
    },
    h2: {
      fontWeight: 700,
      fontSize: "1.875rem",
      lineHeight: 1.3,
    },
    h3: {
      fontWeight: 600,
      fontSize: "1.5rem",
      lineHeight: 1.4,
    },
    h4: {
      fontWeight: 600,
      fontSize: "1.25rem",
      lineHeight: 1.4,
    },
    h5: {
      fontWeight: 600,
      fontSize: "1.125rem",
      lineHeight: 1.5,
    },
    h6: {
      fontWeight: 600,
      fontSize: "1rem",
      lineHeight: 1.5,
    },
    body1: {
      fontSize: "1rem",
      lineHeight: 1.6,
    },
    body2: {
      fontSize: "0.875rem",
      lineHeight: 1.6,
    },
  },
  shape: {
    borderRadius: 12,
  },
  shadows: [
    "none",
    "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
    "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
    "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
    "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
    "0 2px 8px rgba(0, 0, 0, 0.08)",
    "0 4px 12px rgba(0, 0, 0, 0.12)",
    "0 8px 16px rgba(0, 0, 0, 0.12)",
    "0 12px 24px rgba(0, 0, 0, 0.15)",
    "0 16px 32px rgba(0, 0, 0, 0.15)",
    "0 20px 40px rgba(0, 0, 0, 0.15)",
    "0 24px 48px rgba(0, 0, 0, 0.15)",
    "0 28px 56px rgba(0, 0, 0, 0.15)",
    "0 32px 64px rgba(0, 0, 0, 0.15)",
    "0 36px 72px rgba(0, 0, 0, 0.15)",
    "0 40px 80px rgba(0, 0, 0, 0.15)",
    "0 44px 88px rgba(0, 0, 0, 0.15)",
    "0 48px 96px rgba(0, 0, 0, 0.15)",
    "0 52px 104px rgba(0, 0, 0, 0.15)",
    "0 56px 112px rgba(0, 0, 0, 0.15)",
    "0 60px 120px rgba(0, 0, 0, 0.15)",
    "0 64px 128px rgba(0, 0, 0, 0.15)",
    "0 68px 136px rgba(0, 0, 0, 0.15)",
    "0 72px 144px rgba(0, 0, 0, 0.15)",
    "0 76px 152px rgba(0, 0, 0, 0.15)",
  ],
  transitions: {
    duration: {
      shortest: 150,
      shorter: 200,
      short: 250,
      standard: 300,
      complex: 375,
      enteringScreen: 225,
      leavingScreen: 195,
    },
    easing: {
      easeInOut: "cubic-bezier(0.4, 0, 0.2, 1)",
      easeOut: "cubic-bezier(0.0, 0, 0.2, 1)",
      easeIn: "cubic-bezier(0.4, 0, 1, 1)",
      sharp: "cubic-bezier(0.4, 0, 0.6, 1)",
    },
  },
});

export default theme;
