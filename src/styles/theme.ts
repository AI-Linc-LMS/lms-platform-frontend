// src/theme.ts
import { createTheme } from "@mui/material/styles";

const theme = createTheme({
  palette: {
    mode: "light",
    grey: {
      300: "#f3f4f6",
      800: "#1f2937",
    },
  },
  typography: {
    button: {
      textTransform: "none", // disables uppercase on buttons
    },
  },
  shape: {
    borderRadius: 8,
  },
  transitions: {
    // you can add custom easing or durations here if needed
  },
});

export default theme;
